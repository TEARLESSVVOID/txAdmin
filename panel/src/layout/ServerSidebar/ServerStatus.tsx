import { useGlobalStatus } from '@/hooks/status';
import { VariantProps, cva } from 'class-variance-authority';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DiscordBotStatus, FxMonitorHealth } from '@shared/enums';
import { msToShortDuration } from '@/lib/dateTime';
import { cn } from '@/lib/utils';


const statusBadgeVariants = cva(
    `rounded-sm text-xs font-semibold px-1 py-[0.125rem] tracking-widest text-center cursor-help`,
    {
        variants: {
            type: {
                default: "bg-secondary text-secondary-foreground",
                destructive: "bg-destructive text-destructive-foreground",
                warning: "bg-warning text-warning-foreground",
                success: "bg-success text-success-foreground",
                info: "bg-info text-info-foreground",
                muted: "bg-muted text-muted-foreground",
            },
        },
        defaultVariants: {
            type: "default",
        },
    }
);
type StatusBadgeTypesVars = VariantProps<typeof statusBadgeVariants>['type'];
type StatusBadgeProps = {
    tooltip?: string | {
        title: string;
        description: string;
    };
    type?: StatusBadgeTypesVars;
    children: React.ReactNode;
};

function StatusBadge({ children, tooltip, type }: StatusBadgeProps) {
    //If no tooltip is provided, just show the text
    if (!tooltip) {
        return <span className={statusBadgeVariants({ type })}>
            {children}
        </span>
    }

    return <Tooltip>
        <TooltipTrigger asChild>
            <span className={statusBadgeVariants({ type })}>
                {children}
            </span>
        </TooltipTrigger>
        <TooltipContent side='right'>
            {typeof tooltip === 'string' ? (
                <p>{tooltip}</p>
            ) : (<>
                <h3>{tooltip.title}</h3>
                <p className={cn(
                    'text-xs tracking-wider text-muted-foreground whitespace-pre-wrap',
                    type === 'warning' && 'text-warning-inline',
                )}>
                    {tooltip.description}
                </p>
            </>)}
        </TooltipContent>
    </Tooltip>
}


const discordStatusMap = {
    [DiscordBotStatus.Disabled]: {
        text: '已禁用',
        color: 'default',
        description: 'Discord 机器人已禁用。',
    },
    [DiscordBotStatus.Starting]: {
        text: '启动中',
        color: 'warning',
        description: 'Discord 机器人正在启动。',
    },
    [DiscordBotStatus.Ready]: {
        text: '就绪',
        color: 'default',
        description: 'Discord 机器人已就绪。',
    },
    [DiscordBotStatus.Error]: {
        text: '错误',
        color: 'destructive',
        description: 'Discord 机器人处于错误状态。',
    },
} as const;

export default function ServerStatus() {
    const globalStatus = useGlobalStatus();

    //Preparing status
    let serverHealthText = '--';
    let serverHealthDescTitle = '--';
    let serverHealthDescInfo = '--';
    let serverHealthColor: StatusBadgeTypesVars = 'default';
    let serverUptimeText = '--';
    let serverUptimeDesc = '--';
    let allowlistText = '--';
    let allowlistDesc = '--';
    let allowlistColor: StatusBadgeTypesVars = 'default';
    let discordStatusText = '--';
    let discordStatusDesc = '--';
    let discordStatusColor: StatusBadgeTypesVars = 'default';

    if (globalStatus) {
        //Server uptime
        if (globalStatus.server.uptime > 0) {
            serverUptimeText = msToShortDuration(
                globalStatus.server.uptime,
                {
                    units: ['d', 'h', 'm'],
                    delimiter: ' ',
                }
            );
            serverUptimeDesc = '服务器自启动以来的运行时间。';
        }

        //Server status
        serverHealthText = globalStatus.server.health;
        serverHealthDescInfo = globalStatus.server.healthReason;
        if (globalStatus.server.health === FxMonitorHealth.ONLINE) {
            serverHealthColor = 'success';
            serverHealthDescTitle = '资源运行中，正在接受连接。';
        } else if (globalStatus.server.health === FxMonitorHealth.PARTIAL) {
            serverHealthColor = 'warning';
            serverHealthDescTitle = '资源未运行或未接受连接。';
        } else if (globalStatus.server.health === FxMonitorHealth.OFFLINE) {
            serverHealthColor = 'destructive';
            serverHealthDescTitle = '服务器已离线。';
        } else {
            serverHealthColor = 'destructive';
            serverHealthDescTitle = '未知服务器状态。';
        }

        //Allowlist - FIXME:NEXT:UPDATE: rename backend var
        if (globalStatus.server.whitelist === 'disabled') {
            allowlistText = '已禁用';
            allowlistDesc = '任何人都可以加入。';
        } else if (globalStatus.server.whitelist === 'adminOnly') {
            allowlistText = '仅管理员';
            allowlistColor = 'warning';
            allowlistDesc = '仅管理员可以加入。';
        } else if (globalStatus.server.whitelist === 'discordMember') {
            allowlistText = '服务器成员';
            allowlistDesc = '仅 Discord 服务器成员可以加入。';
        } else if (globalStatus.server.whitelist === 'discordRoles') {
            allowlistText = '指定角色';
            allowlistDesc = '仅拥有指定角色的 Discord 服务器成员可以加入。';
        } else if (globalStatus.server.whitelist === 'approvedLicense') {
            allowlistText = '许可审批';
            allowlistDesc = '仅已通过许可审批的玩家可以加入。';
        } else if (globalStatus.server.whitelist === 'external') {
            allowlistText = '外部处理';
            allowlistDesc = '玩家加入由外部资源处理。';
        }

        //Bot status - too long to show all the text, so just show the code
        if (globalStatus.discord in discordStatusMap) {
            discordStatusText = discordStatusMap[globalStatus.discord].text;
            discordStatusColor = discordStatusMap[globalStatus.discord].color;
            discordStatusDesc = discordStatusMap[globalStatus.discord].description;
        } else {
            discordStatusText = `CODE-${globalStatus.discord}`;
            discordStatusColor = 'destructive';
            discordStatusDesc = '未知状态码';
        }
    }

    return (
        <div className="flex flex-col gap-[0.375rem]">
            <div className="flex justify-between items-center text-muted-foreground text-sm gap-1.5">
                服务器：
                <StatusBadge
                    tooltip={{
                        title: serverHealthDescTitle,
                        description: serverHealthDescInfo
                    }}
                    type={serverHealthColor}
                >{serverHealthText}</StatusBadge>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-sm gap-1.5">
                运行时间：
                <StatusBadge
                    tooltip={serverUptimeDesc}
                >{serverUptimeText}</StatusBadge>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-sm gap-1.5">
                白名单：
                <StatusBadge
                    tooltip={allowlistDesc}
                    type={allowlistColor}
                >{allowlistText}</StatusBadge>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-sm gap-1.5">
                Discord 机器人：
                <StatusBadge
                    tooltip={discordStatusDesc}
                    type={discordStatusColor}
                >{discordStatusText}</StatusBadge>
            </div>
        </div>
    )
}
