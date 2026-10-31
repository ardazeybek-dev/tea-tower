/* Çay Kulesi: language. Turkish is the source text; EN maps it to English.
   Loaded before game.js on every build. The choice is kept in localStorage (ck_lang);
   without one, a Turkish browser gets Turkish and every other browser gets English. */
(function () {
  'use strict';
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
    'Rüzgâr →': 'Gust →', '← Rüzgâr': '← Gust', 'Sıcak çay!': 'Hot tea!', 'Sıcak çay': 'Hot tea',
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
    'Günün fırsatı': 'Deal of the day', 'Dil': 'Language', 'Language': 'Dil', '%40 indirim': '40% off', 'Müzik': 'Music', 'Müzik sesi': 'Music volume', 'Efekt sesi': 'Effects volume',
  'Ortam sesi': 'Ambience', 'Dalga, rüzgâr, kuşlar': 'Waves, wind, birds', 'Titreşim': 'Vibration', 'Dokunuşta hafif titreşim': 'A light buzz on taps',
    'Grafik': 'Graphics', 'Pil dostu': 'Battery saver', 'Otomatik': 'Auto', 'Yüksek': 'High',
    'Daha az efekt, daha uzun pil': 'Fewer effects, longer battery', 'Cihaza göre kendini ayarlar': 'Adjusts to your device', 'En keskin görüntü': 'The sharpest picture',
    'Öğreticiyi göster': 'Show the tutorial', 'Bir sonraki elde ipucu': 'A hint on your next run', 'Bir sonraki elde gösterilecek': 'It will show on your next run',
    // mekânlar
    'Bardak · mekân': 'Glasses · places', 'Mekânlar': 'Places', 'Boğaz': 'Bosphorus', 'Kapadokya': 'Cappadocia',
    'Üsküdar kıyısı': 'Üsküdar shore', 'Çay bahçesi': 'Tea garden', 'Peri bacaları': 'Fairy chimneys', 'Ege koyu': 'Aegean bay',
    'Çay bahçesinde': 'In the tea garden', 'Peri bacalarına karşı': 'By the fairy chimneys', "Ege'ye karşı": 'By the Aegean',
    'Yeni mekân açıldı': 'New place unlocked', 'Sıradaki mekân': 'Next place', 'Gezgin': 'Traveller', 'Bütün mekânları aç': 'Unlock every place',
    // rekor, kilometre taşı, seri koruma, haftalık hedefler
    'Rekor': 'Best', 'Rekor yükseklik!': 'Highest tower yet!', 'Kat': 'Level', 'Rekora': 'Only', 'puan kaldı!': 'points to your best!',
    'Hediye serisi': 'Gift streak', 'Günlük çay serisi': 'Daily tea streak', 'gün': 'days', 'Dün kaçtı, şekerle kurtar': 'Missed yesterday, save it with sugar',
    'Seri kurtarıldı': 'Streak saved', 'Seriyi kurtar': 'Save your streak',
    'Bu haftanın hedefleri': "This week's goals", 'gün kaldı': 'days left',
    'Bu hafta {n} bardak diz': 'Stack {n} glasses this week', 'Bu hafta {n} farklı gün oyna': 'Play on {n} different days this week',
    'Ana ekrana ekle': 'Add to home screen',
    'Sonraki ele güç kat': 'Power up your next run', 'Sakin askı': 'Calm hanger', 'İlk 15 bardak yavaş': 'First 15 glasses slower',
    'Yedek tabak': 'Spare saucer', 'Bir devrilmeyi kurtarır': 'Saves one topple', 'Yedek tabak!': 'Spare saucer!',
    'Altın saat': 'Golden hour', 'Yaldızlı bardak ×2': 'Gilded glasses ×2',
    'Seviye': 'Level', 'kaldı': 'to go', 'Çırak': 'Apprentice', 'Ocakçı': 'Stove keeper', 'Demci': 'Brewer', 'Kalfa': 'Journeyman',
    'Usta': 'Master', 'Çaycıbaşı': 'Head tea maker', 'Semaver ustası': 'Samovar master', 'Çay efendisi': 'Tea lord', 'Boğaz efsanesi': 'Bosphorus legend',
    'Çaycı': 'TeaFan',
    'Hedef geçildi!': 'Target beaten!',
    'Meydan okumayı kazandın!': 'Challenge won!',
    'Hedefe': 'Target in',
    'Meydan okuma': 'Challenge',
    'Hedef': 'Target',
    'Haftanın rekoru!': 'Best of the week!',
    'Haftalık turnuva': 'Weekly tournament',
    'Sıra': 'Rank',
    'Rekorun': 'Your best',
    'Herkes aynı bardak': 'Same glasses for all',
    'Bu hafta': 'This week',
    'sen': 'you',
    'Haftalık rekorun': 'When your weekly best passes',
    'puanı geçince': 'points:',
    'Bu haftanın ödüllerini aldın': 'You collected this week\'s prizes',
    'Aynı bardaklarla beni geç': 'Beat me with the same glasses',
    'Haftalık turnuvada beni geç': 'Beat me in the weekly tournament',
    'Kulemi geçebilir misin?': 'Can you beat my tower?',
    'Çay Kulesi haftalık turnuvası': 'Tea Tower weekly tournament',
    'puan yaptım. Bu hafta herkes aynı bardaklarla oynuyor, beni geçebilir misin?': 'points. This week everyone plays the same glasses, can you beat me?',
    'Çay Kulesi haftalık turnuvası: bu hafta herkes aynı bardaklarla oynuyor': 'Tea Tower weekly tournament: this week everyone plays the same glasses',
    'puan yaptım. Aynı bardaklarla beni geçebilir misin?': 'points. Can you beat me with the same glasses?',
    'Bu link geçen haftanın turnuvasından': 'This link is from last week\'s tournament',
    'Haftalık': 'Weekly',
    'Arkadaşın': 'Your friend scored',
    'puan yaptı': 'points',
    'Adın': 'Your name',
    'Oyna': 'Play',
    'Arkadaşlarını çağır': 'Invite friends',
    'Arkadaşına meydan oku': 'Challenge a friend',
    'Meydan okumayı kapat': 'Close the challenge',
    'Herkes aynı bardaklarla': 'Same glasses for everyone'
  };
  var lang = null;
  try { lang = localStorage.getItem('ck_lang'); } catch (e) {}
  if (lang !== 'tr' && lang !== 'en') {
    lang = 'en';
    try { var l = (navigator.languages && navigator.languages[0]) || navigator.language || ''; if (/^tr\b/i.test(l)) lang = 'tr'; } catch (e) {}
  }
  function t(s) { return lang === 'en' && Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s; }
  function translateDom() {
    document.documentElement.lang = lang;
    if (lang !== 'en') return;
    document.title = 'Tea Tower';
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n; while ((n = walker.nextNode())) { var s = n.nodeValue.trim(); if (s && EN[s]) n.nodeValue = n.nodeValue.replace(s, EN[s]); }
    document.querySelectorAll('[aria-label]').forEach(function (el) { var a = el.getAttribute('aria-label'); if (EN[a]) el.setAttribute('aria-label', EN[a]); });
    var h1 = document.querySelector('#title h1'); if (h1) h1.innerHTML = 'Tea <em>Tower</em>';
  }
  // dil değişince sayfa yeniden yüklenir: statik metinler ve önbelleğe alınmış yazılar temiz kurulsun
  function set(l) { if (l === lang) return; try { localStorage.setItem('ck_lang', l); } catch (e) {} location.reload(); }
  window.I18N = { t: t, set: set, translateDom: translateDom, get lang() { return lang; } };
})();
