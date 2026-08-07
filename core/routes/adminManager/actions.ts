const modulename = 'WebServer:AdminManagerActions';
import { customAlphabet } from 'nanoid';
import dict49 from 'nanoid-dictionary/nolookalikes';
import got from '@lib/got';
import consts from '@shared/consts';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
const console = consoleFactory(modulename);

//Helpers
const nanoid = customAlphabet(dict49, 20);
//NOTE: this desc misses that it should start and end with alphanum or _, and cannot have repeated -_.
const nameRegexDesc = '最多 20 个字符，只能包含字母、数字以及字符 \`_.-\`';
const cfxHttpReqOptions = {
    timeout: { request: 6000 },
};
type ProviderDataType = { id: string, identifier: string };

/**
 * Returns the output page containing the admins.
 */
export default async function AdminManagerActions(ctx: AuthedCtx) {
    //Sanity check
    if (typeof ctx.params?.action !== 'string') {
        return ctx.utils.error(400, '无效请求');
    }
    const action = ctx.params.action;

    //Check permissions
    if (!ctx.admin.testPermission('manage.admins', modulename)) {
        return ctx.send({
            type: 'danger',
            message: '你没有权限执行此操作。',
        });
    }

    //Delegate to the specific action handler
    if (action == 'add') {
        return await handleAdd(ctx);
    } else if (action == 'edit') {
        return await handleEdit(ctx);
    } else if (action == 'delete') {
        return await handleDelete(ctx);
    } else {
        return ctx.send({
            type: 'danger',
            message: '未知操作。',
        });
    }
};


/**
 * Handle Add
 */
async function handleAdd(ctx: AuthedCtx) {
    //Sanity check
    if (
        typeof ctx.request.body.name !== 'string'
        || typeof ctx.request.body.citizenfxID !== 'string'
        || typeof ctx.request.body.discordID !== 'string'
        || ctx.request.body.permissions === undefined
    ) {
        return ctx.utils.error(400, '无效请求 - 缺少参数');
    }

    //Prepare and filter variables
    const name = ctx.request.body.name.trim();
    const password = nanoid();
    const citizenfxID = ctx.request.body.citizenfxID.trim();
    const discordID = ctx.request.body.discordID.trim();
    let permissions = (Array.isArray(ctx.request.body.permissions)) ? ctx.request.body.permissions : [];
    permissions = permissions.filter((x: unknown) => typeof x === 'string');
    if (permissions.includes('all_permissions')) permissions = ['all_permissions'];


    //Validate name
    if (!consts.regexValidFivemUsername.test(name)) {
        return ctx.send({ type: 'danger', markdown: true, message: `**无效的用户名，它必须符合以下规则：**\n${nameRegexDesc}` });
    }

    //Validate & translate FiveM ID
    let citizenfxData: ProviderDataType | false = false;
    if (citizenfxID.length) {
        try {
            if (consts.validIdentifiers.fivem.test(citizenfxID)) {
                const id = citizenfxID.split(':')[1];
                const res = await got(`https://policy-live.fivem.net/api/getUserInfo/${id}`, cfxHttpReqOptions).json<any>();
                if (!res.username || !res.username.length) {
                    return ctx.send({ type: 'danger', message: '无效的 CitizenFX ID1' });
                }
                citizenfxData = {
                    id: res.username,
                    identifier: citizenfxID,
                };
            } else if (consts.regexValidFivemUsername.test(citizenfxID)) {
                const res = await got(`https://forum.cfx.re/u/${citizenfxID}.json`, cfxHttpReqOptions).json<any>();
                if (!res.user || typeof res.user.id !== 'number') {
                    return ctx.send({ type: 'danger', message: '无效的 CitizenFX ID2' });
                }
                citizenfxData = {
                    id: citizenfxID,
                    identifier: `fivem:${res.user.id}`,
                };
            } else {
                return ctx.send({ type: 'danger', message: '无效的 CitizenFX ID3' });
            }
        } catch (error) {
            console.error(`Failed to resolve CitizenFX ID to game identifier with error: ${(error as Error).message}`);
        }
    }

    //Validate Discord ID
    let discordData: ProviderDataType | false = false;
    if (discordID.length) {
        if (!consts.validIdentifierParts.discord.test(discordID)) {
            return ctx.send({ type: 'danger', message: '无效的 Discord ID' });
        }
        discordData = {
            id: discordID,
            identifier: `discord:${discordID}`,
        };
    }

    //Check for privilege escalation
    if (!ctx.admin.isMaster && !ctx.admin.permissions.includes('all_permissions')) {
        const deniedPerms = permissions.filter((x: string) => !ctx.admin.permissions.includes(x));
        if (deniedPerms.length) {
            return ctx.send({
                type: 'danger',
                message: `你不能授予你自身没有的权限：<br>${deniedPerms.join(', ')}`,
            });
        }
    }

    //List changes
    const changes = {
        cfxId: citizenfxData ? citizenfxData.identifier : undefined,
        discordId: discordData ? discordData.identifier : undefined,
        permissions: permissions,
    };

    //Add admin and give output
    try {
        await txCore.adminStore.addAdmin(name, citizenfxData, discordData, password, permissions);
        ctx.admin.logAction(`Adding user '${name}' with ${JSON.stringify(changes)}`);
        return ctx.send({ type: 'showPassword', password });
    } catch (error) {
        return ctx.send({ type: 'danger', message: (error as Error).message });
    }
}


