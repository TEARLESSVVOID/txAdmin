const modulename = 'WebServer:PlayerActions';
import playerResolver from '@lib/player/playerResolver';
import { GenericApiResp } from '@shared/genericApiTypes';
import { PlayerClass, ServerPlayer } from '@lib/player/playerClasses';
import { anyUndefined, calcExpirationFromDuration } from '@lib/misc';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { SYM_CURRENT_MUTEX } from '@lib/symbols';
import { z } from 'zod';
import { shortenId } from '@shared/utils';
import { summarizeIdsArray } from '@lib/player/idUtils';
const console = consoleFactory(modulename);


//Schemas
const removeIdsBodySchema = z.object({
    ids: z.array(z.string().min(4, 'invalid identifier')),
});
export type ApiRemoveIdsReqSchema = z.infer<typeof removeIdsBodySchema>;


/**
 * Actions route for the player modal
 */
export default async function PlayerActions(ctx: AuthedCtx) {
    //Sanity check
    if (anyUndefined(ctx.params.action)) {
        return ctx.utils.error(400, '无效请求');
    }
    const action = ctx.params.action;
    const { mutex, netid, license } = ctx.query;
    const sendTypedResp = (data: GenericApiResp) => ctx.send(data);

    //Finding the player
    let player;
    try {
        const refMutex = mutex === 'current' ? SYM_CURRENT_MUTEX : mutex;
        player = playerResolver(refMutex, parseInt((netid as string)), license);
    } catch (error) {
        return sendTypedResp({ error: (error as Error).message });
    }

    //Delegate to the specific action handler
    if (action === 'save_note') {
        return sendTypedResp(await handleSaveNote(ctx, player));
    } else if (action === 'warn') {
        return sendTypedResp(await handleWarning(ctx, player));
    } else if (action === 'ban') {
        return sendTypedResp(await handleBan(ctx, player));
    } else if (action === 'whitelist') {
        return sendTypedResp(await handleSetWhitelist(ctx, player));
    } else if (action === 'removeIds') {
        return sendTypedResp(await handleRemoveIds(ctx, player));
    } else if (action === 'message') {
        return sendTypedResp(await handleDirectMessage(ctx, player));
    } else if (action === 'kick') {
        return sendTypedResp(await handleKick(ctx, player));
    } else {
        return sendTypedResp({ error: '未知操作' });
    }
};


/**
 * Handle Save Note (open to all admins)
 */
async function handleSaveNote(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.note,
    )) {
        return { error: '无效请求。' };
    }
    const note = ctx.request.body.note.trim();

    try {
        player.setNote(note, ctx.admin.name);
        ctx.admin.logAction(`Set notes for ${player.license}`);
        return { success: true };
    } catch (error) {
        return { error: `保存备注失败：${(error as Error).message}` };
    }
}


/**
 * Handle Send Warning
 */
async function handleWarning(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.reason,
    )) {
        return { error: '无效请求。' };
    }
    const reason = ctx.request.body.reason.trim() || '未提供原因';

    //Check permissions
    if (!ctx.admin.testPermission('players.warn', modulename)) {
        return { error: '你没有权限执行此操作。' };
    }

    //Validating server & player
    const allIds = player.allIdentifiers;
    if (!allIds.length) {
        return { error: '无法警告没有标识符的玩家。' };
    }

    //Register action
    let actionId;
    try {
        actionId = txCore.database.actions.registerWarn(
            allIds,
            ctx.admin.name,
            reason,
            player.displayName,
        );
    } catch (error) {
        return { error: `警告玩家失败：${(error as Error).message}` };
    }
    ctx.admin.logAction(`Warned player "${player.displayName}": ${reason}`);

    // Dispatch `txAdmin:events:playerWarned`
    const eventSent = txCore.fxRunner.sendEvent('playerWarned', {
        author: ctx.admin.name,
        reason,
        actionId,
        targetNetId: (player instanceof ServerPlayer && player.isConnected) ? player.netid : null,
        targetIds: allIds,
        targetName: player.displayName,
    });

    if (eventSent) {
        return { success: true };
    } else {
        return { error: `警告已保存，但可能未能在游戏中发送警告（stdin 错误）。` };
    }
}


