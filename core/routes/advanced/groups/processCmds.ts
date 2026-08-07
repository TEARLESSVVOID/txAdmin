import v8 from 'node:v8';
import type { AdvancedCommandHandler } from "../runCommand";
import { parseFiniteIntString } from "@lib/misc";
import bytes from "bytes";

const printProcessEnv: AdvancedCommandHandler = (ctx, args) => {
    return {
        type: 'json',
        data: JSON.stringify(process.env, null, 2),
    }
}


const printProcessMemoryUsage: AdvancedCommandHandler = (ctx, args) => {
    let outLines: string[] = [];
    for (const [key, value] of Object.entries(process.memoryUsage())) {
        outLines.push(`- ${key}: ${bytes(value)!}`);
    }
    return {
        type: 'md',
        data: [
            '## 进程内存：',
            ...outLines,
        ].join('\n'),
    }
}


const freezeProcess: AdvancedCommandHandler = (ctx, args) => {
    const secs = parseFiniteIntString(args) ?? 50;
    if (secs < 1) {
        return {
            type: 'md',
            data: `无效的参数：${args}`,
        }
    }

    //Scheduling the freeze after the response is sent to the client
    setTimeout(() => {
        console.warn(`Admin ${ctx.admin.name} requested freezing process for ${secs} seconds.`);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, secs * 1000);
    }, 250); //grace period
    return {
        type: 'md',
        data: `正在冻结进程 ${secs} 秒...`,
    }
}


const saveHeapSnapshot: AdvancedCommandHandler = (ctx, args) => {
    setTimeout(() => {
        const snapFile = v8.writeHeapSnapshot();
        console.warn(`Heap snapshot written to: ${snapFile}`);
    }, 250); //grace period
    return {
        type: 'md',
        data: `正在保存堆快照，请查看终端以了解更多详情。\n这可能需要一段时间，并且有很大几率导致服务器崩溃。`,
    }
}


export default {
    printProcessEnv,
    printProcessMemoryUsage,
    freezeProcess,
    saveHeapSnapshot,
}
