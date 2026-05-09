# Phase 2 State Taxonomy

Audio Repair Lab uses explicit states so users cannot get stuck in hidden
half-loaded or half-processed conditions.

| State               | Meaning                                                   | User-actionable exits                                          |
| ------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `idle`              | No source loaded.                                         | Import audio, load demo.                                       |
| `importing`         | File is being read and decoded.                           | Wait; recoverable errors return to prior source or idle.       |
| `analyzing`         | PCM is loaded and source analysis is running.             | Wait; recoverable errors return to loaded source.              |
| `loaded`            | Source is decoded and analyzed with recommended settings. | Process, change settings, import another source.               |
| `processing`        | Worker is producing processed audio.                      | Cancel, wait.                                                  |
| `processed`         | Processed preview/export is available.                    | Export, process again, change settings, import another source. |
| `cancelled`         | User cancelled processing and prior source is intact.     | Process again, change settings, import another source.         |
| `recoverable-error` | A known issue occurred and user work is intact.           | Follow next step, import another source, retry when available. |
| `fatal-error`       | Unexpected internal failure.                              | Reset by importing another source or reloading.                |

## Concurrency Rules

- Importing a new file invalidates any processed output from the prior file.
- Processing while already processing becomes cancellation, not a second run.
- Cancelling terminates the worker, creates a fresh worker, clears progress, and
  preserves the source and inferred settings.
- Export is disabled until a processed result exists.
- User settings changed during processing apply to the next run, not the
  in-flight worker.
