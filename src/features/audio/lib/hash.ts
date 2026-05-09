import type { AudioData, ProcessSettings } from "../types";

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function stableHashString(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function hashAudioData(audio: Pick<AudioData, "channels" | "sampleRate" | "name">): string {
  let hash = 0x811c9dc5;
  hash = mixString(hash, audio.name);
  hash = mixString(hash, String(audio.sampleRate));
  for (const channel of audio.channels) {
    const stride = Math.max(1, Math.floor(channel.length / 8192));
    hash = mixString(hash, String(channel.length));
    for (let i = 0; i < channel.length; i += stride) {
      hash ^= Math.round((channel[i] ?? 0) * 32767) & 0xffff;
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildRunId(
  sourceHash: string,
  appVersion: string,
  settings: ProcessSettings
): string {
  return stableHashString(`${sourceHash}:${appVersion}:${stableStringify(settings)}`);
}

function mixString(seed: number, input: string): number {
  let hash = seed;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash;
}
