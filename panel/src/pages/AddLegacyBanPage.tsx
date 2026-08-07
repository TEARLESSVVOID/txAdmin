import InlineCode from "@/components/InlineCode";
import { useAdminPerms } from "@/hooks/auth";
import { useRef, useState } from "react";
import { ApiAddLegacyBanReqSchema, GetBanTemplatesSuccessResp, SaveBanTemplatesReq } from "@shared/otherTypes";
import { useBackendApi } from "@/hooks/fetch";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BanForm, { BanFormType } from "@/components/BanForm";
import { txToast } from "@/components/TxToaster";
import { GenericApiOkResp } from "@shared/genericApiTypes";
import useSWR from "swr";


export default function AddLegacyBanPage() {
    const idsTextareaRef = useRef<HTMLTextAreaElement>(null);
    const banFormRef = useRef<BanFormType>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { hasPerm } = useAdminPerms();

    const getBanTemplatesApi = useBackendApi<GetBanTemplatesSuccessResp>({
        method: 'GET',
        path: `/settings/banTemplates`,
        throwGenericErrors: true,
    });

    const legacyBanApi = useBackendApi<GenericApiOkResp, ApiAddLegacyBanReqSchema>({
        method: 'POST',
        path: `/history/addLegacyBan`,
        throwGenericErrors: true,
    });


    const handleSave = () => {
        if (!idsTextareaRef.current || !banFormRef.current) return;
        const { reason, duration } = banFormRef.current.getData();

        if (!reason || reason.length < 3) {
            txToast.warning(`原因至少需要 3 个字符。`);
            banFormRef.current.focusReason();
            return;
        }
        const rawIds = idsTextareaRef.current.value;
        if (!rawIds) {
            txToast.warning(`您必须至少输入一个标识符。`);
            idsTextareaRef.current.focus();
            return;
        }
        const identifiers = rawIds
            .toLowerCase()
            .split(/[,;\s\n]+/g)
            .map(id => id.trim())
            .filter(Boolean);
        if (!identifiers.length) {
            txToast.warning(`您必须至少输入一个有效的标识符。`);
            idsTextareaRef.current.focus();
            return;
        }

        setIsSaving(true);
        legacyBanApi({
            data: { identifiers, reason, duration },
            toastLoadingMessage: '正在封禁标识符...',
            genericHandler: {
                successMsg: '标识符已封禁。',
            },
            finally: () => setIsSaving(false),
            success: (data) => {
                idsTextareaRef.current!.value = '';
                idsTextareaRef.current!.focus();
            },
            error: (error) => {
                idsTextareaRef.current!.focus();
            },
        });
    };

    const swrBanTemplates = useSWR('/settings/banTemplates', async () => {
        const data = await getBanTemplatesApi({});
        if (!data) throw new Error('No data returned');
        return data;
    });

    const canBan = hasPerm('players.ban');
    return (
        <div className="space-y-4 w-full max-w-screen-lg mx-auto px-2 md:px-0">
            <div className="px-2 md:px-0">
                <h1 className="text-3xl mb-2">封禁标识符</h1>
                <p>
                    您可以在此封禁特定的玩家标识符（如 <InlineCode>license</InlineCode> 和 <InlineCode>discord</InlineCode>），而无需搜索已注册的玩家。<br />
                    不包含任何 <InlineCode>license</InlineCode> 标识符的封禁被视为<em>旧式封禁</em>，应尽量避免。 <br />
                    {!canBan ? (
                        <span className="text-warning-inline">
                            您需要 <InlineCode className="text-warning-inline">Player: Ban</InlineCode> 权限才能使用此功能。
                        </span>
                    ) : null}
                </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-4 border bg-card p-4 rounded-lg">
                <div className="flex flex-col gap-3">
                    <Label htmlFor="banIdentifiers">
                        标识符
                    </Label>
                    <Textarea
                        ref={idsTextareaRef}
                        className="h-full"
                        disabled={isSaving || !canBan}
                        placeholder="discord:xxxx、fivem:xxxx、license:xxxx、steam:xxxx 等..."
                    />
                </div>
                <BanForm
                    ref={banFormRef}
                    banTemplates={swrBanTemplates.data}
                    disabled={isSaving || !canBan}
                />
            </div>
            <div className="flex place-content-center gap-4">
                <Button
                    size="sm"
                    variant='outline'
                    disabled={isSaving || !canBan}
                    onClick={() => {
                        banFormRef.current?.clearData()
                    }}
                >
                    清空
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    disabled={isSaving || !canBan}
                    onClick={handleSave}
                >
                    {isSaving ? (
                        <span className="flex items-center leading-relaxed">
                            <Loader2Icon className="inline animate-spin h-4" /> 封禁中...
                        </span>
                    ) : '执行封禁'}
                </Button>
            </div>
        </div>
    );
}
