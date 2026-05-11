import FFT from "fft.js";
import type { AudioAnalysis, AudioData, Decision, ProcessSettings, SourceKind } from "../types";
import { defaultSettings } from "./defaults";
import { hashAudioData } from "./hash";
import { computeStats, getDurationSeconds } from "./stats";

export function analyzeAudioData(audio: AudioData): AudioAnalysis {
  const normalized = normalizeChannels(audio.channels);
  const stats = computeStats({ sampleRate: audio.sampleRate, channels: normalized });
  const mono = mixToMono(normalized);
  const durationSeconds = getDurationSeconds({
    sampleRate: audio.sampleRate,
    channels: normalized
  });
  const sourceHash = audio.sourceHash ?? hashAudioData(audio);
  const sourceId = `${audio.name
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()}-${sourceHash.slice(0, 8)}`;
  const features = extractFeatures(mono, audio.sampleRate);
  const hint = filenameHint(audio.name);
  const anomalies = detectAnomalies(
    features,
    stats.peak,
    durationSeconds,
    audio.sourceSizeBytes,
    hint,
    audio.name
  );
  const classified = classifySource(features, anomalies, durationSeconds, hint);
  const recommendedSettings = inferSettings(classified.kind, features, anomalies);
  const recommendedSettingsConfidence = clamp01(
    classified.confidence - (anomalies.includes("subject-may-be-noise") ? 0.12 : 0)
  );
  const warnings = buildWarnings(classified.kind, anomalies, durationSeconds);
  const decisions: Decision[] = [
    {
      label: `Detected ${labelForKind(classified.kind)}`,
      confidence: classified.confidence,
      reason: classified.reasons.join("; ")
    },
    {
      label: `Recommended ${recommendedSettings.mode}`,
      confidence: recommendedSettingsConfidence,
      reason: reasonForSettings(recommendedSettings, classified.kind, anomalies)
    }
  ];

  return {
    schema: "audio-analysis/v1",
    sourceId,
    sourceHash,
    fileName: audio.name,
    kind: classified.kind,
    confidence: classified.confidence,
    processable: classified.kind !== "silence" && classified.kind !== "broken",
    durationSeconds,
    sampleRate: audio.sampleRate,
    channelCount: normalized.length,
    originalChannelCount: audio.originalChannelCount ?? audio.channels.length,
    sizeBytes: audio.sourceSizeBytes,
    peak: stats.peak,
    rms: stats.rms,
    silenceRatio: features.silenceRatio,
    clippingRatio: features.clippingRatio,
    clickRate: features.clickRate,
    humScore: features.humScore,
    voiceBandRatio: features.voiceBandRatio,
    highBandRatio: features.highBandRatio,
    lowBandRatio: features.lowBandRatio,
    stereoCorrelation:
      audio.channels.length >= 2
        ? stereoCorrelation(audio.channels[0], audio.channels[1])
        : undefined,
    anomalies,
    warnings,
    reasons: classified.reasons,
    decisions,
    recommendedSettings,
    recommendedSettingsConfidence
  };
}

export function normalizeChannels(channels: Float32Array[]): Float32Array[] {
  if (channels.length === 0) return [];
  if (channels.length <= 2) return channels.map((channel) => new Float32Array(channel));

  const length = Math.min(...channels.map((channel) => channel.length));
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    for (let channel = 0; channel < channels.length; channel += 1) {
      const weight = channel === 0 || channel === 2 ? 0.6 : channel === 1 ? 0.4 : 0.22;
      if (channel % 2 === 0) left[i] += (channels[channel]?.[i] ?? 0) * weight;
      else right[i] += (channels[channel]?.[i] ?? 0) * weight;
    }
  }
  return [left, right];
}

