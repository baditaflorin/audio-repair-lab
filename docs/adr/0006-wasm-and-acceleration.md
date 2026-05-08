# 0006 - WASM Modules and Acceleration

## Status

Accepted

## Context

The product direction includes RNNoise/Demucs/librosa-like workflows and
WebGPU-accelerated FFT. GitHub Pages cannot set arbitrary COOP/COEP headers,
which affects some threaded WASM stacks.

## Decision

For v1, ship worker-based JavaScript DSP with `fft.js` and a WebGPU capability
probe. Keep the worker boundary ready for future RNNoise WASM, ONNX/Demucs, or
WebGPU FFT adapters loaded behind explicit user action. Do not include large
model binaries until they can be versioned, lazy-loaded, licensed cleanly, and
smoke-tested on Pages.

## Consequences

- v1 remains fast to load and static-hostable.
- The UI can accurately report available browser acceleration.
- Heavy ML assets are a future extension, not a hidden runtime dependency.

## Alternatives Considered

- Bundling large model files in v1: Rejected because it would break the asset
  budget and complicate Pages verification.
- Backend ML inference: Rejected by ADR 0001.
