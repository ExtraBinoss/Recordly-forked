import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SliderControl } from "../../SliderControl";
import type { Padding } from "../../types";

export function FrameSection({
	tSettings,
	t,
	resetFrameSection,
	shadowIntensity,
	borderRadius,
	initialShadowIntensity,
	initialBorderRadius,
	onShadowChange,
	onBorderRadiusChange,
	padding,
	togglePaddingLink,
	handlePaddingSideChange,
	removeBackgroundEnabled,
	handleRemoveBackgroundToggle,
	availableFrames,
	frame,
	onFrameChange,
}: {
	tSettings: (key: string, fallback?: string) => string;
	t: (key: string, fallback?: string) => string;
	resetFrameSection: () => void;
	shadowIntensity: number;
	borderRadius: number;
	initialShadowIntensity: number;
	initialBorderRadius: number;
	onShadowChange?: (v: number) => void;
	onBorderRadiusChange?: (v: number) => void;
	padding: Padding;
	togglePaddingLink: () => void;
	handlePaddingSideChange: (side: keyof Padding, value: number) => void;
	removeBackgroundEnabled: boolean;
	handleRemoveBackgroundToggle: (checked: boolean) => void;
	availableFrames: Array<{ id: string; label: string; thumbnailPath: string }>;
	frame?: string | null;
	onFrameChange?: (frameId: string | null) => void;
}) {
	return (
		<section className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{tSettings("sections.frame", "Frame")}</p>
				<button type="button" onClick={resetFrameSection} className="text-[10px] text-[#2563EB] transition-opacity hover:opacity-80">{t("common.actions.reset", "Reset")}</button>
			</div>
			<div className="flex flex-col gap-1.5">
				<SliderControl label={tSettings("effects.shadow")} value={shadowIntensity} defaultValue={initialShadowIntensity} min={0} max={1} step={0.01} onChange={(v) => onShadowChange?.(v)} formatValue={(v) => `${Math.round(v * 100)}%`} parseInput={(text) => parseFloat(text.replace(/%$/, "")) / 100} />
				<SliderControl label={tSettings("effects.radius", "Radius")} value={borderRadius} defaultValue={initialBorderRadius} min={0} max={200} step={0.5} onChange={(v) => onBorderRadiusChange?.(v)} formatValue={(v) => `${v}px`} parseInput={(text) => parseFloat(text.replace(/px$/, ""))} />
				<div className="flex flex-col gap-1.5 pt-0.5">
					<div className="flex items-center justify-between">
						<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{tSettings("effects.padding")}</p>
						<button type="button" onClick={togglePaddingLink} aria-pressed={padding.linked === false} className="text-[10px] text-[#2563EB] transition-opacity hover:opacity-80" title={padding.linked === false ? tSettings("effects.paddingAdvancedHide", "Hide advanced padding controls") : tSettings("effects.paddingAdvancedShow", "Show advanced padding controls")}>{tSettings("effects.paddingAdvanced", "Advanced")}</button>
					</div>
					{padding.linked !== false ? (
						<SliderControl label="" value={padding.top} defaultValue={8} min={0} max={100} step={1} onChange={(v) => handlePaddingSideChange("top", v)} formatValue={(v) => `${v}%`} parseInput={(text) => parseFloat(text.replace(/%$/, ""))} />
					) : (
						<div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
							<SliderControl label={tSettings("effects.paddingTop", "Top")} value={padding.top} defaultValue={8} min={0} max={100} step={1} onChange={(v) => handlePaddingSideChange("top", v)} formatValue={(v) => `${v}%`} parseInput={(text) => parseFloat(text.replace(/%$/, ""))} />
							<SliderControl label={tSettings("effects.paddingBottom", "Bottom")} value={padding.bottom} defaultValue={8} min={0} max={100} step={1} onChange={(v) => handlePaddingSideChange("bottom", v)} formatValue={(v) => `${v}%`} parseInput={(text) => parseFloat(text.replace(/%$/, ""))} />
							<SliderControl label={tSettings("effects.paddingLeft", "Left")} value={padding.left} defaultValue={8} min={0} max={100} step={1} onChange={(v) => handlePaddingSideChange("left", v)} formatValue={(v) => `${v}%`} parseInput={(text) => parseFloat(text.replace(/%$/, ""))} />
							<SliderControl label={tSettings("effects.paddingRight", "Right")} value={padding.right} defaultValue={8} min={0} max={100} step={1} onChange={(v) => handlePaddingSideChange("right", v)} formatValue={(v) => `${v}%`} parseInput={(text) => parseFloat(text.replace(/%$/, ""))} />
						</div>
					)}
				</div>
				<div className="flex items-center justify-between rounded-lg bg-foreground/[0.03] px-2.5 py-1.5"><span className="text-[10px] text-muted-foreground">{tSettings("effects.removeBackground")}</span><Switch checked={removeBackgroundEnabled} onCheckedChange={handleRemoveBackgroundToggle} className="data-[state=checked]:bg-[#2563EB] scale-75" /></div>
				{availableFrames.length > 0 && (
					<div className="flex flex-col gap-1.5 mt-1">
						<div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Frame</span>{frame && <button type="button" onClick={() => onFrameChange?.(null)} className="text-[9px] text-[#2563EB] hover:opacity-80">Remove</button>}</div>
						<div className="grid grid-cols-3 gap-1.5">{availableFrames.map((f) => { const isSelected = frame === f.id; return <button key={f.id} type="button" onClick={() => onFrameChange?.(isSelected ? null : f.id)} className={cn("flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all text-center", isSelected ? "border-[#2563EB]/50 bg-[#2563EB]/10 ring-1 ring-[#2563EB]/30" : "border-foreground/[0.06] bg-white/[0.02] hover:bg-foreground/[0.05]")}><div className="w-full aspect-video rounded bg-foreground/10 overflow-hidden flex items-center justify-center"><img src={f.thumbnailPath} alt={f.label} className="w-full h-full object-contain" draggable={false} /></div><span className="text-[8px] text-muted-foreground truncate w-full leading-tight">{f.label}</span></button>; })}</div>
					</div>
				)}
			</div>
		</section>
	);
}
