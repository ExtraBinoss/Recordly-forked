import { Palette, Trash as Trash2 } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import minimalCursorUrl from "@/assets/cursors/custom/minimal-cursor.svg";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { type AspectRatio } from "@/utils/aspectRatioUtils";
import { useI18n, useScopedT } from "../../contexts/I18nContext";
import { AnnotationSettingsPanel } from "./AnnotationSettingsPanel";
import { loadEditorPreferences, saveEditorPreferences } from "./editorPreferences";
import { BUILTIN_CURSOR_STYLE_OPTIONS, GRADIENTS } from "./settings/constants";
import { useSettingsPanel } from "./settings/hooks/useSettingsPanel";
import {
	createInvertedPreview,
	createTrimmedSvgPreview,
} from "./settings/utils/cursorPreview";
import { AudioSection } from "./settings/sections/AudioSection";
import { BackgroundSection } from "./settings/sections/BackgroundSection";
import { CaptionsSection } from "./settings/sections/CaptionsSection";
import { ClipSection } from "./settings/sections/ClipSection";
import { CropSection } from "./settings/sections/CropSection";
import { CursorSection } from "./settings/sections/CursorSection";
import {
	ExtensionSettingsSection,
	SettingsExtensionPanels,
} from "./settings/sections/ExtensionSettingsSection";
import { FrameSection } from "./settings/sections/FrameSection";
import { GeneralSettingsSection } from "./settings/sections/GeneralSettingsSection";
import { WebcamSection } from "./settings/sections/WebcamSection";
import { ZoomSection } from "./settings/sections/ZoomSection";
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
	ZoomDepth,
	ZoomMode,
	ZoomMotionBlurTuning,
	ZoomTransitionEasing,
} from "./types";
import {
	DEFAULT_AUTO_CAPTION_SETTINGS,
	DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
	DEFAULT_CURSOR_MOTION_BLUR,
	DEFAULT_CURSOR_STYLE,
	DEFAULT_CURSOR_SWAY,
	DEFAULT_PADDING,
	DEFAULT_ZOOM_IN_DURATION_MS,
	DEFAULT_ZOOM_MOTION_BLUR_TUNING,
	DEFAULT_ZOOM_OUT_DURATION_MS,
} from "./types";
import { cursorSetAssets } from "./videoPlayback/uploadedCursorAssets";

