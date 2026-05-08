# Postmortem

## What Was Built

Audio Repair Lab v0.1.0 is a static GitHub Pages app for local browser audio
repair. It imports browser-decodable audio, generates a noisy demo clip, renders
a waveform, previews original and processed audio, runs worker-based DSP, and
exports WAV output. The live page links to:

- https://github.com/baditaflorin/audio-repair-lab
- https://www.paypal.com/paypalme/florinbadita

The page also displays the package version, build commit, and build timestamp.

## Was Mode A Correct?

Yes. Mode A was the right choice for v1. Import, processing, preview, local
metadata, and export all work without auth, secrets, writes, or a runtime API.
Mode B would add unnecessary data artifacts. Mode C would add operational
surface area without solving a v1 blocker.

## What Worked

- GitHub Pages from `main` `/docs` worked cleanly from the first scaffold.
- Vite's base path and static build fit Pages well.
- Comlink kept worker processing ergonomic.
- The smoke test catches the most likely Pages regressions: base path, links,
  demo generation, processing, and export UI.

## What Did Not Work

- Build metadata cannot point at the exact commit that contains the metadata
  refresh without a circular rebuild. The page shows the source commit used for
  the Pages build.
- GitHub Pages cannot set arbitrary COOP/COEP headers, so some high-performance
  threaded WASM stacks are not safe to assume in v1.

## What Surprised Us

The static build stayed well under the initial 200KB gzip budget even with
React, TanStack Query, Comlink, idb, zod, lucide icons, and a split audio worker.

## Accepted Tech Debt

- The v1 cleanup engine is FFT/DSP based and browser-native. RNNoise WASM,
  Demucs/ONNX, and WebGPU FFT adapters are documented as future modules behind
  the existing worker boundary.
- MP3 import relies on browser decoding support. Export is WAV in v1 because it
  is reliable and license-simple in the browser.
- Full project-file persistence is deferred; v1 stores recent session metadata,
  not source audio.

## Next 3 Improvements

1. Add an optional RNNoise WASM adapter with lazy loading and Pages smoke
   coverage.
2. Add an ONNX/Demucs-style separation adapter with model-size budgeting and a
   clear browser support matrix.
3. Add explicit OPFS project save/load for users who want local persisted audio
   drafts.

## Time Spent vs Estimate

Estimated: 4-6 hours for a static v1 scaffold plus working DSP MVP.

Actual: about 3 hours in this implementation pass, including repository setup,
ADRs, frontend, tests, Pages publishing, and postmortem.