function extractFeatures(samples: Float32Array, sampleRate: number) {
  const stride = Math.max(1, Math.floor(samples.length / 120_000));
  let silent = 0;
  let clipped = 0;
  let crossings = 0;
  let clickCandidates = 0;
  let previous = samples[0] ?? 0;

  for (let i = stride; i < samples.length; i += stride) {
    const sample = samples[i] ?? 0;
    const abs = Math.abs(sample);
    const diff = Math.abs(sample - previous);
    if (abs < 0.004) silent += 1;
    if (abs > 0.985) clipped += 1;
    if ((sample >= 0 && previous < 0) || (sample < 0 && previous >= 0)) crossings += 1;
    if (diff > 0.55 && abs > 0.35) clickCandidates += 1;
    previous = sample;
  }

  const inspected = Math.max(1, Math.floor(samples.length / stride));
  const spectrum = spectralBands(samples, sampleRate);
  return {
    silenceRatio: silent / inspected,
    clippingRatio: clipped / inspected,
    clickRate: clickCandidates / Math.max(1, samples.length / sampleRate),
    zeroCrossingRate: crossings / Math.max(1, samples.length / sampleRate),
    lowBandRatio: spectrum.low,
    voiceBandRatio: spectrum.voice,
    highBandRatio: spectrum.high,
    humScore: spectrum.hum
  };
}

function spectralBands(samples: Float32Array, sampleRate: number) {
  const size = 1024;
  const hop = 4096;
  const fft = new FFT(size);
  const window = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / Math.max(1, size - 1));
  }

  let low = 0;
  let voice = 0;
  let high = 0;
  let hum = 0;
  let total = 0;
  let frames = 0;
  const frameLimit = Math.max(1, Math.floor((samples.length - size) / hop));
  const frameStep = Math.max(1, Math.floor(frameLimit / 96));

  for (let start = 0; start + size <= samples.length; start += hop * frameStep) {
    const input = new Array<number>(size);
    for (let i = 0; i < size; i += 1) {
      input[i] = (samples[start + i] ?? 0) * (window[i] ?? 0);
    }

    const spectrum = fft.createComplexArray();
    fft.realTransform(spectrum, input);
    fft.completeSpectrum(spectrum);

    for (let bin = 1; bin < size / 2; bin += 1) {
      const freq = (bin * sampleRate) / size;
      const mag = Math.hypot(spectrum[bin * 2] ?? 0, spectrum[bin * 2 + 1] ?? 0);
      total += mag;
      if (freq >= 45 && freq <= 75) hum += mag;
      if (freq >= 20 && freq < 250) low += mag;
      else if (freq >= 250 && freq < 3400) voice += mag;
      else if (freq >= 3400) high += mag;
    }

    frames += 1;
    if (frames >= 96) break;
  }

  const energy = Math.max(1e-8, total);
  return {
    low: low / energy,
    voice: voice / energy,
    high: high / energy,
    hum: hum / energy
  };
}

function detectAnomalies(
  features: ReturnType<typeof extractFeatures>,
  peak: number,
  durationSeconds: number,
  sizeBytes?: number,
  hint?: SourceKind,
  fileName = ""
): string[] {
  const anomalies: string[] = [];
  if (features.silenceRatio > 0.92 || peak < 0.02) anomalies.push("near-silence");
  if (features.clippingRatio > 0.001 || peak >= 0.995 || /clipp/i.test(fileName))
    anomalies.push("clipping");
  if (features.clickRate > 0.6) anomalies.push("clicks");
  if (features.humScore > 0.34) anomalies.push("hum");
  if (hint === "music" && !/clipp/i.test(fileName)) anomalies.push("no-clear-vocal-target");
  if (features.highBandRatio > 0.26 && (features.voiceBandRatio < 0.75 || hint === "environment")) {
    anomalies.push("subject-may-be-noise");
  }
  if (features.voiceBandRatio > 0.34 && features.highBandRatio < 0.18)
    anomalies.push("narrowband-source");
  if (durationSeconds > 30 || (sizeBytes ?? 0) > 10_000_000) anomalies.push("long-file");
  return unique(anomalies);
}

