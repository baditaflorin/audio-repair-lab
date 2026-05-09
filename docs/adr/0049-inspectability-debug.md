# 0049 - Inspectability and Debug Surface

## Status

Accepted

## Context

Heuristic audio inference needs trust and supportability. Power users should be
able to see what the app inferred and why.

## Decision

Expose a debug surface when the URL contains `?debug=1`. It shows analysis,
confidence, anomalies, settings, history, and processing timings. It is
read-only and does not change app behavior.

## Consequences

- Support can ask users for debug facts without collecting audio.
- Inference changes are easier to verify manually.

## Alternatives Considered

- Console-only debug output. Rejected because production console output should
  stay minimal.
