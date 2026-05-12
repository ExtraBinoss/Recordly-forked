import { UploadSimple as Upload, X } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getRenderableVideoUrl } from "@/lib/assetPath";
import { cn } from "@/lib/utils";
import { BUILT_IN_WALLPAPERS, isVideoWallpaperSource } from "@/lib/wallpapers";
import type { EditorPreferences } from "../../editorPreferences";
import { SliderControl } from "../../SliderControl";
import { GRADIENTS } from "../constants";
import type { BackgroundTab, WallpaperTile as WallpaperTileData } from "../hooks/useSettingsPanel";

const COLOR_PALETTE = [
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
];

function isHexWallpaper(value: string): boolean {
	return /^#(?:[0-9a-f]{3}){1,2}$/i.test(value);
}

function WallpaperVideoPreview({ src }: { src: string }) {
	const [resolvedSrc, setResolvedSrc] = useState(src);

	useEffect(() => {
		let cancelled = false;
		setResolvedSrc(src);

		void (async () => {
			try {
				const nextSrc = await getRenderableVideoUrl(src);
				if (!cancelled) setResolvedSrc(nextSrc);
			} catch {
				if (!cancelled) setResolvedSrc(src);
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
			onMouseEnter={(event) => event.currentTarget.play().catch(() => undefined)}
			onMouseLeave={(event) => {
				event.currentTarget.pause();
				event.currentTarget.currentTime = 0;
			}}
		/>
	);
}

type WallpaperTileProps = {
	wallpaperUrl: string;
	isSelected: boolean;
	ariaLabel?: string;
	title?: string;
	onClick?: () => void;
	children?: React.ReactNode;
	tSettings: (key: string, fallback?: string) => string;
};

function wallpaperTileClass(isSelected: boolean) {
	return cn(
		"group relative aspect-square w-full overflow-hidden rounded-[10px] border bg-editor-bg transition-colors duration-150",
		isSelected
			? "border-[#2563EB] bg-foreground/[0.08]"
			: "border-foreground/10 bg-foreground/[0.045] hover:border-foreground/20 hover:bg-foreground/[0.07]",
	);
}

function WallpaperTile({
	wallpaperUrl,
	isSelected,
	ariaLabel,
	title,
	onClick,
	children,
	tSettings,
}: WallpaperTileProps) {
	return (
		<div
			className={wallpaperTileClass(isSelected)}
			aria-label={ariaLabel}
			title={title}
			onClick={onClick}
			role="button"
		>
			<div className="absolute inset-[1px] overflow-hidden rounded-[8px] bg-editor-dialog">
				{isVideoWallpaperSource(wallpaperUrl) ? (
					<WallpaperVideoPreview src={wallpaperUrl} />
				) : (
					<img
						src={wallpaperUrl}
						alt={
							title ??
							ariaLabel ??
							tSettings("background.wallpaperPreview", "Wallpaper preview")
						}
						className="h-full w-full select-none object-cover [transform:translateZ(0)]"
						draggable={false}
					/>
				)}
			</div>
			{children}
		</div>
	);
}

export function BackgroundSection({
	tSettings,
	t,
	selected,
	onWallpaperChange,
	backgroundBlur,
	onBackgroundBlurChange,
	backgroundTab,
	setBackgroundTab,
	fileInputRef,
	handleImageUpload,
	customImages,
	imageWallpaperTiles,
	videoWallpaperTiles,
	handleVideoUpload,
	handleRemoveCustomImage,
	customColorInputRef,
	selectedColor,
	setSelectedColor,
	gradient,
	setGradient,
	initialEditorPreferences,
	builtInWallpaperPaths,
	extensionWallpaperPaths,
}: {
	tSettings: (key: string, fallback?: string) => string;
	t: (key: string, fallback?: string) => string;
	selected: string;
	onWallpaperChange: (path: string) => void;
	backgroundBlur: number;
	onBackgroundBlurChange?: (amount: number) => void;
	backgroundTab: BackgroundTab;
	setBackgroundTab: (tab: BackgroundTab) => void;
	fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
	handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	customImages: string[];
	imageWallpaperTiles: WallpaperTileData[];
	videoWallpaperTiles: WallpaperTileData[];
	handleVideoUpload: () => Promise<void>;
	handleRemoveCustomImage: (imageUrl: string, event: React.MouseEvent) => void;
	customColorInputRef: React.MutableRefObject<HTMLInputElement | null>;
	selectedColor: string;
	setSelectedColor: (color: string) => void;
	gradient: string;
	setGradient: (gradient: string) => void;
	initialEditorPreferences: EditorPreferences;
	builtInWallpaperPaths: string[];
	extensionWallpaperPaths: string[];
}) {
	const visibleColorPalette = COLOR_PALETTE.slice(0, 15);

	const resetBackgroundSection = () => {
		onBackgroundBlurChange?.(initialEditorPreferences.backgroundBlur);

		const preferredWallpaper = initialEditorPreferences.wallpaper;
		const hasPreferredWallpaper =
			(preferredWallpaper && builtInWallpaperPaths.includes(preferredWallpaper)) ||
			(preferredWallpaper && extensionWallpaperPaths.includes(preferredWallpaper)) ||
			(preferredWallpaper && customImages.includes(preferredWallpaper)) ||
			(preferredWallpaper && isHexWallpaper(preferredWallpaper)) ||
			(preferredWallpaper && GRADIENTS.some((candidate) => candidate === preferredWallpaper));

		onWallpaperChange(
			(hasPreferredWallpaper ? preferredWallpaper : "") ||
				builtInWallpaperPaths[0] ||
				extensionWallpaperPaths[0] ||
				BUILT_IN_WALLPAPERS[0]?.publicPath ||
				"",
		);
	};

	const getWallpaperTileState = (candidateValue: string, previewPath?: string) => {
		if (!selected) return false;
		if (selected === candidateValue || (previewPath && selected === previewPath)) return true;
		try {
			const clean = (value: string) => value.replace(/^file:\/\//, "").replace(/^\//, "");
			if (clean(selected).endsWith(clean(candidateValue))) return true;
			if (clean(candidateValue).endsWith(clean(selected))) return true;
			if (previewPath && clean(selected).endsWith(clean(previewPath))) return true;
			if (previewPath && clean(previewPath).endsWith(clean(selected))) return true;
		} catch {
			return false;
		}
		return false;
	};

	return (
		<div className="space-y-4">
			<section className="flex flex-col gap-2">
				<div className="flex items-center justify-between gap-3">
					<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
						{tSettings("background.title")}
					</p>
					<button
						type="button"
						onClick={resetBackgroundSection}
						className="text-[10px] text-[#2563EB] transition-opacity hover:opacity-80"
					>
						{t("common.actions.reset", "Reset")}
					</button>
				</div>
				<SliderControl
					label={tSettings("effects.backgroundBlur")}
					value={backgroundBlur}
					defaultValue={initialEditorPreferences.backgroundBlur}
					min={0}
					max={8}
					step={0.25}
					onChange={(value) => onBackgroundBlurChange?.(value)}
					formatValue={(value) => `${value.toFixed(1)}px`}
					parseInput={(text) => parseFloat(text.replace(/px$/, ""))}
				/>
			</section>

			<div className="w-full">
				<LayoutGroup id="background-picker-switcher">
					<div className="grid h-8 w-full grid-cols-4 rounded-xl border border-foreground/10 bg-foreground/[0.04] p-1">
						{[
							{ value: "image", label: tSettings("background.image") },
							{ value: "video", label: tSettings("background.video", "Video") },
							{ value: "color", label: tSettings("background.color") },
							{ value: "gradient", label: tSettings("background.gradient") },
						].map((option) => {
							const isActive = backgroundTab === option.value;
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => setBackgroundTab(option.value as BackgroundTab)}
									className="relative rounded-lg text-[10px] font-semibold tracking-wide transition-colors"
								>
									{isActive ? (
										<motion.span
											layoutId="background-picker-pill"
											className="absolute inset-0 rounded-lg bg-[#2563EB]"
											transition={{
												type: "spring",
												stiffness: 420,
												damping: 34,
											}}
										/>
									) : null}
									<span
										className={cn(
											"relative z-10",
											isActive
												? "text-white"
												: "text-muted-foreground hover:text-foreground",
										)}
									>
										{option.label}
									</span>
								</button>
							);
						})}
					</div>
				</LayoutGroup>

				<div className="pt-2">
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={backgroundTab}
							initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
							animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
							exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							{backgroundTab === "image" ? (
								<div className="mt-0 space-y-2">
									<input
										type="file"
										ref={(node) => {
											fileInputRef.current = node;
										}}
										onChange={handleImageUpload}
										accept=".jpg,.jpeg,image/jpeg"
										className="hidden"
									/>
									<Button
										onClick={() => fileInputRef.current?.click()}
										variant="outline"
										className="w-full gap-2 bg-foreground/5 text-foreground border-foreground/10 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] transition-all h-7 text-[10px]"
									>
										<Upload className="w-3 h-3" />
										{tSettings("background.uploadCustom")}
									</Button>
									<div className="grid grid-cols-8 gap-1.5">
										{customImages.map((imageUrl, index) => (
											<WallpaperTile
												key={`custom-${index}`}
												wallpaperUrl={imageUrl}
												isSelected={getWallpaperTileState(imageUrl)}
												ariaLabel={
													isVideoWallpaperSource(imageUrl)
														? (imageUrl.split(/[\\/]/).pop() ??
															tSettings(
																"background.video",
																"Video background",
															))
														: undefined
												}
												title={
													isVideoWallpaperSource(imageUrl)
														? imageUrl.split(/[\\/]/).pop()
														: undefined
												}
												onClick={() => onWallpaperChange(imageUrl)}
												tSettings={tSettings}
											>
												<button
													onClick={(event) =>
														handleRemoveCustomImage(imageUrl, event)
													}
													className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
												>
													<X className="w-2 h-2 text-white" />
												</button>
											</WallpaperTile>
										))}
										{imageWallpaperTiles.map((tile) => (
											<WallpaperTile
												key={tile.key}
												wallpaperUrl={tile.previewUrl}
												isSelected={getWallpaperTileState(
													tile.value,
													tile.previewUrl,
												)}
												ariaLabel={tile.label}
												title={tile.label}
												onClick={() => onWallpaperChange(tile.value)}
												tSettings={tSettings}
											/>
										))}
									</div>
								</div>
							) : backgroundTab === "video" ? (
								<div className="mt-0 space-y-2">
									<Button
										onClick={handleVideoUpload}
										variant="outline"
										className="w-full gap-2 bg-foreground/5 text-foreground border-foreground/10 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] transition-all h-7 text-[10px]"
									>
										<Upload className="w-3 h-3" />
										{tSettings("background.uploadCustomVideo", "Upload Video")}
									</Button>
									<div className="grid grid-cols-8 gap-1.5">
										{customImages
											.filter(isVideoWallpaperSource)
											.map((videoUrl, index) => (
												<WallpaperTile
													key={`custom-video-${index}`}
													wallpaperUrl={videoUrl}
													isSelected={getWallpaperTileState(videoUrl)}
													ariaLabel={
														videoUrl.split(/[\\/]/).pop() ??
														"Video background"
													}
													title={videoUrl.split(/[\\/]/).pop()}
													onClick={() => onWallpaperChange(videoUrl)}
													tSettings={tSettings}
												>
													<button
														onClick={(event) =>
															handleRemoveCustomImage(videoUrl, event)
														}
														className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
													>
														<X className="w-2 h-2 text-white" />
													</button>
												</WallpaperTile>
											))}
										{videoWallpaperTiles.map((tile) => (
											<WallpaperTile
												key={tile.key}
												wallpaperUrl={tile.previewUrl}
												isSelected={getWallpaperTileState(
													tile.value,
													tile.previewUrl,
												)}
												ariaLabel={tile.label}
												title={tile.label}
												onClick={() => onWallpaperChange(tile.value)}
												tSettings={tSettings}
											/>
										))}
									</div>
								</div>
							) : backgroundTab === "color" ? (
								<div className="mt-0 space-y-2">
									<input
										ref={(node) => {
											customColorInputRef.current = node;
										}}
										type="color"
										value={selectedColor}
										onChange={(event) => {
											setSelectedColor(event.target.value);
											onWallpaperChange(event.target.value);
										}}
										className="sr-only"
									/>
									<div className="grid grid-cols-8 gap-1.5">
										{visibleColorPalette.map((color) => (
											<button
												key={color}
												type="button"
												onClick={() => {
													setSelectedColor(color);
													onWallpaperChange(color);
												}}
												className={wallpaperTileClass(
													selected.toLowerCase() === color.toLowerCase(),
												)}
												style={{ background: color }}
												aria-label={`Color ${color}`}
											/>
										))}
										<button
											type="button"
											onClick={() => customColorInputRef.current?.click()}
											className={wallpaperTileClass(
												isHexWallpaper(selected) &&
													!visibleColorPalette.some(
														(color) =>
															color.toLowerCase() ===
															selected.toLowerCase(),
													),
											)}
											style={{
												background: `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor} 58%, rgba(255,255,255,0.92) 58%, rgba(255,255,255,0.92) 100%)`,
											}}
											aria-label="Custom color picker"
										>
											<div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground/90">
												Pick
											</div>
										</button>
									</div>
								</div>
							) : (
								<div className="mt-0 grid grid-cols-8 gap-1.5">
									{GRADIENTS.map((candidate, index) => (
										<div
											key={candidate}
											className={wallpaperTileClass(gradient === candidate)}
											aria-label={`Gradient ${index + 1}`}
											onClick={() => {
												setGradient(candidate);
												onWallpaperChange(candidate);
											}}
											role="button"
										>
											<div
												className="absolute inset-[1px] overflow-hidden rounded-[8px]"
												style={{ background: candidate }}
											/>
										</div>
									))}
								</div>
							)}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}
