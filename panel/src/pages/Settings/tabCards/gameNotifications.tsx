import TxAnchor from '@/components/TxAnchor';
import SwitchText from '@/components/SwitchText';
import InlineCode from '@/components/InlineCode';
import { SettingItem, SettingItemDesc } from '../settingsItems';
import { useEffect, useMemo, useReducer } from "react";
import { getConfigEmptyState, getConfigAccessors, SettingsCardProps, getPageConfig, configsReducer, getConfigDiff } from "../utils";
import SettingsCardShell from '../SettingsCardShell';


export const pageConfigs = {
    hideAdminInPunishments: getPageConfig('gameFeatures', 'hideAdminInPunishments'),
    hideAdminInMessages: getPageConfig('gameFeatures', 'hideAdminInMessages'),
    hideDefaultAnnouncement: getPageConfig('gameFeatures', 'hideDefaultAnnouncement'),
    hideDefaultDirectMessage: getPageConfig('gameFeatures', 'hideDefaultDirectMessage'),
    hideDefaultWarning: getPageConfig('gameFeatures', 'hideDefaultWarning'),
    hideScheduledRestartWarnings: getPageConfig('gameFeatures', 'hideDefaultScheduledRestartWarning'),
} as const;

export default function ConfigCardGameNotifications({ cardCtx, pageCtx }: SettingsCardProps) {
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

    //Processes the state of the page and sets the card as pending save if needed
    const updatePageState = () => {
        const overwrites = {};

        const res = getConfigDiff(cfg, states, overwrites, false);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { hasChanges, localConfigs } = updatePageState();
        if (!hasChanges) return;
        //NOTE: nothing to validate
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
        >
            <SettingItem label="在处罚中隐藏管理员名称">
                <SwitchText
                    id={cfg.hideAdminInPunishments.eid}
                    checkedLabel="隐藏"
                    uncheckedLabel="显示"
                    checked={states.hideAdminInPunishments}
                    onCheckedChange={cfg.hideAdminInPunishments.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    在<strong>封禁</strong>或<strong>警告</strong>中，绝不向玩家显示管理员名称。<br />
                    此信息仍可在历史记录和日志中查看。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="在消息中隐藏管理员名称">
                <SwitchText
                    id={cfg.hideAdminInMessages.eid}
                    checkedLabel="隐藏"
                    uncheckedLabel="显示"
                    checked={states.hideAdminInMessages}
                    onCheckedChange={cfg.hideAdminInMessages.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    在<strong>公告</strong>或<strong>私信</strong>中不显示管理员名称。<br />
                    此信息仍可在实时控制台和日志中查看。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="隐藏公告通知">
                <SwitchText
                    id={cfg.hideDefaultAnnouncement.eid}
                    checkedLabel="隐藏"
                    uncheckedLabel="显示"
                    checked={states.hideDefaultAnnouncement}
                    onCheckedChange={cfg.hideDefaultAnnouncement.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    禁止显示公告，以便您通过事件 <InlineCode>txAdmin:events:announcement</InlineCode> 实现自己的公告。
                    &nbsp;<TxAnchor href="https://aka.cfx.re/txadmin-events#txadmineventsannouncement">文档</TxAnchor>
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="隐藏私信通知">
                <SwitchText
                    id={cfg.hideDefaultDirectMessage.eid}
                    checkedLabel="隐藏"
                    uncheckedLabel="显示"
                    checked={states.hideDefaultDirectMessage}
                    onCheckedChange={cfg.hideDefaultDirectMessage.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    禁止显示私信，以便您通过事件 <InlineCode>txAdmin:events:playerDirectMessage</InlineCode> 实现自己的私信通知。
                    &nbsp;<TxAnchor href="https://aka.cfx.re/txadmin-events#txadmineventsplayerdirectmessage">文档</TxAnchor>
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="隐藏警告通知">
                <SwitchText
                    id={cfg.hideDefaultWarning.eid}
                    checkedLabel="隐藏"
                    uncheckedLabel="显示"
                    checked={states.hideDefaultWarning}
                    onCheckedChange={cfg.hideDefaultWarning.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    禁止显示警告，以便您通过事件 <InlineCode>txAdmin:events:playerWarned</InlineCode> 实现自己的警告。
                    &nbsp;<TxAnchor href="https://aka.cfx.re/txadmin-events#txadmineventsplayerwarned">文档</TxAnchor>
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="隐藏计划重启警告">
                <SwitchText
                    id={cfg.hideScheduledRestartWarnings.eid}
                    checkedLabel="隐藏"
                    uncheckedLabel="显示"
                    checked={states.hideScheduledRestartWarnings}
                    onCheckedChange={cfg.hideScheduledRestartWarnings.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    禁止显示计划重启警告，以便您通过事件 <InlineCode>txAdmin:events:scheduledRestart</InlineCode> 实现自己的警告。
                    &nbsp;<TxAnchor href="https://aka.cfx.re/txadmin-events#txadmineventsscheduledrestart">文档</TxAnchor>
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
