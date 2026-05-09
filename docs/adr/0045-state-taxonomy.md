# 0045 - State Taxonomy and State Machine

## Status

Accepted

## Context

Phase 2 requires no stuck states, cancellation, and intentional handling of
loading, analyzed, processing, cancelled, recoverable error, and fatal error.

## Decision

Document reachable states in `docs/phase2-substance/states.md` and model the UI
around explicit app status values. Every status has at least one user-actionable
exit.

## Consequences

- The process button can become cancel while work is running.
- Decode and processing failures preserve user work when possible.
- Concurrency behavior is deterministic.

## Alternatives Considered

- Continue with several booleans. Rejected because boolean combinations create
  unintended half-states.
