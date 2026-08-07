const modulename = 'WebServer:SettingsPage';
import consoleFactory from '@lib/console';
import fsp from 'node:fs/promises';
import path from 'node:path';
import slash from 'slash';
import type { AuthedCtx } from '@modules/WebServer/ctxTypes';
import type { ApiToastResp } from '@shared/genericApiTypes';
import type { PartialTxConfigs, PartialTxConfigsToSave } from '@modules/ConfigStore/schema';
import type { ConfigChangelogEntry } from '@shared/otherTypes';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import Translator, { localeFileSchema } from '@modules/Translator';
import ConfigStore from '@modules/ConfigStore';
import { resolveCFGFilePath } from '@lib/fxserver/fxsConfigHelper';
import { findPotentialServerDataPaths, isValidServerDataPath } from '@lib/fxserver/serverData';
import { getFsErrorMdMessage } from '@lib/fs';
import { generateStatusMessage } from '@modules/DiscordBot/commands/status';
import { getSchemaChainError } from '@modules/ConfigStore/schema/utils';
import { confx } from '@modules/ConfigStore/utils';
import { SYM_RESET_CONFIG } from '@lib/symbols';
const console = consoleFactory(modulename);


//Types
export type SaveConfigsReq = {
    resetKeys: string[];
    changes: PartialTxConfigs,
};
export type SaveConfigsResp = ApiToastResp & {
    stored?: PartialTxConfigs;
    changelog?: ConfigChangelogEntry[];
};

type SendTypedResp = (data: SaveConfigsResp) => void;
type CardHandlerSuccessResp = {
    processedConfig: PartialTxConfigsToSave;
    successToast?: ApiToastResp;
}
type CardHandler = (
    inputConfig: PartialTxConfigsToSave,
    sendTypedResp: SendTypedResp
) => Promise<CardHandlerSuccessResp | void>;

//Known cards
const cardNamesMap = {
    general: 'General',
    fxserver: 'FXServer',
    bans: 'Bans',
    // FIXME:NEXT:UPDATE rename
    whitelist: 'Whitelist',
    discord: 'Discord',
    'game-menu': 'Game Menu',
    'game-notifications': 'Game Notifications',
} as const;
const validCardIds = Object.keys(cardNamesMap) as [keyof typeof cardNamesMap];

//Req validation
const paramsSchema = z.object({ card: z.enum(validCardIds) });
const bodySchema = z.object({
    resetKeys: z.array(z.string()),
    changes: z.object({}).passthrough(),
});

//Helper to clean paths
const cleanPath = (x: string) => slash(path.normalize(x));


/**
 * Processes a settings save request
 * NOTE: the UI trims all strings
 */
export default async function SaveSettingsConfigs(ctx: AuthedCtx) {
    const sendTypedResp = (data: SaveConfigsResp) => ctx.send(data);

    //Check permissions
    if (!ctx.admin.testPermission('settings.write', modulename)) {
        return sendTypedResp({
            type: 'error',
            msg: '你没有权限执行此操作。',
        });
    }

    //Validating input
    const paramsSchemaRes = paramsSchema.safeParse(ctx.params);
    const bodySchemaRes = bodySchema.safeParse(ctx.request.body);
    if (!paramsSchemaRes.success || !bodySchemaRes.success) {
        return sendTypedResp({
            type: 'error',
            md: true,
            title: '无效请求',
            msg: fromError(
                paramsSchemaRes.error ?? bodySchemaRes.error,
                { prefix: null }
            ).message,
        });
    }
    const cardId = paramsSchemaRes.data.card;
    const { resetKeys, changes: inputConfig } = bodySchemaRes.data;
    const cardName = cardNamesMap[ctx.params.card as keyof typeof cardNamesMap] ?? 'UNKNOWN';

    // FIXME:NEXT:UPDATE remove
    const displayCardName = cardName === 'Whitelist' ? 'Allowlist' : cardName;

    //Delegate to the specific card handlers - if required
    let handlerResp: CardHandlerSuccessResp | void = { processedConfig: inputConfig };
    try {
        if (cardId === 'general') {
            handlerResp = await handleGeneralCard(inputConfig, sendTypedResp);
        } else if (cardId === 'fxserver') {
            handlerResp = await handleFxserverCard(inputConfig, sendTypedResp);
        } else if (cardId === 'discord') {
            handlerResp = await handleDiscordCard(inputConfig, sendTypedResp);
        }
    } catch (error) {
        return sendTypedResp({
            type: 'error',
            md: true,
            title: `处理 ${displayCardName} 更改时出错。`,
            msg: (error as any).message,
        });
    }
    if (!handlerResp) return; //resp already sent

    //Apply reset keys
    const configChanges = handlerResp.processedConfig;
    try {
        for (const config of resetKeys) {
            const [scope, key] = config.split('.');
            if (!scope || !key) throw new Error(`无效的重置键：\`${config}\``);
            confx(configChanges).set(scope, key, SYM_RESET_CONFIG);
        }
    } catch (error) {
        return sendTypedResp({
            type: 'error',
            md: true,
            title: `处理 ${displayCardName} 更改时出错。`,
            msg: (error as any).message,
        });
    }

    //Save the changes
    try {
        const changes = txCore.configStore.saveConfigs(configChanges, ctx.admin.name);
        if (changes.hasMatch(['server.dataPath', 'server.cfgPath'])) {
            txCore.webServer.webSocket.pushRefresh('status');
        }
        return sendTypedResp({
            type: 'success',
            msg: `${displayCardName} 设置已保存！`,
            ...(handlerResp?.successToast ?? {}),
            stored: txCore.configStore.getStoredConfig(),
            changelog: txCore.configStore.getChangelog(),
        });
    } catch (error) {
        const cardName = cardNamesMap[ctx.params.card as keyof typeof cardNamesMap] ?? 'UNKNOWN';
        return sendTypedResp({
            type: 'error',
            md: true,
            title: `保存 ${displayCardName} 更改时出错。`,
            msg: (error as any).message,
        });
    }
};


