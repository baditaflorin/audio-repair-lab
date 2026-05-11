import type { HumFrequencyOption } from "../types";

export interface BiquadCoefficients {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

const harmonicCount = 6;
const defaultQ = 32;

export function notchCoefficients(
  centerHz: number,
  sampleRate: number,
  q = defaultQ
): BiquadCoefficients {
  const safeQ = Math.max(1, q);
  const omega = (2 * Math.PI * centerHz) / Math.max(1, sampleRate);
  const cos = Math.cos(omega);
  const alpha = Math.sin(omega) / (2 * safeQ);
  const a0 = 1 + alpha;

  return {
    b0: 1 / a0,
    b1: (-2 * cos) / a0,
    b2: 1 / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0
  };
}

export function applyBiquad(input: Float32Array, coeffs: BiquadCoefficients): Float32Array {
  const output = new Float32Array(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < input.length; i += 1) {
    const x = input[i] ?? 0;
    const y = coeffs.b0 * x + coeffs.b1 * x1 + coeffs.b2 * x2 - coeffs.a1 * y1 - coeffs.a2 * y2;
    output[i] = y;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
  }
  return output;
}

export function applyZeroPhaseBiquad(
  input: Float32Array,
  coeffs: BiquadCoefficients
): Float32Array {
  const forward = applyBiquad(input, coeffs);
  const reversed = forward.slice().reverse();
  const reversedFiltered = applyBiquad(reversed, coeffs);
  return new Float32Array(reversedFiltered).reverse();
}

export function detectHumFrequency(channels: Float32Array[], sampleRate: number): 50 | 60 {
  const channel = channels[0];
  if (!channel || channel.length < sampleRate / 4) return 60;

  const length = Math.min(channel.length, sampleRate * 4);
  const subset = channel.subarray(0, length);
  const energyAt = (frequency: number) =>
    measureSinusoidEnergy(subset, sampleRate, frequency) +
    measureSinusoidEnergy(subset, sampleRate, frequency * 2) +
    measureSinusoidEnergy(subset, sampleRate, frequency * 3);

  const energy50 = energyAt(50);
  const energy60 = energyAt(60);
  return energy60 >= energy50 ? 60 : 50;
}

export function resolveHumFrequency(
  option: HumFrequencyOption,
  channels: Float32Array[],
  sampleRate: number
): 50 | 60 {
  if (option === "50") return 50;
  if (option === "60") return 60;
  return detectHumFrequency(channels, sampleRate);
}

export function removeHumFromChannels(
  channels: Float32Array[],
  sampleRate: number,
  fundamental: 50 | 60,
  options: { harmonics?: number; q?: number } = {}
): Float32Array[] {
  const harmonics = Math.max(1, options.harmonics ?? harmonicCount);
  const q = options.q ?? defaultQ;
  const coefficients: BiquadCoefficients[] = [];
  for (let harmonic = 1; harmonic <= harmonics; harmonic += 1) {
    const frequency = fundamental * harmonic;
    if (frequency >= sampleRate / 2 - 5) break;
    coefficients.push(notchCoefficients(frequency, sampleRate, q));
  }
  if (coefficients.length === 0) {
    return channels.map((channel) => new Float32Array(channel));
  }
  return channels.map((channel) => {
    let output = new Float32Array(channel.length);
    output.set(channel);
    for (const coeffs of coefficients) {
      const next = applyZeroPhaseBiquad(output, coeffs);
      output = new Float32Array(next.length);
      output.set(next);
    }
    return output;
  });
}

function measureSinusoidEnergy(
  samples: Float32Array,
  sampleRate: number,
  frequency: number
): number {
  if (frequency <= 0 || frequency >= sampleRate / 2) return 0;
  const omega = (2 * Math.PI * frequency) / sampleRate;
  let sumCos = 0;
  let sumSin = 0;
  const length = samples.length;
  for (let i = 0; i < length; i += 1) {
    const value = samples[i] ?? 0;
    sumCos += value * Math.cos(omega * i);
    sumSin += value * Math.sin(omega * i);
  }
  const norm = 2 / Math.max(1, length);
  const real = sumCos * norm;
  const imag = sumSin * norm;
  return real * real + imag * imag;
}
