# Phase 2 Substance Real-Data Audit

Phase 1 proved the happy path. Phase 2 uses this fixture set as the grading
rubric for whether Audio Repair Lab behaves like useful audio software on real
user material.

## Fixture Set

| ID                    | Real-world input                                                                                                                             | Shape                                     | v1 behavior                                                                                               | Should have done                                                                          | Failure mode              | Manual work v1 forced                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------- |
| `interview-ogg`       | https://commons.wikimedia.org/wiki/Special:Redirect/file/AudioEditExample-interview.ogg                                                      | Short interview speech, mild room/noise   | Imports and waits for user settings. Default clean can learn voice as noise if speech starts immediately. | Detect speech/interview, use speech-safe cleanup, surface confidence.                     | Wrong-but-confident risk. | User must choose mode and sliders by ear.                      |
| `armstrong-archival`  | https://commons.wikimedia.org/wiki/Special:Redirect/file/Phrase_de_Neil_Armstrong.oga                                                        | Archival spoken phrase                    | Imports, generic cleanup. No archival/radio-ish recognition.                                              | Detect speech with limited bandwidth and avoid aggressive gating.                         | Weak domain logic.        | User must infer that gentle speech cleanup is safer.           |
| `noaa-weather-radio`  | https://commons.wikimedia.org/wiki/Special:Redirect/file/NOAA_Weather_Radio_MKE-KEC60_Weekly_Test.ogg                                        | Narrowband weather radio speech           | Imports, but generic gate treats static and voice without a radio profile.                                | Detect radio speech, preserve intelligibility, warn about narrowband source.              | Wrong-but-confident risk. | User must know radio speech should not be treated like music.  |
| `birdsong-field`      | https://commons.wikimedia.org/wiki/Special:Redirect/file/Birdsong_morning_01.ogg                                                             | Environmental subject audio               | App has no way to know the "noise" is the point.                                                          | Detect non-speech/non-music environment and warn that cleanup may remove desired content. | Wrong intent.             | User must protect subject audio manually.                      |
| `piano-music`         | https://commons.wikimedia.org/wiki/Special:Redirect/file/Poem_of_Music_(Piano_Etude)_-_Student_Kim_Hui.ogg                                   | Music, no lead vocal                      | Default repair rack still offers vocal and clean paths as if equally safe.                                | Detect music/no-vocal-likely and recommend conservative cleanup.                          | Wrong-but-confident risk. | User must avoid destructive voice/noise settings.              |
| `clipped-audio`       | https://commons.wikimedia.org/wiki/Special:Redirect/file/Digital_audio_clipping_example_-_LVB5_fragment_4._10dB_overload.ogg                 | Known clipping example                    | Repair can soften clips, but app does not detect clipping before the user asks.                           | Detect clipping on import and choose repair/chain.                                        | Feels dumb.               | User must notice and select repair.                            |
| `silent-empty`        | https://commons.wikimedia.org/wiki/Special:Redirect/file/Short_Silent,_Empty_Audio.ogg                                                       | Valid silent/empty audio                  | Imports as a normal source, then processing can produce a meaningless "success".                          | Detect silence/empty and say there is nothing useful to repair.                           | Wrong-but-confident.      | User must discover by playing it.                              |
| `hollings-speech`     | https://commons.wikimedia.org/wiki/Special:Redirect/file/Sen._Fritz_Hollings_in_Support_of_the_Telephone_Advertising_Consumer_Rights_Act.ogg | Spoken archive, likely long/narrow speech | Imports if browser supports it; no long-speech settings inference.                                        | Detect speech and estimate safe processing cost.                                          | Manual burden.            | User must pick settings and wait without a good preview.       |
| `long-radio-wav`      | https://commons.wikimedia.org/wiki/Special:Redirect/file/NOAA_Radio_Station_in_Robinson,_TX_(November_23,_2021).wav                          | Larger WAV/radio input                    | Full-buffer decode and process with no preflight, progress budget, or cancellation.                       | Preflight size/duration, show progress, allow cancellation, avoid stuck states.           | Obvious/stuck.            | User has no way to know whether the app is still healthy.      |
| `truncated-interview` | Truncated transfer derived from `AudioEditExample-interview.ogg`                                                                             | Partial/corrupt user upload               | Decode failure is generic browser failure text.                                                           | Identify truncated/corrupt audio and offer a clear next step.                             | Recoverable but vague.    | User must guess whether the file, browser, or app is at fault. |

## Top 5 Logic Gaps

1. Import has no domain analysis. The app does not infer speech, music, radio, environment, clipping, silence, huge input, or broken input before the user acts.
2. Noise profiling assumes the first 1.2 seconds are noise. Real speech and music often begin immediately, so v1 can learn the subject as noise.
3. No confidence model exists. Processing can succeed technically while being unsafe or low-confidence, and the UI/export do not say so.
4. Long and large files are not separate states. There is no preflight budget, progress, cancellation, or recovery path.
5. Decode and format failures are not domain-aware. Empty, truncated, unsupported, multichannel, and browser-decoder failures collapse into generic messages.

## Top 3 Intuition Failures

1. Importing a file does not immediately produce a useful first guess.
2. A successful export can be confidently wrong because it omits warnings, confidence, and provenance.
3. Processing long audio can feel frozen because v1 has no progress, cancellation, or explicit state machine.

## Top 3 Feels-Stupid Moments

1. The user must decide whether the file is speech, music, radio, environment, clipped, or silent.
2. The user must tune sliders before the app has measured the audio.
3. The user must diagnose bad decode results and bad audio results by ear.

## What Smart Means For Audio Repair Lab

- On import, classify the source as speech, music, radio speech, environmental sound, silence, large, or broken with confidence and reasons.
- Recommend a safe repair mode and settings immediately; the user corrects a guess instead of configuring from scratch.
- Learn noise from detected quiet/noise-like regions rather than blindly from the beginning.
- Surface anomalies such as clipping, clicks, hum, silence, low SNR, channel collapse, channel mismatch, and large-file risk before export.
- Export deterministic audio plus provenance: source hash, app version, schema version, parameters, confidence, warnings, and decision reasons.

## Phase 2 Substance Success Metrics

- Real-data pass rate: at least 7 of 10 fixtures complete import, inference, process, preview/export with no manual mode or slider changes.
- Robustness: 10 of 10 fixtures avoid crashes and stuck states.
- Graceful failure: 10 of 10 failed imports or unsafe outputs explain what failed, why, and what to do next.
- Determinism: identical input/settings produce byte-identical PCM and WAV output across two runs for every processable fixture.
- Performance honesty: files over 30 seconds show progress; operations over 5 seconds are cancellable.
- Confidence: every process result and export carries an overall confidence and per-decision reasons.
- Speed: median import-to-useful-first-guess under 1 second for fixtures up to 10 MB on a developer laptop.

## Out Of Scope

- No backend, auth, cloud processing, sharing, or cross-device sync.
- No visual polish pass, redesign, command palette, OG images, or marketing work.
- No DAW timeline, batch processor, plugin format, or multitrack editor.
- No architecture mode change. Phase 2 remains Mode A, pure GitHub Pages.
- No large ML model bundle until a later ADR proves the size, licensing, and Pages runtime story.
