import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"
import { FallbackProps } from "react-error-boundary";
import { FiAlertOctagon } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect } from "react";
import { LocalStorageKey } from "@/lib/localStorage";

//Used for global errors
export function AppErrorFallback({ error }: FallbackProps) {
    const refreshPage = () => {
        window.location.reload();
    }
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center">
            <GenericErrorBoundaryCard
                title="应用错误："
                description="由于发生意外错误，面板已崩溃。"
                error={error}
                resetButton={<Button variant="outline" onClick={refreshPage}>刷新</Button>}
            />
        </div>
    );
}

//Used for page errors (inside the shell)
export function PageErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="w-full flex flex-col items-center justify-center">
            <GenericErrorBoundaryCard
                title="页面错误："
                description="渲染此页面时发生错误。"
                error={error}
                resetButton={<Button variant="outline" onClick={resetErrorBoundary}>返回</Button>}
            />
        </div>
    );
}


type GenericErrorBoundaryCardProps = {
    title: string;
    description: string;
    error: Error;
    resetButton: React.ReactNode;
}

export function GenericErrorBoundaryCard(props: GenericErrorBoundaryCardProps) {
    //Auto refresh the page if the error is related to removeChild - dev mode only
    if (window.txConsts.showAdvanced) {
        useEffect(() => {
            if (props.error.message?.includes("Failed to execute 'removeChild' on 'Node'")) {
                console.warn('Detected removeChild error, scheduling reload');
                // Use a flag in sessionStorage to prevent infinite reload loops
                const lastReloadRaw = localStorage.getItem(LocalStorageKey.ErrorFallbackLastReload);
                const now = Date.now();
                const lastReload = lastReloadRaw ? parseInt(lastReloadRaw) : 0;
                if (now - lastReload > 30_000) {
                    localStorage.setItem(LocalStorageKey.ErrorFallbackLastReload, now.toString());
                    setTimeout(() => window.location.reload(), 500);
                }
            }
        }, [props.error]);
    }

    return (
        <Card className="max-w-xl">
            <CardHeader>
                <h1 className="text-3xl text-red-500 pb-0 flex flex-row justify-start items-center">
                    <FiAlertOctagon className="inline-block mr-2" />
                    {props.title}
                </h1>
                <span className="text-sm text-muted-foreground pt-0">{props.description}</span>
            </CardHeader>
            <CardContent>
                <p className="truncate">
                    页面：&nbsp;
                    <code className="text-muted-foreground ">
                        {window.location.pathname ?? '未知'}
                        {window.location.search ?? ''}
                    </code>
                </p>
                <p>
                    版本：&nbsp;
                    <code className="text-muted-foreground">
                        txAdmin v{window.txConsts.txaVersion} atop FXServer b{window.txConsts.fxsVersion}
                    </code>
                </p>
                <p>
                    消息：&nbsp;
                    <code className="text-muted-foreground">{props.error.message ?? '未知'}</code>
                </p>
                <p>堆栈：</p>
                <pre className="mt-1">
                    <ScrollArea
                        className="p-2 border border-red-800 rounded-sm 
                                font-mono text-muted-foreground text-xs text-red-800
                                h-32 w-full"
                    >{props.error.stack}</ScrollArea>
                </pre>
            </CardContent>
            <CardFooter className="flex flex-row justify-between">
                {props.resetButton}
                <Button
                    asChild
                    variant="outline"
                    className="bg-discord hover:bg-discord-active animate-pulse hover:animate-none"
                >
                    <a href="http://discord.gg/txAdmin" target="_blank" rel="noopener noreferrer">
                        支持 Discord
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}
