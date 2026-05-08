# Contributing

Thanks for helping make audio repair tools more accessible.

## Local Setup

```sh
npm install
make install-hooks
make dev
```

## Expectations

- Use Conventional Commits, for example `feat: add waveform zoom`.
- Keep the app static and privacy-preserving unless an ADR changes that.
- Add tests for audio processing logic and any user-facing workflow.
- Run `make lint test build smoke` before pushing.
- Do not commit secrets, private audio, or generated scratch files.

## ADRs

Significant architecture decisions live in `docs/adr/`. Write or update the ADR
before implementing the decision.
