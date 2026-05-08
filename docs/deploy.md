# Deploy

Audio Repair Lab deploys as a pure GitHub Pages site.

Live URL: https://baditaflorin.github.io/audio-repair-lab/

Repository: https://github.com/baditaflorin/audio-repair-lab

## Publishing

GitHub Pages serves `main` branch `/docs`. To publish:

```sh
make build
git add docs
git commit -m "chore: publish pages build"
git push origin main
```

## Rollback

Revert the commit that changed `docs/`, push `main`, and GitHub Pages will serve
the previous static build after the Pages deployment completes.

## Custom Domain

No custom domain is configured in v1. To add one later, create `docs/CNAME` with
the hostname, configure the domain's DNS to point at GitHub Pages, and update
ADR 0010.

## Pages Notes

GitHub Pages does not support `_headers` or `_redirects`. The app uses a
`404.html` copy of `index.html` for SPA fallback behavior. Service worker scope
is constrained to `/audio-repair-lab/`.
