import { tsToLocaleDateString, tsToLocaleDateTimeString } from "@/lib/dateTime";
import { txToast } from "./TxToaster";

const clockSkewTolerance = 5 * 60; //5 minutes

type Props = {
    tsFetch: number;
    tsObject: number;
    serverTime: number;
    className?: string;
    isDateOnly?: boolean;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
};

export default function DateTimeCorrected({ tsFetch, tsObject, serverTime, className, isDateOnly, dateStyle, timeStyle }: Props) {
    const serverClockDrift = serverTime - tsFetch; //be positive if server is ahead
    const howFarInThePast = serverTime - tsObject;
    const localTime = tsFetch - howFarInThePast;

    const clockDriftBtnHandler = () => {
        txToast.warning(`这意味着服务器时钟比您的电脑时间${serverClockDrift > 0 ? '快' : '慢'} ${Math.abs(serverClockDrift)} 秒。请确保您的电脑和服务器时钟已同步。`);
    }
    const displayTime = isDateOnly
        ? tsToLocaleDateString(localTime, dateStyle ?? 'medium')
        : tsToLocaleDateTimeString(localTime, dateStyle ?? 'medium', timeStyle ?? 'short')
    return <span
        className={className}
        title={tsToLocaleDateTimeString(localTime, 'long', 'long')}
    >
        {displayTime}
        {Math.abs(serverClockDrift) > clockSkewTolerance && (
            <button
                className="ml-1 text-warning-inline"
                onClick={clockDriftBtnHandler}
            >（时钟偏差）</button>
        )}
    </span>
}
