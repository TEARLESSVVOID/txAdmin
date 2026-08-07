const modulename = 'WebServer:ServerLog';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);


/**
 * Returns the server log page
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
export default async function ServerLog(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('server.log.view')) {
        return ctx.utils.renderMessage('你没有权限查看此页面。');
    }

    const renderData = {
        headerTitle: '服务器日志',
    };
    return ctx.utils.render('main/serverLog', renderData);
};
