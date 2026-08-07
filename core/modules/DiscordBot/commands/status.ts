const modulename = 'DiscordBot:cmd:status';
import humanizeDuration from 'humanize-duration';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from 'discord.js';
import { txEnv } from '@core/globalData';
import { cloneDeep } from 'lodash-es';
import { embedder, ensurePermission, isValidButtonEmoji, isValidEmbedUrl, logDiscordAdminAction } from '../discordHelpers';
import consoleFactory from '@lib/console';
import { msToShortishDuration } from '@lib/misc';
import { FxMonitorHealth } from '@shared/enums';
const console = consoleFactory(modulename);


const isValidButtonConfig = (btn: any) => {
    const btnType = typeof btn;
    return (
        btn !== null && btnType === 'object'
        && typeof btn.label === 'string'
        && btn.label.length
        && typeof btn.url === 'string'
        // && btn.url.length //let the function handle it
        && (typeof btn.emoji === 'string' || btn.emoji === undefined)
    );
}

const invalidUrlMessage = `每个 URL 都必须以（\`http://\`、\`https://\`、\`discord://\`）之一开头。
URL 不能为空，如果不需要 URL，请删除 URL 行。`;

const invalidPlaceholderMessage = `你的 URL 以 \`{{\` 开头，请尝试删除它。
如果你只是想编辑像 \`{{serverBrowserUrl}}\` 或 \`{{serverJoinUrl}}\` 这样的占位符，请记住这些占位符会由 txAdmin 自动替换，你完全不需要编辑它们。`

const invalidEmojiMessage = `所有表情符号必须是以下之一：
- UTF-8 表情（'😄'）
- 有效的表情 ID（'1062339910654246964'）
- Discord 自定义表情（\`<:name:id>\` 或 \`<a:name:id>\`）。
要获取完整的表情代码，请将其插入 Discord，并在前面加上 \`\\\` 然后发送消息`


