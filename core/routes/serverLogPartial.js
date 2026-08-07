const modulename = 'WebServer:ServerLogPartial';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the admin log.
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
export default async function ServerLogPartial(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('server.log.view')) {
        return sendTypedResp({ error: '你没有权限调用此接口。' });
    }

    const isDigit = /^\d{13}$/;
    const sliceSize = 500;

    if (ctx.request.query.dir === 'older' && isDigit.test(ctx.request.query.ref)) {
        const log = txCore.logger.server.readPartialOlder(ctx.request.query.ref, sliceSize);
        return ctx.send({
            boundry: log.length < sliceSize,
            log,
        });
    } else if (ctx.request.query.dir === 'newer' && isDigit.test(ctx.request.query.ref)) {
        const log = txCore.logger.server.readPartialNewer(ctx.request.query.ref, sliceSize);
        return ctx.send({
            boundry: log.length < sliceSize,
            log,
        });
    } else {
        return ctx.send({
            boundry: true,
            log: txCore.logger.server.getRecentBuffer(),
        });
    }
};
