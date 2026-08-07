const modulename = 'WebServer:AdminManagerPage';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the admins.
 */
export default async function AdminManagerPage(ctx: AuthedCtx) {
    //Check permission
    if (!ctx.admin.hasPermission('manage.admins')) {
        return ctx.utils.renderMessage('你没有权限查看此页面。');
    }

    //Prepare admin array
    const admins = txCore.adminStore.getAdminsList().map((admin) => {
        let perms;
        if (admin.master == true) {
            perms = '主账户';
        } else if (admin.permissions.includes('all_permissions')) {
            perms = '全部权限';
        } else if (admin.permissions.length !== 1) {
            perms = `${admin.permissions.length} 个权限`;
        } else {
            perms = '1 个权限';
        }
        const isSelf = ctx.admin.name.toLowerCase() === admin.name.toLowerCase();

        let identifiers: string[] = [];
        if ('citizenfx' in admin.providers && typeof admin.providers.citizenfx?.identifier === 'string') {
            identifiers.push(admin.providers.citizenfx.identifier);
        }

        if ('discord' in admin.providers && typeof admin.providers.discord?.identifier === 'string') {
            identifiers.push(admin.providers.discord.identifier);
        }

        return {
            name: admin.name,
            identifiers,
            perms: perms,
            isSelf,
            disableEdit: !ctx.admin.isMaster && admin.master,
            disableDelete: (admin.master || isSelf),
        };
    });

    //Set render data
    const renderData = {
        headerTitle: '管理员管理',
        admins,
    };

    //Give output
    return ctx.utils.render('main/adminManager', renderData);
};
