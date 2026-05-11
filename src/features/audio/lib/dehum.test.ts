import { describe, expect, it } from "vitest";
import { defaultSettings } from "./defaults";
import {
  detectHumFrequency,
  notchCoefficients,
  removeHumFromChannels,
  resolveHumFrequency
} from "./dehum";
import { processAudioData } from "./dsp";
import type { AudioData } from "../types";

const sampleRate = 16_000;
const duration = 1;

function rms(samples: Float32Array): number {
  if (!samples.length) return 0;
  let total = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = samples[i] ?? 0;
    total += value * value;
  }
  return Math.sqrt(total / samples.length);
}

function buildSignal(fundamental: number, voiceAmp = 0.4, humAmp = 0.25): Float32Array {
  const length = sampleRate * duration;
  const channel = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const voice = voiceAmp * Math.sin(2 * Math.PI * 880 * t);
    const hum =
      humAmp *
      (Math.sin(2 * Math.PI * fundamental * t) +
        0.7 * Math.sin(2 * Math.PI * fundamental * 2 * t) +
        0.4 * Math.sin(2 * Math.PI * fundamental * 3 * t));
    channel[i] = voice + hum;
  }
  return channel;
}

describe("dehum", () => {
  it("computes biquad notch coefficients with unit gain in the passband", () => {
    const coeffs = notchCoefficients(60, sampleRate);
    expect(coeffs.b0).toBeGreaterThan(0);
    expect(coeffs.b0).toBeLessThan(1);
    expect(coeffs.b1).toBeCloseTo(-2 * Math.cos((2 * Math.PI * 60) / sampleRate) * coeffs.b0, 6);
    expect(coeffs.b2).toBeCloseTo(coeffs.b0, 10);
  });

  it("removes 60 Hz mains hum and its harmonics while preserving the voice band", () => {
    const dirty = buildSignal(60);
    const [clean] = removeHumFromChannels([dirty], sampleRate, 60);
    if (!clean) throw new Error("dehum returned no channel");

    const isolateHumEnergy = (samples: Float32Array) =>
      sineEnergy(samples, sampleRate, 60) +
      sineEnergy(samples, sampleRate, 120) +
      sineEnergy(samples, sampleRate, 180);

    const dirtyHum = isolateHumEnergy(dirty);
    const cleanHum = isolateHumEnergy(clean);
    expect(cleanHum).toBeLessThan(dirtyHum * 0.08);

    const dirtyVoice = sineEnergy(dirty, sampleRate, 880);
    const cleanVoice = sineEnergy(clean, sampleRate, 880);
    expect(cleanVoice).toBeGreaterThan(dirtyVoice * 0.85);
  });

  it("auto-detects the mains fundamental from harmonic energy", () => {
    const europeanHum = buildSignal(50, 0.2, 0.4);
    expect(detectHumFrequency([europeanHum], sampleRate)).toBe(50);

    const americanHum = buildSignal(60, 0.2, 0.4);
    expect(detectHumFrequency([americanHum], sampleRate)).toBe(60);
  });

  it("honors a manual fundamental choice", () => {
    const ambiguous = buildSignal(60, 0.2, 0.4);
    expect(resolveHumFrequency("50", [ambiguous], sampleRate)).toBe(50);
    expect(resolveHumFrequency("60", [ambiguous], sampleRate)).toBe(60);
  });

  it("wires through processAudioData so the chain reports a hum operation", () => {
    const audio: AudioData = {
      name: "hum-source.wav",
      sampleRate,
      channels: [buildSignal(60)]
    };

    const result = processAudioData(audio, {
      ...defaultSettings,
      mode: "noise",
      removeHum: true,
      humFrequency: "60",
      removeClicks: false,
      softenClipping: false
    });

    expect(result.operations.some((label) => label.toLowerCase().includes("hum"))).toBe(true);
    const firstChannel = result.channels[0];
    if (!firstChannel) throw new Error("missing output channel");
    expect(rms(firstChannel)).toBeGreaterThan(0);
  });
});

function sineEnergy(samples: Float32Array, sampleRateHz: number, frequency: number): number {
  if (frequency <= 0 || frequency >= sampleRateHz / 2) return 0;
  const omega = (2 * Math.PI * frequency) / sampleRateHz;
  let real = 0;
  let imag = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = samples[i] ?? 0;
    real += value * Math.cos(omega * i);
    imag += value * Math.sin(omega * i);
  }
  const norm = 2 / Math.max(1, samples.length);
  const r = real * norm;
  const m = imag * norm;
  return r * r + m * m;
}
