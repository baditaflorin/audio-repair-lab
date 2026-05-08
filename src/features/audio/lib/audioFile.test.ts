import { describe, expect, it } from "vitest";
import { encodeWav } from "./audioFile";

describe("encodeWav", () => {
  it("writes a valid RIFF/WAVE blob", async () => {
    const blob = encodeWav({
      sampleRate: 44_100,
      channels: [new Float32Array([0, 0.5, -0.5, 0])]
    });
    const bytes = await blobBytes(blob);
    const header = String.fromCharCode(...bytes.slice(0, 4));
    const wave = String.fromCharCode(...bytes.slice(8, 12));

    expect(blob.type).toBe("audio/wav");
    expect(header).toBe("RIFF");
    expect(wave).toBe("WAVE");
  });
});

function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read blob."));
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });
}
