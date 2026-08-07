import { getPublicIp } from "@core/boot/startReadyWatcher";
import type { AdvancedCommandHandler } from "../runCommand";
import probeInternetTime, { type ProbeSuccess } from "@lib/host/probeInternetTime";
import { mdCodeBlock } from "@lib/misc";


const printPublicIp: AdvancedCommandHandler = async (ctx, args) => {
    const ip = await getPublicIp() || '未找到';
    return {
        type: 'md',
        data: `公网 IP：${ip}`,
    }
}


//MARK: Clock info
const GETTIMEAPI_HOST = 'gettimeapi.dev';
const DRIFT_THRESHOLD_MS = 5_000;

const formatUtcOffset = (minutes: number) => {
    const sign = minutes >= 0 ? '+' : '-';
    const abs = Math.abs(minutes);
    const h = Math.floor(abs / 60).toString().padStart(2, '0');
    const m = (abs % 60).toString().padStart(2, '0');
    return `${sign}${h}:${m}`;
};

//NOTE: resolves what UTC offset (in minutes) the given IANA timezone should currently have
//according to ICU (Intl). Returns null if ICU can't resolve it.
const resolveIntlOffsetMinutes = (timeZone: string): number | null => {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'longOffset',
        }).formatToParts(new Date());
        const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value;
        if (!tzPart) return null;
        if (tzPart === 'GMT' || tzPart === 'UTC') return 0;
        const m = tzPart.match(/^(?:GMT|UTC)([+-])(\d{1,2})(?::(\d{2}))?$/);
        if (!m) return null;
        const sign = m[1] === '+' ? 1 : -1;
        return sign * (parseInt(m[2]) * 60 + parseInt(m[3] ?? '0'));
    } catch {
        return null;
    }
};

const printClockInfo: AdvancedCommandHandler = async (ctx, args) => {
    const probeResult = await probeInternetTime();
    const { date, avgOffsetMs, avgRttMs, results } = probeResult;

    //Local values (as resolved by the Node.js runtime / OS)
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'n/a';
    //NOTE: getTimezoneOffset() is inverted vs ISO 8601 (BRT is -03:00 but returns 180)
    const localUtcOffsetMin = -new Date().getTimezoneOffset();
    const localUtcOffset = formatUtcOffset(localUtcOffsetMin);
    const localTime = new Date().toLocaleString();

    //ICU/V8 self-consistency: does Date#getTimezoneOffset agree with what Intl says
    //localTimezone should be right now? A mismatch means the restart scheduler (which uses
    //Date#setHours) will fire at a different wall-clock time than the UI suggests.
    const intlExpectedOffsetMin = resolveIntlOffsetMinutes(localTimezone);
    const intlExpectedOffset = intlExpectedOffsetMin !== null
        ? formatUtcOffset(intlExpectedOffsetMin)
        : '无法解析';
    const icuV8Ok = intlExpectedOffsetMin !== null && intlExpectedOffsetMin === localUtcOffsetMin;

    //Internet values (as resolved by gettimeapi.dev for the local timezone)
    const gettimeapiProbe = results.find(
        (r) => r.success && r.url.includes(GETTIMEAPI_HOST),
    ) as ProbeSuccess | undefined;
    const internetTimezone = gettimeapiProbe?.timezone?.timezone ?? '无法解析';
    const internetUtcOffset = gettimeapiProbe?.timezone?.offset ?? '无法解析';
    const internetTime = date ? new Date(date).toLocaleString() : '无法解析';

    //Sanity check flags
    const tzOk = internetTimezone !== 'not resolved' && internetTimezone === localTimezone;
    const offsetOk = internetUtcOffset !== 'not resolved' && internetUtcOffset === localUtcOffset;
    const driftOk = avgOffsetMs !== null && Math.abs(avgOffsetMs) <= DRIFT_THRESHOLD_MS;
    const mark = (ok: boolean) => (ok ? '✔' : '❌');

    const driftStr = avgOffsetMs !== null ? `${avgOffsetMs}ms` : '未找到';
    const rttStr = avgRttMs !== null ? `${avgRttMs}ms` : '未找到';

    return {
        type: 'md',
        data: [
            '## 时钟信息：',
            '',
            '| 指标 | 本地 | 互联网 | 状态 |',
            '| --- | --- | --- | :---: |',
            `| 时区 | \`${localTimezone}\` | \`${internetTimezone}\` | ${mark(tzOk)} |`,
            `| UTC 偏移 | \`${localUtcOffset}\` | \`${internetUtcOffset}\` | ${mark(offsetOk)} |`,
            `| 时间 | ${localTime} | ${internetTime} | ${mark(driftOk)} |`,
            '',
            `- ICU/V8 时区自检：${mark(icuV8Ok)} _（\`Date\` 偏移为 \`${localUtcOffset}\`，\`${localTimezone}\` 应为 \`${intlExpectedOffset}\`）_`,
            `- 时钟漂移：${driftStr} _（阈值：±${DRIFT_THRESHOLD_MS}ms）_`,
            `- 网络 RTT：${rttStr}`,
            '',
            '_本地值由 Node.js 运行时/操作系统解析。互联网值来自 `gettimeapi.dev`（时区）以及所有探测的平均值（时间/漂移）。_',
            '## 原始探测数据：',
            ...results.map(r => {
                const j = JSON.stringify({ ...r, url: undefined, success: undefined }, null, 2)
                return [
                    `### ${r.url}`,
                    mdCodeBlock(j, 'json'),
                ].join('\n');
            }),
        ].join('\n'),
    }
}


export default {
    printPublicIp,
    printClockInfo,
}
