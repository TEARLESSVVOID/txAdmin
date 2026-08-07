const modulename = 'WebServer:FXServerSchedule';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import { ApiToastResp } from '@shared/genericApiTypes';
const console = consoleFactory(modulename);


/**
 * Handle all the server scheduler commands
 */
export default async function FXServerSchedule(ctx: AuthedCtx) {
    if (
        typeof ctx.request.body.action === 'undefined'
        || typeof ctx.request.body.parameter === 'undefined'
    ) {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: `无效请求`,
        });
    }
    const {action, parameter} = ctx.request.body;

    //Check permissions
    if (!ctx.admin.testPermission('control.server', modulename)) {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: '你没有权限执行此操作。',
        });
    }

    if (action === 'setNextTempSchedule') {
        try {
            txCore.fxScheduler.setNextTempSchedule(parameter);
            ctx.admin.logAction(`Scheduling server restart at ${parameter}`);
            return ctx.send<ApiToastResp>({
                type: 'success',
                msg: '已安排重启。',
            });
        } catch (error) {
            return ctx.send<ApiToastResp>({
                type: 'error',
                msg: (error as Error).message,
            });
        }

    } else if (action === 'setNextSkip') {
        try {
            txCore.fxScheduler.setNextSkip(parameter, ctx.admin.name);
            const logAct = parameter ? 'Cancelling' : 'Re-enabling';
            ctx.admin.logAction(`${logAct} next scheduled restart.`);
            return ctx.send<ApiToastResp>({
                type: 'success',
                msg: '计划已更改。',
            });
        } catch (error) {
            return ctx.send<ApiToastResp>({
                type: 'error',
                msg: (error as Error).message,
            });
        }

    } else {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: '未知操作。',
        });
    }
};
