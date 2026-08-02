import { describe, expect, it } from "vitest";
import { MAX_DECODED_PCM_BYTES, analyzeAudioData } from "./analysis";
import { createDemoClip } from "./demo";
import type { AudioData } from "../types";

describe("huge-input safety ceiling", () => {
  it("keeps a normal-sized clip processable with no too-large anomaly", () => {
    const audio = createDemoClip(16_000);
    const analysis = analyzeAudioData(audio);

    expect(analysis.anomalies).not.toContain("too-large");
    expect(analysis.processable).toBe(true);
  });

  it("marks decoded audio above MAX_DECODED_PCM_BYTES as non-processable instead of letting it reach the DSP pipeline", () => {
    // Single mono channel sized to decode just over the ceiling. This is the
    // exact quantity processAudioData() would otherwise try to clone several
    // times over (see dsp.ts / analysis.ts comments) and that reproduced multi-
    // gigabyte worker RSS for long real recordings before this fix.
    const sampleRate = 48_000;
    const oversizedSamples = Math.floor(MAX_DECODED_PCM_BYTES / 4) + 10_000;
    const channel = new Float32Array(oversizedSamples);
    const audio: AudioData = {
      name: "hour-long-recording.wav",
      sampleRate,
      channels: [channel]
    };

    const analysis = analyzeAudioData(audio);

    expect(analysis.anomalies).toContain("too-large");
    expect(analysis.kind).toBe("broken");
    expect(analysis.processable).toBe(false);
    expect(analysis.warnings.join(" ")).toMatch(/too large to process safely in a browser tab/i);
  }, 20_000);
});
