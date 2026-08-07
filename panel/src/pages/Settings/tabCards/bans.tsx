import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Link } from 'wouter'
import { PencilIcon } from 'lucide-react'
import SwitchText from '@/components/SwitchText'
import { AdvancedDivider, SettingItem, SettingItemDesc } from '../settingsItems'
import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components/ui/autosize-textarea"
import { useState, useEffect, useRef, useMemo, useReducer } from "react"
import { getConfigEmptyState, getConfigAccessors, SettingsCardProps, getPageConfig, configsReducer, getConfigDiff } from "../utils"
import SettingsCardShell from "../SettingsCardShell"
import { txToast } from "@/components/TxToaster"


export const pageConfigs = {
    checkingEnabled: getPageConfig('banlist', 'enabled'),
    rejectionMessage: getPageConfig('banlist', 'rejectionMessage'),

    requiredHwids: getPageConfig('banlist', 'requiredHwidMatches', true),
} as const;

export default function ConfigCardBans({ cardCtx, pageCtx }: SettingsCardProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [states, dispatch] = useReducer(
        configsReducer<typeof pageConfigs>,
        null,
        () => getConfigEmptyState(pageConfigs),
    );
    const cfg = useMemo(() => {
        return getConfigAccessors(cardCtx.cardId, pageConfigs, pageCtx.apiData, dispatch);
    }, [pageCtx.apiData, dispatch]);

    //Effects - handle changes and reset advanced settings
    useEffect(() => {
        updatePageState();
    }, [states]);
    useEffect(() => {
        if (showAdvanced) return;
        Object.values(cfg).forEach(c => c.isAdvanced && c.state.discard());
    }, [showAdvanced]);

    //Refs for configs that don't use state
    const rejectionMessageRef = useRef<AutosizeTextAreaRef | null>(null);

    //Marshalling Utils
    const selectNumberUtil = {
        toUi: (num?: number) => num ? num.toString() : undefined,
        toCfg: (str?: string) => str ? parseInt(str) : undefined,
    }

    //Processes the state of the page and sets the card as pending save if needed
    const updatePageState = () => {
        const overwrites = {
            rejectionMessage: rejectionMessageRef.current?.textArea.value,
        };

        const res = getConfigDiff(cfg, states, overwrites, showAdvanced);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { hasChanges, localConfigs } = updatePageState();
        if (!hasChanges) return;

        if (
            localConfigs.banlist?.rejectionMessage
            && localConfigs.banlist.rejectionMessage.length > 512
        ) {
            return txToast.error({
                title: '封禁拒绝消息过长。',
                md: true,
                msg: '消息长度必须为 512 个字符或更少。',
            });
        }
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
            advancedVisible={showAdvanced}
            advancedSetter={setShowAdvanced}
        >
            <SettingItem label="封禁检测">
                <SwitchText
                    id={cfg.checkingEnabled.eid}
                    checkedLabel="启用"
                    uncheckedLabel="禁用"
                    checked={states.checkingEnabled}
                    onCheckedChange={cfg.checkingEnabled.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    在玩家加入时检查其封禁状态。<br />
                    <strong>注意：</strong>如果禁用此选项，txAdmin 封禁将无法生效。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="封禁模板">
                <Link asChild href="/settings/ban-templates">
                    <Button
                        size={'sm'}
                        variant="secondary"
                        disabled={pageCtx.isReadOnly}
                    >
                        <PencilIcon className='size-4 mr-1.5 inline-block' /> 编辑封禁模板
                    </Button>
                </Link>
                <SettingItemDesc>
                    配置封禁玩家时下拉选项中显示的封禁原因与时长。这对于频繁出现的常见原因（如违反服务器规则）非常有用。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="封禁拒绝消息" htmlFor={cfg.rejectionMessage.eid} showOptional>
                <AutosizeTextarea
                    id={cfg.rejectionMessage.eid}
                    ref={rejectionMessageRef}
                    placeholder='您可以通过 http://discord.gg/example 申诉此封禁。'
                    defaultValue={cfg.rejectionMessage.initialValue}
                    onInput={updatePageState}
                    autoComplete="off"
                    minHeight={60}
                    maxHeight={180}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    可选消息：当被封禁的玩家尝试连接时，在拒绝消息中向玩家显示。<br />
                    如果您有封禁申诉流程，可以使用此字段告知玩家。
                </SettingItemDesc>
            </SettingItem>

            {showAdvanced && <AdvancedDivider />}

            <SettingItem label="封禁所需 HWID 匹配数" htmlFor={cfg.requiredHwids.eid} showIf={showAdvanced}>
                <Select
                    value={selectNumberUtil.toUi(states.requiredHwids)}
                    onValueChange={(val) => cfg.requiredHwids.state.set(selectNumberUtil.toCfg(val))}
                    disabled={pageCtx.isReadOnly}
                >
                    <SelectTrigger id={cfg.requiredHwids.eid}>
                        <SelectValue placeholder="请选择..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1 - 推荐</SelectItem>
                        <SelectItem value="2">2 - 宽松</SelectItem>
                        <SelectItem value="3">3 - 非常宽松</SelectItem>
                        <SelectItem value="4">4 - 几乎禁用</SelectItem>
                        <SelectItem value="0">禁用 HWID 封禁</SelectItem>
                    </SelectContent>
                </Select>
                <SettingItemDesc>
                    此选项配置玩家的 HWID 令牌与现有封禁匹配多少个时阻止其加入，也可以完全禁用 HWID 封禁。<br />
                    由于硬件 ID 令牌不能保证唯一，因此存在两名玩家的令牌恰好匹配但彼此无关的可能。<br />
                    <strong>注意：</strong>大多数玩家有 3 到 6 个 HWID 令牌。
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
