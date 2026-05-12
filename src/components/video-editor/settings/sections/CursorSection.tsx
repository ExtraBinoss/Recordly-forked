import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { CursorStyle } from "../../types";
import { DEFAULT_CURSOR_CLICK_BOUNCE, DEFAULT_CURSOR_CLICK_BOUNCE_DURATION, DEFAULT_CURSOR_MOTION_BLUR, DEFAULT_CURSOR_SIZE, DEFAULT_CURSOR_SWAY } from "../../types";
import { SliderControl } from "../../SliderControl";
import { fromCursorSwaySliderValue, toCursorSwaySliderValue } from "../../videoPlayback/cursorSway";

export function CursorSection(props: any) {
	const { tSettings, t, resetCursorSection, showCursor, onShowCursorChange, loopCursor, onLoopCursorChange, cursorStyle, onCursorStyleChange, cursorStyleOptions, cursorPreviewUrls, CursorStylePreview, cursorSize, onCursorSizeChange, cursorMotionBlur, onCursorMotionBlurChange, cursorClickBounce, onCursorClickBounceChange, cursorClickBounceDuration, onCursorClickBounceDurationChange, cursorSway, onCursorSwayChange, showDevMotionControls, renderExtensionPanels } = props;
	return (
		<section className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{tSettings("sections.cursor", "Cursor")}</p>
					<button type="button" onClick={resetCursorSection} className="text-[10px] text-[#2563EB] transition-opacity hover:opacity-80">{t("common.actions.reset", "Reset")}</button>
				</div>
				<div className="flex items-center gap-3">
					<label className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span>{tSettings("effects.showCursor")}</span><Switch checked={showCursor} onCheckedChange={onShowCursorChange} className="data-[state=checked]:bg-[#2563EB] scale-75" /></label>
					<label className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span>{tSettings("effects.loopCursor")}</span><Switch checked={loopCursor} onCheckedChange={onLoopCursorChange} className="data-[state=checked]:bg-[#2563EB] scale-75" /></label>
				</div>
			</div>
			<div className="flex flex-col gap-1.5">
				<ToggleGroup type="single" value={cursorStyle} onValueChange={(value) => value && onCursorStyleChange?.(value as CursorStyle)} className="grid grid-cols-4 gap-2" aria-label={tSettings("effects.cursorStyle", "Cursor Style")}>{cursorStyleOptions.map((option: any) => <ToggleGroupItem key={option.value} value={option.value} title={option.label} aria-label={option.label} className={cn("group aspect-square h-auto min-w-0 rounded-[10px] border border-foreground/10 bg-foreground/[0.03] p-3 text-left text-foreground shadow-none transition-all hover:border-foreground/20 hover:bg-foreground/[0.06]", "data-[state=on]:border-[#2563EB]/70 data-[state=on]:bg-[#2563EB]/12 data-[state=on]:text-foreground")}><div className="flex h-full flex-col items-center justify-between gap-3"><div className="flex min-h-0 flex-1 items-center justify-center rounded-lg px-2 py-1.5"><CursorStylePreview style={option.value} previewUrls={cursorPreviewUrls} /></div></div></ToggleGroupItem>)}</ToggleGroup>
				<SliderControl label={tSettings("effects.cursorSize")} value={cursorSize} defaultValue={DEFAULT_CURSOR_SIZE} min={0.5} max={10} step={0.05} onChange={(v) => onCursorSizeChange?.(v)} formatValue={(v) => `${v.toFixed(2)}×`} parseInput={(text) => parseFloat(text.replace(/×$/, ""))} />
				<SliderControl label={tSettings("effects.cursorMotionBlur")} value={cursorMotionBlur} defaultValue={DEFAULT_CURSOR_MOTION_BLUR} min={0} max={2} step={0.05} onChange={(v) => onCursorMotionBlurChange?.(v)} formatValue={(v) => `${v.toFixed(2)}×`} parseInput={(text) => parseFloat(text.replace(/×$/, ""))} />
				<SliderControl label={tSettings("effects.cursorClickBounce")} value={cursorClickBounce} defaultValue={DEFAULT_CURSOR_CLICK_BOUNCE} min={0} max={5} step={0.05} onChange={(v) => onCursorClickBounceChange?.(v)} formatValue={(v) => `${v.toFixed(2)}×`} parseInput={(text) => parseFloat(text.replace(/×$/, ""))} />
				<SliderControl label={tSettings("effects.cursorClickBounceDuration", "Bounce Speed")} value={cursorClickBounceDuration} defaultValue={DEFAULT_CURSOR_CLICK_BOUNCE_DURATION} min={60} max={500} step={5} onChange={(v) => onCursorClickBounceDurationChange?.(v)} formatValue={(v) => `${Math.round(v)} ms`} parseInput={(text) => parseFloat(text.replace(/ms$/i, "").trim())} />
				<SliderControl label={tSettings("effects.cursorSway")} value={toCursorSwaySliderValue(cursorSway)} defaultValue={toCursorSwaySliderValue(DEFAULT_CURSOR_SWAY)} min={0} max={toCursorSwaySliderValue(2)} step={toCursorSwaySliderValue(0.05)} onChange={(v) => onCursorSwayChange?.(fromCursorSwaySliderValue(v))} formatValue={(v) => v <= 0 ? tSettings("effects.off") : `${v.toFixed(2)}×`} parseInput={(text) => { const normalized = text.trim().toLowerCase(); if (normalized === "off") return 0; return parseFloat(text.replace(/×$/, "")); }} />
				{showDevMotionControls ? <div className="rounded-lg border border-foreground/10 bg-foreground/[0.03] px-3 py-2"><div className="text-[10px] text-muted-foreground">{tSettings("effects.cursorDebugMovedToDev", "Cursor spring tuning is available in Settings > Dev.")}</div></div> : null}
			</div>
			{renderExtensionPanels?.()}
		</section>
	);
}
