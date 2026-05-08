import FFT from "fft.js";
import type { AudioData, ProcessResult, ProcessSettings } from "../types";
import { computeStats } from "./stats";

export function processAudioData(audio: AudioData, settings: ProcessSettings): ProcessResult {
  const warnings: string[] = [];
  const operations: string[] = [];
  let channels = cloneChannels(audio.channels);

  if (audio.channels.length === 0 || (audio.channels[0]?.length ?? 0) === 0) {
    throw new Error("Audio buffer is empty.");
  }

  if (settings.mode === "noise" || settings.mode === "chain") {
    channels = reduceNoise(
      channels,
      audio.sampleRate,
      settings.noiseReduction,
      settings.noiseSensitivity
    );
    operations.push("FFT spectral noise reduction");
  }

  if (settings.mode === "vocal" || settings.mode === "chain") {
    if (channels.length < 2) {
      warnings.push(
        "Mono source: vocal isolation uses voice-band focus instead of stereo center extraction."
      );
    }
    channels = isolateVocals(
      channels,
      audio.sampleRate,
      settings.vocalStrength,
      settings.vocalTarget
    );
    operations.push(settings.vocalTarget === "vocals" ? "Stereo vocal focus" : "Center removal");
  }

  if (settings.mode === "repair" || settings.mode === "chain") {
    channels = repairAudio(channels, settings);
    operations.push("Click and clipping repair");
  }

  channels = normalizePeak(channels, 0.98);

  return {
    sampleRate: audio.sampleRate,
    channels,
    stats: computeStats({ sampleRate: audio.sampleRate, channels }),
    warnings,
    operations
  };
}

export function reduceNoise(
  channels: Float32Array[],
  sampleRate: number,
  reduction: number,
  sensitivity: number
): Float32Array[] {
  const windowSize = chooseWindowSize(sampleRate);
  const hopSize = windowSize / 4;
  const learnSamples = Math.min(channels[0]?.length ?? 0, Math.floor(sampleRate * 1.2));
  const window = hann(windowSize);

  return channels.map((channel) =>
    spectralGate(channel, window, windowSize, hopSize, learnSamples, reduction, sensitivity)
  );
}

export function isolateVocals(
  channels: Float32Array[],
  sampleRate: number,
  strength: number,
  target: "vocals" | "instrumental"
): Float32Array[] {
  if (channels.length < 2) {
    return [voiceBandFocus(channels[0] ?? new Float32Array(), sampleRate, strength)];
  }

  const left = channels[0] ?? new Float32Array();
  const right = channels[1] ?? left;
  const length = Math.min(left.length, right.length);
  const outLeft = new Float32Array(length);
  const outRight = new Float32Array(length);
  const wet = clamp01(strength);
  const dry = 1 - wet;

  for (let i = 0; i < length; i += 1) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    const mid = (l + r) * 0.5;

    if (target === "vocals") {
      outLeft[i] = dry * l + wet * mid;
      outRight[i] = dry * r + wet * mid;
    } else {
      outLeft[i] = l - mid * wet;
      outRight[i] = r - mid * wet;
    }
  }

  return [outLeft, outRight];
}

export function repairAudio(channels: Float32Array[], settings: ProcessSettings): Float32Array[] {
  return channels.map((channel) => {
    let repaired: Float32Array<ArrayBufferLike> = new Float32Array(channel);

    if (settings.removeClicks) {
      repaired = interpolateClicks(repaired, settings.repairStrength);
    }

    if (settings.softenClipping) {
      repaired = softenClippedSamples(repaired, settings.repairStrength);
    }

    return repaired;
  });
}

export function normalizePeak(channels: Float32Array[], ceiling: number): Float32Array[] {
  let peak = 0;
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i += 1) {
      peak = Math.max(peak, Math.abs(channel[i] ?? 0));
    }
  }

  if (peak <= ceiling || peak === 0) return channels;
  const gain = ceiling / peak;
  return channels.map((channel) => channel.map((sample) => sample * gain));
}

function spectralGate(
  channel: Float32Array,
  window: Float32Array,
  windowSize: number,
  hopSize: number,
  learnSamples: number,
  reduction: number,
  sensitivity: number
): Float32Array {
  const fft = new FFT(windowSize);
  const frames = frameStarts(channel.length, windowSize, hopSize);
  const noise = estimateNoiseProfile(channel, fft, window, frames, learnSamples, windowSize);
  const output = new Float32Array(channel.length);
  const norm = new Float32Array(channel.length);
  const floorScale = 0.9 + clamp01(sensitivity) * 2.8;
  const minGain = 1 - clamp01(reduction) * 0.92;

  for (const start of frames) {
    const input = windowedFrame(channel, window, start, windowSize);
    const spectrum = fft.createComplexArray();
    fft.realTransform(spectrum, input);
    fft.completeSpectrum(spectrum);

    for (let bin = 0; bin < windowSize; bin += 1) {
      const reIndex = bin * 2;
      const imIndex = reIndex + 1;
      const real = spectrum[reIndex] ?? 0;
      const imag = spectrum[imIndex] ?? 0;
      const magnitude = Math.hypot(real, imag);
      const threshold = (noise[bin] ?? 0) * floorScale;
      const gain =
        magnitude <= 1e-8
          ? minGain
          : Math.max(minGain, Math.min(1, (magnitude - threshold) / magnitude));
      spectrum[reIndex] = real * gain;
      spectrum[imIndex] = imag * gain;
    }

    const inverse = fft.createComplexArray();
    fft.inverseTransform(inverse, spectrum);
    const time = fft.fromComplexArray(inverse);

    for (let i = 0; i < windowSize; i += 1) {
      const index = start + i;
      if (index >= output.length) break;
      const win = window[i] ?? 0;
      output[index] += (time[i] ?? 0) * win;
      norm[index] += win * win;
    }
  }

  for (let i = 0; i < output.length; i += 1) {
    output[i] = norm[i] && norm[i] > 1e-8 ? output[i] / norm[i] : (channel[i] ?? 0);
  }

  return output;
}

