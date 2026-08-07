import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import TxAnchor from '@/components/TxAnchor'
import { RotateCcwIcon, XIcon } from 'lucide-react'
import SwitchText from '@/components/SwitchText'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc } from '../settingsItems'
import { useEffect, useRef, useMemo, useReducer } from "react"
import { getConfigEmptyState, getConfigAccessors, SettingsCardProps, getPageConfig, configsReducer, getConfigDiff } from "../utils"
import SettingsCardShell from "../SettingsCardShell"
import { Textarea } from "@/components/ui/textarea"
import { txToast } from "@/components/TxToaster"


//We are not validating the JSON, only that it is a string
export const attemptBeautifyJsonString = (input: string) => {
    try {
        return JSON.stringify(JSON.parse(input), null, 4);
    } catch (error) {
        return input;
    }
};


export const pageConfigs = {
    botEnabled: getPageConfig('discordBot', 'enabled'),
    botToken: getPageConfig('discordBot', 'token'),
    discordGuild: getPageConfig('discordBot', 'guild'),
    warningsChannel: getPageConfig('discordBot', 'warningsChannel'),
    embedJson: getPageConfig('discordBot', 'embedJson'),
    embedConfigJson: getPageConfig('discordBot', 'embedConfigJson'),
} as const;

export default function ConfigCardDiscord({ cardCtx, pageCtx }: SettingsCardProps) {
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
    const botTokenRef = useRef<HTMLInputElement | null>(null);
    const discordGuildRef = useRef<HTMLInputElement | null>(null);
    const warningsChannelRef = useRef<HTMLInputElement | null>(null);

    //Marshalling Utils
    const emptyToNull = (str?: string) => {
        if (str === undefined) return undefined;
        const trimmed = str.trim();
        return trimmed.length ? trimmed : null;
    };

    //Processes the state of the page and sets the card as pending save if needed
    const updatePageState = () => {
        const overwrites = {
            botToken: emptyToNull(botTokenRef.current?.value),
            discordGuild: emptyToNull(discordGuildRef.current?.value),
            warningsChannel: emptyToNull(warningsChannelRef.current?.value),
        };

        const res = getConfigDiff(cfg, states, overwrites, false);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { hasChanges, localConfigs } = updatePageState();
        if (!hasChanges) return;

        if (localConfigs.discordBot?.enabled) {
            if (!localConfigs.discordBot?.token) {
                return txToast.error('您必须提供 Discord 机器人令牌（Token）才能启用机器人。');
            }
            if (!localConfigs.discordBot?.guild) {
                return txToast.error('您必须提供服务器 ID 才能启用机器人。');
            }
            if (!localConfigs.discordBot?.embedJson || !localConfigs.discordBot?.embedConfigJson) {
                return txToast.error('您必须同时提供嵌入 JSON 和配置 JSON 才能启用机器人。');
            }
        }
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
        >
            <SettingItem label="Discord 机器人">
                <SwitchText
                    id={cfg.botEnabled.eid}
                    checkedLabel="启用"
                    uncheckedLabel="禁用"
                    variant="checkedGreen"
                    checked={states.botEnabled}
                    onCheckedChange={cfg.botEnabled.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    启用 Discord 集成。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="令牌（Token）" htmlFor={cfg.botToken.eid} required={states.botEnabled}>
                <Input
                    id={cfg.botToken.eid}
                    ref={botTokenRef}
                    defaultValue={cfg.botToken.initialValue}
                    onInput={updatePageState}
                    disabled={pageCtx.isReadOnly}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxx.xxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    maxLength={96}
                    autoComplete="off"
                    className="blur-input"
                    required
                />
                <SettingItemDesc>
                    要获取令牌并让机器人加入您的服务器，请参考以下两个指南：<br />
                    <TxAnchor href="https://discordjs.guide/legacy/preparations/app-setup">设置机器人应用</TxAnchor> 和 <TxAnchor href="https://discordjs.guide/legacy/preparations/adding-your-app">将机器人添加到服务器</TxAnchor><br />
                    <strong>注意：</strong>不要在其他机器人上重复使用同一令牌。<br />
                    <strong>注意：</strong>机器人需要 <strong>Server Members</strong>（服务器成员）意图，可在 <TxAnchor href="https://discord.com/developers/applications">Discord 开发者门户</TxAnchor> 中设置。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="服务器（Guild）ID" htmlFor={cfg.discordGuild.eid} required={states.botEnabled}>
                <Input
                    id={cfg.discordGuild.eid}
                    ref={discordGuildRef}
                    defaultValue={cfg.discordGuild.initialValue}
                    onInput={updatePageState}
                    disabled={pageCtx.isReadOnly}
                    placeholder='000000000000000000'
                />
                <SettingItemDesc>
                    Discord 服务器（也称为 Discord Guild）的 ID。<br />
                    要获取服务器 ID，请进入 Discord 设置并<TxAnchor href="https://support.discordapp.com/hc/article_attachments/115002742731/mceclip0.png">启用开发者模式</TxAnchor>，然后右键单击服务器图标，选择"复制 ID"。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="警告频道 ID" htmlFor={cfg.warningsChannel.eid} showOptional>
                <Input
                    id={cfg.warningsChannel.eid}
                    ref={warningsChannelRef}
                    defaultValue={cfg.warningsChannel.initialValue}
                    onInput={updatePageState}
                    disabled={pageCtx.isReadOnly}
                    placeholder='000000000000000000'
                />
                <SettingItemDesc>
                    用于发送公告（例如服务器重启）的频道 ID。<br />
                    您可以将其留空以禁用此功能。<br />
                    要获取频道 ID，请进入 Discord 设置并<TxAnchor href="https://support.discordapp.com/hc/article_attachments/115002742731/mceclip0.png">启用开发者模式</TxAnchor>，然后右键单击频道名称，选择"复制 ID"。
                </SettingItemDesc>
            </SettingItem>
            {/* <SettingItem label="Status Embed">
                <div className="flex flex-wrap gap-6">
                    <Button
                        size={'sm'}
                        variant="secondary"
                        disabled={pageCtx.isReadOnly}
                        // FIXME: implement
                    >
                        <PencilIcon className='size-4 mr-1.5 inline-block' /> Change Embed JSON
                    </Button>
                    <Button
                        size={'sm'}
                        variant="secondary"
                        disabled={pageCtx.isReadOnly}
                        // FIXME: implement
                    >
                        <PencilIcon className='size-4 mr-1.5 inline-block' /> Change Config JSON
                    </Button>
                </div>
                <SettingItemDesc>
                    The server status embed is customizable by editing the two JSONs above. <br />
                    <strong>Note:</strong> Use the command <InlineCode>/status add</InlineCode> on a channel that the bot has the "Send Message" permission to setup the embed.
                </SettingItemDesc>
            </SettingItem> */}
            <SettingItem label="状态嵌入 JSON" htmlFor={cfg.embedJson.eid} required={states.botEnabled}>
                <div className="flex flex-col gap-2">
                    <Textarea
                        id={cfg.embedJson.eid}
                        placeholder='{}'
                        value={attemptBeautifyJsonString(states.embedJson ?? '')}
                        onChange={(e) => cfg.embedJson.state.set(e.target.value)}
                        autoComplete="off"
                        style={{ minHeight: 512 }}
                        disabled={pageCtx.isReadOnly}
                        spellCheck={false}
                    />
                    <div className="w-full flex flex-wrap justify-between gap-6">
                        <Button
                            className="grow"
                            variant="outline"
                            onClick={() => cfg.embedJson.state.discard()}
                            disabled={pageCtx.isReadOnly}
                        >
                            <XIcon className="mr-2 h-4 w-4" /> 放弃更改
                        </Button>
                        <Button
                            className="grow border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            variant="outline"
                            onClick={() => cfg.embedJson.state.default()}
                            disabled={pageCtx.isReadOnly}
                        >
                            <RotateCcwIcon className="mr-2 h-4 w-4" /> 重置为默认
                        </Button>
                    </div>
                </div>
                <SettingItemDesc>
                    服务器状态嵌入可通过编辑上面的 JSON 进行自定义。<br />
                    <strong>注意：</strong>请在机器人拥有"发送消息"权限的频道中使用 <InlineCode>/status add</InlineCode> 命令来设置嵌入。
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="状态配置 JSON" htmlFor={cfg.embedConfigJson.eid} required={states.botEnabled}>
                <div className="flex flex-col gap-2">
                    <Textarea
                        id={cfg.embedConfigJson.eid}
                        placeholder='{}'
                        value={attemptBeautifyJsonString(states.embedConfigJson ?? '')}
                        onChange={(e) => cfg.embedConfigJson.state.set(e.target.value)}
                        autoComplete="off"
                        style={{ minHeight: 512 }}
                        disabled={pageCtx.isReadOnly}
                        spellCheck={false}
                    />
                    <div className="w-full flex flex-wrap justify-between gap-6">
                        <Button
                            className="grow"
                            variant="outline"
                            onClick={() => cfg.embedConfigJson.state.discard()}
                            disabled={pageCtx.isReadOnly}
                        >
                            <XIcon className="mr-2 h-4 w-4" /> 放弃更改
                        </Button>
                        <Button
                            className="grow border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            variant="outline"
                            onClick={() => cfg.embedConfigJson.state.default()}
                            disabled={pageCtx.isReadOnly}
                        >
                            <RotateCcwIcon className="mr-2 h-4 w-4" /> 重置为默认
                        </Button>
                    </div>
                </div>
                <SettingItemDesc>
                    服务器状态嵌入可通过编辑上面的 JSON 进行自定义。<br />
                    <strong>注意：</strong>请在机器人拥有"发送消息"权限的频道中使用 <InlineCode>/status add</InlineCode> 命令来设置嵌入。
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