/**
 * General card handler
 */
const handleGeneralCard: CardHandler = async (inputConfig, sendTypedResp) => {
    //Validates custom language file
    if (inputConfig.general?.language === undefined) throw new Error(`'general' 卡片出现意外数据。`);
    if (inputConfig.general.language === 'custom') {
        try {
            const raw = await fsp.readFile(txCore.translator.customLocalePath, 'utf8');
            if (!raw.length) throw new Error('该 \`locale.json\` 文件为空。');
            const parsed = JSON.parse(raw);
            const locale = localeFileSchema.parse(parsed);
            if (!Translator.humanizerLanguages.includes(locale.$meta.humanizer_language)) {
                throw new Error(`无效的 humanizer 语言：\`${locale.$meta.humanizer_language}\`。`);
            }
        } catch (error) {
            let msg = (error as Error).message;
            if (error instanceof Error) {
                if (error.message.includes('ENOENT')) {
                    msg = `找不到自定义语言文件：\n\`${txCore.translator.customLocalePath}\``;
                } else if (error.message.includes('JSON')) {
                    msg = '自定义语言文件包含无效的 JSON。';
                } else if (error instanceof z.ZodError) {
                    msg = fromError(error, { prefix: '无效的语言元数据' }).message;
                }
            }
            return sendTypedResp({
                type: 'error',
                title: '自定义语言错误',
                md: true,
                msg,
            });
        }
    }

    return { processedConfig: inputConfig };
}


/**
 * FXServer card handler
 */
const handleFxserverCard: CardHandler = async (inputConfig, sendTypedResp) => {
    // if (typeof inputConfig.server?.dataPath === 'string' && inputConfig.server.dataPath.length) {
    //     inputConfig.server.dataPath = cleanPath(inputConfig.server.dataPath + '/');
    // }
    if (typeof inputConfig.server?.dataPath !== 'string' || !inputConfig.server?.dataPath.length) {
        throw new Error(`'fxserver' 卡片出现意外数据。`);
    }

    //Validating Server Data Path
    const dataPath = inputConfig.server.dataPath;
    try {
        const isValid = await isValidServerDataPath(dataPath);
        if (!isValid) throw new Error(`isValidServerDataPath 返回了意外结果`);
    } catch (error) {
        try {
            const potentialFix = await findPotentialServerDataPaths(dataPath);
            if (potentialFix) {
                return sendTypedResp({
                    type: 'error',
                    title: '服务器数据文件夹错误',
                    md: true,
                    msg: `提供的路径无效。\n\n你是否指的是这个路径？\n\`${cleanPath(potentialFix)}\``,
                });
            }
        } catch (error2) { }
        return sendTypedResp({
            type: 'error',
            title: '服务器数据文件夹错误',
            md: true,
            msg: (error as any).message,
        });
    }


    //Validating CFG Path
    let cfgPath = txConfig.server.cfgPath;
    if (inputConfig.server?.cfgPath !== undefined) {
        const res = ConfigStore.Schema.server.cfgPath.validator.safeParse(inputConfig.server.cfgPath);
        if (!res.success) {
            return sendTypedResp({
                type: 'error',
                title: '无效的 CFG 路径',
                md: true,
                msg: fromError(res.error, { prefix: null }).message,
            });
        }
        cfgPath = res.data;
    }

    try {
        cfgPath = resolveCFGFilePath(cfgPath, dataPath);
        const cfgFileStat = await fsp.stat(cfgPath);
        if (!cfgFileStat.isFile()) {
            throw new Error('提供的路径不是文件');
        }
    } catch (error) {
        return sendTypedResp({
            type: 'error',
            title: 'CFG 路径错误',
            md: true,
            msg: getFsErrorMdMessage(error, cleanPath(cfgPath)),
        });
    }

    //FIXME: implement findLikelyCFGPath in here


    //Final cleanup
    if (typeof inputConfig.server?.dataPath === 'string') {
        inputConfig.server.dataPath = cleanPath(inputConfig.server.dataPath);
    }
    if (typeof inputConfig.server?.cfgPath === 'string') {
        inputConfig.server.cfgPath = cleanPath(inputConfig.server.cfgPath);
    }

    return {
        processedConfig: inputConfig,
        successToast: {
            type: 'success',
            title: 'FXServer 设置已保存！',
            msg: '你需要重启服务器才能使更改生效。',
        }
    };
}


