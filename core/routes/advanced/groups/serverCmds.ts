import { SYM_SYSTEM_AUTHOR } from "@lib/symbols";
import type { AdvancedCommandHandler } from "../runCommand";
import { mdCodeBlock, parseFiniteIntString } from "@lib/misc";


const forceUpdateMutableConvars: AdvancedCommandHandler = async (ctx, args) => {
    const convarList = await txCore.fxRunner.updateMutableConvars();
    if (!convarList) {
        return {
            type: 'md',
            data: `更新可变控制台变量（convar）失败。\n请查看终端以了解更多详情。`,
        }
    }
    const lines = convarList.map(([set, convar, value]) => `${set} ${convar} ${value}`);
    return {
        type: 'md',
        data: [
            '## 已更新的控制台变量：',
            mdCodeBlock(lines.join('\n'), 'txt'),
        ].join('\n'),
    }
}


const safelyRestartMonitorResource: AdvancedCommandHandler = (ctx, args) => {
    const setCmdResult = txCore.fxRunner.sendCommand(
        'set',
        [
            'txAdmin-luaComToken',
            txCore.webServer.luaComToken,
        ],
        SYM_SYSTEM_AUTHOR
    );
    if (!setCmdResult) {
        return {
            type: 'md',
            data: '重置 luaComToken 失败。\n请查看终端以了解更多详情。',
        }
    }
    const ensureCmdResult = txCore.fxRunner.sendCommand(
        'ensure',
        ['monitor'],
        SYM_SYSTEM_AUTHOR
    );
    if (ensureCmdResult) {
        return {
            type: 'md',
            data: '监控资源（monitor）已重启。',
        }
    } else {
        return {
            type: 'md',
            data: '重启监控资源失败。\n请查看终端以了解更多详情。',
        }
    }
}


const forceReauthRecentPlayers: AdvancedCommandHandler = async (ctx, args) => {
    const numPlayers = parseFiniteIntString(args) ?? 10;
    if (numPlayers < 1) {
        return {
            type: 'md',
            data: `无效的参数：${args}`,
        }
    }
    const netIds = txCore.fxPlayerlist.getPlayerList().map((p) => p.netid).slice(-numPlayers);
    txCore.fxRunner.sendEvent('adminsUpdated', netIds);
    return {
        type: 'md',
        data: `已刷新以下 NetID 的玩家：${netIds.join(', ')}`,
    }
}


export default {
    forceUpdateMutableConvars,
    safelyRestartMonitorResource,
    forceReauthRecentPlayers,
}
