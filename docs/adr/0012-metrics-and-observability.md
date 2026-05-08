# 0012 - Metrics and Observability

## Status

Accepted

## Context

The static app has no backend metrics endpoint. Usage analytics would add a
privacy tradeoff.

## Decision

Ship v1 with no analytics. The UI shows local processing status, duration, and
warnings. Manual smoke tests verify health.

## Consequences

- No PII or usage beacons are collected.
- Product decisions rely on user feedback, issues, and voluntary stars.

## Alternatives Considered

- Plausible or beacon analytics: Deferred until there is a clear need and an
  opt-in privacy ADR.