/**
 * Handle Banning command
 */
async function handleBan(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (
        anyUndefined(
            ctx.request.body,
            ctx.request.body.duration,
            ctx.request.body.reason,
        )
    ) {
        return { error: '无效请求。' };
    }
    const durationInput = ctx.request.body.duration.trim();
    const reason = (ctx.request.body.reason as string).trim() || '未提供原因';

    //Calculating expiration/duration
    let calcResults;
    try {
        calcResults = calcExpirationFromDuration(durationInput);
    } catch (error) {
        return { error: (error as Error).message };
    }
    const { expiration, duration } = calcResults;

    //Check permissions
    if (!ctx.admin.testPermission('players.ban', modulename)) {
        return { error: '你没有权限执行此操作。' }
    }

    //Validating player - hwids.length can be zero 
    const allIds = player.allIdentifiers;
    const allHwids = player.allHardwareIdentifiers;
    if (!allIds.length) {
        return { error: '无法封禁没有标识符的玩家。' }
    }

    //Register action
    let actionId;
    try {
        actionId = txCore.database.actions.registerBan(
            allIds,
            ctx.admin.name,
            reason,
            expiration,
            player.displayName,
            allHwids
        );
    } catch (error) {
        return { error: `封禁玩家失败：${(error as Error).message}` };
    }
    ctx.admin.logAction(`Banned player "${player.displayName}": ${reason}`);

    //No need to dispatch events if server is not online
    if (txCore.fxRunner.isIdle) {
        return { success: true };
    }

    //Prepare and send command
    let kickMessage, durationTranslated;
    const tOptions: any = {
        author: txCore.adminStore.getAdminPublicName(ctx.admin.name, 'punishment'),
        reason: reason,
    };
    if (expiration !== false && duration) {
        durationTranslated = txCore.translator.tDuration(
            duration * 1000,
            { units: ['d', 'h'] },
        );
        tOptions.expiration = durationTranslated;
        kickMessage = txCore.translator.t('ban_messages.kick_temporary', tOptions);
    } else {
        durationTranslated = null;
        kickMessage = txCore.translator.t('ban_messages.kick_permanent', tOptions);
    }

    // Dispatch `txAdmin:events:playerBanned`
    const eventSent = txCore.fxRunner.sendEvent('playerBanned', {
        author: ctx.admin.name,
        reason,
        actionId,
        expiration,
        durationInput,
        durationTranslated,
        targetNetId: (player instanceof ServerPlayer) ? player.netid : null,
        targetIds: allIds,
        targetHwids: allHwids,
        targetName: player.displayName,
        kickMessage,
    });

    if (eventSent) {
        return { success: true };
    } else {
        return { error: `玩家已被封禁，但可能未能踢出玩家（stdin 错误）。` };
    }
}


/**
 * Handle Player Whitelist Action
 */
async function handleSetWhitelist(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.status,
    )) {
        return { error: '无效请求。' };
    }
    const status = (ctx.request.body.status === 'true' || ctx.request.body.status === true);

    //Check permissions
    if (!ctx.admin.testPermission('players.whitelist', modulename)) {
        return { error: '你没有权限执行此操作。' }
    }

    try {
        player.setWhitelist(status);
        if (status) {
            ctx.admin.logAction(`Added ${player.license} to the whitelist.`);
        } else {
            ctx.admin.logAction(`Removed ${player.license} from the whitelist.`);
        }

        // Dispatch `txAdmin:events:whitelistPlayer`
        txCore.fxRunner.sendEvent('whitelistPlayer', {
            action: status ? 'added' : 'removed',
            license: player.license,
            playerName: player.displayName,
            adminName: ctx.admin.name,
        });

        return { success: true };
    } catch (error) {
        return { error: `保存白名单状态失败：${(error as Error).message}` };
    }
}


/**
 * Handle Player Removal of IDs
 */
