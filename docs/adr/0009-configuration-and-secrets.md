# 0009 - Configuration and Secrets Management

## Status

Accepted

## Context

Frontend secrets are not secrets. Mode A should not require credentials.

## Decision

Use only public build-time configuration exposed through Vite. Commit
`.env.example` with placeholders. Do not read API keys, tokens, or private
values in the frontend. Use gitleaks in pre-commit to block accidental secrets.

## Consequences

- The app can be forked and deployed without secret setup.
- Any future feature needing a secret must use an offline generator or a new
  Mode C ADR.

## Alternatives Considered

- Encrypted frontend secrets: Rejected because they are still recoverable.
