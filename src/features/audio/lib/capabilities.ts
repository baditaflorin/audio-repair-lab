import type { BrowserCapabilities } from "../types";

export async function detectCapabilities(): Promise<BrowserCapabilities> {
  const nav = globalThis.navigator as Navigator & { gpu?: unknown };

  return {
    webAudio: "AudioContext" in globalThis || "webkitAudioContext" in globalThis,
    webWorker: "Worker" in globalThis,
    webGpu: Boolean(nav.gpu),
    audioWorklet: "AudioWorkletNode" in globalThis,
    offlineAudioContext: "OfflineAudioContext" in globalThis
  };
}
