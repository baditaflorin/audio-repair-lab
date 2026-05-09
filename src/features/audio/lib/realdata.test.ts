import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readFixtureWav } from "../../../../tests/utils/wav";
import { analyzeAudioData } from "./analysis";
import { encodeWav } from "./audioFile";
import { processAudioData } from "./dsp";

interface FixtureExpectation {
  id: string;
  fixtureFile: string;
  expected: {
    kind: string;
    processable: boolean;
    recommendedMode: string;
    minimumConfidence: number;
    requiredReasons: string[];
    requiredAnomalies: string[];
  };
}

const fixtureDir = join(process.cwd(), "test/fixtures/realdata");
const expectations = readdirSync(fixtureDir)
  .filter((file) => file.endsWith(".expected.json"))
  .map((file) => JSON.parse(readFileSync(join(fixtureDir, file), "utf8")) as FixtureExpectation);

describe("real-data substance fixtures", () => {
  for (const fixture of expectations) {
    it(`${fixture.id} produces the expected analysis and deterministic output`, async () => {
      const sourcePath = join(fixtureDir, fixture.fixtureFile);

      if (!fixture.fixtureFile.endsWith(".wav")) {
        expect(statSync(sourcePath).size).toBeLessThan(8192);
        expect(fixture.expected.kind).toBe("broken");
        expect(fixture.expected.requiredAnomalies).toContain("decode-failed");
        return;
      }

      const audio = readFixtureWav(sourcePath, fixture.fixtureFile);
      const analysis = analyzeAudioData(audio);

      expect(analysis.kind).toBe(fixture.expected.kind);
      expect(analysis.processable).toBe(fixture.expected.processable);
      expect(analysis.recommendedSettings.mode).toBe(fixture.expected.recommendedMode);
      expect(analysis.confidence).toBeGreaterThanOrEqual(fixture.expected.minimumConfidence);
      for (const reason of fixture.expected.requiredReasons) {
        expect(analysis.reasons.join(" ").toLowerCase()).toContain(reason);
      }
      for (const anomaly of fixture.expected.requiredAnomalies) {
        expect(analysis.anomalies).toContain(anomaly);
      }

      if (!analysis.processable) return;

      const first = processAudioData(audio, analysis.recommendedSettings, {
        analysis,
        appVersion: "0.2.0"
      });
      const second = processAudioData(audio, analysis.recommendedSettings, {
        analysis,
        appVersion: "0.2.0"
      });

      expect(first.confidence).toBeGreaterThan(0);
      expect(first.provenance?.sourceHash).toBe(analysis.sourceHash);
      expect(first.provenance?.runId).toBe(second.provenance?.runId);

      const firstBytes = await blobBytes(encodeWav(first, first.provenance));
      const secondBytes = await blobBytes(encodeWav(second, second.provenance));
      expect(Buffer.compare(Buffer.from(firstBytes), Buffer.from(secondBytes))).toBe(0);
    }, 30_000);
  }
});

function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read blob."));
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });
}