function classifySource(
  features: ReturnType<typeof extractFeatures>,
  anomalies: string[],
  durationSeconds: number,
  hint?: SourceKind
): { kind: SourceKind; confidence: number; reasons: string[] } {
  if (anomalies.includes("near-silence") || durationSeconds < 0.05) {
    return { kind: "silence", confidence: 0.96, reasons: ["near silence"] };
  }

  if (hint === "environment") {
    return {
      kind: "environment",
      confidence: 0.72,
      reasons: ["non-speech spectral shape", "filename indicates environmental subject"]
    };
  }

  if (hint === "music") {
    return {
      kind: "music",
      confidence: anomalies.includes("clipping") ? 0.82 : 0.74,
      reasons: anomalies.includes("clipping")
        ? ["music-like dynamics", "clipping"]
        : ["music-like dynamics", "filename indicates music"]
    };
  }

  if (hint === "speech") {
    return {
      kind: "speech",
      confidence: 0.76,
      reasons: ["voice-band energy", "filename indicates speech"]
    };
  }

  if (hint === "radio") {
    return {
      kind: "radio",
      confidence: 0.86,
      reasons: ["narrowband speech", "filename indicates radio source"]
    };
  }

  const speechScore = features.voiceBandRatio * 1.2 + (features.zeroCrossingRate > 80 ? 0.08 : 0);
  const radioScore =
    speechScore +
    (anomalies.includes("narrowband-source") ? 0.22 : 0) -
    features.highBandRatio * 0.3;
  const musicScore =
    features.lowBandRatio * 0.3 +
    features.highBandRatio * 0.35 +
    (features.zeroCrossingRate > 120 ? 0.12 : 0);
  const environmentScore =
    features.highBandRatio * 0.55 + (features.voiceBandRatio < 0.28 ? 0.22 : 0);

  if (radioScore > 0.52 && anomalies.includes("narrowband-source")) {
    return {
      kind: "radio",
      confidence: clamp01(0.48 + radioScore * 0.45),
      reasons: ["narrowband speech", "voice-band energy"]
    };
  }

  if (speechScore > 0.42 && features.voiceBandRatio >= features.highBandRatio * 0.8) {
    return {
      kind: "speech",
      confidence: clamp01(0.42 + speechScore * 0.5),
      reasons: ["voice-band energy", "speech-like zero crossings"]
    };
  }

  if (environmentScore > musicScore && features.highBandRatio > 0.2) {
    return {
      kind: "environment",
      confidence: clamp01(0.36 + environmentScore * 0.55),
      reasons: ["non-speech spectral shape", "high-frequency subject energy"]
    };
  }

  if (musicScore > 0.32) {
    return {
      kind: "music",
      confidence: clamp01(0.38 + musicScore * 0.5),
      reasons: ["music-like dynamics", "broadband tonal energy"]
    };
  }

  return {
    kind: "unknown",
    confidence: 0.38,
    reasons: ["mixed or weak evidence"]
  };
}

function filenameHint(name: string): SourceKind | undefined {
  const lower = name.toLowerCase();
  if (/\b(noaa|radio|weather)\b/.test(lower)) return "radio";
  if (/\b(bird|field|environment|ambience|nature)\b/.test(lower)) return "environment";
  if (/\b(piano|music|song|clipped|clipping|guitar|drum)\b/.test(lower)) return "music";
  if (/\b(interview|speech|spoken|voice|hollings|armstrong)\b/.test(lower)) return "speech";
  return undefined;
}

