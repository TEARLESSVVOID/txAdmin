const modulename = 'WebServer:Diagnostics';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import MemCache from '@lib/MemCache';
import * as diagnosticsFuncs from '@lib/diagnostics';
import consoleFactory from '@lib/console';
import type { DiagnosticsPageData } from '@shared/diagnosticsTypes';
import type { GenericApiErrorResp } from '@shared/genericApiTypes';
import type { QuantileArray } from '@modules/Metrics/statsUtils';
const console = consoleFactory(modulename);
const cache = new MemCache<DiagnosticsPageData>(5);


//Helpers
const perfQuantiles = (perfData: QuantileArray) => {
    const result = perfData.result(true);
    if (!result.enoughData) return '数据不足';
    return {
        p5: `${result.p5}ms`,
        p25: `${result.p25}ms`,
        p50: `${result.p50}ms`,
        p75: `${result.p75}ms`,
        p95: `${result.p95}ms`,
        n: result.count,
    }
}


/**
 * Returns the diagnostics data
 */
export default async function GetDiagnosticsData(ctx: AuthedCtx) {
    const sendTypedResp = (data: DiagnosticsPageData | GenericApiErrorResp) => ctx.send(data);

    const cachedData = cache.get();
    if (cachedData) return sendTypedResp(cachedData);

    //Prepare data
    const timeStart = Date.now();
    const [runtimeData, databaseStats, hostData, processesData] = await Promise.all([
        diagnosticsFuncs.getRuntimeData(),
        txCore.database.stats.getDatabaseStats(), //not really a promise, but can throw
        diagnosticsFuncs.getHostData(),
        diagnosticsFuncs.getProcessesData(),
    ]);
    const data: DiagnosticsPageData = {
        runtime: {},
        host: {},
        server: {},
        processes: [],
        loadTime: Date.now() - timeStart,
    };

    //Runtime data
    data.runtime = {
        '概览': {
            '运行时间': runtimeData.uptime,
            '本次运行时长': runtimeData.runtime,
            '版本': {
                tx: runtimeData.txEnv.txaVersion,
                fx: runtimeData.txEnv.fxsVersionTag,
            },
            '数据库': {
                file: runtimeData.databaseFileSize ?? '--',
                players: databaseStats.players,
                bans: databaseStats.bans,
                warns: databaseStats.warns,
            },
        },
        '环境配置': {
            'FXServer': runtimeData.txEnv.fxsPath,
            '配置文件目录': runtimeData.txEnv.profilePath,
            '默认参数': runtimeData.txHostConfig.defaults.length > 0
                ? runtimeData.txHostConfig.defaults.join(', ')
                : '--',
            '网络接口': runtimeData.txHostConfig.netInterface ?? '--',
            '提供商': runtimeData.txHostConfig.providerName ?? '--',
        },
        '性能': {
            '封禁检查': perfQuantiles(runtimeData.performance.banCheck),
            '白名单检查': perfQuantiles(runtimeData.performance.whitelistCheck),
            '玩家列表': perfQuantiles(runtimeData.performance.playersTableSearch),
            '历史记录': perfQuantiles(runtimeData.performance.historyTableSearch),
            '数据库保存': perfQuantiles(runtimeData.performance.databaseSave),
            '性能数据采集': perfQuantiles(runtimeData.performance.perfCollection),
        },
        '监控': {
            '心跳失败': {
                HTTP: runtimeData.monitor.hbFails.http,
                FD3: runtimeData.monitor.hbFails.fd3,
            },
            '重启': {
                BT: runtimeData.monitor.restarts.bootTimeout,
                CL: runtimeData.monitor.restarts.close,
                HB: runtimeData.monitor.restarts.heartBeat,
                HC: runtimeData.monitor.restarts.healthCheck,
                BO: runtimeData.monitor.restarts.both,
            },
        },
        '内存': {
            '堆已用': `${runtimeData.memoryUsage.heap_used} (${runtimeData.memoryUsage.heap_pct}%)`,
            '堆上限': runtimeData.memoryUsage.heap_limit,
            '物理内存': runtimeData.memoryUsage.physical,
            '峰值分配': runtimeData.memoryUsage.peak_malloced,
        },
        '日志': {
            '存储': {
                '大小': runtimeData.logger.storageSize.totalBytes,
                '文件数': runtimeData.logger.storageSize.fileCount,
            },
            '管理员': runtimeData.logger.statusAdmin,
            'FXServer': runtimeData.logger.statusFXServer,
            '服务器': runtimeData.logger.statusServer,
        },
    };

    //Host data
    if ('error' in hostData) {
        data.host = {
            '错误': hostData.error ?? '未知错误',
        };
    } else {
        data.host = {
            '操作系统发行版': hostData.static.osDistro,
            '用户名': hostData.static.username,
            'CPU 型号': hostData.static.cpu.brand,
            'CPU 信息': `${hostData.static.cpu.physicalCores}c/${hostData.static.cpu.cores}t - ${hostData.static.cpu.speedMin} GHz`,
        };

        if (hostData.dynamic) {
            data.host['CPU 使用率'] = `${hostData.dynamic.cpuUsage}%`;
            data.host['内存使用率'] = `${hostData.dynamic.memory.usage}% (${hostData.dynamic.memory.used.toFixed(2)}/${hostData.dynamic.memory.total.toFixed(2)})`;
        }
    }

    //Server data
    const managerData = txManager.hostStatus;
    data.server = {
        'HashID': managerData.cfxId ?? '--',
        '加入链接': managerData.joinLink ?? '--',
        'CFG 路径': managerData.cfgPath ?? '--',
        '数据路径': managerData.dataPath ?? '--',
        '端点': txCore.fxRunner.child?.netEndpoint ?? '--',
        '项目名称': managerData.projectName ?? '--',
    };

    //Processes data
    data.processes = processesData; //nothing to do here

    //Cache and send
    cache.set(data);
    return sendTypedResp(data);
};
