import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Route as WouterRoute, Switch } from "wouter";
import { PageErrorFallback } from "@/components/ErrorFallback";
import { useAtomValue, useSetAtom } from "jotai";
import { contentRefreshKeyAtom, pageErrorStatusAtom, useSetPageTitle } from "@/hooks/pages";
import { navigate as setLocation } from 'wouter/use-browser-location';
import { useAdminPerms } from "@/hooks/auth";

import Iframe from "@/pages/Iframe";
import NotFound from "@/pages/NotFound";
import TestingPage from "@/pages/TestingPage/TestingPage";
import LiveConsolePage from "@/pages/LiveConsole/LiveConsolePage";
import PlayersPage from "@/pages/Players/PlayersPage";
import HistoryPage from "@/pages/History/HistoryPage";
import BanTemplatesPage from "@/pages/BanTemplates/BanTemplatesPage";
import SystemLogPage from "@/pages/SystemLogPage";
import AddLegacyBanPage from "@/pages/AddLegacyBanPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import PlayerDropsPage from "@/pages/PlayerDropsPage/PlayerDropsPage";
import SettingsPage from "@/pages/Settings/SettingsPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import DiagnosticsPage from "@/pages/Diagnostics/DiagnosticsPage";
import AdvancedPage from "@/pages/AdvancedPage";


type RouteType = {
    path: string;
    title: string;
    permission?: string;
    Page: JSX.Element;
};

const allRoutes: RouteType[] = [
    //Global Routes
    {
        path: '/players',
        title: '玩家',
        Page: <PlayersPage />
    },
    {
        path: '/history',
        title: '历史记录',
        Page: <HistoryPage />
    },
    {
        path: '/insights/player-drops',
        title: '玩家掉线',
        Page: <PlayerDropsPage />
    },
    {
        path: '/allowlist',
        title: '白名单',
        Page: <Iframe legacyUrl="allowlist" />
    },
    {
        path: '/admins',
        title: '管理员',
        Page: <Iframe legacyUrl="adminManager" />
    },
    {
        path: '/settings',
        title: '设置',
        permission: 'settings.view',
        Page: <SettingsPage />
    },
    {
        path: '/system/master-actions',
        title: '主控操作',
        //NOTE: content is readonly for unauthorized accounts
        Page: <Iframe legacyUrl="masterActions" />
    },
    {
        path: '/system/diagnostics',
        title: '诊断',
        Page: <DiagnosticsPage />
    },
    {
        path: '/system/console-log',
        title: '控制台日志',
        permission: 'txadmin.log.view',
        Page: <SystemLogPage pageName="console" />
    },
    {
        path: '/system/action-log',
        title: '操作日志',
        permission: 'txadmin.log.view',
        Page: <SystemLogPage pageName="action" />
    },

    //Server Routes
    {
        path: '/',
        title: '仪表盘',
        Page: <DashboardPage />
    },
    {
        path: '/server/console',
        title: '实时控制台',
        permission: 'console.view',
        Page: <LiveConsolePage />
    },
    {
        path: '/server/resources',
        title: '资源',
        Page: <Iframe legacyUrl="resources" />
    },
    {
        path: '/server/server-log',
        title: '服务器日志',
        permission: 'server.log.view',
        Page: <Iframe legacyUrl="serverLog" />
    },
    {
        path: '/server/cfg-editor',
        title: 'CFG 编辑器',
        permission: 'server.cfg.editor',
        Page: <Iframe legacyUrl="cfgEditor" />
    },
    {
        path: '/server/setup',
        title: '服务器设置',
        permission: 'master', //FIXME: eithger change to all_permissions or create a new Setup/Deploy permission
        Page: <Iframe legacyUrl="setup" />
    },
    {
        path: '/server/deployer',
        title: '服务器部署',
        permission: 'master', //FIXME: eithger change to all_permissions or create a new Setup/Deploy permission
        Page: <Iframe legacyUrl="deployer" />
    },
    {
        path: '/advanced',
        title: '高级',
        permission: 'all_permissions',
        Page: <AdvancedPage />
    },

    //No nav routes
    {
        path: '/settings/ban-templates',
        title: '封禁模板',
        //NOTE: content is readonly for unauthorized accounts
        Page: <BanTemplatesPage />
    },
    {
        path: '/ban-identifiers',
        title: '封禁标识符',
        Page: <AddLegacyBanPage />
    },
    //FIXME: decide on how to organize the url for the player drops page - /server/ prefix?
    //       This will likely be a part of the insights page, eventually
    // {
    //     path: '/player-crashes',
    //     title: 'Player Crashes',
    //     children: <PlayerCrashesPage />
    // },
];


function Route(route: RouteType) {
    const { hasPerm } = useAdminPerms();
    const setPageTitle = useSetPageTitle();
    setPageTitle(route.title);
    const nodeToRender = route.permission && !hasPerm(route.permission)
        ? <UnauthorizedPage pageName={route.title} permission={route.permission} />
        : route.Page;
    return <WouterRoute path={route.path}>{nodeToRender}</WouterRoute>
}


export function MainRouterInner() {
    return (
        <Switch>
            {allRoutes.map((route) => <Route key={route.path} {...route} />)}

            {/* Other Routes - they need to set the title manuually */}
            {import.meta.env.DEV && (
                <WouterRoute path="/test"><TestingPage /></WouterRoute>
            )}
            <WouterRoute component={NotFound} />
        </Switch>
    );
}


export default function MainRouter() {
    const setPageErrorStatus = useSetAtom(pageErrorStatusAtom);
    const contentRefreshKey = useAtomValue(contentRefreshKeyAtom);

    return (
        <ErrorBoundary
            key={contentRefreshKey}
            FallbackComponent={PageErrorFallback}
            onError={() => {
                console.log('Page ErrorBoundary caught an error');
                setPageErrorStatus(true);
            }}
            onReset={() => {
                console.log('Page ErrorBoundary reset');
                setLocation('/');
                setPageErrorStatus(false);
            }}
        >
            <MainRouterInner />
        </ErrorBoundary>
    );
}
