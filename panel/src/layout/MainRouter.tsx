import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Route as WouterRoute, Switch } from "wouter";
import { PageErrorFallback } from "@/components/ErrorFallback";
import { useAtomValue, useSetAtom } from "jotai";
import { contentRefreshKeyAtom, pageErrorStatusAtom, useSetPageTitle } from "@/hooks/pages";
import { navigate as setLocation } from 'wouter/use-browser-location';
import { useAdminPerms } from "@/hooks/auth";
import { useTranslation } from "@/hooks/useTranslation";

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
        title: 'players',
        Page: <PlayersPage />
    },
    {
        path: '/history',
        title: 'history',
        Page: <HistoryPage />
    },
    {
        path: '/insights/player-drops',
        title: 'player.drops',
        Page: <PlayerDropsPage />
    },
    {
        path: '/allowlist',
        title: 'allowlist',
        Page: <Iframe legacyUrl="allowlist" />
    },
    {
        path: '/admins',
        title: 'admins',
        Page: <Iframe legacyUrl="adminManager" />
    },
    {
        path: '/settings',
        title: 'settings',
        permission: 'settings.view',
        Page: <SettingsPage />
    },
    {
        path: '/system/master-actions',
        title: 'master.actions',
        //NOTE: content is readonly for unauthorized accounts
        Page: <Iframe legacyUrl="masterActions" />
    },
    {
        path: '/system/diagnostics',
        title: 'diagnostics',
        Page: <DiagnosticsPage />
    },
    {
        path: '/system/console-log',
        title: 'console.log',
        permission: 'txadmin.log.view',
        Page: <SystemLogPage pageName="console" />
    },
    {
        path: '/system/action-log',
        title: 'action.log',
        permission: 'txadmin.log.view',
        Page: <SystemLogPage pageName="action" />
    },

    //Server Routes
    {
        path: '/',
        title: 'dashboard',
        Page: <DashboardPage />
    },
    {
        path: '/server/console',
        title: 'live.console',
        permission: 'console.view',
        Page: <LiveConsolePage />
    },
    {
        path: '/server/resources',
        title: 'resources',
        Page: <Iframe legacyUrl="resources" />
    },
    {
        path: '/server/server-log',
        title: 'server.log',
        permission: 'server.log.view',
        Page: <Iframe legacyUrl="serverLog" />
    },
    {
        path: '/server/cfg-editor',
        title: 'cfg.editor',
        permission: 'server.cfg.editor',
        Page: <Iframe legacyUrl="cfgEditor" />
    },
    {
        path: '/server/setup',
        title: 'server.setup',
        permission: 'master', //FIXME: eithger change to all_permissions or create a new Setup/Deploy permission
        Page: <Iframe legacyUrl="setup" />
    },
    {
        path: '/server/deployer',
        title: 'server.deployer',
        permission: 'master', //FIXME: eithger change to all_permissions or create a new Setup/Deploy permission
        Page: <Iframe legacyUrl="deployer" />
    },
    {
        path: '/advanced',
        title: 'advanced',
        permission: 'all_permissions',
        Page: <AdvancedPage />
    },

    //No nav routes
    {
        path: '/settings/ban-templates',
        title: 'ban.templates',
        //NOTE: content is readonly for unauthorized accounts
        Page: <BanTemplatesPage />
    },
    {
        path: '/ban-identifiers',
        title: 'ban.identifiers',
        Page: <AddLegacyBanPage />
    },
];


function Route(route: RouteType) {
    const { t } = useTranslation();
    const { hasPerm } = useAdminPerms();
    const setPageTitle = useSetPageTitle();
    setPageTitle(t(`page.${route.title}`));
    const nodeToRender = route.permission && !hasPerm(route.permission)
        ? <UnauthorizedPage pageName={t(`page.${route.title}`)} permission={route.permission} />
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
