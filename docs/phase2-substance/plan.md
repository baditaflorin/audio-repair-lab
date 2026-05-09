# Phase 2 Substance Plan

This plan is ranked by impact on the real-data audit, not implementation appeal.
Items reference the Phase 2 catalog numbers.

## Picklist

1. Real-data fixture harness and fuzz edge fixtures. Catalog 1, 4, 5, 35.
2. Decode/preflight normalization for empty, truncated, unsupported, huge, and multichannel inputs. Catalog 2, 3, 4, 5, 15, 33.
3. Source analysis engine for speech/music/radio/environment/silence/broken classification. Catalog 6, 7, 8, 13.
4. Smart settings inference on import. Catalog 6, 8, 9, 10, 39.
5. Confidence model attached to source analysis and processing. Catalog 16, 19, 44.
6. Domain-aware validation and anomaly detection: clipping, clicks, hum, silence, channel mismatch, low SNR. Catalog 12, 18.
7. Speech-safe adaptive noise profile selection. Catalog 6, 12, 15.
8. Actionable error taxonomy: what, why, now what. Catalog 11, 32, 34.
9. Explicit UI state taxonomy and no-stuck-state transitions. Catalog 24, 25, 27.
10. Cancellable long processing by terminating/recreating the worker. Catalog 26, 29.
11. Progress reporting for processing phases. Catalog 28, 29.
12. Deterministic demo generation and deterministic exports. Catalog 35.
13. Export provenance embedded in WAV metadata. Catalog 14, 38.
14. Stable source/session IDs from source hash and settings. Catalog 22, 38.
15. Inspectable debug surface via `?debug=1`. Catalog 37.
16. Activity history for import/analyze/process/export events. Catalog 36.
17. Reprocess output safely through the same pipeline internals. Catalog 20.
18. Preserve user corrections within the session for similar source classes. Catalog 39, 40.
19. Cache source analysis by source hash. Catalog 31.
20. Performance measurement script and before/after docs. Catalog 28.
21. Boundary schemas for analysis, settings, provenance, and fixture expectations. Catalog 33.
22. Domain vocabulary audit of user-facing labels/errors. Catalog 11, 43.

## Shipping Rule

Every behavior-changing item must keep all real-data fixtures non-regressing. A
red fixture blocks the push unless an ADR documents why the tradeoff is
intentional.
