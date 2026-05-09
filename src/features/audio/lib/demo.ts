import type { AudioData } from "../types";

export function createDemoClip(sampleRate = 44_100): AudioData {
  const seconds = 10;
  const length = sampleRate * seconds;
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const random = seededRandom(0x5eed);

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const phraseEnvelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.32 * t);
    const voice =
      0.22 * phraseEnvelope * Math.sin(2 * Math.PI * 180 * t) +
      0.1 * phraseEnvelope * Math.sin(2 * Math.PI * 360 * t) +
      0.045 * phraseEnvelope * Math.sin(2 * Math.PI * 720 * t);
    const sideInstrument = 0.12 * Math.sin(2 * Math.PI * 660 * t) * Math.sin(2 * Math.PI * 0.7 * t);
    const hum = 0.055 * Math.sin(2 * Math.PI * 60 * t);
    const hiss = 0.035 * (random() * 2 - 1);
    const click = i % Math.floor(sampleRate * 1.7) === 0 ? 0.82 : 0;

    left[i] = clamp(voice + sideInstrument + hum + hiss + click);
    right[i] = clamp(voice - sideInstrument + hum + hiss * 0.9 - click * 0.4);
  }

  return {
    name: "demo-noisy-vocal.wav",
    sampleRate,
    channels: [left, right]
  };
}

function clamp(value: number): number {
  return Math.max(-0.98, Math.min(0.98, value));
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 0x100000000;
  };
}
