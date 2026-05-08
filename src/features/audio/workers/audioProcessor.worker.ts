import { expose } from "comlink";
import { processAudioData } from "../lib/dsp";
import type { AudioData, ProcessResult, ProcessSettings } from "../types";

export interface AudioProcessorApi {
  process(audio: AudioData, settings: ProcessSettings): Promise<ProcessResult>;
}

const api: AudioProcessorApi = {
  async process(audio, settings) {
    return processAudioData(audio, settings);
  }
};

expose(api);
