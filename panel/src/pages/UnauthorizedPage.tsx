import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ShieldAlertIcon } from "lucide-react";
import { Link } from "wouter";


function PermissionTooltip({ permission }: { permission: string }) {
    return (
        <Tooltip>
            <TooltipTrigger className="underline decoration-dotted cursor-help tracking-wider">
                权限
            </TooltipTrigger>
            <TooltipContent>
                {permission}
            </TooltipContent>
        </Tooltip>
    )
}


type UnauthorizedPageProps = {
    pageName: string;
    permission: string;
};

export default function UnauthorizedPage({ pageName, permission }: UnauthorizedPageProps) {
    let messageNode;
    if (permission === 'master') {
        messageNode = (<>
            您需要是主管理员账户才能查看<strong className="text-accent">{pageName}</strong>页面。
        </>);
    } else {
        messageNode = (<>
            您没有查看<strong className="text-accent">{pageName}</strong>页面所需的 <PermissionTooltip permission={permission} />。 <br />
            如果您认为这是错误，请联系您的服务器所有者。
        </>);
    }
    return (
        <div className="w-full px-4 pt-[7.5vh] flex items-start justify-center bg-background">
            <div className="mx-auto max-w-xl text-center border border-destructive/50 rounded-lg p-6 bg-destructive-hint/15 space-y-4">
                <h1 className="text-2xl font-bold tracking-tight text-destructive">
                    <ShieldAlertIcon className="size-6 mr-2 mt-0.5 inline align-text-top" />
                    访问被拒绝
                </h1>
                <p className="mt-4 text-sm text-primary/90 tracking-wide">
                    {messageNode}
                </p>
                <Button variant="outline" size='sm' asChild>
                    <Link href="/">返回仪表盘</Link>
                </Button>
            </div>
        </div>
    );
}
