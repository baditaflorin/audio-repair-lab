# 0003 - Frontend Framework and Build Tooling

## Status

Accepted

## Context

The frontend is the main product. It needs strict typing, fast local iteration,
GitHub Pages compatibility, tests, and a small production bundle.

## Decision

Use React, TypeScript strict mode, Vite, Tailwind CSS, Vitest, and Playwright.
Use `@tanstack/react-query` for cacheable async metadata, `zod` for validating
stored session records, `comlink` for worker calls, `idb` for IndexedDB, and
`lucide-react` for icons.

## Consequences

- Vite can build directly into the Pages directory.
- React keeps complex state and controls manageable.
- The app must lazy-load heavy audio modules to respect the initial bundle
  budget.

## Alternatives Considered

- Plain TypeScript without a framework: Rejected because the control surface is
  stateful enough to benefit from components.
- Next.js: Rejected because static Pages hosting does not need server features.
