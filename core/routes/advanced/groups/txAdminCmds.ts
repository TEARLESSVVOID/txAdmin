import { mdCodeBlock, msToShortishDuration } from "@lib/misc";
import type { AdvancedCommandHandler } from "../runCommand";


const setVerbosity: AdvancedCommandHandler = (ctx, args) => {
    if (args === 'true') {
        console.setVerbose(true);
    } else if (args === 'false') {
        console.setVerbose(false);
    } else if (!args) {
        return {
            type: 'md',
            data: `当前详细级别（verbosity）为 ${console.isVerbose}。\n你需要传入一个布尔值来设置它。`,
        }
    } else {
        return {
            type: 'md',
            data: `无效的参数：${args}`,
        }
    }

    return {
        type: 'md',
        data: `控制台详细级别已设置为 ${console.isVerbose}`,
    }
}


const setConfig: AdvancedCommandHandler = (ctx, args) => {
    const [scopeKey, valueString] = args.split(/\s+/, 2);
    if (!scopeKey || !valueString) throw new Error(`无效的 set 命令：${args}`);
    const [scope, key] = scopeKey.split('.');
    if (!scope || !key) throw new Error(`无效的 scope.key：${scopeKey}`);

    const configUpdate: any = {};
    try {
        configUpdate[scope] = { [key]: JSON.parse(valueString) };
    } catch (error) {
        console.dir(error);
        return {
            type: 'md',
            data: `解析 JSON 值失败：${valueString}\n如果你要设置字符串，必须用引号将其包裹起来。`,
        }
    }
    const { raw: keysUpdated } = txCore.configStore.saveConfigs(configUpdate, ctx.admin.name);
    const outParts = [
        '## 已更新的键：',
        mdCodeBlock(JSON.stringify(keysUpdated ?? 'not set', null, 2), 'json'),
        '## 已存储的配置：',
        mdCodeBlock(JSON.stringify(txCore.configStore.getStoredConfig(), null, 2), 'json'),
    ];

    return {
        type: 'md',
        data: outParts.join('\n'),
    }
}


const printFullPlayerList: AdvancedCommandHandler = (ctx, args) => {
    return {
        type: 'json',
        data: JSON.stringify(txCore.fxPlayerlist.getPlayerList(), null, 2),
    }
}


const printFullServerLogBuffer: AdvancedCommandHandler = (ctx, args) => {
    return {
        type: 'json',
        data: JSON.stringify(txCore.logger.server.getRecentBuffer(), null, 2),
    }
}


const printFxRunnerChildHistory: AdvancedCommandHandler = (ctx, args) => {
    return {
        type: 'json',
        data: JSON.stringify(txCore.fxRunner.history, null, 2),
    }
}


const printLoggerErrors: AdvancedCommandHandler = (ctx, args) => {
    const outData = {
        admin: txCore.logger.admin.lrLastError,
        fxserver: txCore.logger.fxserver.lrLastError,
        server: txCore.logger.server.lrLastError,
    };
    return {
        type: 'json',
        data: JSON.stringify(outData, null, 2),
    }
}


const printFxResourcesBootLog: AdvancedCommandHandler = (ctx, args) => {
    const bootLog = txCore.fxResources.latestBootLog;
    if (!bootLog) {
        return {
            type: 'md',
            data: '服务器尚未启动完成。',
        }
    } else {
        const maxResNameLength = Math.max(...bootLog.map((x) => x.resource.length));
        const lines = bootLog
            .sort((a, b) => b.duration - a.duration)
            .map((x) => {
                const name = x.resource.padEnd(maxResNameLength);
                const duration = msToShortishDuration(x.duration, { units: ['m', 's', 'ms'] });
                return `${name} ${duration}`;
            });
        return {
            type: 'md',
            data: [
                '## 最近的启动日志：',
                mdCodeBlock(lines.join('\n'), 'txt'),
            ].join('\n'),
        }
    }
}


export default {
    verbose: setVerbosity,
    set: setConfig,
    printFullPlayerList,
    printFullServerLogBuffer,
    printFxRunnerChildHistory,
    printLoggerErrors,
    printFxResourcesBootLog,
}
