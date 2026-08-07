import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ApiTimeout, useBackendApi } from '@/hooks/fetch';
import InlineCode from '@/components/InlineCode';
import { cn } from '@/lib/utils';
import { handleExternalLinkClick } from '@/lib/navigation';
import TxAnchor from '@/components/TxAnchor';

type SendReportResponse =
    | { reportId: string }
    | { error: string };

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const InfoContent = () => (
    <div className="space-y-4 text-sm">
        <p className="text-sm">
            此<u>可选</u>功能会向 Cfx.re 团队发送诊断报告，可能用于排查各种服务器问题。
            发送数据后，您将获得一个报告 ID，可在支持频道中使用。
        </p>

        <div className="space-y-4">
            <div>
                <h4 className="font-semibold text-warning-inline">
                    谁可以访问这些数据？
                </h4>
                <p>
                    数据将在最多 24 小时内对 Cfx.re 团队可见。
                </p>
            </div>

            <div>
                <h4 className="font-semibold text-warning-inline">将发送哪些数据？</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>诊断页面的所有数据</li>
                    <li>最近的 txAdmin（系统）日志、实时控制台日志和服务器日志</li>
                    <li>环境变量</li>
                    <li>服务器性能（仪表盘图表）数据</li>
                    <li>玩家数据库统计信息</li>
                    <li>txAdmin 设置（不含机器人令牌）</li>
                    <li>管理员列表（不含密码/哈希）</li>
                    <li>服务器数据目录和监控目录中的文件/文件夹列表</li>
                    <li>服务器数据目录中的配置文件</li>
                </ul>
            </div>

            <div>
                <h4 className="font-semibold text-warning-inline">
                    敏感信息保护：
                </h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>设置：</strong>Discord 机器人令牌将被移除</li>
                    <li><strong>管理员列表：</strong>不会发送密码哈希</li>
                    <li>
                        <strong>环境变量：</strong>名称中包含{' '}
                        <span className="text-xs space-x-1">
                            <InlineCode>key</InlineCode>,
                            <InlineCode>license</InlineCode>,
                            <InlineCode>pass</InlineCode>,
                            <InlineCode>private</InlineCode>,
                            <InlineCode>secret</InlineCode>,
                            <InlineCode>token</InlineCode>
                        </span>{' '}
                        的参数将被遮蔽
                    </li>
                    <li>
                        <strong>CFG 文件：</strong>已知的机密参数将被遮蔽
                        （例如 license、mysql 连接字符串、tebex 密钥、webhooks 等）
                    </li>
                    <li><strong>日志：</strong>日志中任何可识别的 IPv4 地址将被遮蔽</li>
                </ul>
            </div>
        </div>
    </div>
);

const LoadingContent = () => (
    <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>正在发送诊断数据...</p>
    </div>
);

const SuccessContent = ({ reportId }: { reportId: string }) => (
    <div className="text-center">
        <div className="mb-4 flex flex-wrap gap-4 items-center justify-center text-2xl">
            <h3 className="font-semibold">报告 ID：</h3>
            <div className="bg-muted p-2 rounded-lg">
                <span className="font-mono text-accent tracking-[0.35em] -mr-[0.35em] font-bold">
                    {reportId}
                </span>
            </div>
        </div>
        <p className="text-muted-foreground pt-2">
            请将此 ID 发送给 <TxAnchor
                href="https://discord.gg/uAmsGa2"
                className="font-semibold tracking-wide text-primary"
            >
                discord.gg/txAdmin
            </TxAnchor> 支持团队。
        </p>
    </div>
);

const ErrorContent = ({ error }: { error: string }) => (
    <div className="text-center">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-destructive mb-2">错误</h3>
            <p className="text-destructive">{error}</p>
        </div>
    </div>
);

export const DiscordBadge = ({ className }: { className?: string }) => (
    <a
        href="https://discord.gg/uAmsGa2"
        target="_blank"
        rel="noopener noreferrer"
        className={cn("inline-block ml-1", className)}
        onClick={handleExternalLinkClick}
    >
        <img
            src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield"
            alt="Discord"
            className="h-5 self-end"
        />
    </a>
);

export function ReportDialog({ open, onOpenChange }: ReportDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [reportId, setReportId] = useState('');
    const [error, setError] = useState('');

    //Wipe the state when the dialog is opened
    useEffect(() => {
        if (open) {
            setIsLoading(false);
            setReportId('');
            setError('');
        }
    }, [open]);

    const sendReportApi = useBackendApi<SendReportResponse>({
        method: 'POST',
        path: '/diagnostics/sendReport',
    });

    const handleSend = async () => {
        setIsLoading(true);
        setError('');
        sendReportApi({
            //NOTE: in NUI, empty bodies become GET requests even if you specify POST
            data: { bugfix: true },
            timeout: ApiTimeout.LONG,
            success: (data) => {
                if ('reportId' in data) {
                    setReportId(data.reportId);
                } else {
                    setError(data.error);
                }
            },
            error: (err) => setError(err),
            finally: () => setIsLoading(false),
        });
    };

    const showInitialState = !isLoading && !reportId && !error;
    const showSuccess = !isLoading && !!reportId;
    const showError = !isLoading && !!error;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>发送诊断数据</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {isLoading && <LoadingContent />}
                    {showInitialState && <InfoContent />}
                    {showSuccess && <SuccessContent reportId={reportId} />}
                    {showError && <ErrorContent error={error} />}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        关闭
                    </Button>
                    {showInitialState && (
                        <Button onClick={handleSend}>
                            同意并发送数据
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
