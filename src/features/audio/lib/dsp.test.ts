import { describe, expect, it } from "vitest";
import { createDemoClip } from "./demo";
import { defaultSettings } from "./defaults";
import { isolateVocals, processAudioData, reduceNoise, repairAudio } from "./dsp";

describe("audio DSP", () => {
  it("runs the full chain without changing length or producing invalid samples", () => {
    const audio = createDemoClip(16_000);
    const result = processAudioData(audio, { ...defaultSettings, mode: "chain" });
    const first = result.channels[0];

    expect(result.channels).toHaveLength(2);
    expect(first?.length).toBe(audio.channels[0]?.length);
    expect(result.stats.peak).toBeLessThanOrEqual(0.98);
    expect(first ? [...first.slice(0, 2000)].every(Number.isFinite) : false).toBe(true);
    expect(result.operations.length).toBeGreaterThan(2);
  });

  it("reduces stationary noise energy on a synthetic clip", () => {
    const sampleRate = 16_000;
    const length = sampleRate * 2;
    const channel = new Float32Array(length);

    for (let i = 0; i < length; i += 1) {
      channel[i] = 0.06 * Math.sin(2 * Math.PI * 1000 * (i / sampleRate));
      if (i > sampleRate) channel[i] += 0.25 * Math.sin(2 * Math.PI * 220 * (i / sampleRate));
    }

    const [cleaned] = reduceNoise([channel], sampleRate, 0.8, 0.8);
    expect(cleaned ? rms(cleaned.slice(0, sampleRate / 2)) : Number.POSITIVE_INFINITY).toBeLessThan(
      rms(channel.slice(0, sampleRate / 2))
    );
  });

  it("can focus or remove center-panned stereo content", () => {
    const left = new Float32Array([0.8, 0.5, -0.5, -0.8]);
    const right = new Float32Array([0.8, 0.5, -0.5, -0.8]);

    const instrumental = isolateVocals([left, right], 44_100, 1, "instrumental");
    const first = instrumental[0];
    expect(first ? Math.max(...first.map(Math.abs)) : Number.POSITIVE_INFINITY).toBeLessThan(0.001);
  });

  it("does not mutate the caller's original channel buffers", () => {
    // processAudioData() used to clone the normalized channels a second time
    // (normalizeChannels() + a redundant cloneChannels() call) purely to be safe
    // against accidental mutation. That second clone was removed to cut peak
    // memory on large files; this test locks in the invariant that made it safe
    // to remove: the original Float32Arrays passed in by the caller must never
    // be modified by processing.
    const audio = createDemoClip(16_000);
    const originalLeft = new Float32Array(audio.channels[0] ?? new Float32Array());
    const originalRight = new Float32Array(audio.channels[1] ?? new Float32Array());

    processAudioData(audio, { ...defaultSettings, mode: "chain" });

    expect(audio.channels[0]).toEqual(originalLeft);
    expect(audio.channels[1]).toEqual(originalRight);
  });

  it("repairs isolated click spikes", () => {
    const channel = new Float32Array(200);
    channel.fill(0.02);
    channel[100] = 0.95;

    const [repaired] = repairAudio([channel], {
      ...defaultSettings,
      removeClicks: true,
      softenClipping: false,
      repairStrength: 1
    });

    expect(Math.abs(repaired?.[100] ?? Number.POSITIVE_INFINITY)).toBeLessThan(0.2);
  });
});

function rms(samples: Float32Array): number {
  let total = 0;
  for (const sample of samples) total += sample * sample;
  return Math.sqrt(total / samples.length);
}
