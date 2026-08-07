import { ApplicationCommandDataResolvable, ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';


const statusCommand: ApplicationCommandDataResolvable = {
    type: ApplicationCommandType.ChatInput,
    name: 'status',
    description: '添加或移除可配置、持久且自动更新的嵌入消息。',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'add',
            description: '创建带有服务器状态的可配置、持久且自动更新的嵌入消息。'
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'remove',
            description: '移除已配置的持久化 txAdmin 状态嵌入消息。'
        }
    ]
}

const whitelistCommand: ApplicationCommandDataResolvable = {
    type: ApplicationCommandType.ChatInput,
    name: 'whitelist',
    description: '白名单嵌入命令。',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'member',
            description: '将成员添加到白名单审批中。',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'member',
                    description: '将被加入白名单的成员。',
                    required: true,
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'request',
            description: '审批白名单请求 ID（例如 R1234）。',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'id',
                    description: '请求的 ID（例如 R1234）。',
                    required: true,
                    minLength: 5,
                    maxLength: 5,
                }
            ]
        }
    ]
}
const allowlistCommand: ApplicationCommandDataResolvable = {
    type: ApplicationCommandType.ChatInput,
    name: 'allowlist',
    description: '准入名单嵌入命令。',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'member',
            description: '将成员添加到准入名单审批中。',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'member',
                    description: '将被加入准入名单的成员。',
                    required: true,
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'request',
            description: '审批准入名单请求 ID（例如 R1234）。',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'id',
                    description: '请求的 ID（例如 R1234）。',
                    required: true,
                    minLength: 5,
                    maxLength: 5,
                }
            ]
        }
    ]
}

const infoCommand: ApplicationCommandDataResolvable = {
    type: ApplicationCommandType.ChatInput,
    name: 'info',
    description: '在 txAdmin 数据库中搜索玩家并显示信息。',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'self',
            description: '搜索使用该命令的本人。',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'member',
            description: '按 Discord ID 搜索玩家。',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'member',
                    description: '将被搜索的成员。',
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'admininfo',
                    description: '供管理员查看标识符和历史信息。'
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'id',
            description: '搜索标识符。',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'id',
                    description: '要搜索的 ID（例如 fivem:271816）。',
                    required: true,
                    minLength: 5,
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'admininfo',
                    description: '供管理员查看标识符和历史信息。'
                }
            ]
        },
    ]
}

/**
 * Exported commands
 */
export default [
    statusCommand,
    whitelistCommand,
    allowlistCommand,
    infoCommand,
] as ApplicationCommandDataResolvable[];
