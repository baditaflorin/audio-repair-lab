# 0002 - Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The app needs responsive UI, expensive local audio processing, export, and a
clear path for future browser ML modules.

## Decision

Use a static React application with feature modules under `src/features/`.
Audio decoding and playback stay on the main thread through Web Audio. Heavy
PCM processing runs in `src/features/audio/workers/` behind Comlink. Shared DSP
helpers live in `src/features/audio/lib/`. Reusable UI pieces live in
`src/components/`.

## Consequences

- UI rendering and audio processing are separated.
- Processing functions can be unit-tested without a DOM.
- Future WASM or WebGPU adapters can sit behind the same worker boundary.

## Alternatives Considered

- Single-threaded UI processing: Rejected because longer files would freeze the
  interface.
- Runtime API processing: Rejected by ADR 0001.
