import { MenuNavLink } from '@/components/MainPageLink';
import TxAnchor from '@/components/TxAnchor';
import { useAdminPerms } from '@/hooks/auth';
import { serverNameAtom, txConfigStateAtom } from '@/hooks/status';
import { cn } from '@/lib/utils';
import { TxConfigState } from '@shared/enums';
import { GlobalStatusType } from '@shared/socketioTypes';
import { useAtomValue } from 'jotai';
import { BoxIcon, ChevronRightSquareIcon, DnaIcon, EyeIcon, FileEditIcon, HourglassIcon, LayoutDashboardIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';


//Separate component to prevent re-render of the entire menu
function ServerName() {
    return useAtomValue(serverNameAtom);
}

type PendingServerConfigureProps = {
    txConfigState?: Exclude<TxConfigState, TxConfigState.Ready>;
}

function PendingServerConfigure({ txConfigState }: PendingServerConfigureProps) {
    const [currLocation] = useLocation();
    const [linkHref, setLinkHref] = useState('');
    const linkText = useRef('');

    //This effect is done to prevent the link from popping up in the delay between ui change 
    // and the pendingStep state atom being updated from the socket.io event
    useEffect(() => {
        let newHref = '';
        if (txConfigState === TxConfigState.Setup && !currLocation.startsWith('/server/setup')) {
            newHref = '/server/setup';
            linkText.current = '前往设置页面！';
        } else if (txConfigState === TxConfigState.Deployer && !currLocation.startsWith('/server/deployer')) {
            newHref = '/server/deployer';
            linkText.current = '前往部署页面！';
        } else {
            newHref = '';
        }

        if (!newHref) {
            setLinkHref('');
            return;
        } else {
            const timeout = setTimeout(() => {
                setLinkHref(newHref);
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [currLocation, txConfigState]);

    return (
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-4'>
            <HourglassIcon className='h-12 w-12 opacity-75 animate-pulse' />
            <p className='text-center text-lg tracking-wider font-light opacity-75'>
                您需要先配置服务器才能启动它。
            </p>
            {linkHref ? (
                <TxAnchor href={linkHref} className='animate-toastbar-enter'>
                    {linkText.current}
                </TxAnchor>
            ) : (
                <TxAnchor href='#' className='animate-toastbar-leave pointer-events-none'>
                    {linkText.current || <>&nbsp;</>}
                </TxAnchor>
            )}
        </div>
    )
}

export default function ServerMenu() {
    const txConfigState = useAtomValue(txConfigStateAtom);
    const { hasPerm } = useAdminPerms();

    const isConfigPending = txConfigState !== TxConfigState.Ready;
    return <div className='relative'>
        {isConfigPending && <PendingServerConfigure txConfigState={txConfigState} />}
        <div className={cn(isConfigPending && 'opacity-0 pointer-events-none')}>
            <h2 className="mb-1.5 text-lg font-semibold tracking-tight line-clamp-1">
                <ServerName />
            </h2>
            <div className="space-y-1 select-none">
                <MenuNavLink href="/">
                    <LayoutDashboardIcon className="mr-2 h-4 w-4" />仪表盘
                </MenuNavLink>
                <MenuNavLink href="/server/console" disabled={!hasPerm('console.view')}>
                    <ChevronRightSquareIcon className="mr-2 h-4 w-4" />实时控制台
                </MenuNavLink>
                <MenuNavLink href="/server/resources">
                    <BoxIcon className="mr-2 h-4 w-4" />资源
                </MenuNavLink>
                <MenuNavLink href="/server/server-log" disabled={!hasPerm('server.log.view')}>
                    <EyeIcon className="mr-2 h-4 w-4" />服务器日志
                </MenuNavLink>
                <MenuNavLink href="/server/cfg-editor" disabled={!hasPerm('server.cfg.editor')}>
                    <FileEditIcon className="mr-2 h-4 w-4" />CFG 编辑器
                </MenuNavLink>
                {window.txConsts.showAdvanced && (
                    <MenuNavLink href="/advanced" className='text-accent' disabled={!hasPerm('all_permisisons')}>
                        <DnaIcon className="mr-2 h-4 w-4" />高级
                    </MenuNavLink>
                )}
                {import.meta.env.DEV && (
                    <MenuNavLink href="/test" className='text-accent'>
                        <DnaIcon className="mr-2 h-4 w-4" />测试
                    </MenuNavLink>
                )}
            </div>
        </div>
    </div>
}
