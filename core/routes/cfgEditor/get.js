const modulename = 'WebServer:CFGEditorPage';
import { resolveCFGFilePath, readRawCFGFile } from '@lib/fxserver/fxsConfigHelper';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the server.cfg
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
export default async function CFGEditorPage(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('server.cfg.editor')) {
        return ctx.utils.renderMessage('你没有权限查看此页面。');
    }

    //Check if file is set
    if (!txCore.fxRunner.isConfigured) {
        let message = '你需要先配置服务器数据路径，然后才能编辑 CFG 文件。';
        return ctx.utils.renderMessage(message);
    }

    //Read cfg file
    let rawFile;
    try {
        let cfgFilePath = resolveCFGFilePath(txConfig.server.cfgPath, txConfig.server.dataPath);
        rawFile = await readRawCFGFile(cfgFilePath);
    } catch (error) {
        let message = `读取 CFG 文件失败，错误信息：${error.message}`;
        return ctx.utils.renderMessage(message);
    }

    return ctx.utils.render('main/cfgEditor', {
        headerTitle: 'CFG 编辑器',
        rawFile,
        disableRestart: (ctx.admin.hasPermission('control.server')) ? '' : 'disabled',
    });
};
