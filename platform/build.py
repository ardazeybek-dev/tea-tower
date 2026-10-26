"""Build portal copies of the game from docs/ without touching docs/.

    python platform/build.py                      # all targets
    python platform/build.py crazygames
    python platform/build.py gamedistribution --gd-id <GAME_ID>
    python platform/build.py --zip <out_dir>      # also write <target>.zip files

Output: platform/<target>/ (index.html, style.css, game.js, platform.js, fonts/).
The service worker, manifest and absolute links are dropped: portals serve the game
inside their own iframe and do not allow a PWA or links to other sites.
"""
import argparse
import pathlib
import re
import shutil
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
SRC = ROOT / "platform" / "src"

SDK_TAG = {
    # https://docs.crazygames.com/sdk/intro/
    "crazygames": '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
    # https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation
    "gamedistribution": (
        '<script>window["GD_OPTIONS"]={"gameId":"__GD_ID__"};</script>\n'
        '<script>(function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(d.getElementById(id))return;'
        'if(window.GD_OPTIONS.gameId.indexOf("__")===0)return;'
        'js=d.createElement(s);js.id=id;js.src="https://html5.api.gamedistribution.com/main.min.js";'
        'fjs.parentNode.insertBefore(js,fjs);}(document,"script","gamedistribution-jssdk"));</script>'
    ),
}


def sub1(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f"patch '{label}': expected 1 match, found {n}. docs/ changed, update build.py")
    return text.replace(old, new)


def patch_game(js):
    # translation helper available to the whole engine
    js = sub1(js, "'use strict';\n", "'use strict';\nconst T = (s) => (window.PF ? window.PF.t(s) : s);\n", "T helper")
    for name in ["İkindi", "Gün batımı", "Gece", "Şafak", "Sabah", "Öğle"]:
        js = sub1(js, f"name: '{name}'", f"name: T('{name}')", "phase " + name)
    js = sub1(js, "`Mükemmel ×${G.combo}` : 'Mükemmel'", "`${T('Mükemmel')} ×${G.combo}` : T('Mükemmel')", "perfect")
    js = sub1(js, "'Denge!'", "T('Denge!')", "balance")
    js = sub1(js, "`Kombo ×${G.combo}`", "`${T('Kombo')} ×${G.combo}`", "combo")
    js = sub1(js, "'Dikkat, sallanıyor!'", "T('Dikkat, sallanıyor!')", "warn")
    js = sub1(js, "floater(topX(), topY() + 160, 'Yeni rekor!'", "floater(topX(), topY() + 160, T('Yeni rekor!')", "record floater")
    js = sub1(js, "G.single ? 'Bardak kaydı' : 'Kule devrildi'", "T(G.single ? 'Bardak kaydı' : 'Kule devrildi')", "reason")
    js = sub1(js, "firstRun ? 'İlk kulen!' : 'Yeni rekor!'", "T(firstRun ? 'İlk kulen!' : 'Yeni rekor!')", "badge")
    js = sub1(js, "ctx.fillText('V A K İ T'", "ctx.fillText(T('V A K İ T')", "banner")

    # audio: a forced mute (ad playing / portal setting) that the in-game toggle cannot override
    js = sub1(js, "let muted = store.get('ck_mute', '0') === '1';",
              "let muted = store.get('ck_mute', '0') === '1', forced = false;", "forced var")
    js = sub1(js, "master.gain.value = muted ? 0 : .9;", "master.gain.value = (muted || forced) ? 0 : .9;", "init gain")
    js = sub1(js, "if (master) master.gain.setTargetAtTime(muted ? 0 : .9, now(), .05); return muted; },",
              "if (master) master.gain.setTargetAtTime((muted || forced) ? 0 : .9, now(), .05); return muted; },\n"
              "    setForced(v) { forced = !!v; if (master) master.gain.setTargetAtTime((muted || forced) ? 0 : .9, now(), .02);"
              " if (forced) api.suspend(); else if (!document.hidden) api.resume(); },", "setForced")
    js = sub1(js, "if (!ac || muted || ac.state !== 'running') return;", "if (!ac || muted || forced || ac.state !== 'running') return;", "gull")

    # gameplay events
    js = sub1(js, "  show('tutorial', G.tutorial);\n}", "  show('tutorial', G.tutorial);\n  PF.gameplayStart();\n}", "start event")
    js = sub1(js, "function endGame() {\n  G.state = 'over'; G.overAt = performance.now();",
              "function endGame() {\n  G.state = 'over'; G.overAt = performance.now(); PF.gameplayStop();", "stop event")
    js = sub1(js, "  if (rec && G.score > 0) { setTimeout(() => { Snd.record(); confetti(60); }, 280); }",
              "  if (rec && G.score > 0) { setTimeout(() => { Snd.record(); confetti(60); }, 280); if (!firstRun) PF.happy(); }", "happytime")
    js = sub1(js, "function goHome() {\n", "function goHome() {\n  PF.gameplayStop();\n", "home event")
    js = sub1(js, "G.prev = G.state; G.state = 'paused'; show('pause', true); Snd.suspend();",
              "G.prev = G.state; G.state = 'paused'; show('pause', true); Snd.suspend(); if (!document.hidden && document.hasFocus()) PF.gameplayStop();", "pause event")
    js = sub1(js, "G.state = G.prev || 'playing'; show('pause', false); Snd.init(); Snd.resume(); last = performance.now();",
              "G.state = G.prev || 'playing'; show('pause', false); Snd.init(); Snd.resume(); last = performance.now(); PF.gameplayStart();", "resume event")

    # ad break between "game over" and the next run; input is blocked while the ad runs
    js = sub1(js, "function tap() {\n", "let adLock = false;\nfunction tap() {\n  if (adLock) return;\n", "tap lock")
    js = sub1(js, "if (performance.now() - G.overAt > 450) startGame(); return; }",
              "if (performance.now() - G.overAt > 450) PF.adBreak(startGame); return; }", "tap ad")
    js = sub1(js, "$('againBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); startGame(); });",
              "$('againBtn').addEventListener('click', (e) => { e.stopPropagation(); if (adLock) return; Snd.init(); PF.adBreak(startGame); });", "again ad")
    # restart from the game-over sheet on pointerup: GameDistribution wants showAd behind touchUp/mouseUp
    js = sub1(js, "  if (G.state === 'paused') return;\n  e.preventDefault();\n",
              "  if (G.state === 'paused') return;\n  e.preventDefault();\n  if (G.state === 'over') return;\n", "down skip over")
    js = sub1(js, "  tap();\n}, { passive: false });\n",
              "  tap();\n}, { passive: false });\nwindow.addEventListener('pointerup', (e) => {\n"
              "  if (e.target.closest && e.target.closest('button')) return;\n  if (G.state === 'over') { Snd.init(); tap(); }\n});\n", "up restart")
    js = sub1(js, "function syncMute() {",
              "PF.bind({ mute(on) { Snd.setForced(on); }, pauseInput(on) { adLock = !!on; } });\nfunction syncMute() {", "bind")
    return js


