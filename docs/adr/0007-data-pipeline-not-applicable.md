# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

This ADR is mandatory for Mode B projects. Audio Repair Lab is Mode A.

## Decision

No data generation pipeline is included in v1. `make data` is an explicit no-op.

## Consequences

- There are no generated JSON, Parquet, or SQLite artifacts.
- No scheduled jobs or release-hosted data files are needed.

## Alternatives Considered

- Mode B artifact generation: Rejected by ADR 0001.
