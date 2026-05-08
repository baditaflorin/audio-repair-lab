# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser logging should help development without
leaking private filenames or audio details in production.

## Decision

Use minimal browser console output. Development may log capability checks and
processing timing. Production should avoid console noise except unexpected
errors routed through the global error UI.

## Consequences

- No server-side structured logging exists.
- Private audio metadata is not logged intentionally.

## Alternatives Considered

- Client log collection: Rejected for v1 privacy and simplicity.
