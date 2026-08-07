const modulename = 'DiscordBot:cmd:info';
import { APIEmbedField, CommandInteraction, EmbedBuilder, EmbedData } from 'discord.js';
import { parsePlayerId } from '@lib/player/idUtils';
import { embedder } from '../discordHelpers';
import { findPlayersByIdentifier } from '@lib/player/playerFinder';
import { txEnv } from '@core/globalData';
import humanizeDuration from 'humanize-duration';
import consoleFactory from '@lib/console';
import { msToShortishDuration } from '@lib/misc';
const console = consoleFactory(modulename);


//Consts
const footer = {
    iconURL: 'https://cdn.discordapp.com/emojis/1062339910654246964.webp?size=96&quality=lossless',
    text: `txAdmin ${txEnv.txaVersion}`,
}


/**
 * Handler for /info
 */
export default async (interaction: CommandInteraction) => {
    const tsToLocaleDate = (ts: number) => {
        return new Date(ts * 1000).toLocaleDateString(
            txCore.translator.canonical,
            { dateStyle: 'long' }
        );
    }

    //Check for admininfo & permission
    let includeAdminInfo = false;
    //@ts-ignore: somehow vscode is resolving interaction as CommandInteraction
    const adminInfoFlag = interaction.options.getBoolean('admininfo');
    if (adminInfoFlag) {
        const admin = txCore.adminStore.getAdminByProviderUID(interaction.user.id);
        if (!admin) {
            return await interaction.reply(embedder.danger('如果你不是 txAdmin 管理员，则无法使用 `admininfo` 选项。'));
        } else {
            includeAdminInfo = true;
        }
    }

    //Detect search identifier
    let searchId;
    //@ts-ignore: somehow vscode is resolving interaction as CommandInteraction
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'self') {
        const targetId = interaction.member?.user.id;
        if (!targetId) {
            return await interaction.reply(embedder.danger('无法解析你的 Discord ID。'));
        }
        searchId = `discord:${targetId}`;

    } else if (subcommand === 'member') {
        const member = interaction.options.getMember('member');
        if(!member || !('user' in member)){
            return await interaction.reply(embedder.danger(`无法解析成员 ID。`));
        }
        searchId = `discord:${member.user.id}`;

    } else if (subcommand === 'id') {
        //@ts-ignore: somehow vscode is resolving interaction as CommandInteraction
        const input = interaction.options.getString('id', true).trim();
        if (!input.length) {
            return await interaction.reply(embedder.danger('无效的标识符。'));
        }

        const { isIdValid, idType, idValue, idlowerCased } = parsePlayerId(input);
        if (!isIdValid || !idType || !idValue || !idlowerCased) {
            return await interaction.reply(embedder.danger(`提供的标识符（\`${input}\`）似乎无效。`));
        }
        searchId = idlowerCased;

    } else {
        throw new Error(`Subcommand ${subcommand} not found.`);
    }

    //Searching for players
    const players = findPlayersByIdentifier(searchId);
    if (!players.length) {
        return await interaction.reply(embedder.warning(`标识符（\`${searchId}\`）似乎未与 txAdmin 数据库中的任何玩家关联。`));
    } else if (players.length > 10) {
        return await interaction.reply(embedder.warning(`标识符（\`${searchId}\`）关联的玩家超过 10 个，请使用 txAdmin Web 面板进行搜索。`));
    }

    //Format players
    const embeds = [];
    for (const player of players) {
        const dbData = player.getDbData();
        if (!dbData) continue;

        //Basic data
        const bodyText: Record<string, string> = {
            '游戏时长': msToShortishDuration(dbData.playTime * 60 * 1000),
            '加入日期': tsToLocaleDate(dbData.tsJoined),
            '最后连接': tsToLocaleDate(dbData.tsLastConnection),
            '已白名单': (dbData.tsWhitelisted)
                ? tsToLocaleDate(dbData.tsWhitelisted)
                : '尚未',
        };

        //If admin query
        let fields: APIEmbedField[] | undefined;
        if (includeAdminInfo) {
            //Counting bans/warns
            const actionHistory = player.getHistory();
            const actionCount = { ban: 0, warn: 0 };
            for (const log of actionHistory) {
                actionCount[log.type]++;
            }
            const banText = (actionCount.ban === 1) ? '1 次封禁' : `${actionCount.ban} 次封禁`;
            const warnText = (actionCount.warn === 1) ? '1 次警告' : `${actionCount.warn} 次警告`;
            bodyText['记录'] = `${banText}，${warnText}`;

            //Filling notes + identifiers
            const notesText = (dbData.notes) ? dbData.notes.text : '无内容';
            const idsText = (dbData.ids.length) ? dbData.ids.join('\n') : '无内容';
            fields = [
                {
                    name: '• 备注：',
                    value: `\`\`\`${notesText}\`\`\``
                },
                {
                    name: '• 标识符：',
                    value: `\`\`\`${idsText}\`\`\``
                },
            ];

        }

        //Preparing embed
        const description = Object.entries(bodyText)
            .map(([label, value]) => `**• ${label}:** \`${value}\``)
            .join('\n')
        const embedData: EmbedData = {
            title: player.displayName,
            fields,
            description,
            footer,
        };
        embeds.push(new EmbedBuilder(embedData).setColor('#4262e2'));
    }

    //Send embeds :)
    return await interaction.reply({ embeds });
}