const tahoeCursorUrl = cursorSetAssets.tahoe.arrow.url;

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
			{children}
		</p>
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
	const [internalActiveEffectSection] = useState<EditorEffectSection>("scene");
	const activeEffectSection = activeEffectSectionProp ?? internalActiveEffectSection;
	const showDevMotionControls = import.meta.env.DEV;

	// Find selected annotation
	const selectedAnnotation = selectedAnnotationId
		? annotationRegions.find((a) => a.id === selectedAnnotationId)
		: null;

	const backgroundSettingsContent = (
		<BackgroundSection
			tSettings={tSettings}
			t={t}
			selected={selected}
			onWallpaperChange={onWallpaperChange}
			backgroundBlur={backgroundBlur}
			onBackgroundBlurChange={onBackgroundBlurChange}
			backgroundTab={backgroundTab}
			setBackgroundTab={setBackgroundTab}
			fileInputRef={fileInputRef}
			handleImageUpload={handleImageUpload}
			customImages={customImages}
			imageWallpaperTiles={imageWallpaperTiles}
			videoWallpaperTiles={videoWallpaperTiles}
			handleVideoUpload={handleVideoUpload}
			handleRemoveCustomImage={handleRemoveCustomImage}
			customColorInputRef={customColorInputRef}
			selectedColor={selectedColor}
			setSelectedColor={setSelectedColor}
			gradient={gradient}
			setGradient={setGradient}
			initialEditorPreferences={initialEditorPreferences}
			builtInWallpaperPaths={builtInWallpaperPaths}
			extensionWallpaperPaths={extensionWallpaperPaths}
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
			shadowIntensity={shadowIntensity}
			borderRadius={borderRadius}
			onShadowChange={onShadowChange}
			onBorderRadiusChange={onBorderRadiusChange}
			padding={padding}
			onPaddingChange={onPaddingChange}
			aspectRatio={aspectRatio}
			onAspectRatioChange={onAspectRatioChange}
			availableFrames={availableFrames}
			frame={frame}
			onFrameChange={onFrameChange}
			initialEditorPreferences={initialEditorPreferences}
		/>
	);

	const cropSectionContent = (
		<CropSection
			tSettings={tSettings}
			t={t}
			cropRegion={cropRegion}
			onCropChange={onCropChange}
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
			extensionPanels={extensionPanels}
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
				showDevMotionControls={showDevMotionControls}
				nativeCaptureUnavailableSession={nativeCaptureUnavailableSession}
				onOpenNativeCaptureUnavailableModal={onOpenNativeCaptureUnavailableModal}
				zoomInDurationMs={zoomInDurationMs}
				onZoomInDurationMsChange={onZoomInDurationMsChange}
				zoomOutDurationMs={zoomOutDurationMs}
				onZoomOutDurationMsChange={onZoomOutDurationMsChange}
				cursorSize={cursorSize}
				onCursorSizeChange={onCursorSizeChange}
				cursorSmoothing={cursorSmoothing}
				onCursorSmoothingChange={onCursorSmoothingChange}
				cursorMotionBlur={cursorMotionBlur}
				onCursorMotionBlurChange={onCursorMotionBlurChange}
				cursorClickBounce={cursorClickBounce}
				onCursorClickBounceChange={onCursorClickBounceChange}
				cursorClickBounceDuration={cursorClickBounceDuration}
				onCursorClickBounceDurationChange={onCursorClickBounceDurationChange}
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
				<SettingsExtensionPanels
					panels={extensionPanels}
					sections={["scene", "appearance", "frame", "crop"]}
				/>
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
				zoomClassicMode={zoomClassicMode}
				onZoomClassicModeChange={onZoomClassicModeChange}
				showDevMotionControls={showDevMotionControls}
				onZoomDelete={onZoomDelete}
				initialEditorPreferences={initialEditorPreferences}
				onZoomMotionBlurTuningChange={onZoomMotionBlurTuningChange}
				onCameraSpringStiffnessMultiplierChange={onCameraSpringStiffnessMultiplierChange}
				onCameraSpringDampingMultiplierChange={onCameraSpringDampingMultiplierChange}
				onCameraSpringMassMultiplierChange={onCameraSpringMassMultiplierChange}
				onZoomInDurationMsChange={onZoomInDurationMsChange}
				onZoomOutDurationMsChange={onZoomOutDurationMsChange}
				extensionPanels={extensionPanels}
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
						showCursor={showCursor}
						onShowCursorChange={onShowCursorChange}
						loopCursor={loopCursor}
						onLoopCursorChange={onLoopCursorChange}
						cursorStyle={cursorStyle}
						onCursorStyleChange={onCursorStyleChange}
						cursorStyleOptions={cursorStyleOptions}
						cursorPreviewUrls={cursorPreviewUrls}
						cursorSize={cursorSize}
						onCursorSizeChange={onCursorSizeChange}
						onCursorSmoothingChange={onCursorSmoothingChange}
						onCursorSpringStiffnessMultiplierChange={
							onCursorSpringStiffnessMultiplierChange
						}
						onCursorSpringDampingMultiplierChange={
							onCursorSpringDampingMultiplierChange
						}
						onCursorSpringMassMultiplierChange={onCursorSpringMassMultiplierChange}
						cursorMotionBlur={cursorMotionBlur}
						onCursorMotionBlurChange={onCursorMotionBlurChange}
						cursorClickBounce={cursorClickBounce}
						onCursorClickBounceChange={onCursorClickBounceChange}
						cursorClickBounceDuration={cursorClickBounceDuration}
						onCursorClickBounceDurationChange={onCursorClickBounceDurationChange}
						cursorSway={cursorSway}
						onCursorSwayChange={onCursorSwayChange}
						showDevMotionControls={showDevMotionControls}
						initialEditorPreferences={initialEditorPreferences}
						extensionPanels={extensionPanels}
					/>
				);
			case "webcam":
				return (
					<WebcamSection
						tSettings={tSettings}
						t={t}
						webcam={webcam}
						webcamPreviewSrc={webcamPreviewSrc}
						webcamPreviewCurrentTime={webcamPreviewCurrentTime}
						webcamPreviewPlaying={webcamPreviewPlaying}
						onWebcamChange={onWebcamChange}
						onUploadWebcam={onUploadWebcam}
						onClearWebcam={onClearWebcam}
						initialEditorPreferences={initialEditorPreferences}
						extensionPanels={extensionPanels}
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
