const modulename = 'WebServer:AuthAddMasterCallback';
import { InitializedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import { getIdFromOauthNameid } from '@lib/player/idUtils';
import { ApiAddMasterCallbackResp } from '@shared/authApiTypes';
import { z } from 'zod';
import { handleOauthCallback } from './oauthMethods';
const console = consoleFactory(modulename);

//Helper functions
const bodySchema = z.object({
    redirectUri: z.string(),
});
export type ApiAddMasterCallbackReqSchema = z.infer<typeof bodySchema>;

/**
 * Handles the Add Master flow
 */
export default async function AuthAddMasterCallback(ctx: InitializedCtx) {
    const schemaRes = bodySchema.safeParse(ctx.request.body);
    if (!schemaRes.success) {
        return ctx.send<ApiAddMasterCallbackResp>({
            errorTitle: '无效的请求体',
            errorMessage: schemaRes.error.message,
        });
    }
    const { redirectUri } = schemaRes.data;

    //Check if there are already admins set up
    if (txCore.adminStore.hasAdmins()) {
        return ctx.send<ApiAddMasterCallbackResp>({
            errorTitle: `主账户已设置。`,
            errorMessage: `请返回登录页面。`,
        });
    }

    //Handling the callback
    const callbackResp = await handleOauthCallback(ctx, redirectUri);
    if('errorCode' in callbackResp || 'errorTitle' in callbackResp){
        return ctx.send<ApiAddMasterCallbackResp>(callbackResp);
    }
    const userInfo = callbackResp;

    //Getting identifier
    const fivemIdentifier = getIdFromOauthNameid(userInfo.nameid);
    if(!fivemIdentifier){
        return ctx.send<ApiAddMasterCallbackResp>({
            errorTitle: '无效的 nameid 标识符。',
            errorMessage: `无法从下面的 URL 中提取用户标识符。请将此问题报告给 txAdmin 开发团队。\n${userInfo.nameid.toString()}`,
        });
    }

    //Setting session
    ctx.sessTools.set({
        tmpAddMasterUserInfo: userInfo,
    });

    return ctx.send<ApiAddMasterCallbackResp>({
        fivemName: userInfo.name,
        fivemId: fivemIdentifier,
        profilePicture: userInfo.picture,
    });
};
