# 0044 - Confidence Model

## Status

Accepted

## Context

The app must avoid confidently wrong output. Successful processing is not the
same as safe or appropriate processing.

## Decision

Attach confidence to source classification, recommended settings, and process
results. Confidence is a number from 0 to 1 plus human-readable reasons.
Warnings and low-confidence decisions flow into the UI and export provenance.

## Consequences

- Users can see when the app is unsure.
- Exports remain auditable downstream.
- Heuristics can improve without changing the public concept of confidence.

## Alternatives Considered

- Binary warnings only. Rejected because borderline cases need nuance.
