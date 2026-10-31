/* Tea Tower: portal adapter (ads, gameplay events, language).
   Built by platform/build.py. TARGET is replaced at build time.
   If the portal SDK is missing (adblock, local file, other domain) every call is a no-op
   and the game keeps working. */
(function () {
  'use strict';
  var TARGET = 'crazygames';          // 'crazygames' | 'gamedistribution'
  var MIN_PLAY_BEFORE_AD = 60;        // seconds of real gameplay before the first ad break
  var AD_TIMEOUT = 8000;              // never leave the player stuck if the SDK hangs
  try { var mp = /[?&]pf_minplay=(\d+)/.exec(location.search); if (mp) MIN_PLAY_BEFORE_AD = +mp[1]; } catch (e) {}  // testing only

  // ---------------------------------------------------------------- language
  var I = window.I18N;                 // docs/i18n.js, loaded first
  var lang = I ? I.lang : 'en';
  function t(s) { return I ? I.t(s) : s; }

  function translateDom() {
    document.documentElement.classList.add('pf-ads');   // shows the video icon on the rewarded button
    if (I) I.translateDom();
    if (lang !== 'en') document.title = 'Çay Kulesi';
  }

  // ---------------------------------------------------------------- state
  var game = null;           // { mute(bool), pauseInput(bool) } set by game.js
  var sdkMuted = false, inAd = false, playing = false, playSeconds = 0, playFrom = 0;
  var cg = null, gdReady = false, gdDone = null, adTimer = 0;
  var rwDone = null, rwOk = false, offered = false;   // rewarded ad state, kept apart from the midgame break

  function setAdMute(on) { inAd = on; if (game) game.mute(on || sdkMuted); }

  // ---------------------------------------------------------------- CrazyGames SDK v3
  // https://docs.crazygames.com/sdk/game/ , https://docs.crazygames.com/sdk/video-ads/
  function initCrazy() {
    var SDK = window.CrazyGames && window.CrazyGames.SDK;
    if (!SDK) return Promise.resolve();
    return Promise.resolve(SDK.init()).then(function () {
      cg = SDK;
      if (playing) { try { SDK.game.gameplayStart(); } catch (e) {} }   // player started before init finished
      try {
        if (SDK.game.settings && SDK.game.settings.muteAudio) { sdkMuted = true; if (game) game.mute(true); }
        SDK.game.addSettingsChangeListener(function (s) { sdkMuted = !!(s && s.muteAudio); if (game) game.mute(inAd || sdkMuted); });
      } catch (e) {}
    }).catch(function (e) { cg = null; console.warn('[portal] CrazyGames SDK unavailable', e); });
  }

  // ---------------------------------------------------------------- GameDistribution SDK
  // https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation
  function onGdEvent(ev) {
    switch (ev && ev.name) {
      case 'SDK_READY': gdReady = true; break;
      case 'SDK_GAME_PAUSE': clearTimeout(adTimer); setAdMute(true); break;
      case 'SDK_GAME_START': setAdMute(false); if (rwDone) finishReward(); else finishAd(); break;
      case 'SDK_REWARDED_WATCH_COMPLETE': rwOk = true; break;
    }
  }
  if (TARGET === 'gamedistribution') {
    window.GD_OPTIONS = window.GD_OPTIONS || {};
    window.GD_OPTIONS.onEvent = onGdEvent;
  }

  // ---------------------------------------------------------------- ad break
  function finishAd() {
    clearTimeout(adTimer);
    if (game) game.pauseInput(false);
    setAdMute(false);
    var cb = gdDone; gdDone = null; if (cb) cb();
  }
  function adBreak(then) {
    then = then || function () {};
    if (gdDone || rwDone) return;                         // already waiting for one
    // a rewarded "keep playing" was offered on this game-over screen: no midgame ad on top of it
    if (offered) { offered = false; then(); return; }
    if (playSeconds < MIN_PLAY_BEFORE_AD) { then(); return; }
    if (TARGET === 'crazygames' && cg && cg.environment !== 'disabled') {
      gdDone = then; if (game) game.pauseInput(true);
      adTimer = setTimeout(finishAd, AD_TIMEOUT);
      try {
        cg.ad.requestAd('midgame', {
          adStarted: function () { clearTimeout(adTimer); setAdMute(true); },
          adFinished: function () { finishAd(); },
          adError: function () { finishAd(); }
        });
      } catch (e) { finishAd(); }
      return;
    }
    if (TARGET === 'gamedistribution' && gdReady && window.gdsdk && typeof window.gdsdk.showAd === 'function') {
      gdDone = then; if (game) game.pauseInput(true);
      adTimer = setTimeout(finishAd, AD_TIMEOUT);
      try {
        var p = window.gdsdk.showAd();
        if (p && typeof p.then === 'function') p.then(function () { if (!inAd) finishAd(); }, function () { finishAd(); });
      } catch (e) { finishAd(); }
      return;
    }
    then();
  }

  // ---------------------------------------------------------------- rewarded ad
  // The reward is granted only when the ad was watched to the end (CG adFinished,
  // GD SDK_REWARDED_WATCH_COMPLETE). Errors, no fill and timeouts give nothing.
  function canReward() {
    if (TARGET === 'crazygames') return !!(cg && cg.environment !== 'disabled');
    if (TARGET === 'gamedistribution') return !!(gdReady && window.gdsdk && typeof window.gdsdk.showAd === 'function');
    return false;
  }
  function finishReward() {
    clearTimeout(adTimer);
    if (game) game.pauseInput(false);
    setAdMute(false);
    var cb = rwDone, ok = rwOk; rwDone = null; rwOk = false;
    if (cb) cb(ok);
  }
  function rewarded(cb) {
    offered = false;
    if (rwDone || gdDone) return;
    if (!canReward()) { cb(false); return; }
    rwDone = cb; rwOk = false; if (game) game.pauseInput(true);
    adTimer = setTimeout(finishReward, AD_TIMEOUT);
    if (TARGET === 'crazygames') {
      try {
        cg.ad.requestAd('rewarded', {
          adStarted: function () { clearTimeout(adTimer); setAdMute(true); },
          adFinished: function () { rwOk = true; finishReward(); },
          adError: function () { finishReward(); }
        });
      } catch (e) { finishReward(); }
      return;
    }
    try {
      var p = window.gdsdk.showAd('rewarded');
      if (p && typeof p.then === 'function') p.then(function () { if (!inAd) finishReward(); }, function () { finishReward(); });
    } catch (e) { finishReward(); }
  }

  // ---------------------------------------------------------------- gameplay events
  function gameplayStart() {
    if (playing) return; playing = true; playFrom = performance.now();
    try { if (cg) cg.game.gameplayStart(); } catch (e) {}
  }
  function gameplayStop() {
    if (!playing) return; playing = false; playSeconds += (performance.now() - playFrom) / 1000;
    try { if (cg) cg.game.gameplayStop(); } catch (e) {}
  }
  function happy() { try { if (cg) cg.game.happytime(); } catch (e) {} }

  var ready = TARGET === 'crazygames' ? initCrazy() : Promise.resolve();
  try { if (window.CrazyGames && window.CrazyGames.SDK && TARGET === 'crazygames') ready.then(function () { if (cg) cg.game.loadingStart(); }); } catch (e) {}

  window.PF = {
    target: TARGET, t: t, get lang() { return lang; }, get inAd() { return inAd; },
    get sdkMuted() { return sdkMuted; }, get playSeconds() { return playSeconds; },
    bind: function (g) { game = g; if (sdkMuted) g.mute(true); },
    loaded: function () { ready.then(function () { try { if (cg) cg.game.loadingStop(); } catch (e) {} }); },
    gameplayStart: gameplayStart, gameplayStop: gameplayStop, adBreak: adBreak, happy: happy,
    canReward: canReward, rewarded: rewarded, offerReward: function () { offered = true; },
    translateDom: translateDom
  };
})();
