# 0046 - Performance Budgets

## Status

Accepted

## Context

Long audio must not look frozen. Phase 2 needs honest performance behavior,
not only faster code.

## Decision

Set budgets:

- Import-to-analysis first guess: median under 1 second for fixtures up to 10 MB.
- Processing under 300 ms may complete silently.
- Processing over 300 ms shows progress.
- Processing over 5 seconds must be cancellable.
- Fixtures track median, p95, and worst processing time.

## Consequences

- Long processing uses worker isolation and progress reporting.
- The smoke and fixture harnesses record timings for postmortem evidence.

## Alternatives Considered

- Optimize only after user complaints. Rejected because the real fixture set
  already contains long/large input risk.
