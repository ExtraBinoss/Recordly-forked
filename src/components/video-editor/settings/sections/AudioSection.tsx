import { Switch } from "@/components/ui/switch";
import { SliderControl } from "../../SliderControl";

export function AudioSection({
	tSettings,
	t,
	selectedAudioVolume,
	selectedAudioNormalize,
	onAudioVolumeChange,
	onAudioNormalizeChange,
}: {
	tSettings: (key: string, fallback?: string) => string;
	t: (key: string, fallback?: string) => string;
	selectedAudioVolume?: number | null;
	selectedAudioNormalize?: boolean | null;
	onAudioVolumeChange?: (v: number) => void;
	onAudioNormalizeChange?: (v: boolean) => void;
}) {
	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{tSettings("audio.volumeTitle", "Audio")}</p>
				<button type="button" onClick={() => { onAudioVolumeChange?.(1); onAudioNormalizeChange?.(false); }} className="text-[10px] text-[#2563EB] transition-opacity hover:opacity-80">{t("common.actions.reset", "Reset")}</button>
			</div>
			<SliderControl label={tSettings("audio.volume", "Volume")} value={selectedAudioVolume ?? 1} defaultValue={1} min={0} max={1} step={0.01} onChange={(v) => onAudioVolumeChange?.(v)} formatValue={(v) => `${Math.round(v * 100)}%`} parseInput={(text) => parseFloat(text.replace(/%$/, "")) / 100} />
			<div className="flex items-center justify-between rounded-lg bg-foreground/[0.03] px-2.5 py-1.5">
				<span className="text-[10px] text-muted-foreground">{tSettings("audio.normalize", "Normalize")}</span>
				<Switch checked={Boolean(selectedAudioNormalize)} onCheckedChange={(v) => onAudioNormalizeChange?.(v)} className="data-[state=checked]:bg-[#2563EB] scale-75" />
			</div>
		</section>
	);
}
