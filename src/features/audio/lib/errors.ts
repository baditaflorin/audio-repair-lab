export type AudioErrorKind =
  | "empty-file"
  | "unsupported-format"
  | "truncated-audio"
  | "decode-failed"
  | "processing-cancelled"
  | "processing-failed"
  | "export-failed";

export class AudioRepairError extends Error {
  readonly kind: AudioErrorKind;
  readonly recoverable: boolean;
  readonly what: string;
  readonly why: string;
  readonly nextStep: string;

  constructor(input: {
    kind: AudioErrorKind;
    what: string;
    why: string;
    nextStep: string;
    recoverable?: boolean;
  }) {
    super(`${input.what} ${input.why} ${input.nextStep}`);
    this.name = "AudioRepairError";
    this.kind = input.kind;
    this.what = input.what;
    this.why = input.why;
    this.nextStep = input.nextStep;
    this.recoverable = input.recoverable ?? true;
  }
}

export function formatAudioError(error: unknown): string {
  if (error instanceof AudioRepairError) {
    return `${error.what} ${error.why} ${error.nextStep}`;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. The app could not identify the failure. Try another audio file.";
}

export function decodeFailureForFile(fileName: string, size: number): AudioRepairError {
  if (size === 0) {
    return new AudioRepairError({
      kind: "empty-file",
      what: "This file is empty.",
      why: "There are no audio bytes for the browser to decode.",
      nextStep: "Choose the original exported audio file instead of a placeholder."
    });
  }

  if (size < 8192) {
    return new AudioRepairError({
      kind: "truncated-audio",
      what: "This audio looks truncated.",
      why: `${fileName} is only ${size} bytes, which is too small for a complete recording.`,
      nextStep: "Re-download or re-export the file, then import it again."
    });
  }

  return new AudioRepairError({
    kind: "decode-failed",
    what: "The browser could not decode this audio.",
    why: "The file may be corrupt, truncated, DRM-protected, or in a codec this browser does not support.",
    nextStep: "Try a WAV, MP3, OGG, FLAC, or M4A export from the original editor."
  });
}
