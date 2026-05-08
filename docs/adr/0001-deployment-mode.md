# 0001 - Deployment Mode

## Status

Accepted

## Context

Audio Repair Lab should make audio cleanup available without a paid desktop
suite or a hosted processing service. The app handles user audio, so privacy
and low operational burden matter. GitHub Pages is the preferred deployment
surface unless runtime auth, secrets, shared writes, or server-only compute are
required.

## Decision

Use Mode A: Pure GitHub Pages.

The v1 app runs fully in the browser with Web Audio for decoding/playback,
Web Workers for CPU isolation, FFT-based DSP for noise cleanup, browser storage
for local session metadata, and static assets served from the repository. No
runtime backend, auth service, API server, or database is required.

## Consequences

- User audio stays local to the browser by default.
- Deployment is a static publish to `main` branch `/docs`.
- Runtime secrets are not possible or needed.
- Heavy ML/DSP modules must be lazy-loaded as browser-compatible static assets.
- GitHub Pages cannot set arbitrary COOP/COEP headers, so threaded WASM and
  model runtimes that require cross-origin isolation are not v1 dependencies.

## Alternatives Considered

- Mode B: Rejected because no offline data generation pipeline is needed.
- Mode C: Rejected because there are no v1 server-side writes, secrets, or auth.
