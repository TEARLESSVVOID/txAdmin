import { Input } from "@/components/ui/input"
import TxAnchor from '@/components/TxAnchor'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc, SettingItemWarningLine } from '../settingsItems'
import { RadioGroup } from "@/components/ui/radio-group"
import BigRadioItem from "@/components/BigRadioItem"
import { useEffect, useRef, useMemo, useReducer } from "react"
import { getConfigEmptyState, getConfigAccessors, SettingsCardProps, getPageConfig, configsReducer, getConfigDiff } from "../utils"
import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components/ui/autosize-textarea"
import SettingsCardShell from "../SettingsCardShell"
import { txToast } from "@/components/TxToaster"
import consts from "@shared/consts"


export const pageConfigs = {
    whitelistMode: getPageConfig('whitelist', 'mode'),
    rejectionMessage: getPageConfig('whitelist', 'rejectionMessage'),
    discordRoles: getPageConfig('whitelist', 'discordRoles'),
} as const;

export default function ConfigCardWhitelist({ cardCtx, pageCtx }: SettingsCardProps) {
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

    //Refs for configs that don't use state
    const rejectionMessageRef = useRef<AutosizeTextAreaRef | null>(null);
    const discordRolesRef = useRef<HTMLInputElement | null>(null);

    //Marshalling Utils
    const inputArrayUtil = {
        toUi: (args?: string[]) => args ? args.join(', ') : '',
        toCfg: (str?: string) => str ? str.split(/[,;]\s*/).map(x => x.trim()).filter(x => x.length) : [],
    }

    //External Read-only Configs
    const isDiscordBotEnabled = pageCtx.apiData?.storedConfigs.discordBot?.enabled === true;

    //Processes the state of the page and sets the card as pending save if needed
    const updatePageState = () => {
        let currDiscordRoles;
        if (discordRolesRef.current) {
            currDiscordRoles = inputArrayUtil.toCfg(discordRolesRef.current.value);
        }
        let currRejectionMessage;
        if (rejectionMessageRef.current) {
            currRejectionMessage = rejectionMessageRef.current.textArea.value.trim();
        }
        const overwrites = {
            rejectionMessage: currRejectionMessage,
            discordRoles: currDiscordRoles,
        };

        const res = getConfigDiff(cfg, states, overwrites, false);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { hasChanges, localConfigs } = updatePageState();
        if (!hasChanges) return;

        const isAllowlistInstructionsRequired = (
            localConfigs.whitelist?.mode !== 'disabled'
            && localConfigs.whitelist?.mode !== 'adminOnly'
        );
        if (isAllowlistInstructionsRequired && !localConfigs.whitelist?.rejectionMessage) {
            return txToast.error('请填写白名单说明字段，以便启用此白名单模式。');
        }
        if (
            localConfigs.whitelist?.rejectionMessage
            && localConfigs.whitelist.rejectionMessage.length > 512
        ) {
            return txToast.error({
                title: '白名单说明过长。',
                md: true,
                msg: '消息长度必须为 512 个字符或更少。',
            });
        }
        if (
            localConfigs.whitelist?.mode === 'discordMember'
            || localConfigs.whitelist?.mode === 'discordRoles'
        ) {
            if (!isDiscordBotEnabled) {
                return txToast.warning({
                    title: '需要启用 Discord 机器人。',
                    msg: '您需要在 Discord 标签页中启用 Discord 机器人，才能使用基于 Discord 的白名单模式。',
                });
            }
            if (
                localConfigs.whitelist?.mode === 'discordRoles'
                && (
                    !Array.isArray(localConfigs.whitelist?.discordRoles)
                    || !localConfigs.whitelist?.discordRoles.length
                )
            ) {
                return txToast.warning({
                    title: '需要指定 Discord 角色。',
                    msg: '您需要至少指定一个 Discord 角色 ID，才能使用"Discord 服务器角色"白名单模式。',
                });
            }
        }
        if (Array.isArray(localConfigs.whitelist?.discordRoles)) {
            const invalidRoles = localConfigs.whitelist.discordRoles
                .filter(x => !consts.regexDiscordSnowflake.test(x))
                .map(x => `- \`${x.slice(0, 20)}\``);
            if (invalidRoles.length) {
                return txToast.error({
                    title: '无效的 Discord 角色 ID。',
                    md: true,
                    msg: '以下 Discord 角色 ID 无效：\n' + invalidRoles.join('\n'),
                });
            }
        }
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    const isPlayerAllowlistEnabled = (
        states.whitelistMode !== 'disabled'
        && states.whitelistMode !== 'adminOnly'
    );

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
        >
            <SettingItem label="白名单模式">
                <RadioGroup
                    value={states.whitelistMode}
                    onValueChange={cfg.whitelistMode.state.set as any}
                    disabled={pageCtx.isReadOnly}
                >
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="disabled"
                        title="禁用"
                        desc={(<>
                            如果您的服务器是公开的、允许所有玩家加入，请选择此选项。当玩家连接时，txAdmin 只会检查他们是否被封禁<i>（如果启用了该功能）</i>，不会做其他检查。
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="adminOnly"
                        title="仅管理员（维护模式）"
                        desc={(<>
                            仅当玩家的 <InlineCode>fivem:</InlineCode> 或 <InlineCode>discord:</InlineCode> 标识符关联到 txAdmin 管理员时，才允许其加入服务器。也称为维护模式。
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="discordMember"
                        disableReason={
                            !isDiscordBotEnabled
                                ? "要使用此选项，必须在 Discord 标签页中启用 Discord 机器人。"
                                : null
                        }
                        title="Discord 服务器成员"
                        desc={(<>
                            检查加入的玩家是否具有 <InlineCode>discord:</InlineCode> 标识符，并且存在于 Discord 标签页中配置的 Discord 服务器中。
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="discordRoles"
                        disableReason={
                            !isDiscordBotEnabled
                                ? "要使用此选项，必须在 Discord 标签页中启用 Discord 机器人。"
                                : null
                        }
                        title="Discord 服务器角色"
                        desc={(<>
                            检查加入的玩家是否具有 <InlineCode>discord:</InlineCode> 标识符，存在于 Discord 标签页中配置的 Discord 服务器中，并且拥有下列至少一个角色。
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="approvedLicense"
                        title="已批准的许可证"
                        desc={(<>
                            玩家的 <InlineCode>license:</InlineCode> 标识符必须由 txAdmin 管理员加入白名单。可以通过 <TxAnchor href="/allowlist">白名单页面</TxAnchor> 或 <InlineCode>/allowlist</InlineCode> Discord 机器人命令完成。
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="external"
                        title="外部白名单资源"
                        // FIXME:NEXT:UPDATE remove
                        newOptionBadgeFeatName="settingsExternalWhitelist"
                        desc={(<>
                            如果您使用外部白名单系统来管理哪些玩家可以加入服务器，请选择此选项。
                        </>)}
                    />
                </RadioGroup>
                <SettingItemDesc>
                    <strong>注意：</strong>启用后，服务器列表将在服务器名称旁显示锁图标，玩家也将在服务器页面看到白名单说明。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem
                label="白名单说明"
                htmlFor={cfg.rejectionMessage.eid}
                required={isPlayerAllowlistEnabled}
            >
                <AutosizeTextarea
                    id={cfg.rejectionMessage.eid}
                    ref={rejectionMessageRef}
                    placeholder='请加入 http://discord.gg/example 并申请加入白名单。'
                    defaultValue={cfg.rejectionMessage.initialValue}
                    onInput={updatePageState}
                    autoComplete="off"
                    minHeight={60}
                    maxHeight={180}
                    softMaxLength={512}
                    disabled={pageCtx.isReadOnly || !isPlayerAllowlistEnabled}
                />
                <SettingItemDesc>
                    在此说明玩家如何申请加入白名单以进入服务器，包括他们需要满足的要求或步骤，例如加入 Discord 服务器或填写在线表单。<br />
                    此消息将显示在游戏内服务器页面中，并且当未加入白名单的玩家尝试连接时，也会发送给他们。
                    <SettingItemWarningLine visible={!pageCtx.isReadOnly && !isPlayerAllowlistEnabled}>
                        启用白名单模式（非仅管理员模式）后，此字段才可用。
                    </SettingItemWarningLine>
                </SettingItemDesc>
            </SettingItem>
            <SettingItem
                label="白名单 Discord 角色"
                htmlFor={cfg.discordRoles.eid}
                required={states.whitelistMode === 'discordRoles'}
            >
                <Input
                    id={cfg.discordRoles.eid}
                    ref={discordRolesRef}
                    defaultValue={inputArrayUtil.toUi(cfg.discordRoles.initialValue)}
                    placeholder="000000000000000000, 000000000000000000"
                    onInput={updatePageState}
                    disabled={pageCtx.isReadOnly || states.whitelistMode !== 'discordRoles'}
                />
                <SettingItemDesc>
                    允许加入服务器的 Discord 角色 ID。<br />
                    此字段支持多个角色，用逗号分隔。
                    <SettingItemWarningLine visible={!pageCtx.isReadOnly && states.whitelistMode !== 'discordRoles'}>
                        将白名单模式设置为"Discord 服务器角色"后，此字段才可用。
                    </SettingItemWarningLine>
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
