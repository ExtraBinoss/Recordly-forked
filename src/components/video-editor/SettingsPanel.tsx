import {
	CursorClick,
	Palette,
	PresentationChart,
	Trash as Trash2,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { getRenderableVideoUrl } from "@/lib/assetPath";
import type { ExtensionSettingField } from "@/lib/extensions";
import { extensionHost } from "@/lib/extensions";
import { cn } from "@/lib/utils";
import { BUILT_IN_WALLPAPERS, isVideoWallpaperSource } from "@/lib/wallpapers";
import { type AspectRatio } from "@/utils/aspectRatioUtils";
import minimalCursorUrl from "@/assets/cursors/custom/minimal-cursor.svg";
import { useI18n, useScopedT } from "../../contexts/I18nContext";
import { AnnotationSettingsPanel } from "./AnnotationSettingsPanel";
import {
	CURSOR_MOTION_PRESETS,
	type CursorMotionPresetId,
	getMatchingCursorMotionPresetId,
} from "./cursorMotionPresets";
import { loadEditorPreferences, saveEditorPreferences } from "./editorPreferences";
import { SliderControl } from "./SliderControl";
import type {
	AnnotationRegion,
	AnnotationType,
	AutoCaptionSettings,
	CaptionCue,
	CropRegion,
	CursorStyle,
	EditorEffectSection,
	FigureData,
	Padding,
	WebcamOverlaySettings,
	WebcamPositionPreset,
	ZoomDepth,
	ZoomMode,
	ZoomMotionBlurTuning,
	ZoomTransitionEasing,
} from "./types";
import {
	DEFAULT_AUTO_CAPTION_SETTINGS,
	DEFAULT_CROP_REGION,
	DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
	DEFAULT_CURSOR_MOTION_BLUR,
	DEFAULT_CURSOR_STYLE,
	DEFAULT_CURSOR_SWAY,
	DEFAULT_PADDING,
	DEFAULT_WEBCAM_POSITION_PRESET,
	DEFAULT_WEBCAM_POSITION_X,
	DEFAULT_WEBCAM_POSITION_Y,
	DEFAULT_ZOOM_IN_DURATION_MS,
	DEFAULT_ZOOM_MOTION_BLUR_TUNING,
	DEFAULT_ZOOM_OUT_DURATION_MS,
} from "./types";
import { isZeroPadding } from "./videoPlayback/layoutUtils";
import {
	cursorSetAssets,
	getCursorStyleSizeMultiplier,
} from "./videoPlayback/uploadedCursorAssets";
import { WebcamCropControl } from "./WebcamCropControl";
import {
	getWebcamPositionForPreset,
	normalizeWebcamCropRegion,
	resolveWebcamCorner,
} from "./webcamOverlay";
import {
	BUILTIN_CURSOR_PREVIEW_FRAME_SIZE,
	BUILTIN_CURSOR_PREVIEW_SIZE,
	BUILTIN_CURSOR_STYLE_OPTIONS,
	GRADIENTS,
} from "./settings/constants";
import { useSettingsPanel } from "./settings/hooks/useSettingsPanel";
import { AudioSection } from "./settings/sections/AudioSection";
import { BackgroundSection } from "./settings/sections/BackgroundSection";
import { CaptionsSection } from "./settings/sections/CaptionsSection";
import { ClipSection } from "./settings/sections/ClipSection";
import { CropSection } from "./settings/sections/CropSection";
import { CursorSection } from "./settings/sections/CursorSection";
import { FrameSection } from "./settings/sections/FrameSection";
import { GeneralSettingsSection } from "./settings/sections/GeneralSettingsSection";
import { WebcamSection } from "./settings/sections/WebcamSection";
import { ZoomSection } from "./settings/sections/ZoomSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const tahoeCursorUrl = cursorSetAssets.tahoe.arrow.url;

function getStepPrecision(step: number): number {
	if (!Number.isFinite(step) || step <= 0) return 0;
	const [mantissa = "0", exponentPart = "0"] = step.toExponential().split("e");
	const exponent = Number.parseInt(exponentPart, 10);
	const mantissaDecimals = (mantissa.split(".")[1] ?? "").replace(/0+$/, "").length;
	const precision = exponent < 0 ? Math.max(0, -exponent + mantissaDecimals) : mantissaDecimals;
	return Math.min(12, precision);
}


function isHexWallpaper(value: string): boolean {
	return /^#(?:[0-9a-f]{3}){1,2}$/i.test(value);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
			{children}
		</p>
	);
}

