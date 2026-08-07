import { Input } from "@/components/ui/input";
import SwitchText from '@/components/SwitchText';
import InlineCode from '@/components/InlineCode';
import { AdvancedDivider, SettingItem, SettingItemDesc } from '../settingsItems';
import { useState, useEffect, useMemo, useReducer } from "react";
import { getConfigEmptyState, getConfigAccessors, SettingsCardProps, getPageConfig, configsReducer, getConfigDiff } from "../utils";
import SettingsCardShell from "../SettingsCardShell";


export const pageConfigs = {
    menuEnabled: getPageConfig('gameFeatures', 'menuEnabled'),
    alignRight: getPageConfig('gameFeatures', 'menuAlignRight'),
    pageKey: getPageConfig('gameFeatures', 'menuPageKey'),
    playerModePtfx: getPageConfig('gameFeatures', 'playerModePtfx'),
} as const;

export default function ConfigCardGameMenu({ cardCtx, pageCtx }: SettingsCardProps) {
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


    //Processes the state of the page and sets the card as pending save if needed
    const updatePageState = () => {
        const overwrites = {};

        const res = getConfigDiff(cfg, states, overwrites, showAdvanced);
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

    //Card content stuff
    const handlePageKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!e.metaKey) e.preventDefault();

        if (["Escape", "Backspace"].includes(e.code)) {
            cfg.pageKey.state.set('Tab');
        } else {
            cfg.pageKey.state.set(e.code);
        }
    }

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
            advancedVisible={showAdvanced}
            advancedSetter={setShowAdvanced}
        >
            <SettingItem label="游戏菜单">
                <SwitchText
                    id={cfg.menuEnabled.eid}
                    checkedLabel="启用"
                    uncheckedLabel="禁用"
                    variant="checkedGreen"
                    checked={states.menuEnabled}
                    onCheckedChange={cfg.menuEnabled.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    启用后，管理员可以通过输入 <InlineCode>/tx</InlineCode> 或使用 FiveM/RedM 设置中配置的按键来打开菜单。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="菜单右对齐">
                <SwitchText
                    id={cfg.alignRight.eid}
                    checkedLabel="右对齐"
                    uncheckedLabel="左对齐"
                    checked={states.alignRight}
                    onCheckedChange={cfg.alignRight.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    将菜单移至屏幕右侧。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="菜单页面切换键" htmlFor={cfg.pageKey.eid} required>
                <Input
                    id={cfg.pageKey.eid}
                    value={states.pageKey}
                    placeholder='点击此处并按键以更改'
                    onKeyDown={handlePageKey}
                    className="font-mono"
                    readOnly
                    onInput={updatePageState}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    用于在菜单中切换页面的按键。<br />
                    点击上方输入框并按任意键即可更改配置。<br />
                    <strong>注意：</strong>默认键为 <InlineCode>Tab</InlineCode>，不能使用 <InlineCode>Escape</InlineCode> 或 <InlineCode>Backspace</InlineCode>。
                </SettingItemDesc>
            </SettingItem>

            {showAdvanced && <AdvancedDivider />}

            <SettingItem label="玩家模式切换特效" showIf={showAdvanced}>
                <SwitchText
                    id={cfg.playerModePtfx.eid}
                    checkedLabel="启用"
                    uncheckedLabel="禁用"
                    variant="checkedGreen"
                    checked={states.playerModePtfx}
                    onCheckedChange={cfg.playerModePtfx.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    当管理员使用 NoClip、无敌模式等时，播放粒子特效和音效。<br />
                    <strong className="text-warning-inline">警告：</strong>此选项通过让所有玩家看到/听到管理员正在使用特殊模式，有助于防止 PvP 期间的管理员滥用。我们建议保持启用。
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
