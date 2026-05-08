# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Browser audio APIs can fail because of unsupported formats, autoplay policy,
memory pressure, or worker errors.

## Decision

Represent user-facing failures as typed `Error` messages at feature boundaries.
Show a global toast-style error panel with clear recovery actions. Worker calls
must return serializable results or throw errors that the UI catches.

## Consequences

- The app avoids silent failures.
- Processing failures do not leave controls permanently disabled.

## Alternatives Considered

- Console-only errors: Rejected because production users need visible recovery.
