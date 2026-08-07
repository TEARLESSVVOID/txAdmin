import { useState } from "react";
import type { DatabaseActionType } from "../../../../core/modules/Database/databaseTypes";
import { Button } from "@/components/ui/button";
import { GenericApiOkResp } from "@shared/genericApiTypes";
import { useAdminPerms } from "@/hooks/auth";
import { Loader2Icon } from "lucide-react";
import { useBackendApi } from "@/hooks/fetch";
import type { ApiRevokeActionReqSchema } from "../../../../core/routes/history/actions";


type ActionModifyTabProps = {
    action: DatabaseActionType;
    refreshModalData: () => void;
}

export default function ActionModifyTab({ action, refreshModalData }: ActionModifyTabProps) {
    const [isRevoking, setIsRevoking] = useState(false);
    const { hasPerm } = useAdminPerms();
    const revokeActionApi = useBackendApi<GenericApiOkResp, ApiRevokeActionReqSchema>({
        method: 'POST',
        path: `/history/revokeAction`,
    });

    const typeLabel = action.type === 'ban' ? '封禁' : '警告';
    const doRevokeAction = () => {
        setIsRevoking(true);
        revokeActionApi({
            data: { actionId: action.id },
            toastLoadingMessage: `正在撤销${typeLabel}...`,
            genericHandler: {
                successMsg: `${typeLabel}已撤销。`,
            },
            success: (data) => {
                setIsRevoking(false);
                if ('success' in data) {
                    refreshModalData();
                }
            },
        });
    }

    const isAlreadyRevoked = !!action.revocation.timestamp;
    const hasRevokePerm = hasPerm(action.type === 'warn' ? 'players.warn' : 'players.ban');
    const revokeBtnLabel = isAlreadyRevoked
        ? `${typeLabel}已撤销`
        : hasRevokePerm
            ? `撤销${typeLabel}`
            : '撤销（无权限）';
    return (
        <div className="flex flex-col gap-4 px-1 mb-1 md:mb-4">
            <div className="space-y-2">
                <h3 className="text-xl">撤销{typeLabel}</h3>
                <p className="text-muted-foreground text-sm">
                    通常在玩家成功申诉该{typeLabel}或管理员后悔发出该处罚时执行。
                    <ul className="list-disc list-inside pt-1">
                        {action.type === 'ban' && <li>玩家将能够重新加入服务器。</li>}
                        <li>玩家不会收到撤销通知。</li>
                        <li>该{typeLabel}不会从玩家历史记录中移除。</li>
                        <li>撤销操作无法恢复！</li>
                    </ul>
                </p>

                <Button
                    variant="destructive"
                    size='xs'
                    className="col-start-1 col-span-full xs:col-span-3 xs:col-start-2"
                    type="submit"
                    disabled={isAlreadyRevoked || !hasRevokePerm || isRevoking}
                    onClick={doRevokeAction}
                >
                    {isRevoking ? (
                        <span className="flex items-center leading-relaxed">
                            <Loader2Icon className="inline animate-spin h-4" /> 撤销中...
                        </span>
                    ) : revokeBtnLabel}
                </Button>
            </div>
        </div>
    );
}
