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

## Modes and progression

- **Second chance:** after a good run (score at least 10 and at least half of your best) the game-over sheet offers one revive per run. The fallen glasses are cleared, the rest of the tower is straightened a little and the score is kept. On the portal builds this is a rewarded ad. On GitHub Pages it is free. While it is offered, tapping the screen does nothing, so a stray tap never throws it away.
- **Daily tea:** one run type per calendar day (local time), the same for everyone. It has a daily rule (windy hanger, hasty swing, golden hour, wide swing or southwester), a seeded glass sequence and a starting time of day. It keeps its own best score for the day and a streak of consecutive days. Second chance is off in this mode.
- **Glass collection:** every glass you stack counts toward a lifetime total that unlocks new designs at 30, 80, 160, 300 and 500: fluted, tulip, evil eye, silver and cobalt. Pick one under *Glasses* on the title screen. Gilded bonus glasses always keep their gold look. Any of them can also be bought early with sugar, and three more (emerald, ruby, pearl) are sugar only.
- **Sugar:** the in-game currency. Every glass stacked gives 1, a perfect drop +1 and a gilded glass +2, credited as you play. Gifts, the wheel, missions and achievements pay sugar too.
- **Gifts:** a 7-day login streak (20, 30, 40, 60, 80, 100, 150 sugar; a missed day starts over) and a daily wheel with one free spin. On the portal builds a rewarded ad gives one extra spin. The panel opens by itself on the first visit of the day.
- **Missions:** three daily missions picked from the date (stack, perfects, height, combo, gilded, runs, Daily tea), plus 19 permanent achievements. Both pay sugar the moment they are done.
- **Share:** the game-over sheet shares the score with the Web Share API, or copies it to the clipboard. It is hidden on the portal builds.

## Features

- Canvas2D renderer with no build step and no dependencies. Every sprite (glasses, saucers, brass tray, kilim tablecloth, Istanbul skyline) is drawn in code and cached once per resolution.
- All audio is synthesized with WebAudio: glass clinks, perfect-drop notes that rise along the Hicaz scale, a sea ambience and seagulls.
- Installable PWA that works offline (manifest + service worker), with high-DPI rendering, safe-area insets and adaptive resolution.
- Best score, daily best and streak, lifetime glass count, chosen design, sugar, owned designs, gift streak, wheel spins, missions, achievements and stats are saved in `localStorage` (`ck_*` keys).

## Run locally

```bash
git clone https://github.com/ardazeybek-dev/tea-tower.git
cd tea-tower
python -m http.server 8080 --directory docs
# open http://localhost:8080
```

The page must be served over http(s). Opening `index.html` as a file is not enough, because the service worker and fonts need an origin. No environment variables are required.

## Portal builds

`platform/build.py` generates portal copies from `docs/` without changing it: SDK hooks (gameplay start/stop, an ad break between game over and the next run with audio muted, a rewarded ad for the second chance), English UI by default (Turkish when the browser language is Turkish), and no service worker, manifest or absolute links.

```bash
python platform/build.py                                   # platform/crazygames/ and platform/gamedistribution/
python platform/build.py gamedistribution --gd-id <ID>     # GameDistribution needs the game ID from its panel
python platform/build.py --zip ../dist                     # also write upload-ready zips (index.html at the root)
```

Edit the game in `docs/` and the adapter in `platform/src/platform.js`, then rebuild; never edit the generated folders. The reward is granted only after the ad has been watched to the end (CrazyGames `adFinished`, GameDistribution `SDK_REWARDED_WATCH_COMPLETE`). When a revive is offered and the player restarts instead, no midgame ad is shown for that restart. GameDistribution only serves rewarded ads after the rewarded flag is enabled for the game in its developer panel. `?pf_minplay=0` skips the 60-second delay before the first ad (testing only).

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
platform/
  build.py            builds portal copies from docs/
  src/platform.js     portal adapter (SDK calls, ad break, language)
  crazygames/, gamedistribution/   generated output, do not edit
```

## Gotchas

- Changes not showing after deploy → the service worker serves cached assets → bump `CACHE` in `docs/sw.js`.
- Headless browser FPS looks very low → software rasterization at DPR 3 → measure with a GPU-backed browser. `window.__game.perf()` reports FPS and per-frame JS time.
- `build.py` stops with "expected 1 match" → a line it patches in `docs/game.js` changed → update the matching `sub1` call in `build.py`.
- Portal SDK logs "gameplayStart() call throttled" in tests → start/stop closer than 1 s → leave real time between rounds.
- Automated tests are flaky on timing → headless rAF is throttled → drive the game with `window.__game.setTimeScale(0)` plus `step()`, `aimPerfect()` and `aimOffset(x)`.

Fonts: Fraunces and Nunito, SIL Open Font License (see `docs/fonts/`).
