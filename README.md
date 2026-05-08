# Audio Repair Lab

[![Live demo](https://img.shields.io/badge/live-GitHub%20Pages-0969da)](https://baditaflorin.github.io/audio-repair-lab/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

Audio Repair Lab is a browser-based audio cleanup workbench for podcasters and
musicians who want noise removal, vocal focus, and quick repair without sending
their files to a server.

Live site: https://baditaflorin.github.io/audio-repair-lab/

Repository: https://github.com/baditaflorin/audio-repair-lab

Support development: https://www.paypal.com/paypalme/florinbadita

![Audio Repair Lab screenshot](docs/media/screenshot.png)

## Quickstart

```sh
npm install
make install-hooks
make dev
```

## Build

```sh
make test
make build
make pages-preview
```

The production build is committed to `docs/` because GitHub Pages serves the
site from `main` branch `/docs`.

## What It Does

- Imports browser-decodable audio, including WAV and MP3 where supported.
- Processes audio locally with Web Audio, Web Workers, and FFT-based DSP.
- Exports a processed WAV file without uploading source audio.
- Shows the running version and source commit in the page footer.

## Architecture

```mermaid
C4Context
    title Audio Repair Lab - GitHub Pages Static App
    Person(user, "Podcaster or musician", "Drops local audio into the browser")
    System_Boundary(pages, "GitHub Pages") {
        System(spa, "React/Vite static app", "UI, waveform, playback, export")
        System(worker, "Audio worker", "FFT noise gate, vocal focus, repair DSP")
        SystemDb(storage, "IndexedDB/OPFS", "Local sessions and drafts")
    }
    System_Ext(github, "GitHub Repository", "Source, stars, releases")
    System_Ext(paypal, "PayPal", "Optional support link")
    Rel(user, spa, "Uses locally")
    Rel(spa, worker, "Processes PCM via Comlink")
    Rel(spa, storage, "Stores local metadata")
    Rel(spa, github, "Links to repo")
    Rel(spa, paypal, "Links to support")
```

More detail: `docs/architecture.md`

ADRs: `docs/adr/`

Deployment guide: `docs/deploy.md`