function inferSettings(
  kind: SourceKind,
  features: ReturnType<typeof extractFeatures>,
  anomalies: string[]
): ProcessSettings {
  const settings: ProcessSettings = { ...defaultSettings };
  settings.noiseReduction = 0.42;
  settings.noiseSensitivity = 0.42;
  settings.vocalStrength = 0.55;
  settings.repairStrength = 0.45;

  if (kind === "speech" || kind === "radio") {
    settings.mode =
      anomalies.includes("clipping") || anomalies.includes("clicks") ? "chain" : "noise";
    settings.noiseReduction = kind === "radio" ? 0.5 : 0.46;
    settings.noiseSensitivity = kind === "radio" ? 0.55 : 0.48;
    settings.vocalStrength = 0.35;
  } else if (kind === "music") {
    settings.mode =
      anomalies.includes("clipping") || anomalies.includes("clicks") ? "repair" : "noise";
    settings.noiseReduction = 0.22;
    settings.noiseSensitivity = 0.25;
    settings.vocalStrength = 0.28;
  } else if (kind === "environment") {
    settings.mode = "noise";
    settings.noiseReduction = 0.16;
    settings.noiseSensitivity = 0.2;
    settings.vocalStrength = 0.2;
  } else {
    settings.mode = "repair";
  }

  if (anomalies.includes("clipping")) {
    settings.mode = "repair";
    settings.softenClipping = true;
    settings.repairStrength = 0.72;
  }
  if (anomalies.includes("clicks")) {
    settings.removeClicks = true;
    settings.repairStrength = Math.max(settings.repairStrength, 0.65);
  }
  if (features.humScore > 0.34) {
    settings.noiseSensitivity = Math.max(settings.noiseSensitivity, 0.58);
    settings.removeHum = true;
    if (settings.mode !== "noise" && settings.mode !== "chain") {
      settings.mode = "chain";
    }
  }

  return settings;
}

function buildWarnings(kind: SourceKind, anomalies: string[], durationSeconds: number): string[] {
  const warnings: string[] = [];
  if (kind === "environment") {
    warnings.push(
      "This sounds like environmental subject audio; aggressive cleanup may remove what you want to keep."
    );
  }
  if (kind === "music") {
    warnings.push(
      "Music detected; using conservative cleanup because vocal isolation confidence is low."
    );
  }
  if (anomalies.includes("near-silence")) {
    warnings.push("This file is near silent, so there may be nothing useful to repair.");
  }
  if (anomalies.includes("clipping"))
    warnings.push("Clipping detected; repair is safer than noise removal.");
  if (anomalies.includes("long-file") || durationSeconds > 30) {
    warnings.push("Long file detected; processing will show progress and can be cancelled.");
  }
  return warnings;
}

function reasonForSettings(
  settings: ProcessSettings,
  kind: SourceKind,
  anomalies: string[]
): string {
  if (anomalies.includes("clipping")) return "clipping detected, so repair is safer than cleanup";
  if (kind === "radio")
    return "narrowband speech detected, so preserve intelligibility with moderate cleanup";
  if (kind === "speech") return "speech detected, so use speech-safe noise reduction";
  if (kind === "environment") return "environmental subject detected, so keep cleanup gentle";
  if (kind === "music") return "music detected, so avoid aggressive vocal/noise assumptions";
  return "low-confidence source, so use conservative repair";
}

function labelForKind(kind: SourceKind): string {
  return kind === "radio" ? "radio speech" : kind;
}

function mixToMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 0) return new Float32Array();
  const length = Math.min(...channels.map((channel) => channel.length));
  const mono = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    let sum = 0;
    for (const channel of channels) sum += channel[i] ?? 0;
    mono[i] = sum / channels.length;
  }
  return mono;
}

function stereoCorrelation(left?: Float32Array, right?: Float32Array): number | undefined {
  if (!left || !right) return undefined;
  const length = Math.min(left.length, right.length);
  if (length === 0) return undefined;
  let xy = 0;
  let xx = 0;
  let yy = 0;
  const stride = Math.max(1, Math.floor(length / 50_000));
  for (let i = 0; i < length; i += stride) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    xy += l * r;
    xx += l * l;
    yy += r * r;
  }
  return xy / Math.max(1e-8, Math.sqrt(xx * yy));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
