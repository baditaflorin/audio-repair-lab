# 0042 - Inference Engine

## Status

Accepted

## Context

The largest Phase 2 gap is that users must identify the audio domain and choose
repair settings themselves.

## Decision

Add an in-browser analysis engine that derives time-domain and lightweight
spectral features, then classifies the source as speech, radio, music,
environment, silence, broken, or unknown. The engine also infers recommended
settings for the existing repair rack.

## Consequences

- Import produces a useful first guess.
- The classifier remains deterministic and static-hostable.
- Heuristics must be exposed with confidence and reasons so they do not become
  hidden wrongness.

## Alternatives Considered

- Bundle a large ML classifier. Deferred because Pages asset size and
  cross-origin isolation constraints remain unresolved.
