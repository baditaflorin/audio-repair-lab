# 0048 - Determinism and Reproducibility Guarantees

## Status

Accepted

## Context

Identical input and settings must produce identical output, and exports must be
inspectable later.

## Decision

Processing is deterministic. The demo generator uses a fixed seed. Exported WAV
metadata includes deterministic provenance: schema version, app version, source
hash, settings, confidence, warnings, operations, and run id derived from
source+settings+version. Wall-clock timestamps stay out of the WAV bytes to
preserve byte-identical output.

## Consequences

- Deterministic export tests are possible.
- The UI may still show wall-clock activity history, but it is not embedded in
  deterministic artifacts.

## Alternatives Considered

- Embed export timestamp in the WAV. Rejected because it breaks byte-identical
  reproducibility.
