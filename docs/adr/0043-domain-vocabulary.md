# 0043 - Domain Vocabulary and UI Language

## Status

Accepted

## Context

Errors like "decodeAudioData failed" are implementation language, not audio
repair language.

## Decision

User-facing labels and errors should use audio-domain terms: speech, music,
radio speech, clipping, click, hum, silence, truncated file, unsupported format,
confidence, and safe repair. Implementation names stay internal.

## Consequences

- Errors must include what failed, why it likely happened, and the next useful
  action.
- Tests may assert domain messages for known bad fixtures.

## Alternatives Considered

- Preserve browser/runtime errors. Rejected because they are not actionable.
