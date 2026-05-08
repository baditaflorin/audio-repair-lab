# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

The app needs to remember recent local sessions and settings without uploading
audio or requiring accounts.

## Decision

Use IndexedDB through `idb` for recent session metadata and settings. Do not
store full audio files in v1 by default. Use in-memory `AudioBuffer` data during
processing and Blob URLs for preview/export.

## Consequences

- Settings survive refreshes.
- Private audio is not silently persisted.
- Future OPFS support can be added for explicit local project files.

## Alternatives Considered

- `localStorage`: Rejected for anything beyond tiny preferences.
- Runtime database: Rejected by ADR 0001.
