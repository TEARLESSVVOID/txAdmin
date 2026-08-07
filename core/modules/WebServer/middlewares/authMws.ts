const modulename = 'WebServer:AuthMws';
import consoleFactory from '@lib/console';
import { checkRequestAuth } from "../authLogic";
import { ApiAuthErrorResp, ApiToastResp, GenericApiErrorResp } from "@shared/genericApiTypes";
import { InitializedCtx } from '../ctxTypes';
import { txHostConfig } from '@core/globalData';
const console = consoleFactory(modulename);

const webLogoutPage = `<style>
body {
    margin: 0;
}
.notice {
    font-family: sans-serif;
    font-size: 1.5em;
    text-align: center;
    background-color: #222326;
    color: #F7F7F8;
    padding: 2em;
    border: 1px solid #333539;
    border-radius: 0.5em;
}
.notice a {
    color: #F00A53;
}
</style>
    <p class="notice">
        用户已注销。 <br>
        正在重定向到<a href="/login#expired" target="_parent">登录页面</a>...
    </p>
<script>
    // Notify parent window that auth failed
    window.parent.postMessage({ type: 'logoutNotice' });
    // If parent redirect didn't work, redirect here
    setTimeout(function() {
        window.parent.location.href = '/login#expired';
    }, 2000);
</script>`;


/**
 * For the hosting provider routes
 */
export const hostAuthMw = async (ctx: InitializedCtx, next: Function) => {
    const docs = 'https://aka.cfx.re/txadmin-env-config';

    //Token disabled
    if (txHostConfig.hostApiToken === 'disabled') {
        return await next();
    }

    //Token undefined
    if (!txHostConfig.hostApiToken) {
        return ctx.send({
            error: '未配置令牌',
            desc: '需要配置 TXHOST_API_TOKEN 环境变量才能使用状态接口',
            docs,
        });
    }

    //Token available
    let tokenProvided: string | undefined;
    const headerToken = ctx.headers['x-txadmin-envtoken'];
    if (typeof headerToken === 'string' && headerToken) {
        tokenProvided = headerToken;
    }
    const paramsToken = ctx.query.envtoken;
    if (typeof paramsToken === 'string' && paramsToken) {
        tokenProvided = paramsToken;
    }
    if (headerToken && paramsToken) {
        return ctx.send({
            error: '令牌冲突',
            desc: '不能同时使用请求头和查询字符串中的令牌',
            docs,
        });
    }
    if (!tokenProvided) {
        return ctx.send({
            error: '缺少令牌',
            desc: '需要在请求头或查询字符串中提供令牌',
            docs,
        });
    }
    if (tokenProvided !== txHostConfig.hostApiToken) {
        return ctx.send({
            error: '无效的令牌',
            desc: '提供的令牌与 TXHOST_API_TOKEN 环境变量不匹配',
            docs,
        });
    }

    return await next();
};


/**
 * Intercom auth middleware
 * This does not set ctx.admin and does not use session/cookies whatsoever.
 * FIXME: add isLocalAddress check?
 */
export const intercomAuthMw = async (ctx: InitializedCtx, next: Function) => {
    if (
        typeof ctx.request.body?.txAdminToken !== 'string'
        || ctx.request.body.txAdminToken !== txCore.webServer.luaComToken
    ) {
        return ctx.send({ error: '无效的令牌' });
    }

    await next();
};

/**
 * Used for the legacy web interface.
 */
export const webAuthMw = async (ctx: InitializedCtx, next: Function) => {
    //Check auth
    const authResult = checkRequestAuth(
        ctx.request.headers,
        ctx.ip,
        ctx.txVars.isLocalRequest,
        ctx.sessTools
    );
    if (!authResult.success) {
        ctx.sessTools.destroy();
        if (authResult.rejectReason) {
            console.verbose.warn(`Invalid session auth: ${authResult.rejectReason}`);
        }
        return ctx.send(webLogoutPage);
    }

    //Adding the admin to the context
    ctx.admin = authResult.admin;
    await next();
};

/**
 * API Authentication Middleware 
 */
export const apiAuthMw = async (ctx: InitializedCtx, next: Function) => {
    const sendTypedResp = (data: ApiAuthErrorResp | (ApiToastResp & GenericApiErrorResp)) => ctx.send(data);

    //Check auth
    const authResult = checkRequestAuth(
        ctx.request.headers,
        ctx.ip,
        ctx.txVars.isLocalRequest,
        ctx.sessTools
    );
    if (!authResult.success) {
        ctx.sessTools.destroy();
        if (authResult.rejectReason && (authResult.rejectReason !== 'nui_admin_not_found' || console.isVerbose)) {
            console.verbose.warn(`Invalid session auth: ${authResult.rejectReason}`);
        }
        return sendTypedResp({
            logout: true,
            reason: authResult.rejectReason ?? '无会话'
        });
    }

    //For web routes, we need to check the CSRF token
    //For nui routes, we need to check the luaComToken, which is already done in nuiAuthLogic above
    if (ctx.txVars.isWebInterface) {
        const sessToken = authResult.admin?.csrfToken; //it should exist for nui because of authLogic
        const headerToken = ctx.headers['x-txadmin-csrftoken'];
        if (!sessToken || !headerToken || sessToken !== headerToken) {
            console.verbose.warn(`Invalid CSRF token: ${ctx.path}`);
            const msg = (headerToken)
                ? '错误：CSRF 令牌无效，请刷新页面或重新登录。'
                : '错误：缺少 HTTP 请求头 \'x-txadmin-csrftoken\'。这可能意味着你的文件未更新，或者你使用了某个会从 HTTP 请求中移除该请求头的反向代理。';

            //Doing ApiAuthErrorResp & GenericApiErrorResp to maintain compatibility with all routes
            //"error" is used by diagnostic, masterActions, playerlist, whitelist and possibly more
            return sendTypedResp({
                type: 'error',
                msg: msg,
                error: msg
            });
        }
    }

    //Adding the admin to the context
    ctx.admin = authResult.admin;
    await next();
};