/**
 * Handle Edit
 */
async function handleEdit(ctx: AuthedCtx) {
    //Sanity check
    if (
        typeof ctx.request.body.name !== 'string'
        || typeof ctx.request.body.citizenfxID !== 'string'
        || typeof ctx.request.body.discordID !== 'string'
        || ctx.request.body.permissions === undefined
    ) {
        return ctx.utils.error(400, '无效请求 - 缺少参数');
    }

    //Prepare and filter variables
    const name = ctx.request.body.name.trim();
    const citizenfxID = ctx.request.body.citizenfxID.trim();
    const discordID = ctx.request.body.discordID.trim();

    //Check if editing himself
    if (ctx.admin.name.toLowerCase() === name.toLowerCase()) {
        return ctx.send({ type: 'danger', message: '(ERR0) 你不能编辑自己。' });
    }

    //Validate & translate permissions
    let permissions: string[] = [];
    if (Array.isArray(ctx.request.body.permissions)) {
        permissions = ctx.request.body.permissions.filter((x: unknown) => typeof x === 'string');
        if (permissions.includes('all_permissions')) {
            permissions = ['all_permissions'];
        }
    }

    //Validate & translate FiveM ID
    let citizenfxData: ProviderDataType | false = false;
    if (citizenfxID.length) {
        try {
            if (consts.validIdentifiers.fivem.test(citizenfxID)) {
                const id = citizenfxID.split(':')[1];
                const res = await got(`https://policy-live.fivem.net/api/getUserInfo/${id}`, cfxHttpReqOptions).json<any>();
                if (!res.username || !res.username.length) {
                    return ctx.send({ type: 'danger', message: '(ERR1) 无效的 CitizenFX ID' });
                }
                citizenfxData = {
                    id: res.username,
                    identifier: citizenfxID,
                };
            } else if (consts.regexValidFivemUsername.test(citizenfxID)) {
                const res = await got(`https://forum.cfx.re/u/${citizenfxID}.json`, cfxHttpReqOptions).json<any>();
                if (!res.user || typeof res.user.id !== 'number') {
                    return ctx.send({ type: 'danger', message: '(ERR2) 无效的 CitizenFX ID' });
                }
                citizenfxData = {
                    id: citizenfxID,
                    identifier: `fivem:${res.user.id}`,
                };
            } else {
                return ctx.send({ type: 'danger', message: '(ERR3) 无效的 CitizenFX ID' });
            }
        } catch (error) {
            console.error(`Failed to resolve CitizenFX ID to game identifier with error: ${(error as Error).message}`);
        }
    }

    //Validate Discord ID
    //FIXME: you cannot remove a discord id by erasing from the field
    let discordData: ProviderDataType | false = false;
    if (discordID.length) {
        if (!consts.validIdentifierParts.discord.test(discordID)) {
            return ctx.send({ type: 'danger', message: '无效的 Discord ID' });
        }
        discordData = {
            id: discordID,
            identifier: `discord:${discordID}`,
        };
    }

    //Check if admin exists
    const admin = txCore.adminStore.getAdminByName(name);
    if (!admin) return ctx.send({ type: 'danger', message: '未找到该管理员。' });

    //Check if editing an master admin
    if (!ctx.admin.isMaster && admin.master) {
        return ctx.send({ type: 'danger', message: '你不能编辑主账户管理员。' });
    }

    //Check for privilege escalation
    if (permissions && !ctx.admin.isMaster && !ctx.admin.permissions.includes('all_permissions')) {
        const deniedPerms = permissions.filter((x: string) => !ctx.admin.permissions.includes(x));
        if (deniedPerms.length) {
            return ctx.send({
                type: 'danger',
                message: `你不能授予你自身没有的权限：<br>${deniedPerms.join(', ')}`,
            });
        }
    }

    //List changes
    const permsAdded = permissions.filter((x: string) => !admin.permissions.includes(x));
    const permsRemoved = admin.permissions.filter((x: string) => !permissions.includes(x));
    const changes: string[] = [];
    if (permsAdded.includes('all_permissions')) {
        changes.push('Added all permissions.');
    } else {
        if (permsAdded.length) {
            changes.push(`Added permissions: ${JSON.stringify(permsAdded)}.`);
        }
        if (permsRemoved.length) {
            changes.push(`Removed permissions: ${JSON.stringify(permsRemoved)}.`);
        }
    }
    const prevCfxId = admin.providers?.citizenfx?.identifier;
    if (!prevCfxId && citizenfxData) {
        changes.push(`Added Cfx.re ID: ${citizenfxData.identifier}.`);
    } else if (prevCfxId && !citizenfxData) {
        changes.push(`Removed Cfx.re ID: ${prevCfxId}.`);
    } else if (prevCfxId && citizenfxData && prevCfxId !== citizenfxData.identifier) {
        changes.push(`Changed Cfx.re ID from ${prevCfxId} to ${citizenfxData.identifier}.`);
    }
    const prevDiscordId = admin.providers?.discord?.identifier;
    if (!prevDiscordId && discordData) {
        changes.push(`Added Discord ID: ${discordData.identifier}.`);
    } else if (prevDiscordId && !discordData) {
        changes.push(`Removed Discord ID: ${prevDiscordId}.`);
    } else if (prevDiscordId && discordData && prevDiscordId !== discordData.identifier) {
        changes.push(`Changed Discord ID from ${prevDiscordId} to ${discordData.identifier}.`);
    }

    //Add admin and give output
    try {
        let logMessage = `Editing user '${name}'`;
        if (changes.length) {
            logMessage += `: ${changes.join(' ')}`;
        } else {
            logMessage += '. No changes were made.';
        }
        await txCore.adminStore.editAdmin(name, null, citizenfxData, discordData, permissions);
        ctx.admin.logAction(logMessage);
        return ctx.send({ type: 'success', refresh: true });
    } catch (error) {
        return ctx.send({ type: 'danger', message: (error as Error).message });
    }
}


/**
 * Handle Delete
 */
async function handleDelete(ctx: AuthedCtx) {
    //Sanity check
    if (typeof ctx.request.body.name !== 'string') {
        return ctx.utils.error(400, '无效请求 - 缺少参数');
    }
    const name = ctx.request.body.name.trim();

    //Check if deleting himself
    if (ctx.admin.name.toLowerCase() === name.toLowerCase()) {
        return ctx.send({ type: 'danger', message: '你不能删除自己。' });
    }

    //Check if admin exists
    const admin = txCore.adminStore.getAdminByName(name);
    if (!admin) return ctx.send({ type: 'danger', message: '未找到该管理员。' });

    //Check if editing an master admin
    if (admin.master) {
        return ctx.send({ type: 'danger', message: '你不能删除主账户管理员。' });
    }

    //Delete admin and give output
    try {
        await txCore.adminStore.deleteAdmin(name);
        ctx.admin.logAction(`Deleting user '${name}'.`);
        return ctx.send({ type: 'success', refresh: true });
    } catch (error) {
        return ctx.send({ type: 'danger', message: (error as Error).message });
    }
}