/**
 * Discord card handler
 */
const handleDiscordCard: CardHandler = async (inputConfig, sendTypedResp) => {
    if (!inputConfig.discordBot) throw new Error(`'discord' 卡片出现意外数据。`);

    //Validating embed JSONs
    //NOTE: need this before checking if enabled, or while disabled one could save invalid JSON
    if (typeof inputConfig.discordBot.embedJson === 'string' || typeof inputConfig.discordBot.embedConfigJson === 'string') {
        try {
            generateStatusMessage(
                inputConfig.discordBot.embedJson as string | undefined ?? txConfig.discordBot.embedJson,
                inputConfig.discordBot.embedConfigJson as string | undefined ?? txConfig.discordBot.embedConfigJson,
            );
        } catch (error) {
            return sendTypedResp({
                type: 'error',
                title: 'Embed 校验失败：',
                md: true,
                msg: (error as Error).message,
            });
        }
    }

    //If bot disabled, kill the bot and don't validate anything
    if (!inputConfig.discordBot?.enabled) {
        await txCore.discordBot.attemptBotReset(false);
        return { processedConfig: inputConfig };
    }

    //Validating fields manually before trying to start the bot
    const baseError = {
        type: 'error',
        title: 'Discord 机器人错误',
        md: true,
    } as const;
    const schemas = ConfigStore.Schema.discordBot;
    const validationError = getSchemaChainError([
        [schemas.enabled, inputConfig.discordBot.enabled],
        [schemas.token, inputConfig.discordBot.token],
        [schemas.guild, inputConfig.discordBot.guild],
        [schemas.warningsChannel, inputConfig.discordBot.warningsChannel],
    ]);
    if (validationError) {
        return sendTypedResp({
            ...baseError,
            msg: validationError,
        });
    }

    //Checking if required fields are present (frontend should have done this already)
    if (
        !inputConfig.discordBot.token
        || !inputConfig.discordBot.guild
    ) {
        return sendTypedResp({
            ...baseError,
            msg: '缺少启用机器人所需的必填字段。',
        });
    }

    //Restarting discord bot
    let successMsg;
    try {
        successMsg = await txCore.discordBot.attemptBotReset({
            enabled: true,
            //They have been validated, so this is fine
            token: inputConfig.discordBot.token as any,
            guild: inputConfig.discordBot.guild as any,
            warningsChannel: inputConfig.discordBot.warningsChannel as any,
        });
    } catch (error) {
        const errorCode = (error as any).code;
        let extraContext = '';
        if (errorCode === 'DisallowedIntents' || errorCode === 4014) {
            extraContext = `**该机器人需要 \`GUILD_MEMBERS\` 意图（intent）权限。**
            - 前往 [Discord 开发者门户](https://discord.com/developers/applications)
            - 导航到 \`Bot > Privileged Gateway Intents\`。
            - 启用 \`GUILD_MEMBERS\` 意图。
            - 在开发者门户中按下保存。
            - 前往 \`txAdmin > 设置 > Discord 机器人\` 并按下保存。`;
        } else if (errorCode === 'CustomNoGuild') {
            const inviteUrl = ('clientId' in (error as any))
                ? `https://discord.com/oauth2/authorize?client_id=${(error as any).clientId}&scope=bot&permissions=0`
                : `https://discordapi.com/permissions.html#0`
            extraContext = `**这通常意味着以下问题之一：**
            - **服务器 ID 错误：** 请阅读服务器 ID 设置的说明以获取更多信息。
            - **机器人不在服务器中：** 你需要 [邀请机器人](${inviteUrl}) 加入服务器。
            - **机器人错误：** 你可能使用了另一个 Discord 机器人的令牌。`;
        } else if (errorCode === 'DangerousPermission') {
            extraContext = `要启用机器人，你需要移除上面列出的权限，这可以在 Discord 服务器角色配置页面中完成。请检查机器人拥有的每一个角色，包括 \`@everyone\` 角色。
            **请记住：**
            - 这些权限是危险的，因为如果机器人令牌泄露，攻击者可能会对你的服务器造成永久性损害。
            - 任何机器人的权限都不应超出其严格所需，尤其是 \`Administrator\`。
            - 你绝不能让多个机器人使用同一个令牌，请为每个机器人创建新的令牌。`;
        }
        return sendTypedResp({
            ...baseError,
            title: '启动机器人时出错：',
            msg: `${(error as Error).message}\n${extraContext}`.trim(),
        });
    }

    return {
        processedConfig: inputConfig,
        successToast: {
            type: 'success',
            md: true,
            title: 'Discord 机器人设置已保存！',
            msg: `${successMsg}\n如果_（并且仅在）_状态 embed 没有更新，请查看 [系统 > 控制台日志](/system/console-log) 页面以查找 embed 错误。`,
        }
    };
}
