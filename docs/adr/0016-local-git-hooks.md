# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project explicitly avoids GitHub Actions. Checks must run locally.

## Decision

Use `.githooks/` wired by `make install-hooks`. Pre-commit runs lint,
format-check, typecheck, and `gitleaks protect --staged`. Commit-msg validates
Conventional Commits. Pre-push runs tests, build, verifies `docs/index.html`,
and runs smoke.

## Consequences

- Contributors must install local hooks.
- The repo documents manual equivalents through Make targets.

## Alternatives Considered

- Lefthook: Rejected to avoid an extra hook manager dependency.