def patch_html(html, target):
    html = re.sub(r'<link rel="manifest"[^>]*>\n', "", html)
    html = re.sub(r'<meta (property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\n', "", html)
    html = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Stack tulip-shaped Turkish tea'
                  ' glasses into a tower by the Bosphorus. One tap, perfect drops, endless combos.">', html)
    html = re.sub(r'<meta name="apple-mobile-web-app[^>]*>\n|<meta name="mobile-web-app-capable"[^>]*>\n', "", html)
    html = re.sub(r'<link rel="(icon|apple-touch-icon)"[^>]*>\n', "", html)
    html = sub1(html, '<title>Çay Kulesi — İnce belli bardakları istifle</title>', '<title>Tea Tower</title>', "title")
    sw = re.search(r"<script>\nif \('serviceWorker'.*?</script>\n", html, re.S)
    if not sw:
        raise SystemExit("patch 'service worker': not found")
    html = html.replace(sw.group(0), "<script>PF.translateDom(); PF.loaded();</script>\n")
    html = sub1(html, '<script src="game.js"></script>',
                SDK_TAG[target] + '\n<script src="platform.js"></script>\n<script src="game.js"></script>', "scripts")
    allowed = ("https://sdk.crazygames.com/", "https://html5.api.gamedistribution.com/", "http://www.w3.org/")
    left = [u for u in re.findall(r'https?://[^"\s)]+', html) if not u.startswith(allowed)]
    if left:
        raise SystemExit(f"absolute URL left in index.html: {left}")
    return html


def build(target, gd_id, zip_dir):
    out = ROOT / "platform" / target
    if out.exists():
        shutil.rmtree(out)
    (out / "fonts").mkdir(parents=True)
    for f in (DOCS / "fonts").iterdir():
        shutil.copy2(f, out / "fonts" / f.name)
    shutil.copy2(DOCS / "style.css", out / "style.css")
    (out / "game.js").write_text(patch_game((DOCS / "game.js").read_text("utf-8")), "utf-8")
    html = patch_html((DOCS / "index.html").read_text("utf-8"), target)
    if target == "gamedistribution" and gd_id:
        html = html.replace("__GD_ID__", gd_id)
    (out / "index.html").write_text(html, "utf-8")
    (out / "platform.js").write_text((SRC / "platform.js").read_text("utf-8").replace("__TARGET__", target), "utf-8")
    files = sorted(p for p in out.rglob("*") if p.is_file())
    size = sum(p.stat().st_size for p in files)
    print(f"{target}: {len(files)} files, {size / 1024:.0f} KB -> {out.relative_to(ROOT)}")
    if zip_dir:
        zp = pathlib.Path(zip_dir) / f"tea-tower-{target}.zip"
        zp.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
            for p in files:  # index.html at the zip root, as the portals expect
                z.write(p, p.relative_to(out).as_posix())
        print(f"  zip: {zp} ({zp.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("targets", nargs="*", default=list(SDK_TAG))
    ap.add_argument("--gd-id", default="")
    ap.add_argument("--zip", default="")
    a = ap.parse_args()
    for t in a.targets:
        build(t, a.gd_id, a.zip)
