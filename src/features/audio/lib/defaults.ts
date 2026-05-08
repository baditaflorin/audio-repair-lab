import type { ProcessSettings } from "../types";

export const defaultSettings: ProcessSettings = {
  mode: "noise",
  noiseReduction: 0.62,
  noiseSensitivity: 0.55,
  vocalStrength: 0.82,
  vocalTarget: "vocals",
  repairStrength: 0.58,
  removeClicks: true,
  softenClipping: true
};
