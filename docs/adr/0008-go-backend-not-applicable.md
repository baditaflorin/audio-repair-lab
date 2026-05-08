# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

This ADR is mandatory for Mode B and Mode C projects. Audio Repair Lab is
Mode A, and the user-facing workflow does not require a Go service.

## Decision

Skip Go backend layout entirely for v1.

## Consequences

- No `cmd/`, `internal/`, `pkg/`, `api/`, `configs/`, or `deploy/` backend tree
  is created.
- No Docker image is produced.

## Alternatives Considered

- Build-time Go utilities: Rejected because Node scripts already support the
  frontend build and smoke workflow.
