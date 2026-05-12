import minimalCursorUrl from "@/assets/cursors/custom/minimal-cursor.svg";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { EditorPreferences } from "../../editorPreferences";
import { SliderControl } from "../../SliderControl";
import type { CursorStyle } from "../../types";
import {
	DEFAULT_CURSOR_CLICK_BOUNCE,
	DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
	DEFAULT_CURSOR_MOTION_BLUR,
	DEFAULT_CURSOR_SIZE,
	DEFAULT_CURSOR_SWAY,
} from "../../types";
import { fromCursorSwaySliderValue, toCursorSwaySliderValue } from "../../videoPlayback/cursorSway";
import {
	cursorSetAssets,
	getCursorStyleSizeMultiplier,
} from "../../videoPlayback/uploadedCursorAssets";
import {
	BUILTIN_CURSOR_PREVIEW_FRAME_SIZE,
	BUILTIN_CURSOR_PREVIEW_SIZE,
	type CursorStyleOption,
} from "../constants";
import { SettingsExtensionPanels, type SettingsPanelExtension } from "./ExtensionSettingsSection";

const tahoeCursorUrl = cursorSetAssets.tahoe.arrow.url;

function CursorStylePreview({
	style,
	previewUrls,
}: {
	style: CursorStyle;
	previewUrls: Partial<Record<string, string>>;
}) {
	const previewSrc =
		style === "macos"
			? (previewUrls.macos ?? tahoeCursorUrl)
			: style === "tahoe"
				? (previewUrls.tahoe ?? tahoeCursorUrl)
				: style === "figma"
					? (previewUrls.figma ?? minimalCursorUrl)
					: style === "tahoe-inverted"
						? (previewUrls["tahoe-inverted"] ?? tahoeCursorUrl)
						: previewUrls[style];

	if (style === "macos" || style === "tahoe" || style === "tahoe-inverted") {
		const previewSize = BUILTIN_CURSOR_PREVIEW_SIZE * getCursorStyleSizeMultiplier(style);
		return (
			<div
				className="flex items-center justify-center"
				style={{
					width: `${BUILTIN_CURSOR_PREVIEW_FRAME_SIZE}px`,
					height: `${BUILTIN_CURSOR_PREVIEW_FRAME_SIZE}px`,
				}}
			>
				<img
					src={previewSrc ?? tahoeCursorUrl}
					alt=""
					className="max-w-none object-contain drop-shadow-[0_8px_12px_rgba(15,23,42,0.18)]"
					draggable={false}
					style={{ width: `${previewSize}px`, height: `${previewSize}px` }}
				/>
			</div>
		);
	}

	if (style === "figma") {
		return <img src={previewSrc} alt="" className="h-7 w-7 object-contain" draggable={false} />;
	}

	if (style === "dot") {
		return (
			<span className="h-[14px] w-[14px] rounded-full border-[2.5px] border-neutral-800 bg-white shadow-[0_8px_12px_rgba(15,23,42,0.16)]" />
		);
	}

	return (
		<img
			src={previewSrc ?? tahoeCursorUrl}
			alt=""
			className="h-7 w-7 object-contain"
			draggable={false}
		/>
	);
}