function estimateNoiseProfile(
  channel: Float32Array,
  fft: FFT,
  window: Float32Array,
  frames: number[],
  learnSamples: number,
  windowSize: number
): Float32Array {
  const profile = new Float32Array(windowSize);
  let count = 0;

  for (const start of frames) {
    if (start >= learnSamples) break;
    const input = windowedFrame(channel, window, start, windowSize);
    const spectrum = fft.createComplexArray();
    fft.realTransform(spectrum, input);
    fft.completeSpectrum(spectrum);

    for (let bin = 0; bin < windowSize; bin += 1) {
      const real = spectrum[bin * 2] ?? 0;
      const imag = spectrum[bin * 2 + 1] ?? 0;
      profile[bin] += Math.hypot(real, imag);
    }
    count += 1;
  }

  if (count === 0) return profile;
  for (let bin = 0; bin < profile.length; bin += 1) {
    profile[bin] /= count;
  }
  return profile;
}

function voiceBandFocus(channel: Float32Array, sampleRate: number, strength: number): Float32Array {
  const highPassed = onePoleHighPass(channel, sampleRate, 110);
  const band = onePoleLowPass(highPassed, sampleRate, 7_400);
  const out = new Float32Array(channel.length);
  const wet = clamp01(strength);
  const dry = 1 - wet;

  for (let i = 0; i < channel.length; i += 1) {
    out[i] = dry * (channel[i] ?? 0) + wet * (band[i] ?? 0);
  }

  return out;
}

function onePoleLowPass(input: Float32Array, sampleRate: number, cutoff: number): Float32Array {
  const out = new Float32Array(input.length);
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  let previous = input[0] ?? 0;

  for (let i = 0; i < input.length; i += 1) {
    previous = previous + alpha * ((input[i] ?? 0) - previous);
    out[i] = previous;
  }

  return out;
}

function onePoleHighPass(input: Float32Array, sampleRate: number, cutoff: number): Float32Array {
  const out = new Float32Array(input.length);
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / sampleRate;
  const alpha = rc / (rc + dt);
  let previousOut = 0;
  let previousIn = input[0] ?? 0;

  for (let i = 0; i < input.length; i += 1) {
    const current = input[i] ?? 0;
    previousOut = alpha * (previousOut + current - previousIn);
    previousIn = current;
    out[i] = previousOut;
  }

  return out;
}

function interpolateClicks(channel: Float32Array, strength: number): Float32Array {
  const out = new Float32Array(channel);
  const radius = Math.max(2, Math.round(2 + clamp01(strength) * 10));
  const threshold = 0.32 - clamp01(strength) * 0.16;

  for (let i = radius; i < channel.length - radius; i += 1) {
    const current = channel[i] ?? 0;
    const before = channel[i - 1] ?? 0;
    const after = channel[i + 1] ?? 0;
    const local = localRms(channel, i, radius);
    const discontinuity = Math.abs(current - before) + Math.abs(current - after);

    if (Math.abs(current) > Math.max(0.18, local * 4) && discontinuity > threshold) {
      const start = i - radius;
      const end = i + radius;
      const startValue = channel[start] ?? 0;
      const endValue = channel[end] ?? 0;

      for (let j = start; j <= end; j += 1) {
        const amount = (j - start) / Math.max(1, end - start);
        out[j] = startValue + (endValue - startValue) * smoothstep(amount);
      }
      i += radius;
    }
  }

  return out;
}

function softenClippedSamples(channel: Float32Array, strength: number): Float32Array {
  const out = new Float32Array(channel.length);
  const drive = 1 + clamp01(strength) * 1.8;
  const ceiling = 0.86 - clamp01(strength) * 0.08;

  for (let i = 0; i < channel.length; i += 1) {
    const sample = channel[i] ?? 0;
    if (Math.abs(sample) < ceiling) {
      out[i] = sample;
    } else {
      const sign = Math.sign(sample);
      const excess = Math.abs(sample) - ceiling;
      out[i] = sign * (ceiling + Math.tanh(excess * drive) * (1 - ceiling));
    }
  }

  return out;
}

function localRms(channel: Float32Array, center: number, radius: number): number {
  let total = 0;
  let count = 0;
  for (let i = center - radius; i <= center + radius; i += 1) {
    const sample = channel[i] ?? 0;
    total += sample * sample;
    count += 1;
  }
  return Math.sqrt(total / Math.max(1, count));
}

function windowedFrame(
  channel: Float32Array,
  window: Float32Array,
  start: number,
  size: number
): number[] {
  const frame = new Array<number>(size);
  for (let i = 0; i < size; i += 1) {
    frame[i] = (channel[start + i] ?? 0) * (window[i] ?? 0);
  }
  return frame;
}

function frameStarts(length: number, windowSize: number, hopSize: number): number[] {
  const starts: number[] = [];
  for (let start = 0; start < length; start += hopSize) {
    starts.push(start);
    if (start + windowSize >= length) break;
  }
  return starts.length ? starts : [0];
}

function hann(size: number): Float32Array {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / Math.max(1, size - 1));
  }
  return window;
}

function chooseWindowSize(sampleRate: number): number {
  if (sampleRate >= 88_200) return 4096;
  if (sampleRate >= 44_100) return 2048;
  return 1024;
}

function cloneChannels(channels: Float32Array[]): Float32Array[] {
  return channels.map((channel) => new Float32Array(channel));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}