export const generateStatusMessage = (
    rawEmbedJson: string = txConfig.discordBot.embedJson,
    rawEmbedConfigJson: string = txConfig.discordBot.embedConfigJson
) => {
    //Parsing decoded JSONs
    let embedJson;
    try {
        embedJson = JSON.parse(rawEmbedJson);
        if (!(embedJson instanceof Object)) throw new Error(`not an Object`);
    } catch (error) {
        throw new Error(`Embed JSON Error: ${(error as Error).message}`);
    }

    let embedConfigJson;
    try {
        embedConfigJson = JSON.parse(rawEmbedConfigJson);
        if (!(embedConfigJson instanceof Object)) throw new Error(`not an Object`);
    } catch (error) {
        throw new Error(`Embed Config JSON Error: ${(error as Error).message}`);
    }

    //Prepare placeholders
    //NOTE: serverCfxId can be undefined, breaking the URLs, but there is no easy clean way to deal with this issue
    const serverCfxId = txCore.cacheStore.get('fxsRuntime:cfxId');
    const fxMonitorStatus = txCore.fxMonitor.status;
    const placeholders = {
        serverName: txConfig.general.serverName,
        statusString: '未知',
        statusColor: '#4C3539',
        serverCfxId,
        serverBrowserUrl: `https://servers.fivem.net/servers/detail/${serverCfxId}`,
        serverJoinUrl: `https://cfx.re/join/${serverCfxId}`,
        serverMaxClients: txCore.cacheStore.get('fxsRuntime:maxClients') ?? '未知',
        serverClients: txCore.fxPlayerlist.onlineCount,
        nextScheduledRestart: '未知',
        uptime: (fxMonitorStatus.uptime > 0)
            ? msToShortishDuration(fxMonitorStatus.uptime)
            : '--',
    }

    //Prepare scheduler placeholder
    const schedule = txCore.fxScheduler.getStatus();
    if (typeof schedule.nextRelativeMs !== 'number') {
        placeholders.nextScheduledRestart = '未安排';
    } else if (schedule.nextSkip) {
        placeholders.nextScheduledRestart = '已跳过';
    } else {
        const tempFlag = (schedule.nextIsTemp) ? '（临时）' : '';
        const relativeTime = msToShortishDuration(schedule.nextRelativeMs);
        const isLessThanMinute = schedule.nextRelativeMs < 60_000;
        if (isLessThanMinute) {
            placeholders.nextScheduledRestart = `现在${tempFlag}`;
        } else {
            placeholders.nextScheduledRestart = `${relativeTime} 后${tempFlag}`;
        }
    }

    //Prepare status placeholders
    if (fxMonitorStatus.health === FxMonitorHealth.ONLINE) {
        placeholders.statusString = embedConfigJson?.onlineString ?? '🟢 在线';
        placeholders.statusColor = embedConfigJson?.onlineColor ?? "#0BA70B";
    } else if (fxMonitorStatus.health === FxMonitorHealth.PARTIAL) {
        placeholders.statusString = embedConfigJson?.partialString ?? '🟡 部分';
        placeholders.statusColor = embedConfigJson?.partialColor ?? "#FFF100";
    } else if (fxMonitorStatus.health === FxMonitorHealth.OFFLINE) {
        placeholders.statusString = embedConfigJson?.offlineString ?? '🔴 离线';
        placeholders.statusColor = embedConfigJson?.offlineColor ?? "#A70B28";
    }

    //Processing embed
    function replacePlaceholders(inputString: string) {
        Object.entries(placeholders).forEach(([key, value]) => {
            inputString = inputString.replaceAll(`{{${key}}}`, String(value));
        });
        return inputString;
    }
    function processValue(inputValue: any): any {
        if (typeof inputValue === 'string') {
            return replacePlaceholders(inputValue);
        } else if (Array.isArray(inputValue)) {
            return inputValue.map((arrValue) => processValue(arrValue));
        } else if (inputValue !== null && typeof inputValue === 'object') {
            return processObject(inputValue);
        } else {
            return inputValue;
        }
    }
    function processObject(inputData: object) {
        const input = cloneDeep(inputData);
        const out: any = {};
        for (const [key, value] of Object.entries(input)) {
            const processed = processValue(value);
            if (key === 'url' && !isValidEmbedUrl(processed)) {
                const messageHead = processed.length
                    ? `无效的 URL \`${processed}\`。`
                    : 'URL 为空。';
                const badPlaceholderMessage = processed.startsWith('{{')
                    ? invalidPlaceholderMessage
                    : '';
                throw new Error([
                    messageHead,
                    invalidUrlMessage,
                    badPlaceholderMessage
                ].join('\n'));
            }
            out[key] = processed;
        }
        return out;
    }
    const processedEmbedData = processObject(embedJson);

    //Attempting to instantiate embed class
    let embed;
    try {
        embed = new EmbedBuilder(processedEmbedData);
        embed.setColor(placeholders.statusColor as ColorResolvable);
        embed.setTimestamp();
        embed.setFooter({
            iconURL: 'https://cdn.discordapp.com/emojis/1062339910654246964.webp?size=96&quality=lossless',
            text: `txAdmin ${txEnv.txaVersion} • 每分钟更新`,

        });
    } catch (error) {
        throw new Error(`**嵌入消息类错误：** ${(error as Error).message}`);
    }

    //Attempting to instantiate buttons
    let buttonsRow: ActionRowBuilder<ButtonBuilder> | undefined;
    try {
        if (Array.isArray(embedConfigJson?.buttons) && embedConfigJson.buttons.length) {
            if (embedConfigJson.buttons.length > 5) {
                throw new Error(`超过 5 个按钮的限制。`);
            }
            buttonsRow = new ActionRowBuilder<ButtonBuilder>();
            for (const cfgButton of embedConfigJson.buttons) {
                if (!isValidButtonConfig(cfgButton)) {
                    throw new Error(`Discord 状态嵌入配置中的按钮无效。
                    所有按钮必须满足：
                    - 标签：非空字符串
                    - URL：非空且有效的 URL`);
                }
                const processedUrl = processValue(cfgButton.url);
                if (!isValidEmbedUrl(processedUrl)) {
                    const messageHead = processedUrl.length
                        ? `无效的 URL \`${processedUrl}\``
                        : 'URL 为空';
                    const badPlaceholderMessage = processedUrl.startsWith('{{')
                        ? invalidPlaceholderMessage
                        : '';
                    throw new Error([
                        `${messageHead}，按钮 \`${cfgButton.label}\`。`,
                        invalidUrlMessage,
                        badPlaceholderMessage
                    ].join('\n'));
                }
                const btn = new ButtonBuilder({
                    style: ButtonStyle.Link,
                    label: processValue(cfgButton.label),
                    url: processedUrl,
                });
                if (cfgButton.emoji !== undefined) {
                    if (!isValidButtonEmoji(cfgButton.emoji)) {
                        throw new Error(`按钮 \`${cfgButton.label}\` 的表情无效。\n${invalidEmojiMessage}`);
                    }
                    btn.setEmoji(cfgButton.emoji);
                }
                buttonsRow.addComponents(btn);
            }
        }
    } catch (error) {
        throw new Error(`**嵌入按钮错误：** ${(error as Error).message}`);
    }

    return {
        embeds: [embed],
        components: buttonsRow ? [buttonsRow] : undefined,
    };
}

