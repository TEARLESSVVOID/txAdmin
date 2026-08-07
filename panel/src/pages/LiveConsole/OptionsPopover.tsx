import { PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollbackSizes } from "./xtermOptions";
import type { TerminalOptions, ScrollbackSize, DensityMode, TimestampMode } from "./xtermOptions";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export type LiveConsoleOptionsPopoverProps = {
    options: TerminalOptions;
    setOptions: (options: Partial<TerminalOptions>) => void;
    setHasPendingRefresh: (hasPendingRefresh: boolean) => void;
}

export default function LiveConsoleOptionsPopover({
    options,
    setOptions,
    setHasPendingRefresh,
}: LiveConsoleOptionsPopoverProps) {
    return (
        <PopoverContent className="w-96">
            <div className="grid gap-6">
                {/* Header */}
                <div className="space-y-1.5">
                    <h4 className="font-medium leading-none">实时控制台设置</h4>
                    <p className="text-sm text-muted-foreground">
                        自定义实时控制台的外观与行为。这些设置将被保存。
                    </p>
                </div>

                {/* Display Settings */}
                <div className="space-y-4">
                    <h5 className="text-sm font-medium leading-none">显示选项</h5>
                    <div className="grid gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="density" className="col-span-1">字体大小</Label>
                            <div className="col-span-3">
                                <Select
                                    value={options.density}
                                    onValueChange={(value) => setOptions({ density: value as DensityMode })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择密度" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SPACIOUS">大</SelectItem>
                                        <SelectItem value="COMFORTABLE">中</SelectItem>
                                        <SelectItem value="COMPACT">小</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="timestamp" className="col-span-1">时间戳</Label>
                                <div className="col-span-3">
                                    <Select
                                        value={options.timestamp}
                                        onValueChange={(value) => {
                                            setHasPendingRefresh(true);
                                            setOptions({ timestamp: value as TimestampMode });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择时间戳模式" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DEFAULT">系统默认</SelectItem>
                                            <SelectItem value="FORCE12H">强制 12 小时制</SelectItem>
                                            <SelectItem value="FORCE24H">强制 24 小时制</SelectItem>
                                            <SelectItem value="DISABLED">禁用</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="scrollback" className="col-span-1">回滚行数</Label>
                            <div className="col-span-3">
                                <Select
                                    value={options.scrollback.toString()}
                                    onValueChange={(value) => setOptions({ scrollback: Number(value) as ScrollbackSize })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择大小" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ScrollbackSizes.LARGE.toString()}>1 万行</SelectItem>
                                        <SelectItem value={ScrollbackSizes.MEDIUM.toString()}>5 千行（默认）</SelectItem>
                                        <SelectItem value={ScrollbackSizes.SMALL.toString()}>2.5 千行</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="my-1" />

                {/* Copy Settings */}
                <div className="space-y-4">
                    <h5 className="text-sm font-medium leading-none">复制选项</h5>
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="copyTimestamp">包含时间戳</Label>
                            <Switch
                                id="copyTimestamp"
                                checked={options.copyTimestamp}
                                onCheckedChange={(checked) => setOptions({ copyTimestamp: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="copyChannel">包含频道</Label>
                            <Switch
                                id="copyChannel"
                                checked={options.copyChannel}
                                onCheckedChange={(checked) => setOptions({ copyChannel: checked })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </PopoverContent>
    )
}
