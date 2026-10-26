/* Tea Tower: portal adapter (ads, gameplay events, language).
   Built by platform/build.py. TARGET is replaced at build time.
   If the portal SDK is missing (adblock, local file, other domain) every call is a no-op
   and the game keeps working. */
(function () {
  'use strict';
  var TARGET = 'gamedistribution';          // 'crazygames' | 'gamedistribution'
  var MIN_PLAY_BEFORE_AD = 60;        // seconds of real gameplay before the first ad break
  var AD_TIMEOUT = 45000;             // never leave the player stuck if the SDK hangs
  try { var mp = /[?&]pf_minplay=(\d+)/.exec(location.search); if (mp) MIN_PLAY_BEFORE_AD = +mp[1]; } catch (e) {}  // testing only

  // ---------------------------------------------------------------- language
  var EN = {
    'Çay Kulesi': 'Tea Tower', "Boğaz'a karşı": 'By the Bosphorus',
    'İnce belli bardakları üst üste diz.': 'Stack tulip-shaped tea glasses.',
    'Tam ortaya denk getir, kule parlasın.': 'Hit the center and the tower shines.',
    'En iyi': 'Best', 'Başlamak için dokun': 'Tap to start',
    'Bardak ortaya gelince dokun.': 'Tap when the glass is centered.',
    'Tam ortası parlar, kule dengelenir.': 'Perfect drops glow and steady the tower.',
    'Mola': 'Paused', 'Çay demleniyor…': 'Tea is brewing…', 'Devam et': 'Resume', 'Ana ekran': 'Home',
    'Kule devrildi': 'The tower fell', 'Bardak kaydı': 'The glass slipped', 'puan': 'points',
    'Yeni rekor!': 'New best!', 'İlk kulen!': 'Your first tower!', 'Mükemmel': 'Perfect',
    'En uzun kombo': 'Longest combo', 'Bir el daha': 'Play again', 'ya da ekrana dokun': 'or tap the screen',
    'Denge!': 'Balanced!', 'Dikkat, sallanıyor!': 'Careful, it wobbles!', 'Kombo': 'Combo',
    'V A K İ T': 'T I M E', 'İkindi': 'Afternoon', 'Gün batımı': 'Sunset', 'Gece': 'Night',
    'Şafak': 'Dawn', 'Sabah': 'Morning', 'Öğle': 'Noon',
    'Duraklat': 'Pause', 'Sesi aç/kapat': 'Sound on/off', 'Çay Kulesi oyun alanı': 'Tea Tower game area'
  };
  var lang = 'en';
  try { var l = (navigator.languages && navigator.languages[0]) || navigator.language || ''; if (/^tr\b/i.test(l)) lang = 'tr'; } catch (e) {}
  function t(s) { return lang === 'en' && Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s; }

  function translateDom() {
    document.documentElement.lang = lang;
    if (lang !== 'en') { document.title = 'Çay Kulesi'; return; }
    document.title = 'Tea Tower';
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n; while ((n = walker.nextNode())) { var s = n.nodeValue.trim(); if (s && EN[s]) n.nodeValue = n.nodeValue.replace(s, EN[s]); }
    document.querySelectorAll('[aria-label]').forEach(function (el) { var a = el.getAttribute('aria-label'); if (EN[a]) el.setAttribute('aria-label', EN[a]); });
    var h1 = document.querySelector('#title h1'); if (h1) h1.innerHTML = 'Tea <em>Tower</em>';
  }

  // ---------------------------------------------------------------- state
  var game = null;           // { mute(bool), pauseInput(bool) } set by game.js
  var sdkMuted = false, inAd = false, playing = false, playSeconds = 0, playFrom = 0;
  var cg = null, gdReady = false, gdDone = null, adTimer = 0;

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
      case 'SDK_GAME_START': setAdMute(false); finishAd(); break;
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
    if (gdDone) return;                                   // already waiting for one
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
    translateDom: translateDom
  };
})();
