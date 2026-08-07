const modulename = 'WebServer:MasterActions:GetBackup';
import fsp from 'node:fs/promises';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { getTimeFilename } from '@lib/misc';
import { txEnv } from '@core/globalData';
const console = consoleFactory(modulename);


/**
 * Handles the rendering or delivery of master action resources
 */
export default async function MasterActionsGet(ctx: AuthedCtx) {
    //Check permissions
    if (!ctx.admin.testPermission('master', modulename)) {
        return ctx.utils.renderMessage('只有主账户（master）拥有查看/使用此页面的权限。');
    }
    if (!ctx.txVars.isWebInterface) {
        return ctx.utils.renderMessage('此功能无法通过游戏内菜单使用，请使用 txAdmin 的网页版本。');
    }

    const dbPath = `${txEnv.profilePath}/data/playersDB.json`;
    let readFile;
    try {
        readFile = await fsp.readFile(dbPath);
    } catch (error) {
        console.error(`Could not read database file ${dbPath}.`);
        return ctx.utils.renderMessage(`生成备份文件失败，错误信息：${(error as Error).message}`);
    }
    //getTimeFilename
    ctx.attachment(`playersDB_${getTimeFilename()}.json`);
    ctx.body = readFile;
    console.log(`[${ctx.admin.name}] Downloading player database.`);
};
