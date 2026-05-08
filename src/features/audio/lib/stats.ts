import type { AudioData, AudioStats } from "../types";

export function getDurationSeconds(audio: Pick<AudioData, "channels" | "sampleRate">): number {
  return (audio.channels[0]?.length ?? 0) / audio.sampleRate;
}

export function computeStats(audio: Pick<AudioData, "channels" | "sampleRate">): AudioStats {
  let peak = 0;
  let sumSquares = 0;
  let samples = 0;

  for (const channel of audio.channels) {
    for (let i = 0; i < channel.length; i += 1) {
      const value = channel[i] ?? 0;
      const abs = Math.abs(value);
      if (abs > peak) peak = abs;
      sumSquares += value * value;
      samples += 1;
    }
  }

  return {
    durationSeconds: getDurationSeconds(audio),
    peak,
    rms: samples > 0 ? Math.sqrt(sumSquares / samples) : 0
  };
}
