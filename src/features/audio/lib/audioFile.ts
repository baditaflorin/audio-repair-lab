import type { AudioData, ExportProvenance } from "../types";
import { decodeFailureForFile } from "./errors";
import { hashAudioData, stableStringify } from "./hash";

type BrowserAudioContext = typeof AudioContext;

function getAudioContextCtor(): BrowserAudioContext {
  const maybeGlobal = globalThis as typeof globalThis & {
    AudioContext?: BrowserAudioContext;
    webkitAudioContext?: BrowserAudioContext;
  };
  const ctor = maybeGlobal.AudioContext ?? maybeGlobal.webkitAudioContext;
  if (!ctor) {
    throw new Error("This browser does not expose Web Audio decoding.");
  }
  return ctor;
}

export async function decodeAudioFile(file: File): Promise<AudioData> {
  if (file.size === 0) throw decodeFailureForFile(file.name, file.size);
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextCtor = getAudioContextCtor();
  const context = new AudioContextCtor();

  try {
    const buffer = await context.decodeAudioData(arrayBuffer.slice(0));
    const channels = Array.from(
      { length: buffer.numberOfChannels },
      (_, index) => new Float32Array(buffer.getChannelData(index))
    );
    return {
      name: file.name,
      sampleRate: buffer.sampleRate,
      channels,
      sourceHash: hashAudioData({ name: file.name, sampleRate: buffer.sampleRate, channels }),
      sourceSizeBytes: file.size,
      originalChannelCount: buffer.numberOfChannels
    };
  } catch {
    throw decodeFailureForFile(file.name, file.size);
  } finally {
    await context.close();
  }
}

export function encodeWav(
  audio: Pick<AudioData, "sampleRate" | "channels">,
  provenance?: ExportProvenance
): Blob {
  const channelCount = Math.min(2, Math.max(1, audio.channels.length));
  const length = audio.channels[0]?.length ?? 0;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataBytes = length * blockAlign;
  const metadata = provenance ? createInfoChunk(stableStringify(provenance)) : new Uint8Array();
  const buffer = new ArrayBuffer(44 + dataBytes + metadata.length);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes + metadata.length, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < length; i += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const source = audio.channels[channel] ?? audio.channels[0] ?? new Float32Array();
      const sample = Math.max(-1, Math.min(1, source[i] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  new Uint8Array(buffer).set(metadata, 44 + dataBytes);

  return new Blob([buffer], { type: "audio/wav" });
}

export function audioDataToObjectUrl(audio: Pick<AudioData, "sampleRate" | "channels">): string {
  return URL.createObjectURL(encodeWav(audio));
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function createInfoChunk(comment: string): Uint8Array {
  const encoded = new TextEncoder().encode(comment);
  const paddedTextSize = encoded.length + (encoded.length % 2);
  const chunkSize = 4 + 8 + paddedTextSize;
  const paddedChunkSize = chunkSize + (chunkSize % 2);
  const bytes = new Uint8Array(8 + paddedChunkSize);
  const view = new DataView(bytes.buffer);
  writeAscii(view, 0, "LIST");
  view.setUint32(4, paddedChunkSize, true);
  writeAscii(view, 8, "INFO");
  writeAscii(view, 12, "ICMT");
  view.setUint32(16, encoded.length, true);
  bytes.set(encoded, 20);
  return bytes;
}
