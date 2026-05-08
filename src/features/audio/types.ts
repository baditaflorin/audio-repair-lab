export type ProcessingMode = "noise" | "vocal" | "repair" | "chain";
export type VocalTarget = "vocals" | "instrumental";

export interface AudioData {
  name: string;
  sampleRate: number;
  channels: Float32Array[];
}

export interface AudioStats {
  durationSeconds: number;
  peak: number;
  rms: number;
}

export interface ProcessSettings {
  mode: ProcessingMode;
  noiseReduction: number;
  noiseSensitivity: number;
  vocalStrength: number;
  vocalTarget: VocalTarget;
  repairStrength: number;
  removeClicks: boolean;
  softenClipping: boolean;
}

export interface ProcessResult {
  sampleRate: number;
  channels: Float32Array[];
  stats: AudioStats;
  warnings: string[];
  operations: string[];
}

export interface BrowserCapabilities {
  webAudio: boolean;
  webWorker: boolean;
  webGpu: boolean;
  audioWorklet: boolean;
  offlineAudioContext: boolean;
}

export interface StoredSession {
  id: string;
  schema: "audio-repair-session/v1";
  fileName: string;
  durationSeconds: number;
  sampleRate: number;
  updatedAt: string;
  settings: ProcessSettings;
}
