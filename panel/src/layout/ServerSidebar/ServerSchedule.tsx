import InlineCode from '@/components/InlineCode';
import { txToast } from '@/components/TxToaster';
import { Button } from '@/components/ui/button';
import { useOpenPromptDialog } from '@/hooks/dialogs';
import { useCloseAllSheets } from '@/hooks/sheets';
import { useGlobalStatus } from '@/hooks/status';
import { useBackendApi } from '@/hooks/fetch';
import { cn } from '@/lib/utils';
import { msToDuration } from '@/lib/dateTime';
import { PenLineIcon, PlayCircleIcon, PlusCircleIcon, XCircleIcon } from 'lucide-react';
import { useAdminPerms } from '@/hooks/auth';

//Prompt props
const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const timezoneDiffMessage = (
    <p className='text-destructive'>
        服务器时区： <b>{window.txConsts.serverTimezone}</b> <br />
        您的时区： <b>{browserTimezone}</b> <br />
        请使用相对时间，或确保计划时间基于服务器时区。
    </p>
)
const promptCommonProps = {
    suggestions: ['+5', '+10', '+15', '+30'],
    title: '服务器应在何时重启？',
    message: (<>
        <p>
            支持的格式： <br />
            <ul className='list-disc ml-4'>
                <li>
                    <InlineCode>+MM</InlineCode> 相对时间（分钟）
                    （示例：<InlineCode>+15</InlineCode> 表示从现在起 15 分钟后。）
                </li>
                <li>
                    <InlineCode>HH:MM</InlineCode> 24 小时制的绝对时间
                    （示例：<InlineCode>23:30</InlineCode> 表示晚上 11:30。）
                </li>
            </ul>
        </p>
        {browserTimezone !== window.txConsts.serverTimezone && timezoneDiffMessage}
    </>),
    placeholder: '+15',
    required: true,
    isWide: true,
};

//Validate schedule time input for 24h format or relative time
const validateSchedule = (input: string) => {
    if (input.startsWith('+')) {
        const minutes = parseInt(input.substring(1));
        if (isNaN(minutes) || minutes < 1 || minutes >= 1440) {
            return false;
        }
    } else {
        const [hours, minutes] = input.split(':', 2).map(x => parseInt(x));
        if (
            typeof hours === 'undefined' || isNaN(hours) || hours < 0 || hours > 23
            || typeof minutes === 'undefined' || isNaN(minutes) || minutes < 0 || minutes > 59
        ) {
            return false;
        }
    }
    return true;
}


export default function ServerSchedule() {
    const closeAllSheets = useCloseAllSheets();
    const openPromptDialog = useOpenPromptDialog();
    const { hasPerm } = useAdminPerms();
    const schedulerApi = useBackendApi({
        method: 'POST',
        path: '/fxserver/schedule'
    });

    const globalStatus = useGlobalStatus();
    if (!globalStatus) {
        return <div>
            <h2 className="mb-1 text-lg font-semibold tracking-tight">
                下次重启：
            </h2>
            <span className='font-light text-muted-foreground italic'>加载中...</span>
        </div>
    }

    //Processing status
    const { scheduler } = globalStatus;
    let nextScheduledText = '未安排';
    let nextScheduledClasses = 'text-muted-foreground italic';
    let disableAddEditBtn = false;
    let showCancelBtn = false;
    let showEnableBtn = false;
    const hasScheduledRestart = typeof scheduler.nextRelativeMs === 'number';
    if (hasScheduledRestart) {
        const tempFlag = (scheduler.nextIsTemp) ? '（临时）' : '';
        const relativeTime = msToDuration(scheduler.nextRelativeMs, { units: ['h', 'm'] });
        const isLessThanMinute = scheduler.nextRelativeMs < 60_000;
        if (isLessThanMinute) {
            disableAddEditBtn = true;
            nextScheduledText = `即将执行 ${tempFlag}`;
        } else {
            nextScheduledText = `${relativeTime} 后 ${tempFlag}`;
        }

        if (scheduler.nextSkip) {
            nextScheduledClasses = 'text-muted-foreground line-through';
            if (!isLessThanMinute) {
                showEnableBtn = true;
            }
        } else {
            nextScheduledClasses = 'text-warning-inline';
            if (!isLessThanMinute) {
                showCancelBtn = true;
            }
        }
    }


    //Handlers
    const onScheduleSubmit = (input: string) => {
        closeAllSheets();
        if (input.includes(',')) {
            txToast.error({
                title: '计划重启时间无效。',
                msg: '您似乎试图安排多个重启时间，这只能在设置页面中完成。\n此输入仅用于安排下一次（非持久）重启。',
            }, { duration: 10000 });
            return;
        }
        if (!validateSchedule(input)) {
            txToast.error(`无效的计划时间：${input}`)
            return;
        }
        schedulerApi({
            data: { action: 'setNextTempSchedule', parameter: input },
            toastLoadingMessage: '正在安排服务器重启...',
        });
    }
    const handleEdit = () => {
        openPromptDialog({
            ...promptCommonProps,
            onSubmit: onScheduleSubmit,
            submitLabel: '编辑',
        });
    }
    const handleAddSchedule = () => {
        openPromptDialog({
            ...promptCommonProps,
            onSubmit: onScheduleSubmit,
            submitLabel: '安排',
        });
    }
    const handleCancel = () => {
        closeAllSheets();
        schedulerApi({
            data: { action: 'setNextSkip', parameter: true },
            toastLoadingMessage: '正在取消下一次服务器重启...',
        });
    }
    const handleEnable = () => {
        closeAllSheets();
        schedulerApi({
            data: { action: 'setNextSkip', parameter: false },
            toastLoadingMessage: '正在启用下一次服务器重启...',
        });
    }

    const hasSchedulePerms = hasPerm('control.server');

    return <div>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">
            下次重启：
        </h2>
        <span className={cn('font-light', nextScheduledClasses)}>{nextScheduledText}</span>
        <div className='flex flex-row justify-between gap-2 mt-2 flex-wrap'>
            {hasScheduledRestart ? (
                <Button
                    size='xs'
                    variant='ghost'
                    className='flex-grow bg-muted border shadow'
                    disabled={!hasSchedulePerms || disableAddEditBtn}
                    onClick={handleEdit}
                >
                    <PenLineIcon className='h-4 w-4 mr-1' /> 编辑
                </Button>
            ) : (
                <Button
                    size='xs'
                    variant='ghost'
                    className='flex-grow bg-muted border shadow'
                    disabled={!hasSchedulePerms || disableAddEditBtn}
                    onClick={handleAddSchedule}
                >
                    <PlusCircleIcon className='h-4 w-4 mr-1' /> 安排重启
                </Button>
            )}
            {showCancelBtn && (
                <Button
                    size='xs'
                    variant='ghost'
                    className='flex-grow bg-muted border shadow'
                    onClick={handleCancel}
                    disabled={!hasSchedulePerms}
                >
                    <XCircleIcon className='h-4 w-4 mr-1' /> 取消
                </Button>
            )}
            {showEnableBtn && (
                <Button
                    size='xs'
                    variant='ghost'
                    className='flex-grow bg-muted border'
                    onClick={handleEnable}
                    disabled={!hasSchedulePerms}
                >
                    <PlayCircleIcon className='h-4 w-4 mr-1' /> 启用
                </Button>
            )}
        </div>
    </div>
}
