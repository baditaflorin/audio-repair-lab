# Architecture

Audio Repair Lab is a Mode A static app served by GitHub Pages. The runtime is
the browser: Web Audio decodes and plays media, a Web Worker performs heavy DSP,
and IndexedDB stores local metadata.

## Context

```mermaid
C4Context
    title Audio Repair Lab Context
    Person(user, "Podcaster or musician", "Repairs local audio")
    System(app, "Audio Repair Lab", "Static browser app on GitHub Pages")
    System_Ext(github, "GitHub", "Source repository and Pages hosting")
    System_Ext(paypal, "PayPal", "Optional support")
    Rel(user, app, "Imports, repairs, previews, exports")
    Rel(app, github, "Links to repo and loads static assets")
    Rel(app, paypal, "Links to support page")
```

## Containers

```mermaid
C4Container
    title Audio Repair Lab Containers
    Person(user, "User")
    System_Boundary(browser, "Browser") {
        Container(ui, "React UI", "TypeScript, Vite", "Controls, waveform, playback, export")
        Container(worker, "Audio Worker", "Comlink, fft.js", "Noise reduction, vocal focus, repair")
        ContainerDb(idb, "IndexedDB", "idb", "Local recent-session metadata")
    }
    System_Ext(pages, "GitHub Pages", "Static files from main /docs")
    Rel(user, ui, "Uses")
    Rel(ui, worker, "Transfers PCM buffers")
    Rel(ui, idb, "Stores metadata")
    Rel(ui, pages, "Loads static assets")
```

## Module Boundaries

- `src/features/audio/` owns decoding state, processing calls, export, and tests.
- `src/features/audio/workers/` owns CPU-intensive DSP and avoids DOM APIs.
- `src/components/` owns reusable presentational controls.
- `scripts/` owns local build, smoke, and Pages helper automation.
