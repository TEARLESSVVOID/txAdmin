import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ServerSidebar } from "./ServerSidebar/ServerSidebar";
import { useGlobalMenuSheet, usePlayerlistSheet, useServerSheet } from "@/hooks/sheets";
import { MenuNavLink, NavLink } from "@/components/MainPageLink";
import { ClipboardCheckIcon, DoorOpenIcon, ListIcon, PieChartIcon, ScrollIcon, SettingsIcon, UserSquare2Icon, UsersIcon, ZapIcon } from 'lucide-react';
import { PlayerlistSidebar } from "./PlayerlistSidebar/PlayerlistSidebar";
import { useAdminPerms } from "@/hooks/auth";
import { LogoFullSquareGreen } from "@/components/Logos";


export function GlobalMenuSheet() {
    const { isSheetOpen, setIsSheetOpen } = useGlobalMenuSheet();
    const { hasPerm } = useAdminPerms();

    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent
                side='left'
                className="p-0 flex flex-col gap-0 w-full xs:w-3/4 select-none"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <ScrollArea className="h-full px-6 [&_svg]:shrink-0">
                    <SheetHeader>
                        <SheetTitle className="py-6">
                            <NavLink href="/">
                                <LogoFullSquareGreen className="h-9 hover:scale-105 hover:brightness-110" />
                            </NavLink>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="mb-4">
                        <h2 className="mb-1.5 text-lg font-semibold tracking-tight">
                            全局菜单
                        </h2>
                        <div className="flex flex-wrap flex-row xs:grid grid-cols-2 gap-4">
                            <MenuNavLink href="/players">
                                <UsersIcon className="mr-2 h-4 w-4" />玩家
                            </MenuNavLink>
                            <MenuNavLink href="/history">
                                <ScrollIcon className="mr-2 h-4 w-4" />历史记录
                            </MenuNavLink>
                            <MenuNavLink href="/insights/player-drops">
                                <DoorOpenIcon className="mr-2 h-4 w-4" />玩家掉线
                            </MenuNavLink>
                            <MenuNavLink href="/allowlist">
                                <ClipboardCheckIcon className="mr-2 h-4 w-4" />白名单
                            </MenuNavLink>
                            <MenuNavLink href="/admins" disabled={!hasPerm('manage.admins')}>
                                <UserSquare2Icon className="mr-2 h-4 w-4" />管理员
                            </MenuNavLink>
                            <MenuNavLink href="/settings" disabled={!hasPerm('settings.view')}>
                                <SettingsIcon className="mr-2 h-4 w-4" />设置
                            </MenuNavLink>
                        </div>
                    </div>
                    <div className="mb-4">
                        <h2 className="mb-1.5 text-lg font-semibold tracking-tight">
                            系统菜单
                        </h2>
                        <div className="flex flex-wrap flex-row xs:grid grid-cols-2 gap-4">
                            <MenuNavLink href="/system/master-actions">
                                <ZapIcon className="mr-2 h-4 w-4" />主控操作
                            </MenuNavLink>
                            <MenuNavLink href="/system/diagnostics">
                                <PieChartIcon className="mr-2 h-4 w-4" />诊断
                            </MenuNavLink>
                            <MenuNavLink href="/system/console-log" disabled={!hasPerm('txadmin.log.view')}>
                                <ListIcon className="mr-2 h-4 w-4" />控制台日志
                            </MenuNavLink>
                            <MenuNavLink href="/system/action-log" disabled={!hasPerm('txadmin.log.view')}>
                                <ListIcon className="mr-2 h-4 w-4" />操作日志
                            </MenuNavLink>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

export function ServerSidebarSheet() {
    const { isSheetOpen, setIsSheetOpen } = useServerSheet();
    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent
                side='left'
                className="w-full xs:w-3/4 p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <ScrollArea className="h-full">
                    <ServerSidebar isSheet />
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

export function PlayersSidebarSheet() {
    const { isSheetOpen, setIsSheetOpen } = usePlayerlistSheet();
    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent
                side='right'
                className="w-full xs:w-3/4 p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <ScrollArea className="h-full">
                    <PlayerlistSidebar isSheet />
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

export default function MainSheets() {
    return <>
        <GlobalMenuSheet />
        <ServerSidebarSheet />
        <PlayersSidebarSheet />
    </>;
}
