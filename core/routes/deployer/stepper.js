const modulename = 'WebServer:DeployerStepper';
import fse from 'fs-extra';
import { txHostConfig } from '@core/globalData';
import consoleFactory from '@lib/console';
import { TxConfigState } from '@shared/enums';
import { sanitizeSimpleHtml } from '@lib/htmlRenderSafety';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the deployer stepper page (all 3 stages)
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
export default async function DeployerStepper(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('master')) {
        return ctx.utils.renderMessage('你需要成为主账户管理员才能使用部署器。');
    }

    //Ensure the correct state for the deployer
    if(txManager.configState === TxConfigState.Setup) {
        return ctx.utils.legacyNavigateToPage('/server/setup');
    } else if(txManager.configState !== TxConfigState.Deployer) {
        return ctx.utils.legacyNavigateToPage('/');
    } else if(!txManager.deployer?.step){
        throw new Error(`txManager.configState is Deployer but txManager.deployer is not defined`);
    }

    //Prepare Output
    const renderData = {
        step: txManager.deployer.step,
        deploymentID: txManager.deployer.deploymentID,
        requireDBConfig: false,
        defaultLicenseKey: '',
        recipe: undefined,
        defaults: {},
    };

    if (txManager.deployer.step === 'review') {
        renderData.recipe = {
            isTrustedSource: txManager.deployer.isTrustedSource,
            name: txManager.deployer.recipe.name,
            author: txManager.deployer.recipe.author,
            description: txManager.deployer.recipe.description,
            raw: txManager.deployer.recipe.raw,
        };
    } else if (txManager.deployer.step === 'input') {
        renderData.defaultLicenseKey = txHostConfig.defaults.cfxKey ?? '';
        renderData.requireDBConfig = txManager.deployer.recipe.requireDBConfig;
        renderData.defaults = {
            autofilled: Object.values(txHostConfig.defaults).some(Boolean),
            license: txHostConfig.defaults.cfxKey ?? '',
            mysqlHost: txHostConfig.defaults.dbHost ?? 'localhost',
            mysqlPort: txHostConfig.defaults.dbPort ?? '3306',
            mysqlUser: txHostConfig.defaults.dbUser ?? 'root',
            mysqlPassword: txHostConfig.defaults.dbPass ?? '',
            mysqlDatabase: txHostConfig.defaults.dbName ?? txManager.deployer.deploymentID,
        };

        const knownVarDescriptions = {
            steam_webApiKey: 'Steam Web API Key 用于在玩家加入时验证其身份。<br/>\n你可以在 https://steamcommunity.com/dev/apikey 获取。',
        }
        const recipeVars = txManager.deployer.getRecipeVars();
        renderData.inputVars = Object.keys(recipeVars).map((name) => {
            return {
                name: name,
                value: recipeVars[name],
                description: sanitizeSimpleHtml(knownVarDescriptions[name] || ''),
            };
        });
    } else if (txManager.deployer.step === 'run') {
        renderData.deployPath = txManager.deployer.deployPath;
    } else if (txManager.deployer.step === 'configure') {
        const errorMessage = `# 未找到 server.cfg！
# 这可能意味着你在点击"下一步"之前将其删除了。
# 请按取消并重新启动部署器，
# 或者在此处粘贴 server.cfg 的内容。
# (╯°□°）╯︵ ┻━┻`;
        try {
            renderData.serverCFG = await fse.readFile(`${txManager.deployer.deployPath}/server.cfg`, 'utf8');
            if (renderData.serverCFG == '#save_attempt_please_ignore' || !renderData.serverCFG.length) {
                renderData.serverCFG = errorMessage;
            } else if (renderData.serverCFG.length > 10240) { //10kb
                renderData.serverCFG = `# 此配方创建的 ./server.cfg 超过 10kb，这很可能意味着数据有误。 
请确保配方中所有内容正确后重试。`;
            }
        } catch (error) {
            console.verbose.dir(error);
            renderData.serverCFG = errorMessage;
        }
    } else {
        return ctx.utils.renderMessage('未知的部署器步骤，请报告此错误并重启 txAdmin。');
    }

    return ctx.utils.render('standalone/deployer', renderData);
};
