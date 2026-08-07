const modulename = 'WebServer:CFGEditorSave';
import { validateModifyServerConfig } from '@lib/fxserver/fxsConfigHelper';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);


const isUndefined = (x) => (x === undefined);


/**
 * Saves the server.cfg
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
export default async function CFGEditorSave(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.cfgData)
        || typeof ctx.request.body.cfgData !== 'string'
    ) {
        return ctx.utils.error(400, '无效请求');
    }

    //Check permissions
    if (!ctx.admin.testPermission('server.cfg.editor', modulename)) {
        return ctx.send({
            type: 'danger',
            message: '你没有权限执行此操作。',
        });
    }

    //Check if file is set
    if (!txCore.fxRunner.isConfigured) {
        const message = '未定义 CFG 或服务器数据路径。请先在设置页面中进行配置。';
        return ctx.send({type: 'danger', message});
    }


    //Validating config contents + saving file and backup
    let result;
    try {
        result = await validateModifyServerConfig(
            ctx.request.body.cfgData,
            txConfig.server.cfgPath,
            txConfig.server.dataPath,
        );
    } catch (error) {
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**保存 \`server.cfg\` 失败，错误信息：**\n${error.message}`,
        });
    }

    //Handle result
    if (result.errors) {
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**由于配置文件存在错误，无法保存 \`server.cfg\`：**\n${result.errors}`,
        });
    }
    if (result.warnings) {
        return ctx.send({
            type: 'warning',
            markdown: true,
            message: `**文件已保存，但有一些警告需要你注意：**\n${result.warnings}`,
        });
    }
    return ctx.send({
        type: 'success',
        markdown: true,
        message: '**文件已保存。**',
    });
};
