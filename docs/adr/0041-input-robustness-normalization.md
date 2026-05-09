# 0041 - Input Robustness and Normalization Policy

## Status

Accepted

## Context

Real user audio may be empty, truncated, too large, multichannel, silent,
unsupported by the browser, or shaped unlike speech/music.

## Decision

Add a preflight and normalization layer that classifies file-level risks before
or immediately after decode. Normalize processing input to a safe channel layout
while preserving source-channel facts in analysis metadata. Empty and truncated
files produce actionable recoverable errors.

## Consequences

- The engine can explain decode failures in user language.
- Processing receives predictable PCM, but analysis preserves original facts.
- Huge input thresholds are explicit and testable.

## Alternatives Considered

- Let Web Audio decode errors bubble up. Rejected because users cannot act on
  browser-specific failure text.
