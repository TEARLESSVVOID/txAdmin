const modulename = 'WebServer:DeployerActions';
import path from 'node:path';
import { cloneDeep } from 'lodash-es';
import slash from 'slash';
import mysql from 'mysql2/promise';
import consts from '@shared/consts';
import { txEnv, txHostConfig } from '@core/globalData';
import { validateModifyServerConfig } from '@lib/fxserver/fxsConfigHelper';
import consoleFactory from '@lib/console';
import { SYM_RESET_CONFIG } from '@lib/symbols';
const console = consoleFactory(modulename);

//Helper functions
const isUndefined = (x) => (x === undefined);


/**
 * Handle all the server control actions
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
export default async function DeployerActions(ctx) {
    //Sanity check
    if (isUndefined(ctx.params.action)) {
        return ctx.utils.error(400, '无效请求');
    }
    const action = ctx.params.action;

    //Check permissions
    if (!ctx.admin.testPermission('master', modulename)) {
        return ctx.send({ success: false, refresh: true });
    }

    //Check if this is the correct state for the deployer
    if (txManager.deployer == null) {
        return ctx.send({ success: false, refresh: true });
    }

    //Delegate to the specific action functions
    if (action == 'confirmRecipe') {
        return await handleConfirmRecipe(ctx);
    } else if (action == 'setVariables') {
        return await handleSetVariables(ctx);
    } else if (action == 'commit') {
        return await handleSaveConfig(ctx);
    } else if (action == 'cancel') {
        return await handleCancel(ctx);
    } else {
        return ctx.send({
            type: 'danger',
            message: '未知的设置操作。',
        });
    }
};


//================================================================
/**
 * Handle submition of user-edited recipe (record to deployer, starts the process)
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
async function handleConfirmRecipe(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.recipe)) {
        return ctx.utils.error(400, '无效请求 - 缺少参数');
    }
    const userEditedRecipe = ctx.request.body.recipe;

    try {
        ctx.admin.logAction('Setting recipe.');
        await txManager.deployer.confirmRecipe(userEditedRecipe);
    } catch (error) {
        return ctx.send({ type: 'danger', message: error.message });
    }

    return ctx.send({ success: true });
}


//================================================================
/**
 * Handle submition of the input variables/parameters
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
async function handleSetVariables(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.svLicense)) {
        return ctx.utils.error(400, '无效请求 - 缺少参数');
    }
    const userVars = cloneDeep(ctx.request.body);

    //Validating sv_licenseKey
    if (
        !consts.regexSvLicenseNew.test(userVars.svLicense)
        && !consts.regexSvLicenseOld.test(userVars.svLicense)
    ) {
        return ctx.send({ type: 'danger', message: '服务器许可证（Server License）似乎无效。' });
    }

    //Validating steam api key requirement
    if (
        txManager.deployer.recipe.steamRequired
        && (typeof userVars.steam_webApiKey !== 'string' || userVars.steam_webApiKey.length < 24)
    ) {
        return ctx.send({
            type: 'danger',
            message: '此配方要求设置有效的 steam_webApiKey。',
        });
    }

    //DB Stuff
    if (typeof userVars.dbDelete !== 'undefined') {
        //Testing the db config
        try {
            userVars.dbPort = parseInt(userVars.dbPort);
            if (isNaN(userVars.dbPort)) {
                return ctx.send({ type: 'danger', message: '数据库端口无效（不是整数）。默认值为 3306。' });
            }

            const mysqlOptions = {
                host: userVars.dbHost,
                port: userVars.dbPort,
                user: userVars.dbUsername,
                password: userVars.dbPassword,
                connectTimeout: 5000,
            };
            await mysql.createConnection(mysqlOptions);
        } catch (error) {
            let outMessage = error?.message ?? '发生未知错误。';
            if (error?.code === 'ECONNREFUSED') {
                let specificError = (txEnv.isWindows)
                    ? '如果你没有安装数据库，可以下载并运行 XAMPP。'
                    : '如果你没有安装数据库，必须下载并运行 MySQL 或 MariaDB。';
                if (userVars.dbPort !== 3306) {
                    specificError += '<br>\n<b>你没有使用默认的数据库端口 3306，请确保其正确！</b>';
                }
                outMessage = `${error?.message}<br>\n${specificError}`;
            } else if (error.message?.includes('auth_gssapi_client')) {
                outMessage = `你的数据库不接受所需的认证方式。请更新你的 MySQL/MariaDB 服务器后重试。`;
            }

            return ctx.send({ type: 'danger', message: `<b>数据库连接失败：</b> ${outMessage}` });
        }

        //Setting connection string
        userVars.dbDelete = (userVars.dbDelete === 'true');
        const dbFullHost = (userVars.dbPort === 3306)
            ? userVars.dbHost
            : `${userVars.dbHost}:${userVars.dbPort}`;
        userVars.dbConnectionString = (userVars.dbPassword.length)
            ? `mysql://${userVars.dbUsername}:${userVars.dbPassword}@${dbFullHost}/${userVars.dbName}?charset=utf8mb4`
            : `mysql://${userVars.dbUsername}@${dbFullHost}/${userVars.dbName}?charset=utf8mb4`;
    }

    //Max Clients & Server Endpoints
    userVars.maxClients = (txHostConfig.forceMaxClients) ? txHostConfig.forceMaxClients : 48;
    if (txHostConfig.netInterface || txHostConfig.fxsPort) {
        const comment = `# ${txHostConfig.sourceName}: do not modify!`;
        const endpointIface = txHostConfig.netInterface ?? '0.0.0.0';
        const endpointPort = txHostConfig.fxsPort ?? 30120;
        userVars.serverEndpoints = [
            `endpoint_add_tcp "${endpointIface}:${endpointPort}" ${comment}`,
            `endpoint_add_udp "${endpointIface}:${endpointPort}" ${comment}`,
        ].join('\n');
    } else {
        userVars.serverEndpoints = [
            'endpoint_add_tcp "0.0.0.0:30120"',
            'endpoint_add_udp "0.0.0.0:30120"',
        ].join('\n');
    }

    //Setting identifiers array
    const admin = txCore.adminStore.getAdminByName(ctx.admin.name);
    if (!admin) return ctx.send({ type: 'danger', message: '未找到该管理员。' });
    const addPrincipalLines = [];
    Object.keys(admin.providers).forEach((providerName) => {
        if (admin.providers[providerName].identifier) {
            addPrincipalLines.push(`add_principal identifier.${admin.providers[providerName].identifier} group.admin #${ctx.admin.name}`);
        }
    });
    userVars.addPrincipalsMaster = (addPrincipalLines.length)
        ? addPrincipalLines.join('\n')
        : '# Deployer Note: this admin master has no identifiers to be automatically added.\n# add_principal identifier.discord:111111111111111111 group.admin #example';

    //Start deployer
    try {
        ctx.admin.logAction('Running recipe.');
        txManager.deployer.start(userVars);
    } catch (error) {
        return ctx.send({ type: 'danger', message: error.message });
    }

    return ctx.send({ success: true });
}


//================================================================
/**
 * Handle the commit of a Recipe by receiving the user edited server.cfg
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
async function handleSaveConfig(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.serverCFG)) {
        return ctx.utils.error(400, '无效请求 - 缺少参数');
    }
    const serverCFG = ctx.request.body.serverCFG;
    const cfgFilePath = path.join(txManager.deployer.deployPath, 'server.cfg');
    txCore.cacheStore.set('deployer:recipe', txManager.deployer?.recipe?.name ?? 'unknown');

    //Validating config contents + saving file and backup
    try {
        const result = await validateModifyServerConfig(serverCFG, cfgFilePath, txManager.deployer.deployPath);
        if (result.errors) {
            return ctx.send({
                type: 'danger',
                success: false,
                markdown: true,
                message: `**由于配置文件存在错误，无法保存 \`server.cfg\`：**\n${result.errors}`,
            });
        }
    } catch (error) {
        return ctx.send({
            type: 'danger',
            success: false,
            markdown: true,
            message: `**保存 \`server.cfg\` 失败，错误信息：**\n${error.message}`,
        });
    }

    //Preparing & saving config
    let onesync = SYM_RESET_CONFIG;
    if (typeof txManager.deployer?.recipe?.onesync === 'string' && txManager.deployer.recipe.onesync.length) {
        onesync = txManager.deployer.recipe.onesync;
    }
    try {
        txCore.configStore.saveConfigs({
            server: {
                dataPath: slash(path.normalize(txManager.deployer.deployPath)),
                cfgPath: 'server.cfg',
                onesync,
            }
        }, ctx.admin.name);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error changing fxserver settings via deployer.`);
        console.verbose.dir(error);
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**保存配置文件时出错：** ${error.message}`
        });
    }

    ctx.admin.logAction('Completed and committed server deploy.');

    //If running (for some reason), kill it first 
    if (!txCore.fxRunner.isIdle) {
        ctx.admin.logCommand('STOP SERVER');
        await txCore.fxRunner.killServer('new server deployed', ctx.admin.name, true);
    }

    //Starting server
    const spawnError = await txCore.fxRunner.spawnServer(false);
    if (spawnError !== null) {
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `配置文件已保存，但启动服务器失败，错误信息：\n${spawnError}`,
        });
    } else {
        txManager.deployer = null;
        txCore.webServer.webSocket.pushRefresh('status');
        return ctx.send({ success: true });
    }
}


//================================================================
/**
 * Handle the cancellation of the deployer proguess
 * @param {import('@modules/WebServer/ctxTypes').AuthedCtx} ctx
 */
async function handleCancel(ctx) {
    txManager.deployer = null;
    txCore.webServer.webSocket.pushRefresh('status');
    return ctx.send({ success: true });
}
