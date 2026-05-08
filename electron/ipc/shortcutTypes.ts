export type LaunchShortcutAction =
	| "startRecording"
	| "stopRecording"
	| "pauseRecording"
	| "resumeRecording"
	| "muteMicrophone";

export type ShortcutBinding = {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
};
