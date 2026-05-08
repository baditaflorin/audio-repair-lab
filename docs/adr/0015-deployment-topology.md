# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode C deployment topology is not needed for a static browser app.

## Decision

Deploy only through GitHub Pages from `main` branch `/docs`. No `deploy/`
directory, Docker Compose stack, nginx, Prometheus, or GHCR image is included.

## Consequences

- Public surface area is limited to static files.
- Operational maintenance is minimal.
- If a future runtime backend is added, this ADR must be superseded.

## Alternatives Considered

- Docker backend on port 25342: Rejected by ADR 0001.
