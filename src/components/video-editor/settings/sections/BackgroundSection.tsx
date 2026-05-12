import { UploadSimple as Upload, X } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isVideoWallpaperSource } from "@/lib/wallpapers";
import { SliderControl } from "../../SliderControl";
import { GRADIENTS } from "../constants";

export function BackgroundSection(props: any) {
	const {
		tSettings,
		t,
		resetBackgroundSection,
		backgroundBlur,
		defaultBackgroundBlur,
		onBackgroundBlurChange,
		backgroundTab,
		setBackgroundTab,
		fileInputRef,
		handleImageUpload,
		customImages,
		getWallpaperTileState,
		renderWallpaperImageTile,
		onWallpaperChange,
		handleRemoveCustomImage,
		imageWallpaperTiles,
		videoWallpaperTiles,
		handleVideoUpload,
		customColorInputRef,
		selectedColor,
		setSelectedColor,
		selected,
		visibleColorPalette,
		wallpaperTileClass,
		isHexWallpaper,
		gradient,
		setGradient,
	} = props;

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
					defaultValue={defaultBackgroundBlur}
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
									onClick={() => setBackgroundTab(option.value)}
									className="relative rounded-lg text-[10px] font-semibold tracking-wide transition-colors"
								>
									{isActive ? (
										<motion.span
											layoutId="background-picker-pill"
											className="absolute inset-0 rounded-lg bg-[#2563EB]"
											transition={{ type: "spring", stiffness: 420, damping: 34 }}
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
										ref={fileInputRef}
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
										{customImages.map((imageUrl: string, idx: number) => {
											const isSelected = getWallpaperTileState(imageUrl);
											return renderWallpaperImageTile(imageUrl, isSelected, {
												key: `custom-${idx}`,
												ariaLabel: isVideoWallpaperSource(imageUrl)
													? (imageUrl.split(/[\\/]/).pop() ??
														tSettings("background.video", "Video background"))
													: undefined,
												title: isVideoWallpaperSource(imageUrl)
													? imageUrl.split(/[\\/]/).pop()
													: undefined,
												onClick: () => onWallpaperChange(imageUrl),
												children: (
													<button
														onClick={(event) => handleRemoveCustomImage(imageUrl, event)}
														className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
													>
														<X className="w-2 h-2 text-white" />
													</button>
												),
											});
										})}
										{imageWallpaperTiles.map((tile: any) =>
											renderWallpaperImageTile(
												tile.previewUrl,
												getWallpaperTileState(tile.value, tile.previewUrl),
												{
													key: tile.key,
													ariaLabel: tile.label,
													title: tile.label,
													onClick: () => onWallpaperChange(tile.value),
												},
											),
										)}
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
										{customImages.filter(isVideoWallpaperSource).map((videoUrl: string, idx: number) =>
											renderWallpaperImageTile(videoUrl, getWallpaperTileState(videoUrl), {
												key: `custom-video-${idx}`,
												ariaLabel: videoUrl.split(/[\\/]/).pop() ?? "Video background",
												title: videoUrl.split(/[\\/]/).pop(),
												onClick: () => onWallpaperChange(videoUrl),
												children: (
													<button
														onClick={(event) => handleRemoveCustomImage(videoUrl, event)}
														className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
													>
														<X className="w-2 h-2 text-white" />
													</button>
												),
											}),
										)}
										{videoWallpaperTiles.map((tile: any) =>
											renderWallpaperImageTile(
												tile.previewUrl,
												getWallpaperTileState(tile.value, tile.previewUrl),
												{
													key: tile.key,
													ariaLabel: tile.label,
													title: tile.label,
													onClick: () => onWallpaperChange(tile.value),
												},
											),
										)}
									</div>
								</div>
							) : backgroundTab === "color" ? (
								<div className="mt-0 space-y-2">
									<input
										ref={customColorInputRef}
										type="color"
										value={selectedColor}
										onChange={(event) => {
											setSelectedColor(event.target.value);
											onWallpaperChange(event.target.value);
										}}
										className="sr-only"
									/>
									<div className="grid grid-cols-8 gap-1.5">
										{visibleColorPalette.map((color: string) => (
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
														(color: string) =>
															color.toLowerCase() === selected.toLowerCase(),
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
									{GRADIENTS.map((candidate, idx) => (
										<div
											key={candidate}
											className={wallpaperTileClass(gradient === candidate)}
											aria-label={`Gradient ${idx + 1}`}
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
