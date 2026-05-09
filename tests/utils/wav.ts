import { readFileSync } from "node:fs";
import type { AudioData } from "../../src/features/audio/types";
import { hashAudioData } from "../../src/features/audio/lib/hash";

export function readFixtureWav(path: string, name: string): AudioData {
  const bytes = readFileSync(path);
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`${name} is not a WAV file.`);
  }

  let offset = 12;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;

    if (id === "fmt ") {
      channels = bytes.readUInt16LE(start + 2);
      sampleRate = bytes.readUInt32LE(start + 4);
      bitsPerSample = bytes.readUInt16LE(start + 14);
    }
    if (id === "data") {
      dataOffset = start;
      dataSize = size;
      break;
    }

    offset = start + size + (size % 2);
  }

  if (channels <= 0 || sampleRate <= 0 || bitsPerSample !== 16 || dataOffset < 0) {
    throw new Error(`${name} has an unsupported WAV layout.`);
  }

  const frameCount = Math.floor(dataSize / (channels * 2));
  const output = Array.from({ length: channels }, () => new Float32Array(frameCount));

  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = bytes.readInt16LE(dataOffset + (frame * channels + channel) * 2);
      const channelData = output[channel];
      if (!channelData) throw new Error(`${name} channel ${channel} is missing.`);
      channelData[frame] = sample / 32768;
    }
  }

  const audio = {
    name,
    sampleRate,
    channels: output,
    sourceSizeBytes: bytes.length,
    originalChannelCount: channels
  };

  return {
    ...audio,
    sourceHash: hashAudioData(audio)
  };
}
