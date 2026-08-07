const modulename = 'Deployer';
import path from 'node:path';
import { cloneDeep } from 'lodash-es';
import fse from 'fs-extra';
import open from 'open';
import getOsDistro from '@lib/host/getOsDistro.js';
import { txEnv } from '@core/globalData';
import recipeEngine from './recipeEngine.js';
import consoleFactory from '@lib/console.js';
import recipeParser from './recipeParser.js';
import { getTimeHms } from '@lib/misc.js';
import { makeTemplateRecipe } from './utils.js';
const console = consoleFactory(modulename);


//Constants
export const RECIPE_DEPLOYER_VERSION = 3;


/**
 * The deployer class is responsible for running the recipe and handling status and errors
 */
export class Deployer {
    /**
     * @param {string|false} originalRecipe
     * @param {string} deployPath
     * @param {boolean} isTrustedSource
     * @param {object} customMetaData
     */
    constructor(originalRecipe, deploymentID, deployPath, isTrustedSource, customMetaData = {}) {
        console.log('Deployer instance ready.');

        //Setup variables
        this.step = 'review'; //FIXME: transform into an enum
        this.deployFailed = false;
        this.deployPath = deployPath;
        this.isTrustedSource = isTrustedSource;
        this.originalRecipe = originalRecipe;
        this.deploymentID = deploymentID;
        this.progress = 0;
        this.serverName = customMetaData.serverName || txConfig.general.serverName || '';
        this.logLines = [];

        //Load recipe
        const impRecipe = (originalRecipe !== false)
            ? originalRecipe
            : makeTemplateRecipe(customMetaData.serverName, customMetaData.author);
        try {
            this.recipe = recipeParser(impRecipe);
        } catch (error) {
            console.verbose.dir(error);
            throw new Error(`配方错误：${error.message}`);
        }
    }

    //Dumb helpers - don't care enough to make this less bad
    customLog(str) {
        this.logLines.push(`[${getTimeHms()}] ${str}`);
        console.log(str);
    }
    customLogError(str) {
        this.logLines.push(`[${getTimeHms()}] ${str}`);
        console.error(str);
    }
    getDeployerLog() {
        return this.logLines.join('\n');
    }

    /**
     * Confirms the recipe and goes to the input stage
     * @param {string} userRecipe
     */
    async confirmRecipe(userRecipe) {
        if (this.step !== 'review') throw new Error('应为 review 步骤');

        //Parse/set recipe
        try {
            this.recipe = recipeParser(userRecipe);
        } catch (error) {
            throw new Error(`由于配方错误，无法启动部署器：${error.message}`);
        }

        //Ensure deployment path
        try {
            await fse.ensureDir(this.deployPath);
        } catch (error) {
            console.verbose.dir(error);
            throw new Error(`创建 ${this.deployPath} 失败，错误信息：${error.message}`);
        }

        this.step = 'input';
    }

    /**
     * Returns the recipe variables for the deployer run step
     */
    getRecipeVars() {
        if (this.step !== 'input') throw new Error('应为 input 步骤');
        return cloneDeep(this.recipe.variables);
        //TODO: ?? Object.keys pra montar varname: {type: 'string'}?
    }

    /**
     * Starts the deployment process
     * @param {string} userInputs
     */
    start(userInputs) {
        if (this.step !== 'input') throw new Error('应为 input 步骤');
        Object.assign(this.recipe.variables, userInputs);
        this.logLines = [];
        this.customLog(`正在开始部署 ${this.recipe.name}。`);
        this.deployFailed = false;
        this.progress = 0;
        this.step = 'run';
        this.runTasks();
    }

    /**
     * Marks the deploy as failed
     */
    async markFailedDeploy() {
        this.deployFailed = true;
        try {
            const filePath = path.join(this.deployPath, '_DEPLOY_FAILED_DO_NOT_USE');
            await fse.outputFile(filePath, '此部署已失败，请勿使用这些文件。');
        } catch (error) { }
    }

    /**
     * (Private) Run the tasks in a sequential way.
     */
    async runTasks() {
        if (this.step !== 'run') throw new Error('应为 run 步骤');
        const contextVariables = cloneDeep(this.recipe.variables);
        contextVariables.deploymentID = this.deploymentID;
        contextVariables.serverName = this.serverName;
        contextVariables.recipeName = this.recipe.name;
        contextVariables.recipeAuthor = this.recipe.author;
        contextVariables.recipeDescription = this.recipe.description;

        //Run all the tasks
        for (let index = 0; index < this.recipe.tasks.length; index++) {
            this.progress = Math.round((index / this.recipe.tasks.length) * 100);
            const task = this.recipe.tasks[index];
            const taskID = `[task${index + 1}:${task.action}]`;
            this.customLog(`正在运行 ${taskID}...`);
            const taskTimeoutSeconds = task.timeoutSeconds ?? recipeEngine[task.action].timeoutSeconds;

            try {
                contextVariables.$step = `正在加载任务 ${task.action}`;
                await Promise.race([
                    recipeEngine[task.action].run(task, this.deployPath, contextVariables),
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject(new Error(`在 ${taskTimeoutSeconds} 秒后超时。`));
                        }, taskTimeoutSeconds * 1000);
                    }),
                ]);
                this.logLines[this.logLines.length - 1] += ' ✔️';
            } catch (error) {
                this.logLines[this.logLines.length - 1] += ' ❌';
                let msg = `任务失败：${error.message}\n`
                    + '选项：\n'
                    + JSON.stringify(task, null, 2);
                if (contextVariables.$step) {
                    msg += '\n调试/状态：'
                        + JSON.stringify([
                            txEnv.txaVersion,
                            await getOsDistro(),
                            contextVariables.$step
                        ]);
                }
                this.customLogError(msg);
                return await this.markFailedDeploy();
            }
        }

        //Set progress
        this.progress = 100;
        this.customLog('所有任务已完成。');

        //Check deploy folder validity (resources + server.cfg)
        try {
            if (!fse.existsSync(path.join(this.deployPath, 'resources'))) {
                throw new Error('此配方没有创建 \'resources\' 文件夹。');
            } else if (!fse.existsSync(path.join(this.deployPath, 'server.cfg'))) {
                throw new Error('此配方没有创建 \'server.cfg\' 文件。');
            }
        } catch (error) {
            this.customLogError(`部署验证错误：${error.message}`);
            return await this.markFailedDeploy();
        }

        //Replace all vars in the server.cfg
        try {
            const task = {
                mode: 'all_vars',
                file: './server.cfg',
            };
            await recipeEngine['replace_string'].run(task, this.deployPath, contextVariables);
            this.customLog('正在替换 server.cfg 中的所有变量... ✔️');
        } catch (error) {
            this.customLogError(`替换 server.cfg 中的所有变量失败：${error.message}`);
            return await this.markFailedDeploy();
        }

        //Else: success :)
        this.customLog('部署完成且文件夹验证通过。全部完成！');
        this.step = 'configure';
        if (txEnv.isWindows) {
            try {
                await open(path.normalize(this.deployPath), { app: 'explorer' });
            } catch (error) { }
        }
    }
}
