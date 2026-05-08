import { wrap } from "comlink";
import type { AudioProcessorApi } from "./audioProcessor.worker";

export function createAudioProcessor() {
  const worker = new Worker(new URL("./audioProcessor.worker.ts", import.meta.url), {
    type: "module",
    name: "audio-processor"
  });

  return {
    api: wrap<AudioProcessorApi>(worker),
    dispose: () => worker.terminate()
  };
}
