# 0013 - Testing Strategy

## Status

Accepted

## Context

Audio processing has numeric edge cases, and GitHub Pages routing/base paths can
break silently.

## Decision

Use Vitest for logic unit tests and Playwright for one headless smoke path. The
smoke script builds the app, serves `docs/`, opens the Pages-style base path,
generates a demo clip, runs one processor path, and verifies preview/export UI.

## Consequences

- `make test` and `make smoke` are fast local checks.
- No GitHub Actions are added.

## Alternatives Considered

- Browser-only manual testing: Rejected because static publishing needs repeatable
  confidence.