async function handleRemoveIds(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    const schemaRes = removeIdsBodySchema.safeParse(ctx.request.body);
    if (!schemaRes.success) {
        return { error: '无效的请求体。' };
    }
    const { ids: idsToDelete } = schemaRes.data;

    //Check permissions
    if (!ctx.admin.testPermission('players.remove_ids', modulename)) {
        return { error: '你没有权限执行此操作。' }
    }

    //Checking IDs
    if (!player.license || !player.isRegistered) {
        return { error: '该玩家未在数据库中注册，因此没有已保存的 ID 可以删除。' };
    }
    if (idsToDelete.includes(player.license)) {
        return { error: '你不能从玩家的 ID 中移除其许可证（license）。' };
    }
    if (player instanceof ServerPlayer && player.isConnected) {
        // If the player is connected, player.ids/hwids only contain the active IDs
        const onlineIdFound = idsToDelete.find(id => player.idsOnline.includes(id));
        if (onlineIdFound) {
            return { error: `玩家 #${player.netid} 当前正在使用 ID ${shortenId(onlineIdFound)}，你需要等待其从服务器断开后才能将其从玩家历史中删除。` };
        }
        const onlineHwidFound = idsToDelete.find(id => player.hwidsOnline.includes(id));
        if (onlineHwidFound) {
            return { error: `玩家 #${player.netid} 当前正在使用 HWID ${shortenId(onlineHwidFound, 6)}，你需要等待其从服务器断开后才能将其从玩家历史中删除。` };
        }
    }

    try {
        player.removeIds(idsToDelete);
        const summarizedIds = summarizeIdsArray(idsToDelete);
        ctx.admin.logAction(`Deleted IDs/HWIDs ${summarizedIds} from player "${player.displayName}" with license ${player.license}.`);

        return { success: true };
    } catch (error) {
        return { error: `保存白名单状态失败：${(error as Error).message}` };
    }
}


/**
 * Handle Direct Message Action
 */
async function handleDirectMessage(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.message,
    )) {
        return { error: '无效请求。' };
    }
    const message = ctx.request.body.message.trim();
    if (!message.length) {
        return { error: '无法发送内容为空的消息。' };
    }

    //Check permissions
    if (!ctx.admin.testPermission('players.direct_message', modulename)) {
        return { error: '你没有权限执行此操作。' };
    }

    //Validating server & player
    if (!txCore.fxRunner.child?.isAlive) {
        return { error: '服务器未运行。' };
    }
    if (!(player instanceof ServerPlayer) || !player.isConnected) {
        return { error: '该玩家未连接到服务器。' };
    }

    try {
        ctx.admin.logAction(`DM to "${player.displayName}": ${message}`);

        // Dispatch `txAdmin:events:playerDirectMessage`
        txCore.fxRunner.sendEvent('playerDirectMessage', {
            target: player.netid,
            author: ctx.admin.name,
            message,
        });

        return { success: true };
    } catch (error) {
        return { error: `发送玩家私信失败：${(error as Error).message}` };
    }
}


/**
 * Handle Kick Action
 */
async function handleKick(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.reason,
    )) {
        return { error: '无效请求。' };
    }
    const kickReason = ctx.request.body.reason.trim() || txCore.translator.t('kick_messages.unknown_reason');

    //Check permissions
    if (!ctx.admin.testPermission('players.kick', modulename)) {
        return { error: '你没有权限执行此操作。' };
    }

    //Validating server & player
    if (!txCore.fxRunner.child?.isAlive) {
        return { error: '服务器未运行。' };
    }
    if (!(player instanceof ServerPlayer) || !player.isConnected) {
        return { error: '该玩家未连接到服务器。' };
    }

    try {
        ctx.admin.logAction(`Kicked "${player.displayName}": ${kickReason}`);
        const dropMessage = txCore.translator.t(
            'kick_messages.player',
            { reason: kickReason }
        );

        // Dispatch `txAdmin:events:playerKicked`
        txCore.fxRunner.sendEvent('playerKicked', {
            target: player.netid,
            author: ctx.admin.name,
            reason: kickReason,
            dropMessage,
        });

        return { success: true };
    } catch (error) {
        return { error: `踢出玩家失败：${(error as Error).message}` };
    }
}
