const modulename = 'WebServer:FXServerControls';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import { ApiToastResp } from '@shared/genericApiTypes';
import { msToShortishDuration } from '@lib/misc';
import ConfigStore from '@modules/ConfigStore';
const console = consoleFactory(modulename);


/**
 * Handle all the server control actions
 */
export default async function FXServerControls(ctx: AuthedCtx) {
    //Sanity check
    if (typeof ctx.request.body?.action !== 'string') {
        return ctx.utils.error(400, '无效请求');
    }
    const { action } = ctx.request.body;

    //Check permissions
    if (!ctx.admin.testPermission('control.server', modulename)) {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: '你没有权限执行此操作。',
        });
    }

    if (action === 'restart') {
        ctx.admin.logCommand('RESTART SERVER');

        //If too much of a delay, do it async
        const respawnDelay = txCore.fxRunner.restartSpawnDelay;
        if (respawnDelay.ms > 10_000) {
            txCore.fxRunner.restartServer('admin request', ctx.admin.name).catch((e) => { });
            const durationStr = msToShortishDuration(
                respawnDelay.ms,
                { units: ['m', 's', 'ms'] }
            );
            return ctx.send<ApiToastResp>({
                type: 'warning',
                msg: `服务器将在 ${durationStr} 后重启。`
            });
        } else {
            const restartError = await txCore.fxRunner.restartServer('admin request', ctx.admin.name);
            if (restartError !== null) {
                return ctx.send<ApiToastResp>({ type: 'error', md: true, msg: restartError });
            } else {
                return ctx.send<ApiToastResp>({ type: 'success', msg: '服务器正在重启中。' });
            }
        }

    } else if (action === 'stop') {
        if (txCore.fxRunner.isIdle) {
            return ctx.send<ApiToastResp>({ type: 'success', msg: '服务器已停止。' });
        }
        ctx.admin.logCommand('STOP SERVER');
        await txCore.fxRunner.killServer('admin request', ctx.admin.name, false);
        return ctx.send<ApiToastResp>({ type: 'success', msg: '服务器已停止。' });

    } else if (action === 'start') {
        if (!txCore.fxRunner.isIdle) {
            return ctx.send<ApiToastResp>({
                type: 'error',
                msg: '服务器已在运行。如果无法正常工作，请按重启（RESTART）。'
            });
        }
        ctx.admin.logCommand('START SERVER');
        const spawnError = await txCore.fxRunner.spawnServer(true);
        if (spawnError !== null) {
            return ctx.send<ApiToastResp>({ type: 'error', md: true, msg: spawnError });
        } else {
            return ctx.send<ApiToastResp>({ type: 'success', msg: '服务器正在启动中。' });
        }

    } else {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: `未知的服务器控制操作：'${action}'。`,
        });
    }
};
