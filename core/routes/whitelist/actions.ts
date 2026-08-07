const modulename = 'WebServer:WhitelistActions';
import { GenericApiResp } from '@shared/genericApiTypes';
import { DuplicateKeyError } from '@modules/Database/dbUtils';
import { now } from '@lib/misc';
import { parsePlayerId } from '@lib/player/idUtils';
import { DatabaseWhitelistRequestsType } from '@modules/Database/databaseTypes';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
const console = consoleFactory(modulename);

//Helper functions
const anyUndefined = (...args: any) => [...args].some((x) => (typeof x === 'undefined'));



/**
 * Returns the output page containing the bans experiment
 */
export default async function WhitelistActions(ctx: AuthedCtx) {
    //Sanity check
    if (anyUndefined(ctx.params.action)) {
        return ctx.utils.error(400, '无效请求');
    }
    const { table, action } = ctx.params;
    const sendTypedResp = (data: GenericApiResp) => ctx.send(data);

    //Check permissions
    if (!ctx.admin.testPermission('players.whitelist', modulename)) {
        return sendTypedResp({ error: '你没有权限执行此操作。' });
    }

    //Delegate to the specific table handler
    if (table === 'approvals') {
        return sendTypedResp(await handleApprovals(ctx, action));
    } else if (table === 'requests') {
        return sendTypedResp(await handleRequests(ctx, action));
    } else {
        return sendTypedResp({ error: '未知的数据表' });
    }
};


/**
 * Handle actions regarding the whitelist approvals table
 */
async function handleApprovals(ctx: AuthedCtx, action: any): Promise<GenericApiResp> {
    //Input validation
    if (typeof ctx.request.body?.identifier !== 'string') {
        return { error: '未指定标识符（identifier）' };
    }
    const identifier = ctx.request.body.identifier;
    const { isIdValid, idType, idValue, idlowerCased } = parsePlayerId(identifier);
    if (!isIdValid || !idType || !idValue || !idlowerCased) {
        return { error: '错误：所提供的标识符似乎无效' };
    }

    if (action === 'add') {
        //Preparing player name/avatar
        let playerAvatar = null;
        let playerName = (idValue.length > 8)
            ? `${idType}...${idValue.slice(-8)}`
            : `${idType}:${idValue}`;
        if (idType === 'discord') {
            try {
                const { tag, avatar } = await txCore.discordBot.resolveMemberProfile(idValue);
                playerName = tag;
                playerAvatar = avatar;
            } catch (error) { }
        }

        //Registering approval
        try {
            txCore.database.whitelist.registerApproval({
                identifier: idlowerCased,
                playerName,
                playerAvatar,
                tsApproved: now(),
                approvedBy: ctx.admin.name,
            });
            txCore.fxRunner.sendEvent('whitelistPreApproval', {
                action: 'added',
                identifier: idlowerCased,
                playerName,
                adminName: ctx.admin.name,
            });
        } catch (error) {
            return { error: `保存白名单预批准失败：${(error as Error).message}` };
        }
        ctx.admin.logAction(`Added whitelist approval for ${playerName}.`);
        return { success: true };

    } else if (action === 'remove') {
        try {
            txCore.database.whitelist.removeManyApprovals({ identifier: idlowerCased });
            txCore.fxRunner.sendEvent('whitelistPreApproval', {
                action: 'removed',
                identifier: idlowerCased,
                adminName: ctx.admin.name,
            });
        } catch (error) {
            return { error: `移除白名单预批准失败：${(error as Error).message}` };
        }
        ctx.admin.logAction(`Removed whitelist approval from ${idlowerCased}.`);
        return { success: true };

    } else {
        return { error: '未知操作' };
    }
}


/**
 * Handle actions regarding the whitelist requests table
 */
async function handleRequests(ctx: AuthedCtx, action: any): Promise<GenericApiResp> {
    //Checkinf for the deny all action, the others need reqId
    if (action === 'deny_all') {
        const cutoff = parseInt(ctx.request.body?.newestVisible);
        if (isNaN(cutoff)) {
            return { error: '未指定 newestVisible' };
        }

        try {
            const filter = (req: DatabaseWhitelistRequestsType) => req.tsLastAttempt <= cutoff;
            txCore.database.whitelist.removeManyRequests(filter);
            txCore.fxRunner.sendEvent('whitelistRequest', {
                action: 'deniedAll',
                adminName: ctx.admin.name,
            });
        } catch (error) {
            return { error: `移除全部白名单请求失败：${(error as Error).message}` };
        }
        ctx.admin.logAction('Denied all whitelist requests.');
        return { success: true };
    }

    //Input validation
    const reqId = ctx.request.body?.reqId;
    if (typeof reqId !== 'string' || !reqId.length) {
        return { error: '未指定 reqId' };
    }

    if (action === 'approve') {
        //Find request
        const requests = txCore.database.whitelist.findManyRequests({ id: reqId });
        if (!requests.length) {
            return { error: `未找到白名单请求 ID ${reqId}。` };
        }
        const req = requests[0]; //just getting the first

        //Register whitelistApprovals
        const playerName = req.discordTag ?? req.playerDisplayName;
        const identifier = `license:${req.license}`;
        try {
            txCore.database.whitelist.registerApproval({
                identifier,
                playerName,
                playerAvatar: (req.discordAvatar) ? req.discordAvatar : null,
                tsApproved: now(),
                approvedBy: ctx.admin.name,
            });
            txCore.fxRunner.sendEvent('whitelistRequest', {
                action: 'approved',
                playerName,
                requestId: req.id,
                license: req.license,
                adminName: ctx.admin.name,
            });
        } catch (error) {
            if (!(error instanceof DuplicateKeyError)) {
                return { error: `保存白名单预批准失败：${(error as Error).message}` };
            }
        }
        ctx.admin.logAction(`Approved whitelist request from ${playerName}.`);

        //Remove record from whitelistRequests
        try {
            txCore.database.whitelist.removeManyRequests({ id: reqId });
        } catch (error) {
            return { error: `移除白名单请求失败：${(error as Error).message}` };
        }
        return { success: true };

    } else if (action === 'deny') {
        try {
            const requests = txCore.database.whitelist.removeManyRequests({ id: reqId });
            if(requests.length){
                const req = requests[0]; //just getting the first
                txCore.fxRunner.sendEvent('whitelistRequest', {
                    action: 'denied',
                    playerName: req.playerDisplayName,
                    requestId: req.id,
                    license: req.license,
                    adminName: ctx.admin.name,
                });
            }
        } catch (error) {
            return { error: `移除白名单请求失败：${(error as Error).message}` };
        }
        ctx.admin.logAction(`Denied whitelist request ${reqId}.`);
        return { success: true };

    } else {
        return { error: '未知操作' };
    }
}
