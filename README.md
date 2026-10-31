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
- `P` / `Esc` pauses and `M` mutes. The game also pauses on its own when the tab is hidden, and resuming counts 3-2-1 before the glass swings again.

## Modes and progression

- **Second chance:** after a good run (score at least 10 and at least half of your best) the game-over sheet offers one revive per run. The fallen glasses are cleared, the rest of the tower is straightened a little and the score is kept. On the portal builds this is a rewarded ad. On GitHub Pages it is free. While it is offered, tapping the screen does nothing, so a stray tap never throws it away.
- **Daily tea:** one run type per calendar day (local time), the same for everyone. It has a daily rule (windy hanger, hasty swing, golden hour, wide swing or southwester), a seeded glass sequence and a starting time of day. It keeps its own best score for the day and a streak of consecutive days. Second chance is off in this mode.
- **Challenge a friend:** every classic run is seeded. After a fair run (no second chance, no boosters, score at least 5) the share button and *Challenge a friend* send a link with the seed and the score (`?c=<seed>.<score>.<check>`). Opening it plays the same glass sequence with the same rules and no second chance, with the target under the score. Beating a target of 10 or more pays 30 sugar, once per seed (`ck_chwon`), at most three times a day (`ck_chday`) and never for a link sent from the same device (`ck_chmine`). The winner can send a rematch link. The link is read once and removed from the address bar. Challenges are off on the portal builds.
- **Weekly tournament:** *Weekly* (a chip beside the best score, a mode button in landscape) opens a table for the week (Monday to Sunday, local time). *Play* starts a run seeded from the week, so everyone gets the same glasses and events; classic rules, no second chance, no boosters. There is no server: the table is your weekly best (`ck_wk_best`) plus the friends whose links you opened this week (`ck_wk_fr`). *Invite friends* shares `?w=<week>.<best>.<name>.<check>`; a link from another week or with a bad checksum is ignored. Names are letters, digits and spaces, up to 12 (`ck_name`, editable in the panel). The prize is for your own progress, not rank: the first time each week your weekly best passes 20, 40 and 60, it pays 25 sugar per step (`ck_wk_paid`, at most 75 a week). Off on the portal builds.
- **Events:** from the 8th glass on, a run can bring a gust (three falling glasses drift sideways, white streaks show the direction), a gull flying past the hanger, or a hot tea with steam (a perfect drop pays 3 extra sugar). Events come from their own stream seeded with the run, so a challenge or weekly run meets the same events and the glass sequence of older challenge links stays the same. None in Daily tea.
- **Boosters:** on the game-over sheet of a classic run you can buy boosters for the next run with sugar: *Calm hanger* (20, the first 15 glasses swing 30 % slower), *Spare saucer* (35, the glass that would topple the tower falls alone, once) and *Golden hour* (20, twice the chance of gilded glasses). They are paid when the run starts and last one run. Off in Daily tea and challenges.
- **Tea-maker rank:** every glass gives 1 XP and a perfect drop 2. Level *n* needs 40 + 20·*n* XP. Each level pays 15 + 5·*n* sugar (at most 100), and a new title pays 50 more: Apprentice, Stove keeper (3), Brewer (6), Journeyman (10), Master (15), Head tea maker (20), Samovar master (30), Tea lord (40), Bosphorus legend (60). Players from older versions start with their lifetime glass count as XP, with no payout for those levels. Tap the badge on the title screen to see what is left.
- **Glass collection:** every glass you stack counts toward a lifetime total that unlocks new designs at 30, 80, 160, 300 and 500: fluted, tulip, evil eye, silver and cobalt. Pick one under *Glasses* on the title screen. Gilded bonus glasses always keep their gold look. Any of them can also be bought early with sugar, and three more (emerald, ruby, pearl) are sugar only.
- **Deal of the day:** each day one glass or place you do not own is 40% off (`ck_deal`). It is picked from the date, wears a gold tag with the old price struck through, and stays the same all day; once bought, no other deal comes that day.
- **Sugar:** the in-game currency. Every glass stacked gives 1, a perfect drop +1 and a gilded glass +2, credited as you play. Gifts, the wheel, missions and achievements pay sugar too.
- **Gifts:** a 7-day login streak (20, 30, 40, 60, 80, 100, 150 sugar; a missed day starts over) and a daily wheel with one free spin. On the portal builds a rewarded ad gives one extra spin. The panel opens by itself at most once a day (`ck_giftauto`), even if the page reloads before the gift is claimed.
- **Missions:** three daily missions picked from the date (stack, perfects, height, combo, gilded, runs, Daily tea), two weekly goals (300 glasses, play on 5 different days; the week starts on Monday) and 20 permanent achievements. All of them pay sugar the moment they are done.
- **Goals during a run:** a dashed line on the tower marks your highest tower so far, and passing it gets a short celebration. Every 25 glasses in one run is a milestone worth 10, 20, 30… sugar.
- **Game over:** when you fall just short, the sheet says how many points you needed for your best. It also shows a progress bar toward the next glass or place, and the bar fills by what this run added.
- **Streak repair:** if you missed exactly one day, the gift panel lets you save the gift streak or the Daily tea streak with sugar (40 + 10 per day, at most 150).
- **Places:** four backdrops for the same tea terrace: Bosphorus (Üsküdar shore, ferry and Maiden's Tower), Rize (tea garden hills, drifting mist, birdsong), Cappadocia (fairy chimneys, Uçhisar and hot-air balloons) and Bodrum (white houses, windmills, the castle and a gulet). Rize, Cappadocia and Bodrum unlock at 120, 260 and 450 glasses, or earlier with sugar (300, 550, 850). Pick one under *Collection → Places*. Places only change the look and the ambience. The rules, the swing and Daily tea are the same everywhere.
- **Settings:** the slider button on the title screen or *Settings* in the pause menu. Music and sound effects have their own volume sliders (tapping the speaker beside one mutes it, tapping again brings the slider back), ambience switches separately (the speaker button still mutes everything), the language can be Türkçe or English (`ck_lang`; the page reloads, and the switch is hidden mid-run; without a choice a Turkish browser gets Turkish and any other gets English), vibration can be turned off where the device supports it, the tutorial can be shown again, and graphics run in *Auto* (adaptive resolution), *High* (sharper on high-DPI screens, still drops resolution if the frame rate falls) or *Battery saver* (lower resolution, fewer particles, stars and sea glints).
- **Share:** the game-over sheet shares a 1080×1350 picture (the sky and place of the moment, the tower standing as it was before it fell, the score and the link) with the text, where the browser can share files; otherwise the text and link, or a copy to the clipboard. It is hidden on the portal builds.

## Features

- Canvas2D renderer with no build step and no dependencies. Every sprite (glasses, saucers, brass tray, kilim tablecloth, the four place skylines) is drawn in code and cached once per resolution. Only the active place is built; switching rebuilds it once, never during a run.
- Places are drawn in three depth layers with baked shading and texture. Per time of day they are merged into one horizon image: sun-side rim light, soft shadow side, aerial haze that fades far layers into the sky, a horizon mist band, and water with a broken reflection and wave bands (or a valley floor). The merge reruns only when the colors change, at most 12 times per time-of-day transition.
- Light and weather: the sun and moon have a hard disk, a narrow corona and a wide halo that whitens toward the centre; near the horizon the sea takes the sky colour (a Fresnel band), carries a sun path with a soft core and thin glints, and hazy ship silhouettes drift along the skyline. Night windows glow from a layer baked once. Each place has clear, cloudy, misty, rainy or snowy weather picked from the date, never from the seeded game streams, so challenge links and the weekly tournament stay identical for everyone. The odds follow the real season: snow only in winter (most in Cappadocia, never in Bodrum), more rain in autumn, mostly clear summers. Rain slants harder and snow drifts sideways during a gust.
- Game feel: a smooth trauma-based camera shake with a slight roll, a 50–85 ms hit-stop and a small zoom kick on perfect drops, a brief slow motion when a record falls, and a vignette that deepens while the tower topples. Sparks cool from white to ember, tea drops stretch along their motion, shards flutter as they spin.
- All audio is synthesized with WebAudio: glass clinks, perfect-drop notes that rise along the Hicaz scale, an ambience per place (sea and seagulls, or wind and birdsong) and a calm tea-garden tune in D Hicaz (plucked saz strings built with Karplus-Strong, kanun tremolo, a ney section, darbuka in sofyan rhythm), each on its own channel. The tune is scheduled on a timer rather than the frame loop, so the slower title and pause frame rates never make it stutter; drums and a cymbal join as the tower grows, and it muffles while the tower falls. When a new version takes over, the page reloads itself on the title screen.
- Installable PWA that works offline (manifest + service worker), with high-DPI rendering, safe-area insets and a three-step resolution ladder chosen during play (steps down when slow, back up when comfortable, locks a step that proves slow twice). After the second run an *Add to home screen* button shows on the title screen and the game-over sheet. This happens only where the browser offers installation and never on the portal builds.
- Layouts for small phones, landscape phones and tablets. Every touch target is at least 44 px. The title screen draws at 30 fps and the pause screen at 10 fps to save battery.
- A terrace in the foreground: grape vines in the top corners sway in the breeze. Clouds are flat and layered with shaded undersides. The glasses reflect the color of the sky, and at sunset and dawn a shaft of light with drifting dust falls on the table. Glasses outside the view are not drawn.
- Best score, daily best and streak, lifetime glass count, chosen design, sugar, owned designs, gift streak, wheel spins, missions, achievements, stats, the chosen and bought places (`ck_venue`, `ck_vowned`), weekly goals (`ck_week`), the run count and install choice (`ck_runs`, `ck_inst`), XP and the last paid level (`ck_xp`, `ck_lv`), won challenge seeds (`ck_chwon`), the weekly tournament (`ck_wk_best`, `ck_wk_fr`, `ck_wk_paid`, `ck_name`), the deal of the day (`ck_deal`), the gift panel's last auto-open (`ck_giftauto`), the language (`ck_lang`) and settings with volumes (`ck_set`) are saved in `localStorage` (`ck_*` keys).

## Run locally

```bash
git clone https://github.com/ardazeybek-dev/tea-tower.git
cd tea-tower
python -m http.server 8080 --directory docs
# open http://localhost:8080
```

The page must be served over http(s). Opening `index.html` as a file is not enough, because the service worker and fonts need an origin. No environment variables are required.

## Portal builds

`platform/build.py` generates portal copies from `docs/` without changing it: SDK hooks (gameplay start/stop, an ad break between game over and the next run with audio muted, a rewarded ad for the second chance) and no service worker, manifest or absolute links. The language works as on GitHub Pages, from the shared `docs/i18n.js`.

```bash
python platform/build.py                                   # platform/crazygames/ and platform/gamedistribution/
python platform/build.py gamedistribution --gd-id <ID>     # GameDistribution needs the game ID from its panel
python platform/build.py --zip ../dist                     # also write upload-ready zips (index.html at the root)
```

Edit the game in `docs/` and the adapter in `platform/src/platform.js`, then rebuild. Every new text goes through `tr()` in `game.js` (static HTML text is translated once at load) and needs an entry in the `EN` table of `docs/i18n.js`; never edit the generated folders. The reward is granted only after the ad has been watched to the end (CrazyGames `adFinished`, GameDistribution `SDK_REWARDED_WATCH_COMPLETE`). When a revive is offered and the player restarts instead, no midgame ad is shown for that restart. GameDistribution only serves rewarded ads after the rewarded flag is enabled for the game in its developer panel. `?pf_minplay=0` skips the 60-second delay before the first ad (testing only).

## Project structure

```
docs/                 GitHub Pages root (main branch, /docs)
  index.html          markup, meta / Open Graph tags
  style.css           UI overlays (title, HUD, pause, game over)
  i18n.js             language: English table, tr lookup, page translation
  game.js             engine: sprites, physics, camera, effects, audio, music
  sw.js               offline cache (bump CACHE when shipping changes)
  manifest.webmanifest
  fonts/              Fraunces + Nunito (OFL), latin + latin-ext subsets
  icons/              app icons (any + maskable)
  og.png, preview.png
platform/
  build.py            builds portal copies from docs/
  src/platform.js     portal adapter (SDK calls, ad break)
  crazygames/, gamedistribution/   generated output, do not edit
```

## Gotchas

- Changes not showing → the service worker serves cached assets → bump `CACHE` in `docs/sw.js` when shipping (install fetches with `cache: 'reload'`); while testing serve with `--bind ::` and open `http://[::1]:8080`, where no service worker is registered.
- Scripted taps do nothing → the gift panel opens by itself on the first visit of the day and swallows input → call `window.__game.closePanel()` before `start()`. Headless timings or tests are unreliable → software rasterization, rAF throttled to ~1 fps in a background page, adaptive resolution silently drops DPR, ±20 % noise between runs → drive gameplay with `window.__game.setTimeScale(0)` plus `step()`, `aimPerfect()`, `aimOffset(x)` (hit-stop, slow motion and the resolution ladder live in the rAF loop, which `step()` skips: to test them, patch `requestAnimationFrame` to capture the `frame` callback and call it with fake timestamps; `__game.fx` and `perf().q` expose their state); for speed call `page.bringToFront()`, set `window.__fixDpr = 1` before load, read `window.__game.perf()` and compare old and new builds in alternating runs (median, or the minimum of several; `git archive` each commit and load them in iframes of one page to bisect a cost) with a ~12-glass tower and a time-of-day transition (an empty tower hides per-glass and re-tint costs), never against a number from another day.
- `build.py` stops with "expected 1 match" → a line it patches in `docs/game.js` changed → update the matching `sub1` call in `build.py`.
- Portal SDK logs "gameplayStart() call throttled" in tests → start/stop closer than 1 s → leave real time between rounds.
- Shading baked into a backdrop mask disappears → `tinted()` repaints every pixel with one color → keep shading in a place layer's RGB (white = full color) and let `composeHorizon()` multiply it; use `tinted()` only for flat shapes.

Fonts: Fraunces and Nunito, SIL Open Font License (see `docs/fonts/`).
