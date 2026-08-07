import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent, DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/auth";
import { useEffect, useState } from "react";
import { TabsTrigger, TabsList, TabsContent, Tabs } from "@/components/ui/tabs";
import { ApiChangeIdentifiersReq, ApiChangePasswordReq } from "@shared/authApiTypes";
import { useAccountModal, useCloseAccountModal } from "@/hooks/dialogs";
import { GenericApiOkResp } from "@shared/genericApiTypes";
import { fetchWithTimeout, useAuthedFetcher, useBackendApi } from "@/hooks/fetch";
import consts from "@shared/consts";
import { txToast } from "@/components/TxToaster";
import useSWR from 'swr';
import TxAnchor from "@/components/TxAnchor";


/**
 * Change Password tab
 */
function ChangePasswordTab() {
    const { authData, setAuthData } = useAuth();
    const { setAccountModalTab } = useAccountModal();
    const closeAccountModal = useCloseAccountModal();
    const changePasswordApi = useBackendApi<GenericApiOkResp, ApiChangePasswordReq>({
        method: 'POST',
        path: '/auth/changePassword'
    });

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        if (!authData) return;
        setError('');

        if (newPassword.length < consts.adminPasswordMinLength || newPassword.length > consts.adminPasswordMaxLength) {
            setError(`密码长度必须介于 ${consts.adminPasswordMinLength} 和 ${consts.adminPasswordMaxLength} 位之间。`);
            return;
        } else if (newPassword !== newPasswordConfirm) {
            setError('两次输入的密码不一致。');
            return;
        }

        setIsSaving(true);
        changePasswordApi({
            data: {
                newPassword,
                oldPassword: authData.isTempPassword ? undefined : oldPassword,
            },
            error: (error) => {
                setIsSaving(false);
                setError(error);
            },
            success: (data) => {
                setIsSaving(false);
                if ('success' in data) {
                    if (authData.isTempPassword) {
                        setAccountModalTab('identifiers');
                        setAuthData({
                            ...authData,
                            isTempPassword: false,
                        });
                    } else {
                        txToast.success('密码修改成功！');
                        closeAccountModal();
                    }
                } else {
                    setError(data.error)
                }
            }
        });
    };

    if (!authData) return;
    return (
        <TabsContent value="password" tabIndex={undefined}>
            <form onSubmit={handleSubmit}>
                {authData.isTempPassword ? (<p className="text-sm text-warning-inline">
                    您的账户当前使用临时密码，在您可以使用此网页面板之前需要先修改密码。 <br />
                    <strong>保存前请务必记下您的新密码。</strong>
                </p>) : (<p className="text-sm text-muted-foreground">
                    即使不使用 Cfx.re 登录按钮，您也可以使用密码登录 txAdmin 界面。
                </p>)}
                <div className="space-y-3 pt-2 pb-6">
                    {!authData.isTempPassword && (
                        <div className="space-y-1">
                            <Label htmlFor="current-password">当前密码</Label>
                            <Input
                                id="current-password"
                                placeholder="请输入当前密码"
                                type="password"
                                value={oldPassword}
                                autoFocus
                                required
                                onChange={(e) => {
                                    setOldPassword(e.target.value);
                                    setError('');
                                }}
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <Label htmlFor="new-password">新密码</Label>
                        <Input
                            id="new-password"
                            autoComplete="new-password"
                            placeholder="请输入新密码"
                            type="password"
                            value={newPassword}
                            autoFocus={authData.isTempPassword}
                            required
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setError('');
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="confirm-password">确认密码</Label>
                        <Input
                            id="confirm-password"
                            autoComplete="new-password"
                            placeholder="请再次输入新密码"
                            type="password"
                            required
                            onChange={(e) => {
                                setNewPasswordConfirm(e.target.value);
                                setError('');
                            }}
                        />
                    </div>
                </div>

                {error && <p className="text-destructive text-center -mt-2 mb-4">{error}</p>}
                <Button
                    className="w-full"
                    type="submit"
                    disabled={isSaving}
                >
                    {isSaving ? '保存中...' : authData.isTempPassword ? '保存并下一步' : '修改密码'}
                </Button>
            </form>
        </TabsContent>
    );
}


/**
 * Change Identifiers tab
 */
function ChangeIdentifiersTab() {
    const authedFetcher = useAuthedFetcher();
    const [cfxreId, setCfxreId] = useState('');
    const [discordId, setDiscordId] = useState('');
    const [error, setError] = useState('');
    const [isConvertingFivemId, setIsConvertingFivemId] = useState(false);
    const closeAccountModal = useCloseAccountModal();
    const [isSaving, setIsSaving] = useState(false);

    const currIdsResp = useSWR<ApiChangeIdentifiersReq>(
        '/auth/getIdentifiers',
        () => authedFetcher<ApiChangeIdentifiersReq>('/auth/getIdentifiers'),
        {
            //the data min interval is 5 mins, so we can safely cache for 1 min
            revalidateOnMount: true,
            revalidateOnFocus: false,
        }
    );

    useEffect(() => {
        if (!currIdsResp.data) return;
        setCfxreId(currIdsResp.data.cfxreId);
        setDiscordId(currIdsResp.data.discordId);
    }, [currIdsResp.data]);

    useEffect(() => {
        setError(currIdsResp.error?.message ?? '');
    }, [currIdsResp.error]);

    const changeIdentifiersApi = useBackendApi<GenericApiOkResp, ApiChangeIdentifiersReq>({
        method: 'POST',
        path: '/auth/changeIdentifiers'
    });

    const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        setError('');
        setIsSaving(true);
        changeIdentifiersApi({
            data: { cfxreId, discordId },
            error: (error) => {
                setError(error);
            },
            success: (data) => {
                setIsSaving(false);
                if ('success' in data) {
                    txToast.success('标识符修改成功！');
                    closeAccountModal();
                } else {
                    setError(data.error)
                }
            }
        });
    };

    const handleCfxreIdBlur = async () => {
        if (!cfxreId) return;
        const trimmed = cfxreId.trim();
        if (/^\d+$/.test(trimmed)) {
            setCfxreId(`fivem:${trimmed}`);
        } else if (!trimmed.startsWith('fivem:')) {
            try {
                setIsConvertingFivemId(true);
                const forumData = await fetchWithTimeout(`https://forum.cfx.re/u/${trimmed}.json`);
                if (forumData.user && typeof forumData.user.id === 'number') {
                    setCfxreId(`fivem:${forumData.user.id}`);
                } else {
                    setError('在论坛中找不到该用户。请确认您输入的用户名是否正确。');
                }
            } catch (error) {
                setError('通过论坛 API 检查标识符失败。');
            }
            setIsConvertingFivemId(false);
        } else if (cfxreId !== trimmed) {
            setCfxreId(trimmed);
        }
    }

    const handleDiscordIdBlur = () => {
        if (!discordId) return;
        const trimmed = discordId.trim();
        if (/^\d+$/.test(trimmed)) {
            setDiscordId(`discord:${trimmed}`);
        } else if (discordId !== trimmed) {
            setDiscordId(trimmed);
        }
    }

    return (
        <TabsContent value="identifiers" tabIndex={undefined}>
            <form onSubmit={handleSubmit}>
                <p className="text-sm text-muted-foreground">
                    标识符对于访问<strong>网页面板</strong>是可选的，但要使用<strong>游戏内菜单</strong>和<strong>Discord 机器人</strong>则是必需的。 <br />
                    <strong>建议您至少配置一个。</strong>
                </p>
                <div className="space-y-3 pt-2 pb-6">
                    <div className="space-y-1">
                        <Label htmlFor="cfxreId">FiveM 标识符 <span className="text-sm opacity-75 text-info">（可选）</span></Label>
                        <Input
                            id="cfxreId"
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect="off"
                            placeholder="fivem:000000"
                            value={currIdsResp.isLoading || isConvertingFivemId ? '加载中...' : cfxreId}
                            disabled={currIdsResp.isLoading || isConvertingFivemId}
                            autoFocus
                            onBlur={handleCfxreIdBlur}
                            onChange={(e) => {
                                setCfxreId(e.target.value);
                                setError('');
                            }}
                        />
                        <p className="text-sm text-muted-foreground">
                            您可以在玩家列表中点击自己的名字并进入 ID 页面查看您的标识符。 <br />
                            您也可以输入您的 <TxAnchor href="https://forum.cfx.re/">forum.cfx.re</TxAnchor> 用户名，它会被自动转换。 <br />
                            如果您想使用 Cfx.re 按钮登录，这是必需的。
                        </p>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="discordId">Discord 标识符 <span className="text-sm opacity-75 text-info">（可选）</span></Label>
                        <Input
                            id="discordId"
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect="off"
                            placeholder="discord:000000000000000000"
                            value={currIdsResp.isLoading ? '加载中...' : discordId}
                            disabled={currIdsResp.isLoading}
                            onBlur={handleDiscordIdBlur}
                            onChange={(e) => {
                                setDiscordId(e.target.value);
                                setError('');
                            }}
                        />
                        <p className="text-sm text-muted-foreground">
                            您可以按照<TxAnchor href="https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID">此指南</TxAnchor>获取您的 Discord 用户 ID。 <br />
                            如果您想使用 Discord 机器人的斜杠命令，这是必需的。
                        </p>
                    </div>
                </div>

                {error && <p className="text-destructive text-center -mt-2 mb-4">{error}</p>}
                <Button
                    className="w-full"
                    type="submit"
                    disabled={!currIdsResp || isSaving}
                >
                    {isSaving ? '保存中...' : '保存更改'}
                </Button>
            </form>
        </TabsContent>
    );
}


