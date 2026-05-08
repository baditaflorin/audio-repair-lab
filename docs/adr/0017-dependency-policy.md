# 0017 - Dependency Policy

## Status

Accepted

## Context

Audio software attracts custom DSP experiments, but the project should remain
maintainable and trustworthy.

## Decision

Prefer production-ready libraries for framework, build, worker messaging,
storage, schema validation, icons, testing, and FFT primitives. Keep custom DSP
small, tested, and isolated when no browser-native library offers the exact
repair behavior.

## Consequences

- Dependency updates must be reviewed for bundle size and security.
- Custom signal-processing code lives behind focused tests.
- `npm audit` high/critical issues block releases.

## Alternatives Considered

- Hand-rolled app framework and FFT: Rejected as unnecessary risk.
