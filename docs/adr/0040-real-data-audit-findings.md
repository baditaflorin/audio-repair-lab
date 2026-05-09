# 0040 - Real-Data Audit Findings and Substance Success Metrics

## Status

Accepted

## Context

The v1 app succeeds on the curated demo but does not infer source shape,
processing risk, or failure recovery for user-supplied audio. Phase 2 uses ten
real-world fixtures as the product grading rubric.

## Decision

Use `docs/phase2-substance/realdata-audit.md` as the source of truth for gaps
and success metrics. The Phase 2 test suite must exercise the fixtures in
`test/fixtures/realdata/` and track pass-rate changes in the postmortem.

## Consequences

- Fixtures become regression blockers.
- "Feels smart" is judged by real import/analyze/process/export behavior, not
  the synthetic demo.

## Alternatives Considered

- Continue with only unit tests around DSP helpers. Rejected because it misses
  real domain failures.
