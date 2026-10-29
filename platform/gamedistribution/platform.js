/* Tea Tower: portal adapter (ads, gameplay events, language).
   Built by platform/build.py. TARGET is replaced at build time.
   If the portal SDK is missing (adblock, local file, other domain) every call is a no-op
   and the game keeps working. */
(function () {
  'use strict';
  var TARGET = 'gamedistribution';          // 'crazygames' | 'gamedistribution'
  var MIN_PLAY_BEFORE_AD = 60;        // seconds of real gameplay before the first ad break
  var AD_TIMEOUT = 8000;              // never leave the player stuck if the SDK hangs
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
    'Duraklat': 'Pause', 'Sesi aç/kapat': 'Sound on/off', 'Çay Kulesi oyun alanı': 'Tea Tower game area',
    'Günlük çay': 'Daily tea', 'Bardaklar': 'Glasses', 'Koleksiyon': 'Collection', 'Kapat': 'Close',
    'Bugün': 'Today', 'Seri': 'Streak', 'Günün rekoru!': "Today's best!", 'Toplam': 'Total', 'bardak': 'glasses',
    'Seçili': 'Selected', 'Yeni bardak açıldı': 'New glass unlocked', 'Sıradaki bardak': 'Next glass', 'bardak kaldı': 'to go',
    'Klasik': 'Classic', 'Çizgili': 'Fluted', 'Lale': 'Tulip', 'Nazar': 'Evil Eye', 'Gümüş': 'Silver', 'Kobalt': 'Cobalt',
    'Rüzgârlı Boğaz': 'Windy Bosphorus', 'Telaşlı garson': 'Hasty waiter', 'Altın saat': 'Golden hour',
    'Geniş salınım': 'Wide swing', 'Lodos': 'Southwester',
    'İkinci şans': 'Second chance', 'İkinci şans!': 'Second chance!', 'Reklam izle, devam et': 'Watch an ad to continue',
    'Reklam şu an yok, sonra tekrar dene': 'No ad available right now, try again later',
    // şeker, hediye, çark, başarımlar
    'Şeker': 'Sugar', 'şeker': 'sugar', 'Paylaş': 'Share', 'Hediye': 'Gifts', 'Çark ve seri': 'Wheel & streak',
    'Başarımlar': 'Achievements', 'Günlük hediye': 'Daily gift', 'Hediyen hazır': 'Gift ready', 'Çark hazır': 'Wheel ready',
    'Hediyeyi al': 'Claim gift', 'Yarın yeni hediye': 'New gift tomorrow', 'Çarkı çevir': 'Spin the wheel',
    'Reklam izle, bir daha çevir': 'Watch an ad, spin again', 'Çark yarın yenilenir': 'Wheel resets tomorrow',
    'şeker daha lazım': 'more sugar needed', 'ya da': 'or', 'puanlık kule diktim!': 'point tower, can you beat it?',
    'Kopyalandı': 'Copied', 'Zümrüt': 'Emerald', 'Yakut': 'Ruby', 'Sedef': 'Pearl',
    'İlk kat': 'First floor', 'Bir elde 10 bardak diz': 'Stack 10 glasses in one run',
    'Mahalle kahvesi': 'Corner café', 'Bir elde 25 bardak diz': 'Stack 25 glasses in one run',
    'Galata boyu': 'Galata high', 'Bir elde 50 bardak diz': 'Stack 50 glasses in one run',
    'Usta eli': 'Steady hand', 'Üst üste 5 mükemmel': '5 perfects in a row',
    'Ayar ustası': 'Fine tuner', 'Üst üste 10 mükemmel': '10 perfects in a row',
    'Tek nefes': 'One breath', 'Üst üste 20 mükemmel': '20 perfects in a row',
    'Demli': 'Well brewed', 'Bir elde 30 puan': 'Score 30 in one run',
    'Tavşan kanı': 'Ruby red', 'Bir elde 60 puan': 'Score 60 in one run',
    'Çaycıbaşı': 'Head tea maker', 'Bir elde 100 puan': 'Score 100 in one run',
    'Yaldız': 'Gilded', '10 yaldızlı bardak diz': 'Stack 10 gilded glasses',
    'Altın tepsi': 'Golden tray', '50 yaldızlı bardak diz': 'Stack 50 gilded glasses',
    'Yüz bardak': 'A hundred glasses', 'Toplam 100 bardak': '100 glasses in total',
    'Beş yüz bardak': 'Five hundred glasses', 'Toplam 500 bardak': '500 glasses in total',
    'Bin bardak': 'A thousand glasses', 'Toplam 1000 bardak': '1000 glasses in total',
    'Müdavim': 'Regular', 'Günlük çayda 3 günlük seri': '3-day Daily tea streak',
    'Kahvenin demirbaşı': 'Part of the furniture', 'Günlük çayda 7 günlük seri': '7-day Daily tea streak',
    'Bir hafta': 'One week', '7 gün üst üste hediye al': 'Claim gifts 7 days in a row',
    'Koleksiyoncu': 'Collector', '4 bardak tasarımı aç': 'Unlock 4 glass designs',
    'Tam takım': 'Full set', 'Bütün bardakları aç': 'Unlock every glass',
    'Görevler': 'Missions', 'Her gün yenilenir': 'New every day', 'Bugünün görevleri': "Today's missions",
    'Bugün {n} bardak diz': 'Stack {n} glasses today', 'Bugün {n} mükemmel': '{n} perfects today',
    'Bir elde {n} bardak diz': 'Stack {n} glasses in one run', 'Üst üste {n} mükemmel': '{n} perfects in a row',
    'Bugün {n} yaldızlı bardak': '{n} gilded glasses today', 'Bugün {n} el oyna': 'Play {n} runs today',
    'Günlük çayı oyna': 'Play the Daily tea',
    // ayarlar
    'Ayarlar': 'Settings', 'Tercihler': 'Preferences', 'Ses efektleri': 'Sound effects', 'Bardak, kombo, devrilme': 'Glasses, combos, crashes',
    'Ortam sesi': 'Ambience', 'Dalga, rüzgâr, kuşlar': 'Waves, wind, birds', 'Titreşim': 'Vibration', 'Dokunuşta hafif titreşim': 'A light buzz on taps',
    'Grafik': 'Graphics', 'Pil dostu': 'Battery saver', 'Otomatik': 'Auto', 'Yüksek': 'High',
    'Daha az efekt, daha uzun pil': 'Fewer effects, longer battery', 'Cihaza göre kendini ayarlar': 'Adjusts to your device', 'En keskin görüntü': 'The sharpest picture',
    'Öğreticiyi göster': 'Show the tutorial', 'Bir sonraki elde ipucu': 'A hint on your next run', 'Bir sonraki elde gösterilecek': 'It will show on your next run',
    // mekânlar
    'Bardak · mekân': 'Glasses · places', 'Mekânlar': 'Places', 'Boğaz': 'Bosphorus', 'Kapadokya': 'Cappadocia',
    'Üsküdar kıyısı': 'Üsküdar shore', 'Çay bahçesi': 'Tea garden', 'Peri bacaları': 'Fairy chimneys', 'Ege koyu': 'Aegean bay',
    'Çay bahçesinde': 'In the tea garden', 'Peri bacalarına karşı': 'By the fairy chimneys', "Ege'ye karşı": 'By the Aegean',
    'Yeni mekân açıldı': 'New place unlocked', 'Sıradaki mekân': 'Next place', 'Gezgin': 'Traveller', 'Bütün mekânları aç': 'Unlock every place'
  };
  var lang = 'en';
  try { var l = (navigator.languages && navigator.languages[0]) || navigator.language || ''; if (/^tr\b/i.test(l)) lang = 'tr'; } catch (e) {}
  function t(s) { return lang === 'en' && Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s; }

  function translateDom() {
    document.documentElement.lang = lang;
    document.documentElement.classList.add('pf-ads');   // shows the video icon on the rewarded button
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
