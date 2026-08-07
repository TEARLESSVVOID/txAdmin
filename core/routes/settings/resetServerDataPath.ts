const modulename = 'WebServer:SettingsPage';
import consoleFactory from '@lib/console';
import type { AuthedCtx } from '@modules/WebServer/ctxTypes';
import type { ApiToastResp } from '@shared/genericApiTypes';
import { SYM_RESET_CONFIG } from '@lib/symbols';
const console = consoleFactory(modulename);

export type ResetServerDataPathResp = ApiToastResp;

/**
 * Resets the server settings (was a master action)
 */
export default async function ResetServerDataPath(ctx: AuthedCtx) {
    const sendTypedResp = (data: ResetServerDataPathResp) => ctx.send(data);

    //Check permissions
    if (!ctx.admin.testPermission('all_permissions', modulename)) {
        return sendTypedResp({
            type: 'error',
            msg: '你没有权限执行此操作。',
        });
    }

    //Kill the server async
    if (!txCore.fxRunner.isIdle) {
        ctx.admin.logCommand('STOP SERVER');
        txCore.fxRunner.killServer('new server set up', ctx.admin.name, false).catch((e) => { });
    }

    //Making sure the deployer is not running
    txManager.deployer = null;

    //Preparing & saving config
    try {
        txCore.configStore.saveConfigs({
            server: {
                dataPath: SYM_RESET_CONFIG,
                cfgPath: SYM_RESET_CONFIG,
            }
        }, ctx.admin.name);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error resetting server data settings.`);
        console.verbose.dir(error);
        return sendTypedResp({
            type: 'error',
            md: true,
            title: `重置服务器数据路径时出错。`,
            msg: (error as any).message,
        });
    }

    //technically not required, but faster than fxRunner.killServer()
    txCore.webServer.webSocket.pushRefresh('status');

    //Sending output
    ctx.admin.logAction('Resetting server data settings.');
    return sendTypedResp({
        type: 'success',
        msg: '服务器数据路径已重置。'
    });
};
