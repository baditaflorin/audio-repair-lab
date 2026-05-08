# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no generated public data artifacts. The app still needs stable
contracts for local build metadata and local browser storage.

## Decision

Expose build metadata through Vite compile-time constants:

- `version`: package version.
- `commit`: short git commit hash at build time.
- `builtAt`: ISO timestamp.
- `repoUrl`: `https://github.com/baditaflorin/audio-repair-lab`.
- `supportUrl`: `https://www.paypal.com/paypalme/florinbadita`.

Local session records are versioned with schema `audio-repair-session/v1`.

## Consequences

- The page can display version and commit without a backend.
- No `/data` artifacts are required in v1.
- Breaking local storage changes must bump the schema version.

## Alternatives Considered

- Fetching a JSON manifest: Rejected because compile-time constants are simpler
  and avoid an extra request.
