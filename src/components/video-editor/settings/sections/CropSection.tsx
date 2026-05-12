import { SliderControl } from "../../SliderControl";

export function CropSection({
	tSettings,
	t,
	isCropped,
	resetCropSection,
	cropTop,
	cropBottom,
	cropLeft,
	cropRight,
	setCropInset,
}: {
	tSettings: (key: string, fallback?: string) => string;
	t: (key: string, fallback?: string) => string;
	isCropped: boolean;
	resetCropSection: () => void;
	cropTop: number;
	cropBottom: number;
	cropLeft: number;
	cropRight: number;
	setCropInset: (side: "top" | "bottom" | "left" | "right", pct: number) => void;
}) {
	return (
		<section className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
					{tSettings("sections.crop", "Crop")}
				</p>
				{isCropped ? (
					<button
						type="button"
						onClick={resetCropSection}
						className="text-[10px] text-[#2563EB] transition-opacity hover:opacity-80"
					>
						{t("common.actions.reset", "Reset")}
					</button>
				) : null}
			</div>
			<div className="flex flex-col gap-1.5">
				<SliderControl label={tSettings("crop.top", "Top")} value={cropTop} defaultValue={0} min={0} max={50} step={1} onChange={(v) => setCropInset("top", v)} formatValue={(v) => `${Math.round(v)}%`} parseInput={(text) => parseFloat(text.replace(/%$/, ""))} />
				<SliderControl label={tSettings("crop.bottom", "Bottom")} value={cropBottom} defaultValue={0} min={0} max={50} step={1} onChange={(v) => setCropInset("bottom", v)} formatValue={(v) => `${Math.round(v)}%`} parseInput={(text) => parseFloat(text.replace(/%$/, ""))} />
				<SliderControl label={tSettings("crop.left", "Left")} value={cropLeft} defaultValue={0} min={0} max={50} step={1} onChange={(v) => setCropInset("left", v)} formatValue={(v) => `${Math.round(v)}%`} parseInput={(text) => parseFloat(text.replace(/%$/, ""))} />
				<SliderControl label={tSettings("crop.right", "Right")} value={cropRight} defaultValue={0} min={0} max={50} step={1} onChange={(v) => setCropInset("right", v)} formatValue={(v) => `${Math.round(v)}%`} parseInput={(text) => parseFloat(text.replace(/%$/, ""))} />
			</div>
		</section>
	);
}