/**
 * Account Dialog
 */
export default function AccountDialog() {
    const { authData } = useAuth();
    const {
        isAccountModalOpen, setAccountModalOpen,
        accountModalTab, setAccountModalTab
    } = useAccountModal();

    useEffect(() => {
        if (!authData) return;
        if (authData.isTempPassword) {
            setAccountModalOpen(true);
            setAccountModalTab('password');
        }
    }, []);

    const dialogSetIsClose = (newState: boolean) => {
        if (!newState && authData && !authData.isTempPassword) {
            setAccountModalOpen(false);
            setTimeout(() => {
                setAccountModalTab('password');
            }, 500);
        }
    }

    if (!authData) return;
    return (
        <Dialog
            open={isAccountModalOpen}
            onOpenChange={dialogSetIsClose}
        >
            <DialogContent className="sm:max-w-lg" tabIndex={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {authData.isTempPassword ? '欢迎使用 txAdmin！' : `我的账户 - ${authData.name}`}
                    </DialogTitle>
                </DialogHeader>
                <Tabs
                    defaultValue="password"
                    value={accountModalTab}
                    onValueChange={setAccountModalTab}
                >
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="password">密码</TabsTrigger>
                        <TabsTrigger value="identifiers" disabled={authData.isTempPassword}>标识符</TabsTrigger>
                    </TabsList>
                    <ChangePasswordTab />
                    <ChangeIdentifiersTab />
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
