import { expose } from "comlink";
import { processAudioData } from "../lib/dsp";
import type { AudioAnalysis, AudioData, ProcessResult, ProcessSettings } from "../types";

export interface AudioProcessorApi {
  process(
    audio: AudioData,
    settings: ProcessSettings,
    analysis?: AudioAnalysis,
    appVersion?: string,
    progress?: (progress: number) => void
  ): Promise<ProcessResult>;
}

const api: AudioProcessorApi = {
  async process(audio, settings, analysis, appVersion, progress) {
    return processAudioData(audio, settings, {
      analysis,
      appVersion,
      onProgress: progress
    });
  }
};

expose(api);
