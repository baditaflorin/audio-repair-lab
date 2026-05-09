# Real-Data Audio Fixtures

These fixtures are compact excerpts/transcodes of public real-world audio used
for Phase 2 Substance tests. They are not synthetic demos. Each fixture has a
`.expected.json` sibling that states the behavior the engine must satisfy.

Most fixtures are normalized to mono 16 kHz WAV so Node-based deterministic
tests can run without browser audio decoding. `truncated-interview.ogg` is a
corrupt partial transfer derived from the interview source and is expected to
fail preflight with an actionable message.