function WallpaperVideoPreview({ src }: { src: string }) {
	const [resolvedSrc, setResolvedSrc] = useState(src);

	useEffect(() => {
		let cancelled = false;
		setResolvedSrc(src);

		void (async () => {
			try {
				const nextSrc = await getRenderableVideoUrl(src);
				if (!cancelled) {
					setResolvedSrc(nextSrc);
				}
			} catch {
				if (!cancelled) {
					setResolvedSrc(src);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [src]);

	return (
		<video
			src={resolvedSrc}
			muted
			playsInline
			preload="metadata"
			className="h-full w-full select-none object-cover [transform:translateZ(0)]"
			draggable={false}
			onMouseEnter={(e) => e.currentTarget.play().catch(() => undefined)}
			onMouseLeave={(e) => {
				e.currentTarget.pause();
				e.currentTarget.currentTime = 0;
			}}
		/>
	);
}

/**
 * Renders extension-contributed settings fields (toggle, slider, select, color, text).
 */
function ExtensionSettingsSection({
	extensionId,
	label,
	fields,
}: {
	extensionId: string;
	label: string;
	fields: ExtensionSettingField[];
}) {
	const [, forceUpdate] = useState(0);

	return (
		<div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-foreground/[0.06]">
			<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
				{label}
			</p>
			{fields.map((field) => {
				const value =
					extensionHost.getExtensionSetting(extensionId, field.id) ?? field.defaultValue;

				if (field.type === "toggle") {
					return (
						<div
							key={field.id}
							className="flex items-center justify-between rounded-lg bg-foreground/[0.03] px-2.5 py-1.5"
						>
							<span className="text-[11px] text-muted-foreground">{field.label}</span>
							<Switch
								checked={Boolean(value)}
								onCheckedChange={(checked) => {
									extensionHost.setExtensionSetting(
										extensionId,
										field.id,
										checked,
									);
									forceUpdate((n) => n + 1);
								}}
								className="data-[state=checked]:bg-[#2563EB] scale-75"
							/>
						</div>
					);
				}

				if (field.type === "slider") {
					const step = field.step ?? 0.01;
					const precision = getStepPrecision(step);
					return (
						<div key={field.id} className="mt-1">
							<SliderControl
								label={field.label}
								value={typeof value === "number" ? value : (field.defaultValue as number)}
								defaultValue={field.defaultValue as number}
								min={field.min ?? 0}
								max={field.max ?? 1}
								step={step}
								onChange={(v) => {
									extensionHost.setExtensionSetting(extensionId, field.id, v);
									forceUpdate((n) => n + 1);
								}}
								formatValue={(v) => v.toFixed(precision)}
								parseInput={(text) => parseFloat(text)}
							/>
						</div>
					);
				}

				if (field.type === "select" && field.options) {
					return (
						<div
							key={field.id}
							className="flex items-center justify-between gap-2 rounded-lg bg-foreground/[0.03] px-2.5 py-1.5"
						>
							<span className="text-[11px] text-muted-foreground flex-shrink-0">
								{field.label}
							</span>
							<Select
								value={String(value)}
								onValueChange={(v) => {
									extensionHost.setExtensionSetting(extensionId, field.id, v);
									forceUpdate((n) => n + 1);
								}}
							>
								<SelectTrigger className="h-6 w-24 text-[10px] border-foreground/10 bg-foreground/[0.03]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{field.options.map((opt) => (
										<SelectItem
											key={opt.value}
											value={opt.value}
											className="text-[10px]"
										>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					);
				}

				if (field.type === "color") {
					return (
						<div
							key={field.id}
							className="flex items-center justify-between gap-2 rounded-lg bg-foreground/[0.03] px-2.5 py-1.5"
						>
							<span className="text-[11px] text-muted-foreground flex-shrink-0">
								{field.label}
							</span>
							<input
								type="color"
								value={String(value)}
								onChange={(e) => {
									extensionHost.setExtensionSetting(
										extensionId,
										field.id,
										e.target.value,
									);
									forceUpdate((n) => n + 1);
								}}
								className="w-7 h-5 rounded border border-foreground/10 cursor-pointer bg-transparent"
							/>
						</div>
					);
				}

				if (field.type === "text") {
					return (
						<div
							key={field.id}
							className="flex items-center justify-between gap-2 rounded-lg bg-foreground/[0.03] px-2.5 py-1.5"
						>
							<span className="text-[11px] text-muted-foreground flex-shrink-0">
								{field.label}
							</span>
							<input
								type="text"
								value={String(value)}
								onChange={(e) => {
									extensionHost.setExtensionSetting(
										extensionId,
										field.id,
										e.target.value,
									);
									forceUpdate((n) => n + 1);
								}}
								className="w-24 h-6 rounded bg-foreground/[0.06] border border-foreground/10 px-1.5 text-[10px] text-foreground"
							/>
						</div>
					);
				}

				return null;
			})}
		</div>
	);
}

const MOTION_PRESET_ORDER: CursorMotionPresetId[] = ["focused", "smooth"];

function MotionPresetCards({
	title,
	activePresetId,
	onApply,
	tSettings,
}: {
	title: string;
	activePresetId: CursorMotionPresetId | null;
	onApply: (presetId: CursorMotionPresetId) => void;
	tSettings: (key: string, fallback?: string) => string;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="text-[10px] text-muted-foreground">{title}</div>
			<div className="grid grid-cols-2 gap-2">
				{MOTION_PRESET_ORDER.map((presetId) => {
					const Icon = presetId === "focused" ? CursorClick : PresentationChart;
					const isActive = activePresetId === presetId;

					return (
						<button
							key={presetId}
							type="button"
							onClick={() => onApply(presetId)}
							className={cn(
								"rounded-xl border px-3 py-3 text-left transition-all",
								"border-foreground/10 bg-foreground/[0.03] hover:border-foreground/20 hover:bg-foreground/[0.06]",
								isActive &&
									"border-[#2563EB]/70 bg-[#2563EB]/12 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.15)]",
							)}
						>
							<div className="flex items-start gap-3">
								<div
									className={cn(
										"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-black/10 text-muted-foreground",
										isActive &&
											"border-[#2563EB]/30 bg-[#2563EB]/10 text-[#75A6FF]",
									)}
								>
									<Icon className="h-4 w-4" />
								</div>
								<div className="min-w-0 flex-1">
									<div className="text-[12px] font-medium text-foreground">
										{tSettings(`effects.motionPresets.${presetId}.label`)}
									</div>
								</div>
							</div>
							<div className="mt-2 text-[10px] leading-4 text-muted-foreground">
								{tSettings(`effects.motionPresets.${presetId}.description`)}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}

interface SettingsPanelProps {
	panelMode?: "editor" | "background";
	activeEffectSection?: EditorEffectSection;
	selected: string;
	onWallpaperChange: (path: string) => void;
	selectedZoomDepth?: ZoomDepth | null;
	onZoomDepthChange?: (depth: ZoomDepth) => void;
	selectedZoomId?: string | null;
	selectedZoomMode?: ZoomMode | null;
	onZoomModeChange?: (mode: ZoomMode) => void;
	onZoomDelete?: (id: string) => void;
	selectedClipId?: string | null;
	selectedClipSpeed?: number | null;
	selectedClipMuted?: boolean | null;
	selectedClipShowSourceAudio?: boolean | null;
	hasClipSourceAudio?: boolean;
	onClipSpeedChange?: (speed: number) => void;
	onClipMutedChange?: (muted: boolean) => void;
	onClipShowSourceAudioChange?: (show: boolean) => void;
	sourceAudioTrackMeta?: Array<{ id: string; label: string }>;
	sourceAudioTrackSettings?: Record<string, { volume: number; normalize: boolean }>;
	onSourceAudioTrackVolumeChange?: (id: string, volume: number) => void;
	onSourceAudioTrackNormalizeChange?: (id: string, normalize: boolean) => void;
	onClipDelete?: (id: string) => void;
	selectedAudioId?: string | null;
	selectedAudioVolume?: number | null;
	selectedAudioNormalize?: boolean | null;
	onAudioVolumeChange?: (volume: number) => void;
	onAudioNormalizeChange?: (normalize: boolean) => void;
	onAudioDelete?: (id: string) => void;
	shadowIntensity?: number;
	onShadowChange?: (intensity: number) => void;
	backgroundBlur?: number;
	onBackgroundBlurChange?: (amount: number) => void;
	zoomMotionBlurTuning?: ZoomMotionBlurTuning;
	onZoomMotionBlurTuningChange?: (tuning: ZoomMotionBlurTuning) => void;
	zoomTemporalMotionBlur?: number;
	onZoomTemporalMotionBlurChange?: (amount: number) => void;
	zoomMotionBlurSampleCount?: number | null;
	onZoomMotionBlurSampleCountChange?: (count: number | null) => void;
	zoomMotionBlurShutterFraction?: number | null;
	onZoomMotionBlurShutterFractionChange?: (fraction: number | null) => void;
	connectZooms?: boolean;
	onConnectZoomsChange?: (enabled: boolean) => void;
	autoApplyFreshRecordingAutoZooms?: boolean;
	onAutoApplyFreshRecordingAutoZoomsChange?: (enabled: boolean) => void;
	zoomInDurationMs?: number;
	onZoomInDurationMsChange?: (duration: number) => void;
	zoomInOverlapMs?: number;
	onZoomInOverlapMsChange?: (duration: number) => void;
	zoomOutDurationMs?: number;
	onZoomOutDurationMsChange?: (duration: number) => void;
	connectedZoomGapMs?: number;
	onConnectedZoomGapMsChange?: (duration: number) => void;
	connectedZoomDurationMs?: number;
	onConnectedZoomDurationMsChange?: (duration: number) => void;
	zoomInEasing?: ZoomTransitionEasing;
	onZoomInEasingChange?: (easing: ZoomTransitionEasing) => void;
	zoomOutEasing?: ZoomTransitionEasing;
	onZoomOutEasingChange?: (easing: ZoomTransitionEasing) => void;
	connectedZoomEasing?: ZoomTransitionEasing;
	onConnectedZoomEasingChange?: (easing: ZoomTransitionEasing) => void;
	showCursor?: boolean;
	onShowCursorChange?: (enabled: boolean) => void;
	loopCursor?: boolean;
	onLoopCursorChange?: (enabled: boolean) => void;
	cursorStyle?: CursorStyle;
	onCursorStyleChange?: (style: CursorStyle) => void;
	cursorSize?: number;
	onCursorSizeChange?: (size: number) => void;
	cursorSmoothing?: number;
	onCursorSmoothingChange?: (smoothing: number) => void;
	cursorSpringStiffnessMultiplier?: number;
	onCursorSpringStiffnessMultiplierChange?: (multiplier: number) => void;
	cursorSpringDampingMultiplier?: number;
	onCursorSpringDampingMultiplierChange?: (multiplier: number) => void;
	cursorSpringMassMultiplier?: number;
	onCursorSpringMassMultiplierChange?: (multiplier: number) => void;
	cameraSpringStiffnessMultiplier?: number;
	onCameraSpringStiffnessMultiplierChange?: (multiplier: number) => void;
	cameraSpringDampingMultiplier?: number;
	onCameraSpringDampingMultiplierChange?: (multiplier: number) => void;
	cameraSpringMassMultiplier?: number;
	onCameraSpringMassMultiplierChange?: (multiplier: number) => void;
	zoomClassicMode?: boolean;
	onZoomClassicModeChange?: (enabled: boolean) => void;
	cursorMotionBlur?: number;
	onCursorMotionBlurChange?: (amount: number) => void;
	cursorClickBounce?: number;
	onCursorClickBounceChange?: (amount: number) => void;
	cursorClickBounceDuration?: number;
	onCursorClickBounceDurationChange?: (duration: number) => void;
	cursorSway?: number;
	onCursorSwayChange?: (amount: number) => void;
	borderRadius?: number;
	onBorderRadiusChange?: (radius: number) => void;
	webcam?: WebcamOverlaySettings;
	webcamPreviewSrc?: string | null;
	webcamPreviewCurrentTime?: number;
	webcamPreviewPlaying?: boolean;
	onWebcamChange?: (webcam: WebcamOverlaySettings) => void;
	onUploadWebcam?: () => void;
	onClearWebcam?: () => void;
	padding?: Padding;
	onPaddingChange?: (padding: Padding) => void;
	frame?: string | null;
	onFrameChange?: (frameId: string | null) => void;
	cropRegion?: CropRegion;
	onCropChange?: (region: CropRegion) => void;
	aspectRatio: AspectRatio;
	onAspectRatioChange?: (ratio: AspectRatio) => void;
	selectedAnnotationId?: string | null;
	annotationRegions?: AnnotationRegion[];
	onAnnotationContentChange?: (id: string, content: string) => void;
	onAnnotationTypeChange?: (id: string, type: AnnotationType) => void;
	onAnnotationStyleChange?: (id: string, style: Partial<AnnotationRegion["style"]>) => void;
	onAnnotationFigureDataChange?: (id: string, figureData: FigureData) => void;
	onAnnotationBlurIntensityChange?: (id: string, intensity: number) => void;
	onAnnotationBlurColorChange?: (id: string, color: string) => void;
	onAnnotationDelete?: (id: string) => void;
	autoCaptions?: CaptionCue[];
	autoCaptionSettings?: AutoCaptionSettings;
	whisperExecutablePath?: string | null;
	whisperModelPath?: string | null;
	whisperModelDownloadStatus?: "idle" | "downloading" | "downloaded" | "error";
	whisperModelDownloadProgress?: number;
	isGeneratingCaptions?: boolean;
	onAutoCaptionSettingsChange?: (settings: AutoCaptionSettings) => void;
	onPickWhisperExecutable?: () => void;
	onPickWhisperModel?: () => void;
	onGenerateAutoCaptions?: () => void;
	onClearAutoCaptions?: () => void;
	onDownloadWhisperSmallModel?: () => void;
	onDeleteWhisperSmallModel?: () => void;
	nativeCaptureUnavailableSession?: boolean;
	onOpenNativeCaptureUnavailableModal?: () => void;
}


function loadPreviewImage(url: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Failed to load preview asset: ${url}`));
		image.src = url;
	});
}

function trimCanvasToAlpha(canvas: HTMLCanvasElement, hotspot?: { x: number; y: number }) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return {
			dataUrl: canvas.toDataURL("image/png"),
			width: canvas.width,
			height: canvas.height,
			hotspot,
		};
	}

	const { width, height } = canvas;
	const imageData = ctx.getImageData(0, 0, width, height);
	const { data } = imageData;
	let minX = width;
	let minY = height;
	let maxX = -1;
	let maxY = -1;

	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const alpha = data[(y * width + x) * 4 + 3];
			if (alpha === 0) {
				continue;
			}

			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}
	}

	if (maxX < minX || maxY < minY) {
		return {
			dataUrl: canvas.toDataURL("image/png"),
			width,
			height,
			hotspot,
		};
	}

	const croppedWidth = maxX - minX + 1;
	const croppedHeight = maxY - minY + 1;
	const croppedCanvas = document.createElement("canvas");
	croppedCanvas.width = croppedWidth;
	croppedCanvas.height = croppedHeight;
	const croppedCtx = croppedCanvas.getContext("2d")!;
	croppedCtx.drawImage(
		canvas,
		minX,
		minY,
		croppedWidth,
		croppedHeight,
		0,
		0,
		croppedWidth,
		croppedHeight,
	);

	return {
		dataUrl: croppedCanvas.toDataURL("image/png"),
		width: croppedWidth,
		height: croppedHeight,
		hotspot: hotspot
			? {
					x: hotspot.x - minX,
					y: hotspot.y - minY,
				}
			: undefined,
	};
}

async function createTrimmedSvgPreview(
	url: string,
	sampleSize: number,
	trim?: { x: number; y: number; width: number; height: number },
) {
	const image = await loadPreviewImage(url);
	const sourceCanvas = document.createElement("canvas");
	sourceCanvas.width = sampleSize;
	sourceCanvas.height = sampleSize;
	const sourceCtx = sourceCanvas.getContext("2d")!;
	sourceCtx.drawImage(image, 0, 0, sampleSize, sampleSize);

	if (trim) {
		const croppedCanvas = document.createElement("canvas");
		croppedCanvas.width = trim.width;
		croppedCanvas.height = trim.height;
		const croppedCtx = croppedCanvas.getContext("2d")!;
		croppedCtx.drawImage(
			sourceCanvas,
			trim.x,
			trim.y,
			trim.width,
			trim.height,
			0,
			0,
			trim.width,
			trim.height,
		);
		return croppedCanvas.toDataURL("image/png");
	}

	return trimCanvasToAlpha(sourceCanvas).dataUrl;
}

async function createInvertedPreview(url: string) {
	const image = await loadPreviewImage(url);
	const canvas = document.createElement("canvas");
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
	const ctx = canvas.getContext("2d")!;
	ctx.drawImage(image, 0, 0);
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const { data } = imageData;
	for (let index = 0; index < data.length; index += 4) {
		if (data[index + 3] === 0) {
			continue;
		}
		data[index] = 255 - data[index];
		data[index + 1] = 255 - data[index + 1];
		data[index + 2] = 255 - data[index + 2];
	}
	ctx.putImageData(imageData, 0, 0);
	return canvas.toDataURL("image/png");
}

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
					style={{
						width: `${previewSize}px`,
						height: `${previewSize}px`,
					}}
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

export function SettingsPanel({
	panelMode = "editor",
	activeEffectSection: activeEffectSectionProp,
	selected,
	onWallpaperChange,
	selectedZoomDepth,
	onZoomDepthChange,
	selectedZoomId,
	selectedZoomMode,
	onZoomModeChange,
	onZoomDelete,
	selectedClipId,
	selectedClipSpeed,
	selectedClipMuted,
	selectedClipShowSourceAudio = false,
	hasClipSourceAudio = false,
	onClipSpeedChange,
	onClipMutedChange,
	onClipShowSourceAudioChange,
	sourceAudioTrackMeta = [],
	sourceAudioTrackSettings = {},
	onSourceAudioTrackVolumeChange,
	onSourceAudioTrackNormalizeChange,
	onClipDelete,
	selectedAudioId,
	selectedAudioVolume,
	selectedAudioNormalize,
	onAudioVolumeChange,
	onAudioNormalizeChange,
	onAudioDelete,
	shadowIntensity = 0.67,
	onShadowChange,
	backgroundBlur = 0,
	onBackgroundBlurChange,
	zoomMotionBlurTuning = DEFAULT_ZOOM_MOTION_BLUR_TUNING,
	onZoomMotionBlurTuningChange,
	connectZooms = true,
	onConnectZoomsChange,
	autoApplyFreshRecordingAutoZooms = true,
	onAutoApplyFreshRecordingAutoZoomsChange,
	zoomInDurationMs = DEFAULT_ZOOM_IN_DURATION_MS,
	onZoomInDurationMsChange,
	zoomOutDurationMs = DEFAULT_ZOOM_OUT_DURATION_MS,
	onZoomOutDurationMsChange,
	showCursor = false,
	onShowCursorChange,
	loopCursor = false,
	onLoopCursorChange,
	cursorStyle = DEFAULT_CURSOR_STYLE,
	onCursorStyleChange,
	cursorSize = 5,
	onCursorSizeChange,
	cursorSmoothing = 2,
	onCursorSmoothingChange,
	cursorSpringStiffnessMultiplier = 1,
	onCursorSpringStiffnessMultiplierChange,
	cursorSpringDampingMultiplier = 1,
	onCursorSpringDampingMultiplierChange,
	cursorSpringMassMultiplier = 1,
	onCursorSpringMassMultiplierChange,
	cameraSpringStiffnessMultiplier = 1,
	onCameraSpringStiffnessMultiplierChange,
	cameraSpringDampingMultiplier = 1.13,
	onCameraSpringDampingMultiplierChange,
	cameraSpringMassMultiplier = 1.12,
	onCameraSpringMassMultiplierChange,
	zoomClassicMode = false,
	onZoomClassicModeChange,
	cursorMotionBlur = DEFAULT_CURSOR_MOTION_BLUR,
	onCursorMotionBlurChange,
	cursorClickBounce = 1,
	onCursorClickBounceChange,
	cursorClickBounceDuration = DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
	onCursorClickBounceDurationChange,
	cursorSway = DEFAULT_CURSOR_SWAY,
	onCursorSwayChange,
	borderRadius = 12.5,
	onBorderRadiusChange,
	webcam,
	webcamPreviewSrc = null,
	webcamPreviewCurrentTime = 0,
	webcamPreviewPlaying = false,
	onWebcamChange,
	onUploadWebcam,
	onClearWebcam,
	padding = DEFAULT_PADDING,
	onPaddingChange,
	frame = null,
	onFrameChange,
	cropRegion,
	onCropChange,
	aspectRatio,
	onAspectRatioChange,
	selectedAnnotationId,
	annotationRegions = [],
	onAnnotationContentChange,
	onAnnotationTypeChange,
	onAnnotationStyleChange,
	onAnnotationFigureDataChange,
	onAnnotationBlurIntensityChange,
	onAnnotationBlurColorChange,
	onAnnotationDelete,
	autoCaptions = [],
	autoCaptionSettings = DEFAULT_AUTO_CAPTION_SETTINGS,
	whisperModelPath,
	whisperModelDownloadStatus = "idle",
	whisperModelDownloadProgress = 0,
	isGeneratingCaptions = false,
	onAutoCaptionSettingsChange,
	onPickWhisperModel,
	onGenerateAutoCaptions,
	onClearAutoCaptions,
	onDownloadWhisperSmallModel,
	onDeleteWhisperSmallModel,
	nativeCaptureUnavailableSession = false,
	onOpenNativeCaptureUnavailableModal,
}: SettingsPanelProps) {
	const tSettings = useScopedT("settings");
	const { locale, setLocale, t } = useI18n();
	const { preference: themePreference, setPreference: setThemePreference } = useTheme();
	const isBackgroundPanel = panelMode === "background";
	const removeBackgroundStateRef = useRef<{
		aspectRatio: AspectRatio;
		padding: Padding;
	} | null>(null);
	const {
		initialEditorPreferences,
		customImages,
		fileInputRef,
		customColorInputRef,
		builtInWallpaperPaths,
		extensionWallpaperPaths,
		backgroundTab,
		setBackgroundTab,
		selectedColor,
		setSelectedColor,
		gradient,
		setGradient,
		availableFrames,
		extensionPanels,
		cursorPreviewUrls,
		cursorStyleOptions,
		imageWallpaperTiles,
		videoWallpaperTiles,
		handleImageUpload,
		handleVideoUpload,
		handleRemoveCustomImage,
	} = useSettingsPanel({
		selected,
		onWallpaperChange,
		loadEditorPreferences,
		saveEditorPreferences,
		tSettings,
		t,
		gradients: GRADIENTS,
		builtInCursorStyleOptions: BUILTIN_CURSOR_STYLE_OPTIONS,
		createTrimmedSvgPreview,
		createInvertedPreview,
		minimalCursorUrl,
		tahoeCursorUrl,
	});
	const captionCueCount = autoCaptions.length;
	const colorPalette = [
		"#FF0000",
		"#FFD700",
		"#00FF00",
		"#FFFFFF",
		"#0000FF",
		"#FF6B00",
		"#9B59B6",
		"#E91E63",
		"#00BCD4",
		"#FF5722",
		"#8BC34A",
		"#FFC107",
		"#2563EB",
		"#000000",
		"#607D8B",
		"#795548",
	];

	const removeBackgroundEnabled = aspectRatio === "native" && isZeroPadding(padding);

	const renderExtensionPanelsForSections = (...sections: string[]) =>
		extensionPanels
			.filter((panel) => {
				const parentSection = panel.panel.parentSection;
				return parentSection ? sections.includes(parentSection) : false;
			})
			.map((panel) => (
				<ExtensionSettingsSection
					key={`${panel.extensionId}/${panel.panel.id}`}
					extensionId={panel.extensionId}
					label={panel.panel.label}
					fields={panel.panel.fields}
				/>
			));

	const defaultWebcam = initialEditorPreferences.webcam;
	const [internalActiveEffectSection] = useState<EditorEffectSection>("scene");
	const activeEffectSection = activeEffectSectionProp ?? internalActiveEffectSection;
	const showDevMotionControls = import.meta.env.DEV;

	const handleRemoveBackgroundToggle = (checked: boolean) => {
		if (checked) {
			removeBackgroundStateRef.current = {
				aspectRatio,
				padding,
			};
			onAspectRatioChange?.("native");
			onPaddingChange?.({ top: 0, bottom: 0, left: 0, right: 0, linked: padding.linked });
			return;
		}

		const previousState = removeBackgroundStateRef.current;
		if (previousState) {
			onAspectRatioChange?.(previousState.aspectRatio);
			onPaddingChange?.(previousState.padding);
			removeBackgroundStateRef.current = null;
			return;
		}

		// Fallback if the project loaded in a "background removed" state already
		onAspectRatioChange?.(initialEditorPreferences.aspectRatio);
		onPaddingChange?.({ ...DEFAULT_PADDING });
	};

	const togglePaddingLink = () => {
		const isLinked = padding.linked !== false;
		const nextLinked = !isLinked;
		if (nextLinked) {
			// Compute average for relinking to avoid sudden shifts
			const avg = Math.round(
				(padding.top + padding.bottom + padding.left + padding.right) / 4,
			);
			onPaddingChange?.({
				top: avg,
				bottom: avg,
				left: avg,
				right: avg,
				linked: true,
			});
		} else {
			onPaddingChange?.({
				...padding,
				linked: false,
			});
		}
	};

	const handlePaddingSideChange = (side: keyof Padding, value: number) => {
		if (padding.linked !== false) {
			onPaddingChange?.({
				top: value,
				bottom: value,
				left: value,
				right: value,
				linked: true,
			});
		} else {
			onPaddingChange?.({
				...padding,
				[side]: value,
			});
		}
	};

	const webcamFileName = webcam?.sourcePath?.split(/[\\/]/).pop() ?? null;
	const visibleColorPalette = colorPalette.slice(0, 15);
	const webcamPositionPreset = webcam?.positionPreset ?? DEFAULT_WEBCAM_POSITION_PRESET;
	const webcamPositionX = webcam?.positionX ?? DEFAULT_WEBCAM_POSITION_X;
	const webcamPositionY = webcam?.positionY ?? DEFAULT_WEBCAM_POSITION_Y;
	const webcamCrop = normalizeWebcamCropRegion(webcam?.cropRegion);

	const getWallpaperTileState = (candidateValue: string, previewPath?: string) => {
		if (!selected) return false;
		if (selected === candidateValue || (previewPath && selected === previewPath)) return true;
		try {
			const clean = (s: string) => s.replace(/^file:\/\//, "").replace(/^\//, "");
			if (clean(selected).endsWith(clean(candidateValue))) return true;
			if (clean(candidateValue).endsWith(clean(selected))) return true;
			if (previewPath && clean(selected).endsWith(clean(previewPath))) return true;
			if (previewPath && clean(previewPath).endsWith(clean(selected))) return true;
		} catch {
			return false;
		}
		return false;
	};

	const wallpaperTileClass = (isSelected: boolean) =>
		cn(
			"group relative aspect-square w-full overflow-hidden rounded-[10px] border bg-editor-bg transition-colors duration-150",
			isSelected
				? "border-[#2563EB] bg-foreground/[0.08]"
				: "border-foreground/10 bg-foreground/[0.045] hover:border-foreground/20 hover:bg-foreground/[0.07]",
		);

	const renderWallpaperImageTile = (
		wallpaperUrl: string,
		isSelected: boolean,
		props?: {
			key?: string;
			ariaLabel?: string;
			title?: string;
			onClick?: () => void;
			children?: React.ReactNode;
		},
	) => (
		<div
			key={props?.key}
			className={wallpaperTileClass(isSelected)}
			aria-label={props?.ariaLabel}
			title={props?.title}
			onClick={props?.onClick}
			role="button"
		>
			<div className="absolute inset-[1px] overflow-hidden rounded-[8px] bg-editor-dialog">
				{isVideoWallpaperSource(wallpaperUrl) ? (
					<WallpaperVideoPreview src={wallpaperUrl} />
				) : (
					<img
						src={wallpaperUrl}
						alt={
							props?.title ??
							props?.ariaLabel ??
							tSettings("background.wallpaperPreview", "Wallpaper preview")
						}
						className="h-full w-full select-none object-cover [transform:translateZ(0)]"
						draggable={false}
					/>
				)}
			</div>
			{props?.children}
		</div>
	);

	const crop = cropRegion ?? {
		x: 0,
		y: 0,
		width: 1,
		height: 1,
	};
	const cropTop = Math.round(crop.y * 100);
	const cropLeft = Math.round(crop.x * 100);
	const cropBottom = Math.round((1 - crop.y - crop.height) * 100);
	const cropRight = Math.round((1 - crop.x - crop.width) * 100);
	const isCropped = cropTop > 0 || cropLeft > 0 || cropBottom > 0 || cropRight > 0;

	const setCropInset = (side: "top" | "bottom" | "left" | "right", pct: number) => {
		if (!onCropChange) return;

		const v = pct / 100;
		let { x, y, width, height } = crop;

		if (side === "top") {
			const nextY = Math.min(v, 1 - y - height + v);
			y = nextY;
			height = Math.max(0.05, height - (nextY - crop.y));
		}

		if (side === "left") {
			const nextX = Math.min(v, 1 - x - width + v);
			x = nextX;
			width = Math.max(0.05, width - (nextX - crop.x));
		}

		if (side === "bottom") {
			height = Math.max(0.05, 1 - crop.y - v);
		}

		if (side === "right") {
			width = Math.max(0.05, 1 - crop.x - v);
		}

		onCropChange({ x, y, width, height });
	};

	const resetBackgroundSection = () => {
		onBackgroundBlurChange?.(initialEditorPreferences.backgroundBlur);

		const preferredWallpaper = initialEditorPreferences.wallpaper;
		const hasPreferredWallpaper =
			(preferredWallpaper && builtInWallpaperPaths.includes(preferredWallpaper)) ||
			(preferredWallpaper && extensionWallpaperPaths.includes(preferredWallpaper)) ||
			(preferredWallpaper && customImages.includes(preferredWallpaper)) ||
			(preferredWallpaper && isHexWallpaper(preferredWallpaper)) ||
			(preferredWallpaper &&
				GRADIENTS.some((gradientValue: string) => gradientValue === preferredWallpaper));

		onWallpaperChange(
			(hasPreferredWallpaper ? preferredWallpaper : "") ||
				builtInWallpaperPaths[0] ||
				extensionWallpaperPaths[0] ||
				BUILT_IN_WALLPAPERS[0]?.publicPath ||
				"",
		);
	};

	const resetZoomSection = () => {
		onZoomMotionBlurTuningChange?.(initialEditorPreferences.zoomMotionBlurTuning);
		onCameraSpringStiffnessMultiplierChange?.(
			initialEditorPreferences.cameraSpringStiffnessMultiplier,
		);
		onCameraSpringDampingMultiplierChange?.(
			initialEditorPreferences.cameraSpringDampingMultiplier,
		);
		onCameraSpringMassMultiplierChange?.(initialEditorPreferences.cameraSpringMassMultiplier);
		onZoomInDurationMsChange?.(initialEditorPreferences.zoomInDurationMs);
		onZoomOutDurationMsChange?.(initialEditorPreferences.zoomOutDurationMs);
		onZoomClassicModeChange?.(false);
	};

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

	const activeMotionPresetId = useMemo(() => {
		return (
			getMatchingCursorMotionPresetId({
				zoomInDurationMs,
				zoomOutDurationMs,
				cursorSize,
				cursorSmoothing,
				cursorSpringStiffnessMultiplier,
				cursorSpringDampingMultiplier,
				cursorSpringMassMultiplier,
				cursorMotionBlur,
				cursorClickBounce,
				cursorClickBounceDuration,
			}) ?? "focused"
		);
	}, [
		cursorClickBounce,
		cursorClickBounceDuration,
		cursorMotionBlur,
		cursorSize,
		cursorSmoothing,
		cursorSpringDampingMultiplier,
		cursorSpringMassMultiplier,
		cursorSpringStiffnessMultiplier,
		zoomInDurationMs,
		zoomOutDurationMs,
	]);

	const applyMotionPreset = (presetId: CursorMotionPresetId) => {
		const preset = CURSOR_MOTION_PRESETS[presetId];
		onZoomInDurationMsChange?.(preset.zoomInDurationMs);
		onZoomOutDurationMsChange?.(preset.zoomOutDurationMs);
		onCursorSizeChange?.(preset.cursorSize);
		onCursorSmoothingChange?.(preset.cursorSmoothing);
		onCursorSpringStiffnessMultiplierChange?.(preset.cursorSpringStiffnessMultiplier);
		onCursorSpringDampingMultiplierChange?.(preset.cursorSpringDampingMultiplier);
		onCursorSpringMassMultiplierChange?.(preset.cursorSpringMassMultiplier);
		onCursorMotionBlurChange?.(preset.cursorMotionBlur);
		onCursorClickBounceChange?.(preset.cursorClickBounce);
		onCursorClickBounceDurationChange?.(preset.cursorClickBounceDuration);
	};

	const resetFrameSection = () => {
		const preferredFrame = initialEditorPreferences.frame;
		const resolvedFrame = preferredFrame
			? availableFrames.some((candidate) => candidate.id === preferredFrame)
				? preferredFrame
				: null
			: null;
		onShadowChange?.(initialEditorPreferences.shadowIntensity);
		onBorderRadiusChange?.(initialEditorPreferences.borderRadius);
		onAspectRatioChange?.(initialEditorPreferences.aspectRatio);
		onPaddingChange?.({ ...initialEditorPreferences.padding });
		onFrameChange?.(resolvedFrame);
		removeBackgroundStateRef.current = null;
	};

	const resetWebcamSection = () => {
		if (!onWebcamChange) return;
		onWebcamChange({ ...defaultWebcam });
	};

	const resetCropSection = () => {
		onCropChange?.(DEFAULT_CROP_REGION);
	};

	const updateWebcam = (patch: Partial<WebcamOverlaySettings>) => {
		if (!webcam || !onWebcamChange) return;
		onWebcamChange({ ...webcam, ...patch });
	};

	const applyWebcamPositionPreset = (preset: WebcamPositionPreset) => {
		if (!webcam) return;

		if (preset === "custom") {
			updateWebcam({ positionPreset: "custom" });
			return;
		}

		const position = getWebcamPositionForPreset(preset);
		updateWebcam({
			positionPreset: preset,
			positionX: position.x,
			positionY: position.y,
			corner: resolveWebcamCorner(preset, webcam.corner),
		});
	};

	// Find selected annotation
	const selectedAnnotation = selectedAnnotationId
		? annotationRegions.find((a) => a.id === selectedAnnotationId)
		: null;

	const backgroundSettingsContent = (
		<BackgroundSection
			tSettings={tSettings}
			t={t}
			resetBackgroundSection={resetBackgroundSection}
			backgroundBlur={backgroundBlur}
			defaultBackgroundBlur={initialEditorPreferences.backgroundBlur}
			onBackgroundBlurChange={onBackgroundBlurChange}
			backgroundTab={backgroundTab}
			setBackgroundTab={setBackgroundTab}
			fileInputRef={fileInputRef}
			handleImageUpload={handleImageUpload}
			customImages={customImages}
			getWallpaperTileState={getWallpaperTileState}
			renderWallpaperImageTile={renderWallpaperImageTile}
			onWallpaperChange={onWallpaperChange}
			handleRemoveCustomImage={handleRemoveCustomImage}
			imageWallpaperTiles={imageWallpaperTiles}
			videoWallpaperTiles={videoWallpaperTiles}
			handleVideoUpload={handleVideoUpload}
			customColorInputRef={customColorInputRef}
			selectedColor={selectedColor}
			setSelectedColor={setSelectedColor}
			selected={selected}
			visibleColorPalette={visibleColorPalette}
			wallpaperTileClass={wallpaperTileClass}
			isHexWallpaper={isHexWallpaper}
			gradient={gradient}
			setGradient={setGradient}
		/>
	);

	// If an annotation is selected, show annotation settings instead
	if (
		!isBackgroundPanel &&
		selectedAnnotation &&
		onAnnotationContentChange &&
		onAnnotationTypeChange &&
		onAnnotationStyleChange &&
		onAnnotationDelete
	) {
		return (
			<AnnotationSettingsPanel
				annotation={selectedAnnotation}
				onContentChange={(content) =>
					onAnnotationContentChange(selectedAnnotation.id, content)
				}
				onTypeChange={(type) => onAnnotationTypeChange(selectedAnnotation.id, type)}
				onStyleChange={(style) => onAnnotationStyleChange(selectedAnnotation.id, style)}
				onFigureDataChange={
					onAnnotationFigureDataChange
						? (figureData) =>
								onAnnotationFigureDataChange(selectedAnnotation.id, figureData)
						: undefined
				}
				onBlurIntensityChange={
					onAnnotationBlurIntensityChange
						? (intensity) =>
								onAnnotationBlurIntensityChange(selectedAnnotation.id, intensity)
						: undefined
				}
				onBlurColorChange={
					onAnnotationBlurColorChange
						? (color) => onAnnotationBlurColorChange(selectedAnnotation.id, color)
						: undefined
				}
				onDelete={() => onAnnotationDelete(selectedAnnotation.id)}
			/>
		);
	}

	if (isBackgroundPanel) {
		return (
			<div className="flex-[2] w-[332px] min-w-[280px] max-w-[332px] bg-editor-panel rounded-2xl flex flex-col shadow-xl h-full overflow-hidden">
				<div
					className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 pb-0"
					style={{ scrollbarGutter: "stable" }}
				>
					<div className="mb-4 flex items-center gap-2">
						<Palette className="w-4 h-4 text-[#2563EB]" />
						<span className="text-sm font-medium text-foreground">
							{tSettings("background.title")}
						</span>
					</div>
					{backgroundSettingsContent}
				</div>
			</div>
		);
	}

	const frameSectionContent = (
		<FrameSection
			tSettings={tSettings}
			t={t}
			resetFrameSection={resetFrameSection}
			shadowIntensity={shadowIntensity}
			borderRadius={borderRadius}
			initialShadowIntensity={initialEditorPreferences.shadowIntensity}
			initialBorderRadius={initialEditorPreferences.borderRadius}
			onShadowChange={onShadowChange}
			onBorderRadiusChange={onBorderRadiusChange}
			padding={padding}
			togglePaddingLink={togglePaddingLink}
			handlePaddingSideChange={handlePaddingSideChange}
			removeBackgroundEnabled={removeBackgroundEnabled}
			handleRemoveBackgroundToggle={handleRemoveBackgroundToggle}
			availableFrames={availableFrames}
			frame={frame}
			onFrameChange={onFrameChange}
		/>
	);

	const cropSectionContent = (
		<CropSection
			tSettings={tSettings}
			t={t}
			isCropped={isCropped}
			resetCropSection={resetCropSection}
			cropTop={cropTop}
			cropBottom={cropBottom}
			cropLeft={cropLeft}
			cropRight={cropRight}
			setCropInset={setCropInset}
		/>
	);

	const captionsSectionContent = (
		<CaptionsSection
			tSettings={tSettings}
			t={t}
			autoCaptionSettings={autoCaptionSettings}
			defaultAutoCaptionSettings={DEFAULT_AUTO_CAPTION_SETTINGS}
			onAutoCaptionSettingsChange={onAutoCaptionSettingsChange}
			onPickWhisperModel={onPickWhisperModel}
			onGenerateAutoCaptions={onGenerateAutoCaptions}
			onClearAutoCaptions={onClearAutoCaptions}
			onDownloadWhisperSmallModel={onDownloadWhisperSmallModel}
			onDeleteWhisperSmallModel={onDeleteWhisperSmallModel}
			whisperModelPath={whisperModelPath}
			whisperModelDownloadStatus={whisperModelDownloadStatus}
			whisperModelDownloadProgress={whisperModelDownloadProgress}
			isGeneratingCaptions={isGeneratingCaptions}
			captionCueCount={captionCueCount}
			renderExtensionPanels={() => renderExtensionPanelsForSections("captions")}
		/>
	);

	const effectSectionContent = (() => {
		const settingsSectionContent = (
			<GeneralSettingsSection
				t={t}
				tSettings={tSettings}
				themePreference={themePreference}
				setThemePreference={setThemePreference}
				locale={locale}
				setLocale={setLocale}
				autoApplyFreshRecordingAutoZooms={autoApplyFreshRecordingAutoZooms}
				onAutoApplyFreshRecordingAutoZoomsChange={onAutoApplyFreshRecordingAutoZoomsChange}
				connectZooms={connectZooms}
				onConnectZoomsChange={onConnectZoomsChange}
				MotionPresetCards={MotionPresetCards}
				activeMotionPresetId={activeMotionPresetId}
				applyMotionPreset={applyMotionPreset}
				showDevMotionControls={showDevMotionControls}
				nativeCaptureUnavailableSession={nativeCaptureUnavailableSession}
				onOpenNativeCaptureUnavailableModal={onOpenNativeCaptureUnavailableModal}
				zoomMotionBlurTuning={zoomMotionBlurTuning}
				initialEditorPreferences={initialEditorPreferences}
				onZoomMotionBlurTuningChange={onZoomMotionBlurTuningChange}
				cameraSpringStiffnessMultiplier={cameraSpringStiffnessMultiplier}
				onCameraSpringStiffnessMultiplierChange={onCameraSpringStiffnessMultiplierChange}
				cameraSpringDampingMultiplier={cameraSpringDampingMultiplier}
				onCameraSpringDampingMultiplierChange={onCameraSpringDampingMultiplierChange}
				cameraSpringMassMultiplier={cameraSpringMassMultiplier}
				onCameraSpringMassMultiplierChange={onCameraSpringMassMultiplierChange}
				cursorSpringStiffnessMultiplier={cursorSpringStiffnessMultiplier}
				onCursorSpringStiffnessMultiplierChange={onCursorSpringStiffnessMultiplierChange}
				cursorSpringDampingMultiplier={cursorSpringDampingMultiplier}
				onCursorSpringDampingMultiplierChange={onCursorSpringDampingMultiplierChange}
				cursorSpringMassMultiplier={cursorSpringMassMultiplier}
				onCursorSpringMassMultiplierChange={onCursorSpringMassMultiplierChange}
			/>
		);

		const sceneSectionContent = (
			<div className="space-y-4">
				{backgroundSettingsContent}
				{frameSectionContent}
				{cropSectionContent}
				{renderExtensionPanelsForSections("scene", "appearance", "frame", "crop")}
			</div>
		);

		const zoomItemSectionContent = (
			<ZoomSection
				tSettings={tSettings}
				t={t}
				selectedZoomId={selectedZoomId}
				selectedZoomDepth={selectedZoomDepth}
				selectedZoomMode={selectedZoomMode}
				onZoomModeChange={onZoomModeChange}
				onZoomDepthChange={onZoomDepthChange}
				resetZoomSection={resetZoomSection}
				zoomClassicMode={zoomClassicMode}
				onZoomClassicModeChange={onZoomClassicModeChange}
				showDevMotionControls={showDevMotionControls}
				onZoomDelete={onZoomDelete}
				renderExtensionPanels={() =>
					renderExtensionPanelsForSections("zoom", "appearance", "frame", "crop")
				}
			/>
		);

			const audioSectionContent = (
				<AudioSection
					tSettings={tSettings}
					t={t}
					selectedAudioVolume={selectedAudioVolume}
					selectedAudioNormalize={selectedAudioNormalize}
					onAudioVolumeChange={onAudioVolumeChange}
					onAudioNormalizeChange={onAudioNormalizeChange}
				/>
			);

		const clipSectionContent = (
			<ClipSection
				tSettings={tSettings}
				t={t}
				selectedClipId={selectedClipId}
				selectedClipSpeed={selectedClipSpeed}
				selectedClipMuted={selectedClipMuted}
				selectedClipShowSourceAudio={selectedClipShowSourceAudio}
				hasClipSourceAudio={hasClipSourceAudio}
				onClipSpeedChange={onClipSpeedChange}
				onClipMutedChange={onClipMutedChange}
				onClipShowSourceAudioChange={onClipShowSourceAudioChange}
				sourceAudioTrackMeta={sourceAudioTrackMeta}
				sourceAudioTrackSettings={sourceAudioTrackSettings}
				onSourceAudioTrackVolumeChange={onSourceAudioTrackVolumeChange}
				onSourceAudioTrackNormalizeChange={onSourceAudioTrackNormalizeChange}
			/>
		);

		switch (activeEffectSection) {
			case "settings":
				return settingsSectionContent;
			case "scene":
				return sceneSectionContent;
			case "zoom":
				return zoomItemSectionContent;
			case "clip":
				return clipSectionContent;
			case "audio":
				return audioSectionContent;
			case "frame":
				return sceneSectionContent;
			case "crop":
				return sceneSectionContent;
			case "captions":
				return captionsSectionContent;
			case "cursor":
				return (
					<CursorSection
						tSettings={tSettings}
						t={t}
						resetCursorSection={resetCursorSection}
						showCursor={showCursor}
						onShowCursorChange={onShowCursorChange}
						loopCursor={loopCursor}
						onLoopCursorChange={onLoopCursorChange}
						cursorStyle={cursorStyle}
						onCursorStyleChange={onCursorStyleChange}
						cursorStyleOptions={cursorStyleOptions}
						cursorPreviewUrls={cursorPreviewUrls}
						CursorStylePreview={CursorStylePreview}
						cursorSize={cursorSize}
						onCursorSizeChange={onCursorSizeChange}
						cursorMotionBlur={cursorMotionBlur}
						onCursorMotionBlurChange={onCursorMotionBlurChange}
						cursorClickBounce={cursorClickBounce}
						onCursorClickBounceChange={onCursorClickBounceChange}
						cursorClickBounceDuration={cursorClickBounceDuration}
						onCursorClickBounceDurationChange={onCursorClickBounceDurationChange}
						cursorSway={cursorSway}
						onCursorSwayChange={onCursorSwayChange}
						showDevMotionControls={showDevMotionControls}
						renderExtensionPanels={() => renderExtensionPanelsForSections("cursor")}
					/>
				);
			case "webcam":
				return (
					<WebcamSection
						tSettings={tSettings}
						t={t}
						resetWebcamSection={resetWebcamSection}
						webcam={webcam}
						updateWebcam={updateWebcam}
						webcamCrop={webcamCrop}
						webcamPreviewSrc={webcamPreviewSrc}
						webcamPreviewCurrentTime={webcamPreviewCurrentTime}
						webcamPreviewPlaying={webcamPreviewPlaying}
						WebcamCropControl={WebcamCropControl}
						webcamPositionPreset={webcamPositionPreset}
						applyWebcamPositionPreset={applyWebcamPositionPreset}
						webcamPositionX={webcamPositionX}
						webcamPositionY={webcamPositionY}
						webcamFileName={webcamFileName}
						onUploadWebcam={onUploadWebcam}
						onClearWebcam={onClearWebcam}
						renderExtensionPanels={() => renderExtensionPanelsForSections("webcam")}
					/>
				);
			default: {
				// Handle extension-contributed standalone section pages (ext:extensionId/panelId)
				if (activeEffectSection?.startsWith("ext:")) {
					const panels = extensionPanels.filter(
						(p) =>
							!p.panel.parentSection &&
							`ext:${p.extensionId}/${p.panel.id}` === activeEffectSection,
					);
					if (panels.length > 0) {
						const p = panels[0];
						return (
							<section className="flex flex-col gap-2">
								<SectionLabel>{p.panel.label}</SectionLabel>
								<ExtensionSettingsSection
									extensionId={p.extensionId}
									label={p.panel.label}
									fields={p.panel.fields}
								/>
							</section>
						);
					}
				}
				return sceneSectionContent;
			}
		}
	})();

	return (
		<div className="flex-[2] w-[332px] min-w-[280px] max-w-[332px] bg-editor-panel rounded-2xl flex flex-col shadow-xl h-full overflow-hidden">
			<div
				className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 pb-0"
				style={{ scrollbarGutter: "stable" }}
			>
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={activeEffectSection}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.18, ease: "easeOut" }}
					>
						{effectSectionContent}
					</motion.div>
				</AnimatePresence>
			</div>

			<div
				className={cn(
					"flex-shrink-0 border-t border-foreground/10 bg-editor-panel p-4 pt-3",
					(() => {
						if (activeEffectSection === "clip" && selectedClipId) return false;
						if (activeEffectSection === "zoom" && selectedZoomId) return false;
						if (activeEffectSection === "audio" && selectedAudioId) return false;
						if (selectedAnnotationId) return false; // Annotation editor handles its own but let's see
						return true;
					})() && "hidden",
				)}
			>
				{activeEffectSection === "clip" && selectedClipId && (
					<Button
						onClick={() => {
							if (selectedClipId && onClipDelete) onClipDelete(selectedClipId);
						}}
						variant="destructive"
						size="sm"
						className="h-8 w-full gap-2 border border-red-500/20 bg-red-500/10 text-xs text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/20"
					>
						<Trash2 className="h-3 w-3" />
						{tSettings("clip.delete", "Delete Clip")}
					</Button>
				)}
				{activeEffectSection === "zoom" && selectedZoomId && (
					<Button
						onClick={() => {
							if (selectedZoomId && onZoomDelete) onZoomDelete(selectedZoomId);
						}}
						variant="destructive"
						size="sm"
						className="h-8 w-full gap-2 border border-red-500/20 bg-red-500/10 text-xs text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/20"
					>
						<Trash2 className="h-3 w-3" />
						{tSettings("zoom.deleteZoom", "Delete Zoom")}
					</Button>
				)}
				{activeEffectSection === "audio" && selectedAudioId && (
					<Button
						onClick={() => {
							if (selectedAudioId && onAudioDelete) onAudioDelete(selectedAudioId);
						}}
						variant="destructive"
						size="sm"
						className="h-8 w-full gap-2 border border-red-500/20 bg-red-500/10 text-xs text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/20"
					>
						<Trash2 className="h-3 w-3" />
						{tSettings("audio.deleteRegion", "Delete Audio")}
					</Button>
				)}
				{selectedAnnotationId && (
					<Button
						onClick={() => {
							if (selectedAnnotationId && onAnnotationDelete)
								onAnnotationDelete(selectedAnnotationId);
						}}
						variant="destructive"
						size="sm"
						className="h-8 w-full gap-2 border border-red-500/20 bg-red-500/10 text-xs text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/20"
					>
						<Trash2 className="h-3 w-3" />
						{tSettings("annotation.delete", "Delete Annotation")}
					</Button>
				)}
			</div>
		</div>
	);
}
