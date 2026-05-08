/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __APP_BUILT_AT__: string;
declare const __APP_REPO_URL__: string;
declare const __APP_SUPPORT_URL__: string;

declare module "fft.js" {
  export default class FFT {
    constructor(size: number);
    createComplexArray(): number[];
    realTransform(out: number[], data: ArrayLike<number>): void;
    completeSpectrum(spectrum: number[]): void;
    inverseTransform(out: number[], data: ArrayLike<number>): void;
    fromComplexArray(complex: ArrayLike<number>, storage?: number[]): number[];
  }
}
