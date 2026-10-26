# Çay Kulesi — Tea Tower

A one-thumb stacking game set on a tea terrace facing the Bosphorus. A brass tea hanger swings a tulip-shaped Turkish tea glass back and forth above your tower. Tap to drop it. Land it dead center and the glass flashes, your combo climbs a Hicaz scale, and the tower straightens. Land it off center and the tower starts to lean. Lean too far and the whole thing comes down.

**Play:** https://ardazeybek-dev.github.io/tea-tower/

![Preview](docs/preview.png)

## How to play

- **Tap anywhere** (or press Space) when the swinging glass is over the top of the tower.
- **Perfect** drops (dead center) score +2 and build a combo. Three or more in a row also pull the tower back toward vertical.
- Off-center drops shift the tower's center of mass. If the weight above any glass hangs past the rim, that part of the tower topples.
- **Gilded glasses** are worth extra. A perfect drop on one gives +5.
- Every 7 glasses the time of day moves on: afternoon, sunset, night, dawn, morning, noon. The swing gets faster and wider as you climb, and from glass 10 the hanger starts to drift.
- `P` / `Esc` pauses and `M` mutes. The game also pauses on its own when the tab is hidden.

## Features

- Canvas2D renderer with no build step and no dependencies. Every sprite (glasses, saucers, brass tray, kilim tablecloth, Istanbul skyline) is drawn in code and cached once per resolution.
- All audio is synthesized with WebAudio: glass clinks, perfect-drop notes that rise along the Hicaz scale, a sea ambience and seagulls.
- Installable PWA that works offline (manifest + service worker), with high-DPI rendering, safe-area insets and adaptive resolution.
- Best score is saved in `localStorage`.

## Run locally

```bash
git clone https://github.com/ardazeybek-dev/tea-tower.git
cd tea-tower
python -m http.server 8080 --directory docs
# open http://localhost:8080
```

The page must be served over http(s). Opening `index.html` as a file is not enough, because the service worker and fonts need an origin. No environment variables are required.

## Project structure

```
docs/                 GitHub Pages root (main branch, /docs)
  index.html          markup, meta / Open Graph tags
  style.css           UI overlays (title, HUD, pause, game over)
  game.js             engine: sprites, physics, camera, effects, audio
  sw.js               offline cache (bump CACHE when shipping changes)
  manifest.webmanifest
  fonts/              Fraunces + Nunito (OFL), latin + latin-ext subsets
  icons/              app icons (any + maskable)
  og.png, preview.png
```

## Gotchas

- Changes not showing after deploy → the service worker serves cached assets → bump `CACHE` in `docs/sw.js`.
- Headless browser FPS looks very low → software rasterization at DPR 3 → measure with a GPU-backed browser. `window.__game.perf()` reports FPS and per-frame JS time.
- Automated tests are flaky on timing → headless rAF is throttled → drive the game with `window.__game.setTimeScale(0)` plus `step()`, `aimPerfect()` and `aimOffset(x)`.

Fonts: Fraunces and Nunito, SIL Open Font License (see `docs/fonts/`).
