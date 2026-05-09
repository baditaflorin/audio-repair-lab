# 0050 - Interaction Learning Policy

## Status

Accepted

## Context

The app should learn from user corrections without feeling unpredictable.

## Decision

Remember mode/settings overrides within the current browser session by source
kind. When a similar source is imported, use the remembered defaults and state
that they came from the user's previous correction. Do not sync or upload
corrections.

## Consequences

- Similar inputs feel less repetitive.
- Learning is transparent and local.

## Alternatives Considered

- Persistent behavioral learning. Deferred because it needs clearer UX and
  privacy copy.
