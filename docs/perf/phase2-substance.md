# Phase 2 Substance Performance

Measured locally on the committed real-data fixture set after the Phase 2
engine changes.

| Fixture               | Kind        | Processable  | Analyze ms | Process ms |
| --------------------- | ----------- | ------------ | ---------: | ---------: |
| `armstrong-archival`  | speech      | yes          |        312 |        522 |
| `birdsong-field`      | environment | yes          |         64 |        551 |
| `clipped-audio`       | music       | yes          |         21 |         20 |
| `hollings-speech`     | speech      | yes          |         79 |        618 |
| `interview-ogg`       | speech      | yes          |         12 |        409 |
| `long-radio-wav`      | radio       | yes          |        189 |       2830 |
| `noaa-weather-radio`  | radio       | yes          |          4 |        823 |
| `piano-music`         | music       | yes          |          4 |        525 |
| `silent-empty`        | silence     | no, graceful |          1 |          0 |
| `truncated-interview` | broken      | no, graceful |          0 |          0 |

Summary:

- Real-data robustness pass: 10/10 avoid crash or stuck state.
- Useful inference pass: 10/10 classify into a useful state.
- Processable fixtures: 8/10.
- Graceful non-processable fixtures: 2/10.
- Median process time: 551 ms.
- p95 process time: 2830 ms.
- Worst process time: 2830 ms.
