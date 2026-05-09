export type ProcessingMode = "noise" | "vocal" | "repair" | "chain";
export type VocalTarget = "vocals" | "instrumental";
export type SourceKind =
  | "speech"
  | "radio"
  | "music"
  | "environment"
  | "silence"
  | "broken"
  | "unknown";
export type AppStatus =
  | "idle"
  | "importing"
  | "analyzing"
  | "loaded"
  | "processing"
  | "processed"
  | "cancelled"
  | "recoverable-error"
  | "fatal-error";

export interface AudioData {
  name: string;
  sampleRate: number;
  channels: Float32Array[];
  sourceHash?: string;
  sourceSizeBytes?: number;
  originalChannelCount?: number;
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

export interface Decision {
  label: string;
  confidence: number;
  reason: string;
}

export interface AudioAnalysis {
  schema: "audio-analysis/v1";
  sourceId: string;
  sourceHash: string;
  fileName: string;
  kind: SourceKind;
  confidence: number;
  processable: boolean;
  durationSeconds: number;
  sampleRate: number;
  channelCount: number;
  originalChannelCount: number;
  sizeBytes?: number;
  peak: number;
  rms: number;
  silenceRatio: number;
  clippingRatio: number;
  clickRate: number;
  humScore: number;
  voiceBandRatio: number;
  highBandRatio: number;
  lowBandRatio: number;
  stereoCorrelation?: number;
  anomalies: string[];
  warnings: string[];
  reasons: string[];
  decisions: Decision[];
  recommendedSettings: ProcessSettings;
  recommendedSettingsConfidence: number;
}

export interface ExportProvenance {
  schema: "audio-repair-export/v1";
  appVersion: string;
  sourceId: string;
  sourceHash: string;
  runId: string;
  sourceKind: SourceKind;
  settings: ProcessSettings;
  confidence: number;
  warnings: string[];
  operations: string[];
}

export interface ProcessResult {
  sampleRate: number;
  channels: Float32Array[];
  stats: AudioStats;
  warnings: string[];
  operations: string[];
  confidence: number;
  decisions: Decision[];
  provenance?: ExportProvenance;
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
