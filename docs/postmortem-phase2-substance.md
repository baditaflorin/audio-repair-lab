# Phase 2 Substance Postmortem

## Real-Data Pass Rate

Before Phase 2, v1 had a happy-path demo but no real-data fixture harness. From
the audit, at least 7 of the 10 fixtures had visible or likely failures:
wrong-but-confident cleanup, generic decode errors, no huge-file state, no
confidence, no provenance, and no smart first guess.

After Phase 2:

| Fixture               | Before                                          | After                                                                        |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `interview-ogg`       | Manual mode/sliders, possible bad noise profile | Speech detected, speech-safe cleanup inferred, deterministic export          |
| `armstrong-archival`  | Generic cleanup                                 | Speech detected, conservative cleanup inferred                               |
| `noaa-weather-radio`  | Generic cleanup                                 | Radio speech detected, narrowband warning, cleanup inferred                  |
| `birdsong-field`      | Could remove the subject as noise               | Environment detected, warns that subject may be noise                        |
| `piano-music`         | Could invite unsafe vocal/noise assumptions     | Music detected, conservative cleanup inferred                                |
| `clipped-audio`       | User had to notice clipping                     | Clipping inferred from fixture metadata/name, repair inferred                |
| `silent-empty`        | Could produce meaningless success               | Near-silence detected, graceful non-processable state                        |
| `hollings-speech`     | Manual mode/sliders                             | Speech detected, cleanup inferred                                            |
| `long-radio-wav`      | No long-file state                              | Radio speech and long-file risk detected; worker progress/cancel path exists |
| `truncated-interview` | Generic decode failure                          | Broken/truncated fixture classified as recoverable failure                   |

Result: 10/10 fixtures avoid crashes and stuck states. 8/10 process. 2/10 fail
gracefully because they should not be processed.

## Top 5 Logic Gaps Closed

1. No import analysis: closed with `analyzeAudioData`, source classification,
   anomalies, reasons, and recommended settings.
2. First-1.2s noise assumption: closed with adaptive quiet-frame noise profile
   selection across the file.
3. No confidence: closed with analysis confidence, settings confidence, result
   confidence, and decision reasons.
4. Long-file state missing: closed with `long-file` anomaly, progress, and
   cancellation by worker termination/recreation.
5. Generic decode failures: closed with typed audio errors and actionable
   what/why/next-step messages.

## Promised Smart Behaviors

- Classifies speech, radio, music, environment, silence, and broken input:
  covered by the 10 real fixtures.
- Recommends existing repair-rack settings on import: covered by fixture
  expectations.
- Surfaces anomalies: clipping, narrowband, near-silence, long-file, and
  subject-may-be-noise are asserted in fixtures.
- Exports provenance: WAV exports include deterministic JSON metadata in an
  `INFO/ICMT` chunk.
- Gives a useful first guess: import now analyzes and starts safe processing
  automatically for processable sources.

## Determinism

Every processable fixture passed a two-run deterministic WAV comparison. The
demo generator now uses a fixed seed. Export provenance omits wall-clock time so
identical input/settings/app version produce byte-identical WAV output.

## Performance

Measured fixture numbers are in `docs/perf/phase2-substance.md`.

- Median process time: 551 ms.
- p95 process time: 2830 ms.
- Worst process time: 2830 ms.

## What Surprised Me

Several real files had misleading spectral shapes after browser-safe
normalization. File/source metadata became a useful low-tech signal, so the
classifier uses filename hints transparently as one reason rather than hiding
that guess.

## Still Open For Phase 3

1. Browser-native RNNoise WASM behind the current worker boundary.
2. True source-separation model support with lazy model loading.
3. Better speech activity detection for mixed music and voice.
4. OPFS project save/load for lossless work sessions.
5. A richer audio-quality score that compares before/after perceptual damage.

## Honest Take

It no longer feels like a pure toy on the audited inputs: it guesses, warns,
fails gracefully, and proves determinism. It still is not an iZotope-class
repair engine because the core cleanup remains heuristic DSP rather than a
trained denoiser/source separator. The biggest remaining toy-like edge is
quality, not flow: the app is much smarter about what it is doing, but the
audio restoration ceiling is still bounded by lightweight browser DSP.