export const removeOldEmbed = async (interaction: ChatInputCommandInteraction) => {
    const oldChannelId = txCore.cacheStore.get('discord:status:channelId');
    const oldMessageId = txCore.cacheStore.get('discord:status:messageId');
    if (typeof oldChannelId === 'string' && typeof oldMessageId === 'string') {
        const oldChannel = await interaction.client.channels.fetch(oldChannelId);
        if (oldChannel?.type === ChannelType.GuildText || oldChannel?.type === ChannelType.GuildAnnouncement) {
            await oldChannel.messages.delete(oldMessageId);
        } else {
            throw new Error(`旧频道不是文本或公告频道`);
        }
    } else {
        throw new Error(`未保存旧消息 ID，可能从未发送过，也可能已被删除`);
    }
}

export default async (interaction: ChatInputCommandInteraction) => {
    //Check permissions
    const adminName = await ensurePermission(interaction, 'settings.write');
    if (typeof adminName !== 'string') return;

    //Attempt to remove old message
    const isRemoveOnly = (interaction.options.getSubcommand() === 'remove');
    try {
        await removeOldEmbed(interaction);
        txCore.cacheStore.delete('discord:status:channelId');
        txCore.cacheStore.delete('discord:status:messageId');
        if (isRemoveOnly) {
            const msg = `旧状态嵌入已移除。`;
            logDiscordAdminAction(adminName, msg);
            return await interaction.reply(embedder.success(msg, true));
        }
    } catch (error) {
        if (isRemoveOnly) {
            return await interaction.reply(
                embedder.warning(`**移除旧状态嵌入失败：**\n${(error as Error).message}`, true)
            );
        }
    }

    //Generate new message
    let newStatusMessage;
    try {
        newStatusMessage = generateStatusMessage();
    } catch (error) {
        return await interaction.reply(
            embedder.warning(`**生成新嵌入失败：**\n${(error as Error).message}`, true)
        );
    }

    //Attempt to send new message
    try {
        if (interaction.channel?.type !== ChannelType.GuildText && interaction.channel?.type !== ChannelType.GuildAnnouncement) {
            throw new Error(`不支持此频道类型`);
        }
        const placeholderEmbed = new EmbedBuilder({
            description: '_占位消息，正在尝试用嵌入替换..._\n**注意：** 如果你看到此消息，可能意味着配置的嵌入 JSON 存在问题，Discord 的 API 拒绝了替换此占位消息的请求。'
        })
        const newMessage = await interaction.channel.send({ embeds: [placeholderEmbed] });
        await newMessage.edit(newStatusMessage);
        txCore.cacheStore.set('discord:status:channelId', interaction.channelId);
        txCore.cacheStore.set('discord:status:messageId', newMessage.id);
    } catch (error) {
        let msg: string;
        if ((error as any).code === 50013) {
            msg = `此机器人在该频道中没有发送嵌入消息的权限。
            请修改频道权限，为此机器人授予 \`Embed Links\`（嵌入链接）和 \`Send Messages\`（发送消息）权限。`
        } else {
            msg = (error as Error).message;
        }
        return await interaction.reply(
            embedder.warning(`**发送新嵌入失败：**\n${msg}`, true)
        );
    }

    const msg = `状态嵌入已保存。`;
    logDiscordAdminAction(adminName, msg);
    return await interaction.reply(embedder.success(msg, true));
}