export function CursorSection({
	tSettings,
	t,
	showCursor,
	onShowCursorChange,
	loopCursor,
	onLoopCursorChange,
	cursorStyle,
	onCursorStyleChange,
	cursorStyleOptions,
	cursorPreviewUrls,
	cursorSize,
	onCursorSizeChange,
	onCursorSmoothingChange,
	onCursorSpringStiffnessMultiplierChange,
	onCursorSpringDampingMultiplierChange,
	onCursorSpringMassMultiplierChange,
	cursorMotionBlur,
	onCursorMotionBlurChange,
	cursorClickBounce,
	onCursorClickBounceChange,
	cursorClickBounceDuration,
	onCursorClickBounceDurationChange,
	cursorSway,
	onCursorSwayChange,
	showDevMotionControls,
	initialEditorPreferences,
	extensionPanels,
}: {
	tSettings: (key: string, fallback?: string) => string;
	t: (key: string, fallback?: string) => string;
	showCursor: boolean;
	onShowCursorChange?: (enabled: boolean) => void;
	loopCursor: boolean;
	onLoopCursorChange?: (enabled: boolean) => void;
	cursorStyle: CursorStyle;
	onCursorStyleChange?: (style: CursorStyle) => void;
	cursorStyleOptions: CursorStyleOption[];
	cursorPreviewUrls: Partial<Record<string, string>>;
	cursorSize: number;
	onCursorSizeChange?: (size: number) => void;
	onCursorSmoothingChange?: (smoothing: number) => void;
	onCursorSpringStiffnessMultiplierChange?: (multiplier: number) => void;
	onCursorSpringDampingMultiplierChange?: (multiplier: number) => void;
	onCursorSpringMassMultiplierChange?: (multiplier: number) => void;
	cursorMotionBlur: number;
	onCursorMotionBlurChange?: (amount: number) => void;
	cursorClickBounce: number;
	onCursorClickBounceChange?: (amount: number) => void;
	cursorClickBounceDuration: number;
	onCursorClickBounceDurationChange?: (duration: number) => void;
	cursorSway: number;
	onCursorSwayChange?: (amount: number) => void;
	showDevMotionControls: boolean;
	initialEditorPreferences: EditorPreferences;
	extensionPanels: SettingsPanelExtension[];
}) {
	const resetCursorSection = () => {
		onShowCursorChange?.(initialEditorPreferences.showCursor);
		onLoopCursorChange?.(initialEditorPreferences.loopCursor);
		onCursorStyleChange?.(initialEditorPreferences.cursorStyle);
		onCursorSizeChange?.(initialEditorPreferences.cursorSize);
		onCursorSmoothingChange?.(initialEditorPreferences.cursorSmoothing);
		onCursorSpringStiffnessMultiplierChange?.(
			initialEditorPreferences.cursorSpringStiffnessMultiplier,
		);
		onCursorSpringDampingMultiplierChange?.(
			initialEditorPreferences.cursorSpringDampingMultiplier,
		);
		onCursorSpringMassMultiplierChange?.(initialEditorPreferences.cursorSpringMassMultiplier);
		onCursorMotionBlurChange?.(initialEditorPreferences.cursorMotionBlur);
		onCursorClickBounceChange?.(initialEditorPreferences.cursorClickBounce);
		onCursorClickBounceDurationChange?.(DEFAULT_CURSOR_CLICK_BOUNCE_DURATION);
		onCursorSwayChange?.(initialEditorPreferences.cursorSway);
	};

	return (
		<section className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
						{tSettings("sections.cursor", "Cursor")}
					</p>
					<button
						type="button"
						onClick={resetCursorSection}
						className="text-[10px] text-[#2563EB] transition-opacity hover:opacity-80"
					>
						{t("common.actions.reset", "Reset")}
					</button>
				</div>
				<div className="flex items-center gap-3">
					<label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
						<span>{tSettings("effects.showCursor")}</span>
						<Switch
							checked={showCursor}
							onCheckedChange={onShowCursorChange}
							className="data-[state=checked]:bg-[#2563EB] scale-75"
						/>
					</label>
					<label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
						<span>{tSettings("effects.loopCursor")}</span>
						<Switch
							checked={loopCursor}
							onCheckedChange={onLoopCursorChange}
							className="data-[state=checked]:bg-[#2563EB] scale-75"
						/>
					</label>
				</div>
			</div>
			<div className="flex flex-col gap-1.5">
				<ToggleGroup
					type="single"
					value={cursorStyle}
					onValueChange={(value) => value && onCursorStyleChange?.(value as CursorStyle)}
					className="grid grid-cols-4 gap-2"
					aria-label={tSettings("effects.cursorStyle", "Cursor Style")}
				>
					{cursorStyleOptions.map((option) => (
						<ToggleGroupItem
							key={option.value}
							value={option.value}
							title={option.label}
							aria-label={option.label}
							className={cn(
								"group aspect-square h-auto min-w-0 rounded-[10px] border border-foreground/10 bg-foreground/[0.03] p-3 text-left text-foreground shadow-none transition-all hover:border-foreground/20 hover:bg-foreground/[0.06]",
								"data-[state=on]:border-[#2563EB]/70 data-[state=on]:bg-[#2563EB]/12 data-[state=on]:text-foreground",
							)}
						>
							<div className="flex h-full flex-col items-center justify-between gap-3">
								<div className="flex min-h-0 flex-1 items-center justify-center rounded-lg px-2 py-1.5">
									<CursorStylePreview
										style={option.value}
										previewUrls={cursorPreviewUrls}
									/>
								</div>
							</div>
						</ToggleGroupItem>
					))}
				</ToggleGroup>
				<SliderControl
					label={tSettings("effects.cursorSize")}
					value={cursorSize}
					defaultValue={DEFAULT_CURSOR_SIZE}
					min={0.5}
					max={10}
					step={0.05}
					onChange={(v) => onCursorSizeChange?.(v)}
					formatValue={(v) => `${v.toFixed(2)}×`}
					parseInput={(text) => parseFloat(text.replace(/×$/, ""))}
				/>
				<SliderControl
					label={tSettings("effects.cursorMotionBlur")}
					value={cursorMotionBlur}
					defaultValue={DEFAULT_CURSOR_MOTION_BLUR}
					min={0}
					max={2}
					step={0.05}
					onChange={(v) => onCursorMotionBlurChange?.(v)}
					formatValue={(v) => `${v.toFixed(2)}×`}
					parseInput={(text) => parseFloat(text.replace(/×$/, ""))}
				/>
				<SliderControl
					label={tSettings("effects.cursorClickBounce")}
					value={cursorClickBounce}
					defaultValue={DEFAULT_CURSOR_CLICK_BOUNCE}
					min={0}
					max={5}
					step={0.05}
					onChange={(v) => onCursorClickBounceChange?.(v)}
					formatValue={(v) => `${v.toFixed(2)}×`}
					parseInput={(text) => parseFloat(text.replace(/×$/, ""))}
				/>
				<SliderControl
					label={tSettings("effects.cursorClickBounceDuration", "Bounce Speed")}
					value={cursorClickBounceDuration}
					defaultValue={DEFAULT_CURSOR_CLICK_BOUNCE_DURATION}
					min={60}
					max={500}
					step={5}
					onChange={(v) => onCursorClickBounceDurationChange?.(v)}
					formatValue={(v) => `${Math.round(v)} ms`}
					parseInput={(text) => parseFloat(text.replace(/ms$/i, "").trim())}
				/>
				<SliderControl
					label={tSettings("effects.cursorSway")}
					value={toCursorSwaySliderValue(cursorSway)}
					defaultValue={toCursorSwaySliderValue(DEFAULT_CURSOR_SWAY)}
					min={0}
					max={toCursorSwaySliderValue(2)}
					step={toCursorSwaySliderValue(0.05)}
					onChange={(v) => onCursorSwayChange?.(fromCursorSwaySliderValue(v))}
					formatValue={(v) => (v <= 0 ? tSettings("effects.off") : `${v.toFixed(2)}×`)}
					parseInput={(text) => {
						const normalized = text.trim().toLowerCase();
						if (normalized === "off") return 0;
						return parseFloat(text.replace(/×$/, ""));
					}}
				/>
				{showDevMotionControls ? (
					<div className="rounded-lg border border-foreground/10 bg-foreground/[0.03] px-3 py-2">
						<div className="text-[10px] text-muted-foreground">
							{tSettings(
								"effects.cursorDebugMovedToDev",
								"Cursor spring tuning is available in Settings > Dev.",
							)}
						</div>
					</div>
				) : null}
			</div>
			<SettingsExtensionPanels panels={extensionPanels} sections={["cursor"]} />
		</section>
	);
}
