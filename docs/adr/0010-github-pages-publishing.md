# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

GitHub Pages must work from day one, while project documentation and ADRs also
live under `docs/`.

## Decision

Serve GitHub Pages from `main` branch `/docs`. Vite builds the app into `docs/`
with `emptyOutDir: false` so ADRs and documentation are preserved. Helper
scripts clean only generated Pages assets before each build. The Vite base path
is `/audio-repair-lab/`. The build copies `index.html` to `404.html` for SPA
fallback. A `.nojekyll` file is committed.

## Consequences

- The live URL is `https://baditaflorin.github.io/audio-repair-lab/`.
- Build artifacts must be committed.
- Old generated assets are cleaned by script instead of deleting `docs/`.
- No custom domain is configured in v1.

## Alternatives Considered

- `gh-pages` branch: Rejected to keep the repo simpler.
- `main /` root publishing: Rejected because root build artifacts would clutter
  source files.
