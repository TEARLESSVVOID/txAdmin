const modulename = 'WebServer:AuthChangePassword';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import consts from '@shared/consts';
import { GenericApiResp } from '@shared/genericApiTypes';
import { z } from 'zod';
const console = consoleFactory(modulename);

//Helper functions
const bodySchema = z.object({
    oldPassword: z.string().optional(),
    newPassword: z.string(),
});
export type ApiChangePasswordReqSchema = z.infer<typeof bodySchema>;


/**
 * Route to change your own password
 */
export default async function AuthChangePassword(ctx: AuthedCtx) {
    //Sanity check
    const schemaRes = bodySchema.safeParse(ctx.request.body);
    if (!schemaRes.success) {
        return ctx.send<GenericApiResp>({
            error: `无效的请求体：${schemaRes.error.message}`,
        });
    }
    const { newPassword, oldPassword } = schemaRes.data;

    //Validate new password
    if (newPassword.trim() !== newPassword) {
        return ctx.send<GenericApiResp>({
            error: '你的密码开头或结尾包含空格，这很可能是意外输入。请移除空格后重试。',
        });
    }
    if (newPassword.length < consts.adminPasswordMinLength || newPassword.length > consts.adminPasswordMaxLength) {
        return ctx.send<GenericApiResp>({ error: '新密码长度无效。' });
    }

    //Get vault admin
    const vaultAdmin = txCore.adminStore.getAdminByName(ctx.admin.name);
    if (!vaultAdmin) throw new Error('等等，什么？那个管理员在哪？');
    if (!ctx.admin.isTempPassword) {
        if (!oldPassword || !VerifyPasswordHash(oldPassword, vaultAdmin.password_hash)) {
            return ctx.send<GenericApiResp>({ error: '当前密码错误。' });
        }
    }

    //Edit admin and give output
    try {
        const newHash = await txCore.adminStore.editAdmin(ctx.admin.name, newPassword);

        //Update session hash if logged in via password
        const currSess = ctx.sessTools.get();
        if (currSess?.auth?.type === 'password') {
            ctx.sessTools.set({
                auth: {
                    ...currSess.auth,
                    password_hash: newHash,
                }
            });
        }

        ctx.admin.logAction('Changing own password.');
        return ctx.send<GenericApiResp>({ success: true });
    } catch (error) {
        return ctx.send<GenericApiResp>({ error: (error as Error).message });
    }
};
