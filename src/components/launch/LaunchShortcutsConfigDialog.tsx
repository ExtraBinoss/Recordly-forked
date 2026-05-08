import { Keyboard, ArrowCounterClockwise as RotateCcw } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useShortcuts } from "@/contexts/ShortcutsContext";
import {
	DEFAULT_LAUNCH_SHORTCUTS,
	LAUNCH_SHORTCUT_ACTIONS,
	LAUNCH_SHORTCUT_LABELS,
	findLaunchConflict,
	formatBinding,
	type LaunchShortcutAction,
	type LaunchShortcutsConfig,
	type ShortcutBinding,
} from "@/lib/shortcuts";

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"]);

export function LaunchShortcutsConfigDialog() {
	const {
		isMac,
		launchShortcuts,
		setLaunchShortcuts,
		persistShortcuts,
		isLaunchConfigOpen,
		closeLaunchConfig,
	} = useShortcuts();
	const [draft, setDraft] = useState<LaunchShortcutsConfig>(launchShortcuts);
	const [captureFor, setCaptureFor] = useState<LaunchShortcutAction | null>(null);
	const [conflictAction, setConflictAction] = useState<LaunchShortcutAction | null>(null);

	useEffect(() => {
		if (!isLaunchConfigOpen) return;
		setDraft(launchShortcuts);
		setCaptureFor(null);
		setConflictAction(null);
	}, [isLaunchConfigOpen, launchShortcuts]);

	useEffect(() => {
		if (!captureFor) return;

		const onKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (e.key === "Escape") {
				setCaptureFor(null);
				return;
			}

			if (MODIFIER_KEYS.has(e.key)) return;
			const nextBinding: ShortcutBinding = {
				key: e.key.toLowerCase(),
				...(e.ctrlKey || e.metaKey ? { ctrl: true } : {}),
				...(e.shiftKey ? { shift: true } : {}),
				...(e.altKey ? { alt: true } : {}),
			};

			const conflict = findLaunchConflict(nextBinding, captureFor, draft);
			setCaptureFor(null);
			if (conflict) {
				setConflictAction(conflict.action);
				return;
			}
			setConflictAction(null);
			setDraft((prev) => ({ ...prev, [captureFor]: nextBinding }));
		};

		window.addEventListener("keydown", onKeyDown, { capture: true });
		return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
	}, [captureFor, draft]);

	const handleClose = useCallback(() => {
		setCaptureFor(null);
		setConflictAction(null);
		closeLaunchConfig();
	}, [closeLaunchConfig]);

	const handleSave = useCallback(async () => {
		setLaunchShortcuts(draft);
		await persistShortcuts(undefined, draft);
		handleClose();
	}, [draft, handleClose, persistShortcuts, setLaunchShortcuts]);

	return (
		<Dialog
			open={isLaunchConfigOpen}
			onOpenChange={(open) => {
				if (!open) handleClose();
			}}
		>
			<DialogContent className="launch-theme max-w-[460px] border-[var(--launch-border)] bg-[var(--launch-surface)] text-[var(--launch-text)]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-sm">
						<Keyboard className="h-4 w-4 text-[var(--launch-accent)]" />
						Launch shortcuts
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-1">
					{LAUNCH_SHORTCUT_ACTIONS.map((action) => {
						const isCapturing = captureFor === action;
						return (
							<div key={action} className="flex items-center justify-between gap-3 py-1.5">
								<span className="text-sm text-[var(--launch-text-muted)]">
									{LAUNCH_SHORTCUT_LABELS[action]}
								</span>
								<button
									type="button"
									onClick={() => {
										setConflictAction(null);
										setCaptureFor(isCapturing ? null : action);
									}}
									className="min-w-[130px] rounded-md border border-[var(--launch-border)] bg-[var(--launch-panel)] px-2 py-1 text-center font-mono text-xs text-[var(--launch-text)] hover:border-[var(--launch-border-strong)]"
								>
									{isCapturing ? "Press keys..." : formatBinding(draft[action], isMac)}
								</button>
							</div>
						);
					})}
				</div>

				{conflictAction && (
					<p className="text-xs text-amber-500">
						Shortcut already used by {LAUNCH_SHORTCUT_LABELS[conflictAction]}.
					</p>
				)}

				<p className="text-xs text-[var(--launch-text-muted)]">
					Global shortcuts are active only while recording.
				</p>

				<DialogFooter className="mt-2 flex gap-2 sm:justify-between">
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-[var(--launch-text-muted)] hover:bg-[var(--launch-hover)] hover:text-[var(--launch-text)]"
						onClick={() => setDraft({ ...DEFAULT_LAUNCH_SHORTCUTS })}
					>
						<RotateCcw className="h-3 w-3" />
						Reset
					</Button>
					<div className="flex gap-2">
						<Button variant="ghost" size="sm" onClick={handleClose}>
							Cancel
						</Button>
						<Button
							size="sm"
							className="bg-[var(--launch-accent)] text-white hover:opacity-90"
							onClick={handleSave}
						>
							Save
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
