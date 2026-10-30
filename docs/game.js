/* Çay Kulesi — tek dosyalık Canvas2D oyun motoru */
(() => {
'use strict';

// ------------------------------------------------------------------ utils
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeInOut = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const TAU = Math.PI * 2;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
};
// ayarlar: efekt/ortam sesi, titreşim, grafik kalitesi (auto | high | eco)
const SET = (() => { const d = { sfx: true, amb: true, vib: true, gfx: 'auto' }; try { return Object.assign(d, JSON.parse(store.get('ck_set', '{}'))); } catch (e) { return d; } })();
function saveSet() { store.set('ck_set', JSON.stringify(SET)); }
const GFX_CAP = { auto: 2.5, high: 3, eco: 1.25 };
const eco = () => SET.gfx === 'eco';
const hex = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgb = (c, a) => a == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const shade = (c, k) => k >= 0 ? mixc(c, [255, 240, 220], k) : mixc(c, [20, 4, 2], -k);
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
// portal sürümünde çeviri (platform.js yoksa metin aynen kalır)
const tr = (s) => (window.PF && window.PF.t ? window.PF.t(s) : s);

// ------------------------------------------------------------------ constants (world units, y up)
const PH = 100;          // bir set (tabak+bardak) yüksekliği
const LIFT = 8;          // bardak tabağın içinde ne kadar yukarıda
const GH = 92;           // bardak yüksekliği
const SUP = 30;          // bardak ağzının taşıma yarıçapı
const TRAY_SUP = 96;
const L = 360;           // askı zinciri
const HC = 78;           // askıdaki setin kule tepesine boşluğu
const TEA = [hex('#7c190b'), hex('#a3301a'), hex('#b8461f'), hex('#c45c26')];

const PHASES = [
  { name: 'İkindi', skyTop: '#a3b3cc', skyMid: '#e2c6aa', skyBot: '#f6ddb8', sun: '#fff6e0', glow: '#ffd7a0', far: '#bba595', city: '#6e5656', sea: '#a99c98', seaDeep: '#55606e', shimmer: '#fff0cc', cloud: '#fff3e4', bird: '#4a3838', grade: [255, 220, 184, .12], stars: 0, night: 0, sx: .74, sy: .40, sr: 26 },
  { name: 'Gün batımı', skyTop: '#5f6aa6', skyMid: '#b48fbf', skyBot: '#f6b9a2', sun: '#fff0d2', glow: '#ffb898', far: '#b58aa2', city: '#5a4262', sea: '#8c7096', seaDeep: '#3f3a66', shimmer: '#ffd6b8', cloud: '#f6c8bc', bird: '#2e2236', grade: [240, 192, 204, .18], stars: .25, night: .5, sx: .7, sy: .535, sr: 36 },
  { name: 'Gece', skyTop: '#0c1429', skyMid: '#1d2b4e', skyBot: '#3a4a72', sun: '#f4f1e6', glow: '#a9b8e0', far: '#26314f', city: '#0e1425', sea: '#18233d', seaDeep: '#0b1223', shimmer: '#d4dcff', cloud: '#3e4a6c', bird: '#c8d0ee', grade: [128, 148, 204, .4], stars: 1, night: 1, sx: .26, sy: .2, sr: 19 },
  { name: 'Şafak', skyTop: '#3e4c7a', skyMid: '#9d8baa', skyBot: '#f2c6b2', sun: '#ffe8d2', glow: '#ffc2aa', far: '#8f88a2', city: '#433c58', sea: '#7c7a9a', seaDeep: '#3c3c62', shimmer: '#ffd8c8', cloud: '#f2d2ca', bird: '#2a2440', grade: [222, 196, 222, .2], stars: .35, night: .55, sx: .24, sy: .52, sr: 30 },
  { name: 'Sabah', skyTop: '#86afd2', skyMid: '#bdd3e2', skyBot: '#efe6d8', sun: '#fffaf0', glow: '#fff0d2', far: '#aebcc7', city: '#6e8292', sea: '#7da2b5', seaDeep: '#3f6a84', shimmer: '#ffffff', cloud: '#ffffff', bird: '#3a4a5a', grade: [255, 244, 234, .07], stars: 0, night: 0, sx: .3, sy: .33, sr: 24 },
  { name: 'Öğle', skyTop: '#6399c6', skyMid: '#9fc3dd', skyBot: '#e3ecea', sun: '#ffffff', glow: '#fffae6', far: '#a4b7c3', city: '#5d7482', sea: '#4f8ba6', seaDeep: '#2b6280', shimmer: '#ffffff', cloud: '#ffffff', bird: '#33424e', grade: [255, 250, 240, .05], stars: 0, night: 0, sx: .62, sy: .15, sr: 22 },
].map((p) => {
  const o = { ...p };
  for (const k of ['skyTop', 'skyMid', 'skyBot', 'sun', 'glow', 'far', 'city', 'sea', 'seaDeep', 'shimmer', 'cloud', 'bird']) o[k] = hex(p[k]);
  return o;
});
const PHASE_LEN = 7;

// bardak koleksiyonu: toplam dizilen bardakla açılır ya da şekerle erken alınır; need'i olmayanlar yalnızca şekerle
const SKINS = [
  { name: 'Klasik', need: 0 },
  { name: 'Çizgili', need: 30, price: 80 },
  { name: 'Lale', need: 80, price: 160 },
  { name: 'Nazar', need: 160, price: 300 },
  { name: 'Gümüş', need: 300, price: 500 },
  { name: 'Kobalt', need: 500, price: 800 },
  { name: 'Zümrüt', price: 600 },
  { name: 'Yakut', price: 1000 },
  { name: 'Sedef', price: 1500 },
];
// günlük çark dilimleri (v: şeker, w: ağırlık) ve 7 günlük giriş serisi
const WHEEL = [{ v: 10, w: 20 }, { v: 25, w: 13 }, { v: 15, w: 18 }, { v: 50, w: 7 }, { v: 20, w: 16 }, { v: 35, w: 10 }, { v: 12, w: 14 }, { v: 150, w: 2 }];
const GIFT = [20, 30, 40, 60, 80, 100, 150];
// günlük çay: her gün herkes için aynı kural + aynı bardak dizisi
const DAILY = [
  { name: 'Rüzgârlı Boğaz', drift: 1 },
  { name: 'Telaşlı garson', T: .8 },
  { name: 'Altın saat', gold: .38 },
  { name: 'Geniş salınım', A: 1.22 },
  { name: 'Lodos', drift: 1, T: .9 },
];

// ------------------------------------------------------------------ canvas / sizing
const cv = $('c');
const ctx = cv.getContext('2d', { alpha: false });
let W = 390, H = 844, DPR = 1, S = 1, dprCap = GFX_CAP[SET.gfx] || 2.5;
const SPR = {};
let BG = null;

function resize() {
  W = window.innerWidth; H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, dprCap);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  S = Math.min(W / 390, H / 760);
  buildSprites();
  buildBackground();
}

// ------------------------------------------------------------------ glass profile
const PROF = [[0, 19], [3, 21.5], [12, 22.6], [24, 19.2], [38, 14.6], [52, 16.4], [68, 21.4], [84, 25.6], [92, 27]];
function profHW(h) {
  h = clamp(h, 0, 92);
  let i = 0; while (i < PROF.length - 2 && h > PROF[i + 1][0]) i++;
  const p0 = PROF[i - 1] || PROF[i], p1 = PROF[i], p2 = PROF[i + 1], p3 = PROF[i + 2] || PROF[i + 1];
  const dh = p2[0] - p1[0], t = (h - p1[0]) / dh;
  const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * dh, m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * dh;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
}
function glassPath(g, inset, h0, h1, bottomCurve) {
  g.beginPath();
  g.moveTo(-(profHW(h0) - inset), -h0);
  for (let h = h0; h <= h1; h += 1) g.lineTo(-(profHW(h) - inset), -h);
  g.lineTo(-(profHW(h1) - inset), -h1);
  g.lineTo(profHW(h1) - inset, -h1);
  for (let h = h1; h >= h0; h -= 1) g.lineTo(profHW(h) - inset, -h);
  g.lineTo(profHW(h0) - inset, -h0);
  g.quadraticCurveTo(0, -h0 + bottomCurve, -(profHW(h0) - inset), -h0);
  g.closePath();
}
function stripPath(g, a, b, h0, h1) {
  g.beginPath();
  for (let h = h0; h <= h1; h += 2) g.lineTo(profHW(h) * a, -h);
  for (let h = h1; h >= h0; h -= 2) g.lineTo(profHW(h) * b, -h);
  g.closePath();
}

// ------------------------------------------------------------------ sprites
function sprite(wu, hu, ox, oy, draw) {
  const s = S * DPR;
  const c = mk(wu * s, hu * s);
  const g = c.getContext('2d');
  g.scale(s, s); g.translate(ox, oy);
  draw(g);
  return { c, ox, oy, w: wu, h: hu };
}
function softEllipse(g, x, y, rx, ry, color, a0) {
  g.save(); g.translate(x, y); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, rgb(color, a0)); gr.addColorStop(.55, rgb(color, a0 * .55)); gr.addColorStop(1, rgb(color, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
}
const TEA_H = 80;
// koleksiyon desenleri (cam konturu içine kırpılmış halde çizilir)
function decorate(g, skin) {
  if (skin === 1) {
    // çizgili: dikey kabartmalar
    for (let i = -4; i <= 4; i++) { const a = i / 5; stripPath(g, a - .035, a + .035, 4, 90); g.fillStyle = `rgba(255,255,255,${.1 + (i < 0 ? .08 : 0)})`; g.fill(); }
  } else if (skin === 2) {
    // lale: gövde üstünde kırmızı lale, yanlarda küçükleri
    const tulip = (x, y, s, sq) => {
      g.save(); g.translate(x, y); g.scale(s * sq, s);
      g.strokeStyle = '#3f7a3a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(1, 7, 0, 12); g.stroke();
      g.fillStyle = '#3f7a3a'; g.beginPath(); g.ellipse(-3, 8, 3.2, 1.2, -.6, 0, TAU); g.fill();
      g.fillStyle = '#d23a2a';
      g.beginPath(); g.moveTo(0, 1); g.bezierCurveTo(-7, -1, -6, -9, -4, -11); g.lineTo(-2, -6); g.lineTo(0, -12); g.lineTo(2, -6); g.lineTo(4, -11); g.bezierCurveTo(6, -9, 7, -1, 0, 1); g.fill();
      g.fillStyle = 'rgba(255,220,160,0.55)'; g.beginPath(); g.ellipse(-2.4, -5, 1, 3, .3, 0, TAU); g.fill();
      g.restore();
    };
    tulip(0, -62, 1, 1); tulip(-15, -64, .7, .55); tulip(15, -64, .7, .55);
  } else if (skin === 3) {
    // nazar boncuğu
    const eye = (x, y, r, sq) => {
      g.save(); g.translate(x, y); g.scale(sq, 1);
      for (const [k, c] of [[1, '#1d4fa8'], [.7, '#f6f4ee'], [.48, '#5fb2e6'], [.24, '#141824']]) { g.fillStyle = c; g.beginPath(); g.arc(0, 0, r * k, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(-r * .3, -r * .3, r * .14, 0, TAU); g.fill();
      g.restore();
    };
    eye(0, -63, 7.5, 1); eye(-16, -64, 5, .5); eye(16, -64, 5, .5);
  } else if (skin === 4) {
    // gümüş yaldız: ağız, bel ve dip bantları
    const silver = g.createLinearGradient(-27, 0, 27, 0);
    silver.addColorStop(0, '#6c7480'); silver.addColorStop(.35, '#ffffff'); silver.addColorStop(.55, '#b9c2cc'); silver.addColorStop(1, '#5a626c');
    g.fillStyle = silver;
    g.fillRect(-30, -93, 60, 7); g.fillRect(-30, -41, 60, 4); g.fillRect(-30, -5, 60, 5);
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * 8, -72, 1.6, 0, TAU); g.fill(); }
  } else if (skin === 5) {
    // kobalt: mavi cam + beyaz nokta şeridi
    g.fillStyle = 'rgba(40,86,210,0.34)'; g.fillRect(-30, -93, 60, 95);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.arc(i * 6.4, -86, 1.3, 0, TAU); g.fill(); g.beginPath(); g.arc(i * 6.4 + 3.2, -82, 1, 0, TAU); g.fill(); }
  } else if (skin === 6) {
    // zümrüt: yeşil cam + altın ağız ve bel noktaları
    g.fillStyle = 'rgba(24,150,96,0.36)'; g.fillRect(-30, -93, 60, 95);
    g.fillStyle = '#e8c062'; g.fillRect(-30, -93, 60, 4);
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * 7, -39, 1.5, 0, TAU); g.fill(); }
  } else if (skin === 7) {
    // yakut: kırmızı cam + çapraz kesim parıltıları
    g.fillStyle = 'rgba(200,16,56,0.34)'; g.fillRect(-30, -93, 60, 95);
    g.strokeStyle = 'rgba(255,220,230,0.4)'; g.lineWidth = 1;
    for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * 9 - 10, -4); g.lineTo(i * 9 + 10, -90); g.stroke(); g.beginPath(); g.moveTo(i * 9 + 10, -4); g.lineTo(i * 9 - 10, -90); g.stroke(); }
  } else if (skin === 8) {
    // sedef: gökkuşağı yanardöner + parıltı noktaları
    const ir = g.createLinearGradient(-28, -90, 28, 0);
    ir.addColorStop(0, 'rgba(255,170,220,0.34)'); ir.addColorStop(.35, 'rgba(170,220,255,0.3)'); ir.addColorStop(.65, 'rgba(190,255,210,0.3)'); ir.addColorStop(1, 'rgba(255,230,170,0.34)');
    g.fillStyle = ir; g.fillRect(-30, -93, 60, 95);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [x, y, r] of [[-12, -70, 1.6], [9, -56, 1.2], [-6, -22, 1.3], [13, -80, 1], [2, -40, .9]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  }
}
function makeGlass(tea, golden, skin) {
  return sprite(64, 104, 32, 98, (g) => {
    // arka cam duvarı
    glassPath(g, 0, 0, 92, 3.4);
    g.fillStyle = 'rgba(255,250,240,0.10)'; g.fill();
    // çay
    g.save();
    glassPath(g, 1.7, 3, TEA_H, 2.6); g.clip();
    const hw = 23;
    let gr = g.createLinearGradient(-hw, 0, hw, 0);
    gr.addColorStop(0, rgb(shade(tea, -.55))); gr.addColorStop(.2, rgb(shade(tea, -.2)));
    gr.addColorStop(.42, rgb(shade(tea, .22))); gr.addColorStop(.58, rgb(shade(tea, .08)));
    gr.addColorStop(.82, rgb(shade(tea, -.3))); gr.addColorStop(1, rgb(shade(tea, -.6)));
    g.fillStyle = gr; g.fillRect(-30, -TEA_H - 2, 60, TEA_H + 4);
    gr = g.createLinearGradient(0, 0, 0, -TEA_H);
    gr.addColorStop(0, 'rgba(30,4,0,0.42)'); gr.addColorStop(.35, 'rgba(30,4,0,0)');
    gr.addColorStop(.8, 'rgba(255,200,140,0.0)'); gr.addColorStop(1, 'rgba(255,190,120,0.22)');
    g.fillStyle = gr; g.fillRect(-30, -TEA_H - 2, 60, TEA_H + 4);
    // bel kısmında ışık kırılması
    softEllipse(g, 2, -36, 10, 16, [255, 170, 90], .28);
    g.restore();
    // çay yüzeyi
    const sw = profHW(TEA_H) - 1.7;
    g.save(); g.beginPath(); g.ellipse(0, -TEA_H, sw, 3.1, 0, 0, TAU);
    gr = g.createLinearGradient(-sw, 0, sw, 0);
    gr.addColorStop(0, rgb(shade(tea, .1))); gr.addColorStop(.5, rgb(shade(tea, .42))); gr.addColorStop(1, rgb(shade(tea, -.05)));
    g.fillStyle = gr; g.fill();
    g.strokeStyle = rgb(shade(tea, .6), .7); g.lineWidth = .7; g.stroke(); g.restore();
    // ön cam: yansımalar
    g.save(); glassPath(g, 0, 0, 92, 3.4); g.clip();
    stripPath(g, -.74, -.5, 6, 88); g.fillStyle = 'rgba(255,255,255,0.36)'; g.fill();
    stripPath(g, -.86, -.8, 10, 86); g.fillStyle = 'rgba(255,255,255,0.22)'; g.fill();
    stripPath(g, .52, .64, 50, 88); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fill();
    softEllipse(g, -9, -10, 6, 4, [255, 255, 255], .5);
    // üst boş cam (çayın üstü) hafif buğu
    const gr2 = g.createLinearGradient(0, -TEA_H, 0, -92);
    gr2.addColorStop(0, 'rgba(255,255,255,0.05)'); gr2.addColorStop(1, 'rgba(255,255,255,0.16)');
    g.fillStyle = gr2; g.fillRect(-30, -92, 60, 12);
    if (skin) decorate(g, skin);
    g.restore();
    // kontur
    glassPath(g, 0, 0, 92, 3.4);
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(70,24,14,0.28)'; g.lineWidth = 1.8; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = .8; g.stroke();
    // dip kalınlığı
    g.beginPath(); g.ellipse(0, -2.2, 17, 2.6, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.22)'; g.fill();
    // ağız
    g.beginPath(); g.ellipse(0, -92, 27, 3.6, 0, Math.PI, TAU); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1; g.stroke();
    g.beginPath(); g.ellipse(0, -92, 27, 3.6, 0, 0, Math.PI); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.3; g.stroke();
    if (golden) {
      const gold = g.createLinearGradient(-27, 0, 27, 0);
      gold.addColorStop(0, '#8a5a12'); gold.addColorStop(.35, '#ffe9a0'); gold.addColorStop(.55, '#e0ac3a'); gold.addColorStop(1, '#7a4c0c');
      g.save(); glassPath(g, 0, 85, 92, 0); g.clip();
      g.fillStyle = gold; g.fillRect(-30, -93, 60, 9); g.restore();
      g.beginPath(); g.ellipse(0, -92, 27, 3.6, 0, 0, TAU); g.strokeStyle = '#ffe39a'; g.lineWidth = 1.4; g.stroke();
      g.save(); glassPath(g, 0, 36, 40, 0); g.clip(); g.fillStyle = gold; g.fillRect(-30, -41, 60, 6); g.restore();
      g.save(); glassPath(g, 0, 0, 5, 3.4); g.clip(); g.fillStyle = gold; g.fillRect(-30, -6, 60, 8); g.restore();
    }
  });
}
function makeSaucer(golden) {
  return sprite(126, 30, 63, 20, (g) => {
    // gövde (yan bant)
    g.beginPath();
    g.moveTo(-59, -8);
    g.bezierCurveTo(-56, -2, -40, 0, -30, 0.5);
    g.lineTo(30, 0.5);
    g.bezierCurveTo(40, 0, 56, -2, 59, -8);
    g.ellipse(0, -8, 59, 10, 0, 0, Math.PI, false);
    g.closePath();
    let gr = g.createLinearGradient(0, -8, 0, 2);
    gr.addColorStop(0, '#f6eee2'); gr.addColorStop(.6, '#d9c8b2'); gr.addColorStop(1, '#b8a48e');
    g.fillStyle = gr; g.fill();
    gr = g.createLinearGradient(-59, 0, 59, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.3, 'rgba(255,255,255,0.55)'); gr.addColorStop(.42, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(90,50,30,0.18)');
    g.fillStyle = gr; g.fill();
    // üst yüzey
    g.beginPath(); g.ellipse(0, -8, 59, 10, 0, 0, TAU);
    gr = g.createRadialGradient(-14, -11, 2, 0, -8, 60);
    gr.addColorStop(0, '#fffdf8'); gr.addColorStop(.7, '#f4ebde'); gr.addColorStop(1, '#e2d3bf');
    g.fillStyle = gr; g.fill();
    // kenar çizgileri
    const goldC = golden ? '#f0c65a' : '#c9a14a';
    g.beginPath(); g.ellipse(0, -8, 58.2, 9.6, 0, 0, TAU); g.strokeStyle = goldC; g.lineWidth = golden ? 1.8 : 1.3; g.stroke();
    g.beginPath(); g.ellipse(0, -8, 50.5, 8.2, 0, 0, TAU); g.strokeStyle = 'rgba(176,56,38,0.92)'; g.lineWidth = 1.9; g.stroke();
    g.beginPath(); g.ellipse(0, -8, 47.2, 7.6, 0, 0, TAU); g.strokeStyle = goldC; g.lineWidth = .7; g.stroke();
    // lale motifleri
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU + .3;
      const x = Math.cos(a) * 54.4, y = -8 + Math.sin(a) * 8.9;
      g.save(); g.translate(x, y); g.scale(1, .55 + .45 * Math.abs(Math.sin(a)));
      g.beginPath(); g.moveTo(0, -1.6); g.quadraticCurveTo(1.6, -.4, 0, 1.4); g.quadraticCurveTo(-1.6, -.4, 0, -1.6);
      g.fillStyle = i % 2 ? '#b0382a' : goldC; g.fill(); g.restore();
    }
    // orta çukur + bardak gölgesi
    softEllipse(g, 0, -7.6, 30, 5.4, [110, 70, 40], .3);
    softEllipse(g, 1.5, -8, 22, 3.6, [60, 30, 15], .45);
    g.beginPath(); g.ellipse(0, -8, 22, 3.8, 0, 0, Math.PI); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = .7; g.stroke();
  });
}
function makeTray() {
  return sprite(250, 64, 125, 30, (g) => {
    // gölge masada
    softEllipse(g, 6, 22, 128, 14, [40, 16, 8], .45);
    // yan bant
    g.beginPath(); g.moveTo(-112, 0); g.lineTo(-108, 8); g.ellipse(0, 8, 108, 15, 0, Math.PI, 0, true); g.lineTo(112, 0); g.ellipse(0, 0, 112, 16, 0, 0, Math.PI, false); g.closePath();
    let gr = g.createLinearGradient(-112, 0, 112, 0);
    gr.addColorStop(0, '#6b4514'); gr.addColorStop(.25, '#e8c46e'); gr.addColorStop(.4, '#fff0b8'); gr.addColorStop(.55, '#c99a3c'); gr.addColorStop(1, '#5c3a10');
    g.fillStyle = gr; g.fill();
    // üst yüzey
    g.beginPath(); g.ellipse(0, 0, 112, 16, 0, 0, TAU);
    gr = g.createLinearGradient(-112, -16, 112, 16);
    gr.addColorStop(0, '#d9b25a'); gr.addColorStop(.45, '#f7dc92'); gr.addColorStop(.7, '#c08f36'); gr.addColorStop(1, '#8a5e1c');
    g.fillStyle = gr; g.fill();
    g.beginPath(); g.ellipse(0, 0, 103, 14, 0, 0, TAU); g.strokeStyle = 'rgba(110,70,20,0.55)'; g.lineWidth = 1.4; g.stroke();
    g.beginPath(); g.ellipse(0, .6, 103, 14, 0, .2, Math.PI - .2); g.strokeStyle = 'rgba(255,240,190,0.6)'; g.lineWidth = .8; g.stroke();
    // kakma desen
    g.strokeStyle = 'rgba(120,76,24,0.45)'; g.lineWidth = .8;
    for (let r = 0; r < 2; r++) {
      const rx = 80 - r * 26, ry = 11 - r * 3.6;
      g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.stroke();
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * TAU;
        g.beginPath(); g.ellipse(Math.cos(a) * (rx + 6), Math.sin(a) * (ry + .9), 3.2, 1.1, 0, 0, TAU); g.stroke();
      }
    }
    softEllipse(g, -30, -4, 50, 6, [255, 250, 220], .35);
  });
}
function makeTile() {
  // kilim deseni, 1 ünite = s px
  const s = S * DPR, tw = 64, th = 56;
  const c = mk(tw * s, th * s), g = c.getContext('2d');
  g.scale(s, s);
  g.fillStyle = '#8e2a1e'; g.fillRect(0, 0, tw, th);
  g.fillStyle = '#20304e'; g.fillRect(0, 0, tw, 7); g.fillRect(0, th - 7, tw, 7);
  g.fillStyle = '#e0b25c';
  for (let x = 0; x < tw; x += 8) { g.beginPath(); g.moveTo(x, 7); g.lineTo(x + 4, 11); g.lineTo(x + 8, 7); g.fill(); g.beginPath(); g.moveTo(x, th - 7); g.lineTo(x + 4, th - 11); g.lineTo(x + 8, th - 7); g.fill(); }
  g.fillStyle = '#f1e3c8'; for (let x = 2; x < tw; x += 8) { g.fillRect(x, 2.5, 4, 2); g.fillRect(x, th - 4.5, 4, 2); }
  const cx = tw / 2, cy = th / 2;
  const dia = (r, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r * 1.15, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r * 1.15, cy); g.closePath(); g.fill(); };
  dia(15, '#f1e3c8'); dia(12, '#20304e'); dia(8.5, '#c8642a'); dia(4.5, '#f1e3c8'); dia(2, '#8e2a1e');
  g.fillStyle = '#f1e3c8';
  for (const sx of [-1, 1]) { g.save(); g.translate(cx + sx * 26, cy); g.beginPath(); g.moveTo(0, -5); g.lineTo(3, 0); g.lineTo(0, 5); g.lineTo(-3, 0); g.fill(); g.restore(); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < th; y += 2) g.fillRect(0, y, tw, .5);
  return { c, s, tw, th };
}
function makeGlow(color) {
  const c = mk(128, 128), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, rgb(color, 1)); gr.addColorStop(.25, rgb(color, .45)); gr.addColorStop(1, rgb(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
}
function makeSpark() {
  const c = mk(64, 64), g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(.18, 'rgba(255,230,160,.8)'); gr.addColorStop(1, 'rgba(255,200,100,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,245,.95)';
  g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(34, 30, 62, 32); g.quadraticCurveTo(34, 34, 32, 62); g.quadraticCurveTo(30, 34, 2, 32); g.quadraticCurveTo(30, 30, 32, 2); g.fill();
  return c;
}
// asma: üst köşeden sarkan dal, yapraklar ve salkım; ışık rengi RGB'de, vakit rengi sonra derecelendirmeyle gelir
function vineLeaf(g, x, y, R, rot, dark, blur) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath();
  for (let i = 0; i <= 120; i++) {
    const a = i / 120 * TAU, d = a - Math.PI * 1.5;
    let r = R * (.72 + .28 * Math.pow(Math.abs(Math.cos(2.5 * (a - Math.PI / 2))), .7)) + R * .035 * Math.sin(a * 26);
    r *= 1 - .45 * Math.exp(-(d * d) / .03);   // sapın girdiği oyuk
    const px = Math.cos(a) * r, py = R + Math.sin(a) * r;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  const gr = g.createRadialGradient(0, R * .9, R * .1, 0, R, R * 1.05);
  gr.addColorStop(0, rgb(shade([112, 138, 58], -dark * .5))); gr.addColorStop(.6, rgb(shade([70, 96, 36], -dark * .6))); gr.addColorStop(1, rgb(shade([42, 60, 22], -dark * .7)));
  if (blur) { g.shadowColor = 'rgba(40,56,20,.9)'; g.shadowBlur = blur; }
  g.fillStyle = gr; g.fill(); g.shadowBlur = 0;
  // damarlar: sap dibinden beş loba
  g.strokeStyle = `rgba(210,230,150,${.22 - dark * .12})`; g.lineWidth = R * .045;
  for (const a of [.5, .1, .9, -.3, 1.3]) { g.beginPath(); g.moveTo(0, R * .15); g.quadraticCurveTo(Math.cos(a * Math.PI) * R * .3, R * .6, Math.cos(a * Math.PI) * R * .85, R + Math.sin(a * Math.PI) * R * .85); g.stroke(); }
  g.restore();
}
function makeVine(seed) {
  return sprite(160, 140, 0, 0, (g) => {
    const r = seeded(seed), u = S * DPR;
    g.lineCap = 'round';
    const cane = (pts, w) => { g.strokeStyle = '#3b2716'; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0], pts[1]); g.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]); g.stroke(); };
    // köşeden giren kalın dal, ondan sarkan ince bir sürgün
    cane([-14, -4, 30, 10, 70, 2, 118, 30], 5);
    cane([10, 6, 26, 40, 8, 70, 22, 118], 2.2);
    // filiz kıvrımı
    g.strokeStyle = '#4a3a1c'; g.lineWidth = 1.1; g.beginPath();
    for (let i = 0; i < 40; i++) { const a = i * .32, rr = 7 - i * .15; i ? g.lineTo(112 + Math.cos(a) * rr, 34 + i * .5 + Math.sin(a) * rr) : g.moveTo(112 + rr, 34); }
    g.stroke();
    // köşede iri, öne doğru bulanık yapraklar; içe doğru küçülüp koyulaşır (derinlik)
    const leaves = [[-8, -10, 34, .2, .15], [30, -6, 26, -.3, .55], [6, 30, 24, .5, .75], [62, 2, 21, .1, .85], [88, 16, 16, -.4, .95], [26, 56, 17, .7, .9], [-4, 78, 15, .2, .95]]
      .map(([x, y, R, rot, dark]) => ({ x: x + (r() - .5) * 4, y, R, rot: rot + (r() - .5) * .3, dark }));
    leaves.sort((a, b) => b.dark - a.dark);
    // salkım: arkada, iki yaprağın arasında
    const bx = 46 + r() * 6, by = 30;
    for (let row = 0; row < 6; row++) for (let k = 0; k <= 5 - row; k++) {
      const gx = bx + (k - (5 - row) / 2) * 6.4 + (r() - .5) * 1.5, gy = by + row * 6.2;
      const gg = g.createRadialGradient(gx - 1.3, gy - 1.5, .4, gx, gy, 3.6);
      gg.addColorStop(0, '#8a5a86'); gg.addColorStop(.5, '#4e2a52'); gg.addColorStop(1, '#2a1430');
      g.fillStyle = gg; g.beginPath(); g.arc(gx, gy, 3.4, 0, TAU); g.fill();
    }
    for (const l of leaves) vineLeaf(g, l.x, l.y, l.R, l.rot, l.dark, l.dark < .6 ? (3.5 - l.dark * 4) * u : 0);
  });
}
function buildSprites() {
  for (const m of [SPR.reflM, SPR.beam, ...(SPR.vines || [])]) freeMask(m);
  SPR.glass = TEA.map((t) => makeGlass(t, false, G.skin));
  SPR.glassGold = makeGlass(hex('#a8381c'), true);
  SPR.saucer = makeSaucer(false);
  SPR.saucerGold = makeSaucer(true);
  SPR.tray = makeTray();
  SPR.tile = makeTile();
  SPR.soft = makeGlow([255, 255, 255]);
  SPR.warm = makeGlow([255, 196, 120]);
  SPR.spark = makeSpark();
  SPR.softM = { c: SPR.soft };
  SPR.mistM = { c: SPR.soft };
  SPR.contact = sprite(90, 20, 45, 10, (g) => softEllipse(g, 0, 0, 40, 6.5, [40, 14, 6], .42));
  SPR.kilimPattern = ctx.createPattern(SPR.tile.c, 'repeat');
  // camda gökyüzü yansıması: her karede o anki gök rengiyle boyanır
  SPR.reflM = sprite(64, 104, 32, 98, (g) => {
    g.save(); glassPath(g, 0, 0, 92, 3.4); g.clip(); g.fillStyle = '#fff';
    stripPath(g, -.98, -.6, 4, 90); g.globalAlpha = .9; g.fill();
    stripPath(g, .62, .92, 26, 90); g.globalAlpha = .55; g.fill();
    g.globalAlpha = .45; g.fillRect(-30, -92, 60, 7);
    g.restore();
  });
  SPR.vines = [makeVine(11), makeVine(23)];
  // ışık huzmeleri: güneşten açılan iki kama tek tuvalde (tek çizim), tepede dar, aşağı doğru sönük
  const bc = mk(96, 256), bg = bc.getContext('2d');
  const wedge = (x0, x1, a) => {
    const t = mk(96, 256), tg = t.getContext('2d');
    let gr = tg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, `rgba(255,214,170,${a})`); gr.addColorStop(1, 'rgba(255,214,170,0)');
    tg.fillStyle = gr; tg.beginPath(); tg.moveTo(46, 0); tg.lineTo(50, 0); tg.lineTo(x1, 256); tg.lineTo(x0, 256); tg.closePath(); tg.fill();
    tg.globalCompositeOperation = 'destination-in'; gr = tg.createLinearGradient(x0 / 2 + 24, 0, x1 / 2 + 24, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); tg.fillStyle = gr; tg.fillRect(0, 0, 96, 256);
    bg.drawImage(t, 0, 0); t.width = t.height = 0;
  };
  wedge(0, 62, .9); wedge(58, 96, .7);
  SPR.beam = { c: bc };
}

// ------------------------------------------------------------------ mekânlar (yalnızca görünüm ve ses; oyun kuralları her yerde aynı)
// renk çiftleri [renk, oran]: vaktin rengi bu oranda mekânın rengine çekilir, gece etkisi azalır
const VENUES = [
  { id: 'bogaz', name: 'Boğaz', sub: 'Üsküdar kıyısı', eyebrow: "Boğaz'a karşı", need: 0, water: true, call: 'gull' },
  { id: 'rize', name: 'Rize', sub: 'Çay bahçesi', eyebrow: 'Çay bahçesinde', need: 120, price: 300, water: false, call: 'bird',
    far: ['#4c6e66', .45], city: ['#3a7a3a', .62], ground: ['#4c7a3c', '#22482a', .72] },
  { id: 'kapadokya', name: 'Kapadokya', sub: 'Peri bacaları', eyebrow: 'Peri bacalarına karşı', need: 260, price: 550, water: false, call: 'none',
    far: ['#b4806a', .42], city: ['#d8a67c', .55], ground: ['#cc965f', '#7c4c32', .68] },
  { id: 'bodrum', name: 'Bodrum', sub: 'Ege koyu', eyebrow: "Ege'ye karşı", need: 450, price: 850, water: true, call: 'gull',
    far: ['#6e8a62', .42], city: ['#f6f1e8', .72], sea: ['#2c8cb4', '#0c5a84', .45] },
].map((v) => { for (const k of ['far', 'city', 'ground', 'sea']) if (v[k]) v[k] = v[k].map((c) => typeof c === 'string' ? hex(c) : c); return v; });
const vtint = (base, t, night) => t ? mixc(base, t[0], t[1] * (1 - night * .75)) : base;

function maskCanvas(w, h) { const c = mk(w, h); return { c, g: c.getContext('2d') }; }
function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function drawMosque(g, x, base, u, r, mins) {
  const R = 26 * u * r;
  g.fillRect(x - 54 * u * r, base - 22 * u * r, 108 * u * r, 22 * u * r);
  // yarım kubbeler
  for (const sx of [-1, 1]) {
    g.beginPath(); g.arc(x + sx * 30 * u * r, base - 22 * u * r, 15 * u * r, Math.PI, 0); g.fill();
    g.beginPath(); g.arc(x + sx * 48 * u * r, base - 22 * u * r, 8 * u * r, Math.PI, 0); g.fill();
  }
  g.fillRect(x - R * 1.02, base - 34 * u * r, R * 2.04, 13 * u * r);
  g.beginPath(); g.ellipse(x, base - 34 * u * r, R, R * .92, 0, Math.PI, 0); g.fill();
  g.fillRect(x - .8 * u, base - 34 * u * r - R * .92 - 7 * u * r, 1.6 * u, 8 * u * r);
  for (const m of mins) {
    const mx = x + m[0] * u * r, mh = m[1] * u * r, mw = 3.4 * u * r;
    g.fillRect(mx - mw / 2, base - mh, mw, mh);
    for (let b = 0; b < m[2]; b++) { const by = base - mh * (.62 + b * .14); g.fillRect(mx - mw, by, mw * 2, 2.2 * u * r); }
    g.beginPath(); g.moveTo(mx - mw * .62, base - mh); g.lineTo(mx, base - mh - 15 * u * r); g.lineTo(mx + mw * .62, base - mh); g.fill();
  }
}
// gece pencereleri: siluetin dolu piksellerinden rastgele noktalar (önizlemede atlanır, getImageData pahalı)
function winsOf(g, bw, bh, rnd, u, max, depth) {
  const data = g.getImageData(0, 0, bw, bh).data;
  const wins = [];
  for (let i = 0; i < 1400 && wins.length < max; i++) {
    const px = rnd() * bw | 0, py = (bh - rnd() * depth * u) | 0;
    if (py > 0 && py < bh - 3 * u && data[(py * bw + px) * 4 + 3] > 200) wins.push([px, py, rnd()]);
  }
  return wins;
}
function ridgeMask(bw, bh, u, fn, step) {
  const m = maskCanvas(bw, bh), g = m.g;
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, bh);
  for (let x = 0; x <= bw; x += step || 5) g.lineTo(x, bh - fn(x / bw, x) * u);
  g.lineTo(bw, bh); g.fill();
  return m;
}
// katman maskesi: alfa = şekil, rgb = önceden işlenmiş gölge/doku (beyaz = tam renk). Renk birleştirmede çarpılır.
const grey = (v) => { v = v * 255 | 0; return `rgb(${v},${v},${v})`; };
function atop(m, fn) { const g = m.g; g.save(); g.globalCompositeOperation = 'source-atop'; fn(g); g.restore(); }
// tabana doğru koyulaşma: yamaç dibi gölgede kalır
function baseShade(m, bh, u, top, k) {
  atop(m, (g) => { const gr = g.createLinearGradient(0, bh - top * u, 0, bh); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${k})`); g.fillStyle = gr; g.fillRect(0, 0, m.c.width, bh); });
}
// yatay kaya katmanları (tüf, plato)
function strata(m, bw, bh, u, rnd, top, a) {
  atop(m, (g) => { for (let y = bh - top * u; y < bh;) { const h = (1 + rnd() * 3.5) * u; g.fillStyle = `rgba(0,0,0,${(rnd() * a).toFixed(3)})`; g.fillRect(0, y, bw, h); y += h; } });
}
// çay sıraları: tepe konturuna paralel, aşağı indikçe aralık açılır
function teaRows(m, bw, bh, u, fn, n, gap, a, lw) {
  atop(m, (k) => {
    k.strokeStyle = `rgba(0,0,0,${a})`; k.lineWidth = lw * u;
    for (let j = 1; j <= n; j++) {
      k.beginPath();
      for (let x = 0; x <= bw; x += 8) { const t = x / bw, y = bh - fn(t) * u + j * (gap + j * gap * .2) * u + Math.sin(t * 60 + j) * .6 * u; x ? k.lineTo(x, y) : k.moveTo(x, y); }
      k.stroke();
    }
  });
}
// dağınık koyu benekler: maki, çalı, ağaç
function speckle(m, bw, bh, u, rnd, n, top, r, a) {
  atop(m, (g) => { g.fillStyle = `rgba(0,0,0,${a})`; for (let i = 0; i < n; i++) { const x = rnd() * bw, y = bh - rnd() * top * u, rr = (r * (.5 + rnd())) * u; g.beginPath(); g.ellipse(x, y, rr, rr * .8, 0, 0, TAU); g.fill(); } });
}
// boğaz geçidi: köprünün altında tepeler alçalır, su görünsün
const strait = (t) => 1 - .82 * Math.exp(-Math.pow((t - .72) / .05, 2));
function sceneBogaz(u, bw, bh, rnd, thumb) {
  // en uzak: Anadolu sırtı, pusun içinde
  const haze = ridgeMask(bw, bh, u, (t) => (48 + 12 * Math.sin(t * 2.6 + 2) + 6 * Math.sin(t * 7.9 + .3)) * strait(t), 8);
  // uzak tepeler, seyrek evler ve köprü
  const hill = (t) => (34 + 16 * Math.sin(t * 7.3 + 1) + 10 * Math.sin(t * 17.1) + 6 * Math.sin(t * 41)) * strait(t);
  const far = ridgeMask(bw, bh, u, hill, 6), fg = far.g;
  for (let x = 0; x < bw; x += 5 * u) { if (rnd() < .5) { const hh = (3 + rnd() * 7) * u; fg.fillStyle = grey(.8 + rnd() * .2); fg.fillRect(x, bh - hill(x / bw) * u - hh + 2 * u, 4 * u, hh); } }
  fg.fillStyle = '#fff'; fg.strokeStyle = '#fff';
  { const x0 = bw * .665, x1 = bw * .775, dk = bh - 26 * u, tt = dk - 36 * u;
    fg.fillRect(x0 - 44 * u, dk, x1 - x0 + 88 * u, 2.2 * u);
    for (const x of [x0, x1]) { fg.fillRect(x - 1.4 * u, tt, 2.8 * u, bh - tt); fg.fillRect(x - 1.8 * u, dk + 6 * u, 3.6 * u, 1.4 * u); }
    fg.lineWidth = .8 * u; fg.beginPath();
    fg.moveTo(x0 - 44 * u, dk); fg.quadraticCurveTo(x0 - 12 * u, dk - 8 * u, x0, tt);
    fg.quadraticCurveTo((x0 + x1) / 2, dk + 30 * u, x1, tt);
    fg.quadraticCurveTo(x1 + 12 * u, dk - 8 * u, x1 + 44 * u, dk); fg.stroke();
    fg.globalAlpha = .45; fg.lineWidth = .5 * u; fg.beginPath();
    for (let x = x0 + 4 * u; x < x1 - 2 * u; x += 4 * u) { const f = (x - x0) / (x1 - x0), cy = tt * (1 - f) * (1 - f) + 2 * f * (1 - f) * (dk + 30 * u) + f * f * tt; fg.moveTo(x, cy); fg.lineTo(x, dk); }
    fg.stroke(); fg.globalAlpha = 1; }
  baseShade(far, bh, u, 40, .22);
  // yakın siluet: tarihi yarımada, her bina kendi tonunda
  const city = maskCanvas(bw, bh);
  const g = city.g;
  let x = 0;
  while (x < bw) { const w = (7 + rnd() * 16) * u, h = (5 + rnd() * 14) * u; g.fillStyle = grey(.72 + rnd() * .28); g.fillRect(x, bh - h, w + 1, h); if (rnd() < .3) { g.beginPath(); g.moveTo(x, bh - h); g.lineTo(x + w / 2, bh - h - 5 * u); g.lineTo(x + w, bh - h); g.fill(); } x += w; }
  g.fillStyle = '#fff';
  g.fillRect(0, bh - 6 * u, bw, 6 * u);
  drawMosque(g, bw * .18, bh - 4 * u, u, .78, [[-62, 70, 2], [62, 70, 2]]);
  drawMosque(g, bw * .43, bh - 8 * u, u, 1.0, [[-66, 88, 3], [66, 88, 3], [-84, 70, 2], [84, 70, 2]]);
  // galata
  { const gx = bw * .62, gb = bh - 10 * u; g.fillRect(gx - 7 * u, gb - 58 * u, 14 * u, 58 * u); g.fillRect(gx - 8.4 * u, gb - 50 * u, 16.8 * u, 3 * u);
    g.beginPath(); g.moveTo(gx - 8 * u, gb - 58 * u); g.lineTo(gx, gb - 78 * u); g.lineTo(gx + 8 * u, gb - 58 * u); g.fill(); g.fillRect(gx - .7 * u, gb - 84 * u, 1.4 * u, 7 * u);
    atop(city, (k) => { k.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 4; i++) k.fillRect(gx - 5 * u + i * 3 * u, gb - 46 * u, 1.4 * u, 3 * u); }); }
  drawMosque(g, bw * .8, bh - 5 * u, u, .7, [[-60, 72, 2], [60, 72, 2], [-74, 60, 1], [74, 60, 1]]);
  drawMosque(g, bw * .97, bh - 3 * u, u, .5, [[-58, 70, 2]]);
  baseShade(city, bh, u, 30, .32);
  const wins = thumb ? [] : winsOf(g, bw, bh, rnd, u, 170, 40);
  // kız kulesi
  const kk = maskCanvas(60 * u, 54 * u);
  { const k = kk.g, c = 30 * u; k.fillStyle = '#fff';
    k.beginPath(); k.ellipse(c, 50 * u, 26 * u, 5 * u, 0, 0, TAU); k.fill();
    k.fillRect(c - 20 * u, 36 * u, 40 * u, 14 * u); k.fillRect(c - 6 * u, 14 * u, 12 * u, 24 * u); k.fillRect(c - 7.5 * u, 22 * u, 15 * u, 2 * u);
    k.beginPath(); k.moveTo(c - 6.5 * u, 14 * u); k.lineTo(c, 2 * u); k.lineTo(c + 6.5 * u, 14 * u); k.fill();
    k.beginPath(); k.arc(c + 13 * u, 36 * u, 5 * u, Math.PI, 0); k.fill(); }
  // vapur
  const fe = maskCanvas(70 * u, 26 * u);
  { const k = fe.g; k.fillStyle = '#fff';
    k.beginPath(); k.moveTo(0, 15 * u); k.lineTo(70 * u, 15 * u); k.lineTo(64 * u, 23 * u); k.lineTo(6 * u, 23 * u); k.fill();
    k.fillRect(8 * u, 9 * u, 54 * u, 6 * u); k.fillRect(14 * u, 4 * u, 40 * u, 5 * u); k.fillRect(31 * u, 0, 6 * u, 5 * u); }
  const layers = [
    { m: haze, d: 1, col: 'far', top: 64, dy: 6 },
    { m: far, d: .55, col: 'far', top: 62, sh: 4, dy: 4 },
    { m: city, d: 0, col: 'city', top: 100, sh: 6, dy: 0 },
  ];
  return { layers, wins, kk, fe };
}
function sceneRize(u, bw, bh, rnd, thumb) {
  // kaçkarlar: sivri, yüksek sırtlar, en uzakta
  const peaks = ridgeMask(bw, bh, u, (t) => 62 + 26 * Math.sin(t * 5.3 + 2) + 16 * Math.abs(Math.sin(t * 13.7 + .4)) + 6 * Math.sin(t * 37));
  // ara sırt: karşı yamacın çaylıkları
  const midH = (t) => 44 + 12 * Math.sin(t * 3.1 + 2.2) + 6 * Math.sin(t * 7.7 + .8);
  const mid = ridgeMask(bw, bh, u, midH, 6);
  teaRows(mid, bw, bh, u, midH, 12, 1.8, .2, .8);
  speckle(mid, bw, bh, u, rnd, 120, 40, 1.6, .28);
  baseShade(mid, bh, u, 40, .2);
  // yakın çay tepeleri + ahşap evler, ağaç kümeleri, küçük cami
  const hill = (t) => 34 + 16 * Math.sin(t * 4.2 + .5) + 8 * Math.sin(t * 9.3 + 1.2);
  const city = ridgeMask(bw, bh, u, hill), g = city.g;
  atop(city, (k) => { k.fillStyle = grey(.86); k.fillRect(0, 0, bw, bh); });
  teaRows(city, bw, bh, u, hill, 10, 3, .34, 1.3);
  for (let x = 20 * u; x < bw; x += (26 + rnd() * 60) * u) {
    const y = bh - hill(x / bw) * u + 2 * u;
    if (rnd() < .55) {
      const w = (8 + rnd() * 6) * u, h = (6 + rnd() * 4) * u;
      g.fillStyle = '#fff'; g.fillRect(x - w / 2, y - h, w, h);
      g.fillStyle = grey(.78); g.fillRect(x + w * .18, y - h, w * .32, h);
      g.fillStyle = grey(.48); g.beginPath(); g.moveTo(x - w / 2 - 1.5 * u, y - h); g.lineTo(x, y - h - 5 * u); g.lineTo(x + w / 2 + 1.5 * u, y - h); g.fill();
    } else { g.fillStyle = grey(.5); for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + (k - 1) * 4 * u, y - (4 + rnd() * 4) * u, (3 + rnd() * 2.5) * u, 0, TAU); g.fill(); } }
  }
  g.fillStyle = '#fff';
  drawMosque(g, bw * .72, bh - hill(.72) * u + 3 * u, u, .42, [[-56, 76, 2]]);
  baseShade(city, bh, u, 50, .3);
  const wins = thumb ? [] : winsOf(g, bw, bh, rnd, u, 60, 34);
  const layers = [
    { m: peaks, d: 1, col: 'far', top: 110, dy: 6 },
    { m: mid, d: .5, col: 'mid', top: 64, sh: 4, dy: 3 },
    { m: city, d: 0, col: 'city', top: 60, sh: 5, dy: 0 },
  ];
  return { layers, wins, mist: true };
}
function sceneKapadokya(u, bw, bh, rnd, thumb) {
  // en uzak: erciyes, karlı zirve
  const ercH = (t) => 24 + 5 * Math.sin(t * 5.1 + 1) + 3 * Math.sin(t * 31) + 86 * Math.exp(-Math.abs(t - .7) / .075) * (1 - .08 * Math.exp(-Math.pow((t - .7) / .01, 2)));
  const erc = ridgeMask(bw, bh, u, ercH, 4);
  atop(erc, (k) => {
    k.fillStyle = 'rgba(0,0,0,.24)'; k.beginPath(); k.moveTo(0, bh);
    for (let x = 0; x <= bw; x += 3 * u) k.lineTo(x, bh - (Math.min(ercH(x / bw) - 2, 78 + rnd() * 6 + Math.sin(x * .05 / u) * 6 + 8 * Math.abs(Math.sin(x * .013 / u)))) * u);
    k.lineTo(bw, bh); k.fill();
  });
  // düz tepeli platolar, katman katman
  const K = 8, hs = []; for (let i = 0; i <= K; i++) hs.push(30 + rnd() * 34);
  const far = ridgeMask(bw, bh, u, (t, x) => {
    const f = t * K, i = Math.min(K - 1, f | 0), e = clamp((f - i - .8) / .2, 0, 1);
    return lerp(hs[i], hs[i + 1], e * e * (3 - 2 * e)) + Math.sin(x * .05 / u) * 1.2;
  }, 4);
  strata(far, bw, bh, u, rnd, 70, .16);
  baseShade(far, bh, u, 50, .22);
  // peri bacaları + uçhisar kalesi
  const city = ridgeMask(bw, bh, u, (t) => 9 + 5 * Math.sin(t * 9 + 1), 6), g = city.g;
  const base = bh - 8 * u, caps = [];
  const chim = (x, h, w) => {
    g.beginPath(); g.moveTo(x - w, base);
    g.bezierCurveTo(x - w * .55, base - h * .35, x - w * .32, base - h * .8, x - w * .18, base - h);
    g.lineTo(x + w * .18, base - h);
    g.bezierCurveTo(x + w * .32, base - h * .8, x + w * .55, base - h * .35, x + w, base); g.fill();
    caps.push([x, base - h, w]);
  };
  for (let x = 6 * u; x < bw; x += (10 + rnd() * 22) * u) {
    if (Math.abs(x / bw - .34) < .06) continue;
    const n = 1 + (rnd() * 3 | 0);
    for (let k = 0; k < n; k++) chim(x + k * 5 * u, (16 + rnd() * 34) * u, (5 + rnd() * 5) * u);
  }
  const cx = bw * .34, b = base + 2 * u;
  g.beginPath(); g.moveTo(cx - 46 * u, b);
  g.bezierCurveTo(cx - 40 * u, b - 30 * u, cx - 26 * u, b - 44 * u, cx - 14 * u, b - 50 * u);
  g.lineTo(cx - 12 * u, b - 70 * u); g.bezierCurveTo(cx - 6 * u, b - 79 * u, cx + 6 * u, b - 79 * u, cx + 12 * u, b - 70 * u);
  g.lineTo(cx + 16 * u, b - 50 * u); g.bezierCurveTo(cx + 28 * u, b - 42 * u, cx + 40 * u, b - 28 * u, cx + 48 * u, b); g.fill();
  g.fillRect(cx - .8 * u, b - 88 * u, 1.6 * u, 12 * u); g.fillRect(cx + .8 * u, b - 88 * u, 6 * u, 4 * u);
  strata(city, bw, bh, u, rnd, 90, .13);
  // bazalt şapkalar koyu, kalenin yüzünde oyma pencereler
  g.fillStyle = grey(.58);
  for (const [x, y, w] of caps) { g.beginPath(); g.ellipse(x, y - 1.2 * u, w * .44, 3 * u, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x, y - 3.4 * u, w * .26, 2.8 * u, 0, Math.PI, 0); g.fill(); }
  atop(city, (k) => { k.fillStyle = 'rgba(0,0,0,.5)'; for (let i = 0; i < 46; i++) { const hx = cx + (rnd() - .5) * 60 * u, hy = b - (6 + rnd() * 62) * u; k.fillRect(hx, hy, 1.6 * u, 2.2 * u); } });
  baseShade(city, bh, u, 40, .3);
  const wins = thumb ? [] : winsOf(g, bw, bh, rnd, u, 110, 70);
  // balonlar: toprak tonlu, önbelleğe alınmış küçük sprite'lar
  const pal = [['#b8503c', '#dcb25c', '#3e6a94'], ['#cf8448', '#ece0c8'], ['#4c8064', '#d8bc6a', '#b04c3a'], ['#6e5690', '#dcb0b6']];
  const balloons = pal.map((p, i) => makeBalloon(u * (i % 2 ? 1.05 : 1.35), p));
  const layers = [
    { m: erc, d: 1, col: 'far', top: 124, dy: 6 },
    { m: far, d: .5, col: 'far', top: 66, sh: 4, dy: 4 },
    { m: city, d: 0, col: 'city', top: 90, sh: 7, dy: 0 },
  ];
  return { layers, wins, balloons };
}
function makeBalloon(u, cols) {
  const r = 9 * u, c = mk(r * 2 + 2, r * 3.2), g = c.getContext('2d');
  g.translate(r + 1, r + 1);
  g.save();
  g.beginPath(); g.arc(0, 0, r, Math.PI * .82, Math.PI * .18);
  g.quadraticCurveTo(r * .55, r * 1.2, r * .28, r * 1.45); g.lineTo(-r * .28, r * 1.45);
  g.quadraticCurveTo(-r * .55, r * 1.2, Math.cos(Math.PI * .82) * r, Math.sin(Math.PI * .82) * r); g.closePath(); g.clip();
  for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(-r + i * r / 3, -r, r / 3 + 1, r * 2.6); }
  const sh = g.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r * 1.6);
  sh.addColorStop(0, 'rgba(255,255,255,.3)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(40,10,10,.5)');
  g.fillStyle = sh; g.fillRect(-r, -r, r * 2, r * 2.6);
  g.restore();
  g.strokeStyle = 'rgba(60,30,20,.7)'; g.lineWidth = Math.max(.6, .1 * r);
  g.beginPath(); g.moveTo(-r * .26, r * 1.45); g.lineTo(-r * .16, r * 1.86); g.moveTo(r * .26, r * 1.45); g.lineTo(r * .16, r * 1.86); g.stroke();
  g.fillStyle = '#6a3e1e'; g.fillRect(-r * .2, r * 1.84, r * .4, r * .32);
  return { c, r };
}
function sceneBodrum(u, bw, bh, rnd, thumb) {
  // en uzak: karşı adalar
  const isl = ridgeMask(bw, bh, u, (t) => 30 + 12 * Math.sin(t * 3.3 + 1.4) + 5 * Math.sin(t * 11.2), 6);
  // evlerin yaslandığı yamaç, makiyle benekli
  const hillH = (t) => 74 * Math.exp(-Math.pow((t - .46) / .2, 2));
  const far = ridgeMask(bw, bh, u, (t) => Math.max(20 + 9 * Math.sin(t * 6.1 + .4) + 5 * Math.sin(t * 17.3), hillH(t) + 3 * Math.sin(t * 23)));
  speckle(far, bw, bh, u, rnd, 420, 80, 1.5, .22);
  baseShade(far, bh, u, 60, .2);
  // beyaz kübik evler (gölgeli yan yüz), servi, sırtta yel değirmenleri, kıyıda kale
  const city = maskCanvas(bw, bh), g = city.g;
  g.fillStyle = '#fff'; g.fillRect(0, bh - 3 * u, bw, 3 * u);
  // evler yamaca teraslar hâlinde dizilir, alttakiler önde
  const houses = [];
  for (let i = 0; i < 340; i++) {
    const t = .24 + rnd() * .46, top = hillH(t);
    if (top < 12) continue;
    houses.push([t, Math.round(top * (.04 + rnd() * .8) / 4.5) * 4.5 + rnd() * 1.2, (3 + rnd() * 4) * u, (2.6 + rnd() * 2.4) * u]);
  }
  houses.sort((a, b) => b[1] - a[1]);
  for (const [t, yy, w, h] of houses) {
    const x0 = t * bw - w / 2, y0 = bh - yy * u - h;
    g.fillStyle = '#fff'; g.fillRect(x0, y0, w, h);
    g.fillStyle = grey(.86); g.fillRect(x0 + w * .64, y0, w * .36, h);
  }
  g.fillStyle = grey(.42);
  for (let i = 0; i < 34; i++) { const t = .26 + rnd() * .42, top = hillH(t); if (top < 14) continue; const x = t * bw, y = bh - top * (.05 + rnd() * .75) * u, hh = (5 + rnd() * 4) * u; g.beginPath(); g.ellipse(x, y - hh / 2, .9 * u, hh / 2, 0, 0, TAU); g.fill(); }
  // yel değirmenleri: taş gövde, konik külah, altı ince kollu kanat (bazıları yıkık, kanatsız)
  for (const t of [.38, .43, .5, .55]) {
    const x = t * bw, y = bh - (hillH(t) - 2) * u, a = rnd() * TAU, hy = y - 10 * u;
    g.fillStyle = grey(.92);
    g.beginPath(); g.moveTo(x - 3.6 * u, y); g.lineTo(x - 2.9 * u, hy); g.lineTo(x + 2.9 * u, hy); g.lineTo(x + 3.6 * u, y); g.fill();
    g.fillStyle = grey(.6); g.beginPath(); g.moveTo(x - 3.2 * u, hy); g.lineTo(x, hy - 3.6 * u); g.lineTo(x + 3.2 * u, hy); g.fill();
    if (t === .43) continue;
    g.strokeStyle = grey(.7); g.lineWidth = .6 * u; g.beginPath();
    for (let k = 0; k < 6; k++) { const b = a + k * Math.PI / 3; g.moveTo(x, hy - 1.4 * u); g.lineTo(x + Math.cos(b) * 7 * u, hy - 1.4 * u + Math.sin(b) * 7 * u); }
    g.stroke();
  }
  g.fillStyle = grey(.88);
  { const cx = bw * .82, b = bh - 2 * u;
    g.beginPath(); g.ellipse(cx, b, 52 * u, 6 * u, 0, Math.PI, 0); g.fill();
    g.fillRect(cx - 40 * u, b - 16 * u, 80 * u, 16 * u);
    g.fillRect(cx - 14 * u, b - 38 * u, 13 * u, 38 * u); g.fillRect(cx + 16 * u, b - 28 * u, 10 * u, 28 * u);
    for (let i = 0; i < 9; i++) g.fillRect(cx - 40 * u + i * 9.4 * u, b - 19 * u, 4.4 * u, 3 * u);
    for (let i = 0; i < 3; i++) { g.fillRect(cx - 14 * u + i * 4.6 * u, b - 41 * u, 3 * u, 3 * u); g.fillRect(cx + 16 * u + i * 3.6 * u, b - 31 * u, 2.4 * u, 3 * u); }
    g.fillRect(cx - 8 * u, b - 48 * u, 1.2 * u, 10 * u); g.fillRect(cx - 6.8 * u, b - 48 * u, 5 * u, 3.4 * u);
    atop(city, (k) => { k.fillStyle = 'rgba(0,0,0,.18)'; for (let y = b - 38 * u; y < b; y += 2.6 * u) k.fillRect(cx - 52 * u, y, 104 * u, .5 * u); }); }
  baseShade(city, bh, u, 30, .25);
  const wins = thumb ? [] : winsOf(g, bw, bh, rnd, u, 160, 70);
  // gulet
  const fe = maskCanvas(72 * u, 40 * u);
  { const k = fe.g; k.fillStyle = '#fff';
    k.beginPath(); k.moveTo(2 * u, 29 * u); k.lineTo(72 * u, 26 * u); k.quadraticCurveTo(64 * u, 37 * u, 52 * u, 38 * u); k.lineTo(12 * u, 38 * u); k.quadraticCurveTo(5 * u, 35 * u, 2 * u, 29 * u); k.fill();
    k.fillRect(16 * u, 25 * u, 30 * u, 4 * u);
    k.fillRect(26 * u, 3 * u, 1.4 * u, 24 * u); k.fillRect(44 * u, 8 * u, 1.2 * u, 19 * u);
    k.beginPath(); k.moveTo(27.4 * u, 4 * u); k.lineTo(27.4 * u, 23 * u); k.lineTo(40 * u, 23 * u); k.fill();
    k.beginPath(); k.moveTo(45.2 * u, 9 * u); k.lineTo(45.2 * u, 23 * u); k.lineTo(56 * u, 23 * u); k.fill();
    k.beginPath(); k.moveTo(26 * u, 5 * u); k.lineTo(15 * u, 23 * u); k.lineTo(25 * u, 23 * u); k.fill(); }
  const layers = [
    { m: isl, d: 1, col: 'far', top: 50, dy: 5 },
    { m: far, d: .5, col: 'far', top: 80, sh: 4, dy: 3 },
    { m: city, d: 0, col: 'city', top: 80, sh: 2, rim: .5, dy: 0 },
  ];
  return { layers, wins, fe };
}
const SCENES = { bogaz: sceneBogaz, rize: sceneRize, kapadokya: sceneKapadokya, bodrum: sceneBodrum };
function buildScene(id, u, bw, bh, thumb) { return (SCENES[id] || sceneBogaz)(u, bw, bh, seeded(7), thumb); }
// eski arka plan canvas'larını hemen boşalt: iOS canvas belleğini geç bırakır, art arda mekân değişimi sınırı aşmasın
function freeMask(m) { if (!m) return; for (const c of [m.c, m._t]) if (c) c.width = c.height = 0; m._key = null; }
function freeScene(sc) {
  for (const L of sc.layers) freeMask(L.m);
  for (const k of ['kk', 'fe', 'comp', 'T', 'E']) freeMask(sc[k]);
  if (sc.balloons) sc.balloons.forEach(freeMask);
  if (sc.comps) sc.comps.forEach(freeMask);
}
let CLOUDS = null;
function buildBackground() {
  const u = S * DPR;
  const bw = Math.ceil(W * DPR * 1.5), bh = Math.ceil(170 * u);
  if (BG) { freeScene(BG); BG.ov.width = BG.ov.height = 0; }
  const sc = buildScene(VENUES[G.venue].id, u, bw, bh);
  // bulutlar: mekândan bağımsız, yalnızca çözünürlük değişince yeniden çizilir
  if (!CLOUDS || CLOUDS.u !== u) {
    if (CLOUDS) CLOUDS.list.forEach((m) => { freeMask(m); freeMask(m.sh); });
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      // yassı küme: geniş, basık tepecikler düz bir tabana oturur, altında ince bir stratus şeridi
      const cw = (180 + i * 36) * u, ch = 64 * u, m = maskCanvas(cw, ch), g = m.g, base = ch * .8;
      const r2 = seeded(31 + i * 7);
      const puff = (cx, cy, rx, ry, a) => {
        g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(.72, `rgba(255,255,255,${a * .85})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
      };
      puff(cw * .5, base - 2 * u, cw * .46, 6 * u, .7);
      for (let j = 0; j < 11; j++) {
        const t = .14 + r2() * .72, rx = (20 + r2() * 26) * u * (1.25 - 1.5 * Math.abs(t - .5)), ry = rx * (.42 + r2() * .2);
        puff(cw * t, base - ry * .3, rx, ry, .95);
      }
      g.globalCompositeOperation = 'destination-out';
      const cut = g.createLinearGradient(0, base - 1 * u, 0, base + 5 * u); cut.addColorStop(0, 'rgba(0,0,0,0)'); cut.addColorStop(1, 'rgba(0,0,0,1)');
      g.fillStyle = cut; g.fillRect(0, base - 1 * u, cw, ch);
      // alt yüz gölgesi: aynı biçimin alt yarısı, ayrı renkle boyanır
      const sh = maskCanvas(cw, ch);
      sh.g.drawImage(m.c, 0, 0); sh.g.globalCompositeOperation = 'destination-in';
      const sg = sh.g.createLinearGradient(0, base - 22 * u, 0, base); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,1)');
      sh.g.fillStyle = sg; sh.g.fillRect(0, 0, cw, ch);
      m.sh = sh;
      clouds.push(m);
    }
    const stars = []; const r3 = seeded(99);
    for (let i = 0; i < 140; i++) stars.push([r3(), r3() * .75, .4 + r3() * 1.2, r3() * TAU]);
    CLOUDS = { u, list: clouds, stars };
  }
  // ufuk tek tuvalde birleşir: kara katmanları + deniz/kara zemini (ekranın alt %42'si)
  BG = { bw, bh, ...sc, clouds: CLOUDS.list, stars: CLOUDS.stars, ov: mk(Math.ceil(W / 3), Math.ceil(H / 3)), ovKey: '',
    comps: [0, 1].map(() => maskCanvas(bw, bh + Math.ceil(H * .42 * DPR))), T: maskCanvas(bw, bh), E: maskCanvas(bw, bh) };
}
// ------------------------------------------------------------------ ufuk birleştirme
// Bir vaktin renkleriyle: katman rengi × gölge, güneşe bakan kenar aydınlık, karşı yan gölgede, uzak katman pusa gömülür.
// Sonra ufuk pusu, güneş saçılması, su (yansıma + dalga bantları) ya da vadi tabanı. Vakit başına bir kez çizilir (horizonFor).
const hazeOf = (P) => mixc(P.skyBot, P.glow, .3);
function layerColor(L, P, V, nt) {
  const far = vtint(mixc(P.far, P.skyBot, .25), V.far, nt), city = vtint(P.city, V.city, nt);
  return L.col === 'far' ? far : L.col === 'mid' ? mixc(far, city, .55) : city;
}
function composeHorizon(o, layers, bh, P, V, u, T, E, vw, lite) {
  const g = o.g, bw = o.c.width, H2 = o.c.height, sh = H2 - bh, nt = P.night, hz = hazeOf(P);
  const side = P.sx > .5 ? 1 : -1, lightC = rgb(mixc(P.glow, P.sun, .5)), litA = .55 * (1 - nt * .6);
  const t = T.g, e = E.g;
  g.clearRect(0, 0, bw, H2);
  for (const L of layers) {
    const C = layerColor(L, P, V, nt), m = L.m.c;
    t.globalCompositeOperation = 'copy'; t.drawImage(m, 0, 0);
    t.globalCompositeOperation = 'multiply'; t.fillStyle = rgb(C); t.fillRect(0, 0, bw, bh);
    t.globalCompositeOperation = 'destination-in'; t.drawImage(m, 0, 0);
    t.globalCompositeOperation = 'source-atop';
    if (L.d < .9) {
      // kenar ışığı: güneş yönündeki komşusu boş olan pikseller
      const r = 1.3 * u;
      e.globalCompositeOperation = 'copy'; e.drawImage(m, 0, 0);
      e.globalCompositeOperation = 'destination-out'; e.drawImage(m, -side * r, r);
      e.globalCompositeOperation = 'source-in'; e.fillStyle = lightC; e.fillRect(0, 0, bw, bh);
      t.globalAlpha = litA * (1 - L.d * .6) * (L.rim || 1); t.drawImage(E.c, 0, 0);
      // gölge yanı: güneşin karşısındaki kenarda yumuşak bant
      if (L.sh && !lite) {
        e.globalCompositeOperation = 'copy'; e.globalAlpha = 1; e.drawImage(m, 0, 0);
        e.globalCompositeOperation = 'destination-out'; e.globalAlpha = .5;
        for (let k = 1; k <= 3; k++) e.drawImage(m, side * L.sh * u * k / 3, 0);
        e.globalAlpha = 1; e.globalCompositeOperation = 'source-in'; e.fillStyle = rgb(mixc(mixc(C, [0, 0, 0], .5), P.skyTop, .3)); e.fillRect(0, 0, bw, bh);
        t.globalAlpha = .5 * (1 - L.d * .7); t.drawImage(E.c, 0, 0);
      }
      t.globalAlpha = 1;
    }
    // hava perspektifi: uzak katman göğe yaklaşır, etekleri pusa gömülür
    const hg = t.createLinearGradient(0, bh - L.top * u, 0, bh);
    hg.addColorStop(0, rgb(hz, L.d * .6)); hg.addColorStop(1, rgb(hz, Math.min(.9, L.d * .6 + .14)));
    t.fillStyle = hg; t.fillRect(0, 0, bw, bh);
    t.globalCompositeOperation = 'source-over';
    g.drawImage(T.c, 0, (L.dy || 0) * u);
  }
  // ufuk pusu (gökyüzüne de taşar) ve güneş tarafında ışık saçılması
  let gr = g.createLinearGradient(0, bh - 46 * u, 0, bh);
  gr.addColorStop(0, rgb(hz, 0)); gr.addColorStop(1, rgb(hz, .24 * (1 - nt * .4)));
  g.fillStyle = gr; g.fillRect(0, bh - 46 * u, bw, 46 * u);
  const sxc = (bw - vw) / 2 + P.sx * vw, sr = 130 * u;
  gr = g.createRadialGradient(sxc, bh, 0, sxc, bh, sr);
  gr.addColorStop(0, rgb(P.glow, .16 * (1 - nt * .7))); gr.addColorStop(1, rgb(P.glow, 0));
  g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(sxc - sr, bh - sr, sr * 2, sr * 2); g.globalCompositeOperation = 'source-over';
  const rnd = seeded(5);
  let low;
  if (V.water) {
    const sea = V.sea;
    const top = sea ? vtint(mixc(P.sea, P.skyBot, .35), [sea[0], sea[2]], nt) : mixc(P.sea, P.skyBot, .35);
    low = sea ? vtint(P.seaDeep, [sea[1], sea[2]], nt) : P.seaDeep;
    gr = g.createLinearGradient(0, bh, 0, H2); gr.addColorStop(0, rgb(top)); gr.addColorStop(1, rgb(low));
    g.fillStyle = gr; g.fillRect(0, bh, bw, sh);
    // yansıma: karanın ters, basık, dalgayla kırılmış şeritleri
    t.globalCompositeOperation = 'copy'; t.drawImage(o.c, 0, 0, bw, bh, 0, 0, bw, bh); t.globalCompositeOperation = 'source-over';
    const sq = .5, hs = Math.max(2, (lite ? 4 : 2.2) * u), n = Math.ceil(70 * u * sq / hs);
    for (let i = 0; i < n; i++) {
      const y0 = bh + i * hs, f = i / n;
      g.setTransform(1, 0, 0, -1, 0, 2 * y0 + hs);
      g.globalAlpha = .4 * (1 - f);
      g.drawImage(T.c, 0, bh - (i + 1) * hs / sq, bw, hs / sq, Math.sin(i * 2.3) * (.4 + f * 2.4) * u, y0, bw, hs);
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    // dalga bantları: ufka yakın sık ve ince, yakında seyrek ve kalın; açık (gök yansıması) ve koyu sırayla
    const lc = mixc(P.skyBot, P.shimmer, .3), dc = mixc(low, [0, 0, 0], .25);
    for (let k = 0; k < 46; k++) {
      const f = k / 46, y = bh + 1 + Math.pow(f, 1.9) * sh, th = (.4 + f * 1.8) * u * .7;
      g.fillStyle = rgb(k % 2 ? lc : dc, (k % 2 ? .1 : .08) * (1 - f * .3));
      for (let x = -rnd() * 30 * u; x < bw;) { const len = (10 + rnd() * 60) * u * (.4 + f); g.fillRect(x, y + (rnd() - .5) * th * 2, len, th); x += len + (14 + rnd() * 70) * u * (.4 + f); }
    }
  } else {
    // vadi tabanı: perspektifte tarla/çaylık sıraları, ufka yakın pus
    const gt = V.ground, top = vtint(P.far, [gt[0], gt[2]], nt);
    low = vtint(P.city, [gt[1], gt[2]], nt);
    gr = g.createLinearGradient(0, bh, 0, H2); gr.addColorStop(0, rgb(top)); gr.addColorStop(1, rgb(low));
    g.fillStyle = gr; g.fillRect(0, bh, bw, sh);
    const dc = mixc(low, [0, 0, 0], .22), dense = V.id === 'rize';
    if (dense) {
      g.strokeStyle = rgb(dc, .34);
      for (let k = 0; k < 22; k++) {
        const f = k / 22, y = bh + 2 * u + Math.pow(f, 1.6) * sh * .95, amp = (1 + f * 10) * u, fr = .004 / u * (1 + k % 3 * .3);
        g.lineWidth = (.5 + f * 2.2) * u * .7; g.beginPath();
        for (let x = 0; x <= bw; x += 10) { const yy = y + Math.sin(x * fr + k * 1.7) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
        g.stroke();
      }
    } else {
      for (let k = 0; k < 18; k++) {
        const f = k / 18, y = bh + 2 * u + Math.pow(f, 1.7) * sh * .9, th = (.4 + f * 1.6) * u * .6;
        g.fillStyle = rgb(dc, .1 * (1 - f * .3));
        for (let x = -rnd() * 30 * u; x < bw;) { const len = (10 + rnd() * 50) * u * (.4 + f); g.fillRect(x, y, len, th); x += len + (10 + rnd() * 60) * u * (.4 + f); }
      }
    }
    gr = g.createLinearGradient(0, bh, 0, bh + sh * .35);
    gr.addColorStop(0, rgb(hz, .34 * (1 - nt * .4))); gr.addColorStop(1, rgb(hz, 0));
    g.fillStyle = gr; g.fillRect(0, bh, bw, sh * .35);
  }
  o.low = low;
}
// her vaktin ufku bir kez birleştirilir; iki tuval son iki vakti tutar, geçişte ikisi çapraz karışır
// (geçiş başına en fazla bir birleştirme). keep: geçişte öbür ucu tutan tuval, üstüne yazılmaz
function horizonFor(i, keep) {
  const key = i + '|' + eco();
  for (const o of BG.comps) if (o.key === key) return o;
  const o = BG.comps[0] === keep ? BG.comps[1] : BG.comps[0];
  o.key = key; composeHorizon(o, BG.layers, BG.bh, PHASES[i], VENUES[G.venue], S * DPR, BG.T, BG.E, W * DPR, eco());
  return o;
}
// renk grade + vinyet tek bir multiply katmanında (düşük çözünürlük, yumuşak)
function gradeOverlay(gc) {
  const key = (gc[0] | 0) + ',' + (gc[1] | 0) + ',' + (gc[2] | 0) + ',' + gc[3].toFixed(3);
  const c = BG.ov;
  if (BG.ovKey === key) return c;
  BG.ovKey = key;
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.fillStyle = rgb(gc, gc[3]); g.fillRect(0, 0, w, h);
  const gr = g.createRadialGradient(w / 2, h * .45, h * .25, w / 2, h * .5, h * .78);
  gr.addColorStop(0, 'rgba(120,90,110,0)'); gr.addColorStop(1, 'rgba(120,90,110,0.42)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  return c;
}
function tinted(m, color) {
  const key = rgb(color);
  if (m._key === key) return m._t;
  if (!m._t) { m._t = mk(m.c.width, m.c.height); m._tg = m._t.getContext('2d'); }
  const t = m._tg;
  t.globalCompositeOperation = 'copy'; t.drawImage(m.c, 0, 0);
  t.globalCompositeOperation = 'source-in'; t.fillStyle = key; t.fillRect(0, 0, m._t.width, m._t.height);
  t.globalCompositeOperation = 'source-over';
  m._key = key; return m._t;
}

// ------------------------------------------------------------------ audio
const Snd = (() => {
  let ac = null, master = null, dry = null, verb = null, amb = null, sfx = null, ambBus = null;
  let muted = store.get('ck_mute', '0') === '1';
  const HICAZ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16, 17, 19, 20, 22, 24, 25, 28];
  function init() {
    if (ac) { if (ac.state === 'suspended' && !document.hidden) ac.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : .9;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ac.destination);
    // iki alt hat: efektler ve ortam (deniz, martı); ikisi de master'a bağlı, sessize alma hâlâ her şeyi keser
    sfx = ac.createGain(); sfx.gain.value = SET.sfx ? 1 : 0; sfx.connect(master);
    ambBus = ac.createGain(); ambBus.gain.value = SET.amb ? 1 : 0; ambBus.connect(master);
    dry = ac.createGain(); dry.connect(sfx);
    verb = ac.createConvolver();
    const len = ac.sampleRate * 2.2, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = .32; verb.connect(vg); vg.connect(sfx);
    ambience();
  }
  const now = () => ac.currentTime;
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tone(freq, vol, dec, type, t, send) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    env(g, t, .003, vol, dec); o.connect(g); g.connect(dry); if (send !== false) g.connect(verb);
    o.start(t); o.stop(t + dec + .05);
  }
  let noiseBuf = null;
  function noise(dur, vol, type, f, q, t, f2) {
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q;
    const g = ac.createGain(); env(g, t, .004, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(dry); g.connect(verb); s.start(t, Math.random()); s.stop(t + dur + .05);
  }
  function glass(freq, vol, dec, t) {
    t = t || now();
    const P = [[1, 1, 1], [2.32, .42, .6], [4.25, .2, .35], [6.63, .09, .2]];
    for (const p of P) { const f = freq * p[0]; if (f < 16000) tone(f, vol * p[1], dec * p[2], 'sine', t); }
    noise(.02, vol * .25, 'highpass', 5000, .7, t);
  }
  function ambience() {
    // deniz
    const len = ac.sampleRate * 4, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
    const s = ac.createBufferSource(); s.buffer = b; s.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const g = ac.createGain(); g.gain.value = .07;
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .09; lg.gain.value = .045; lfo.connect(lg); lg.connect(g.gain);
    s.connect(lp); lp.connect(g); g.connect(ambBus); s.start(); lfo.start();
    amb = { g, lp, lg };
    setScene(scene);
  }
  // mekâna göre ortam: deniz kıyısında dalga + martı, karada rüzgâr + kuş
  let scene = { water: true, call: 'gull' };
  function setScene(sc) {
    scene = sc;
    if (!amb) return;
    const t = now();
    amb.lp.frequency.setTargetAtTime(sc.water ? 520 : 340, t, .4);
    amb.g.gain.setTargetAtTime(sc.water ? .07 : .05, t, .4);
    amb.lg.gain.setTargetAtTime(sc.water ? .045 : .03, t, .4);
  }
  function gull() {
    if (!ac || muted || ac.state !== 'running') return;
    const t = now() + .05;
    if (scene.call === 'bird') {
      // kısa ötüşler: iki-üç hızlı yukarı kayan cıvıltı
      for (let k = 0; k < 3; k++) {
        const o = ac.createOscillator(), g = ac.createGain(), t0 = t + k * .14 + Math.random() * .04, f = 2600 + Math.random() * 900;
        o.type = 'sine'; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.45, t0 + .07);
        env(g, t0, .008, .012, .09); o.connect(g); g.connect(ambBus); o.start(t0); o.stop(t0 + .14);
      }
      return;
    }
    if (scene.call === 'none') return;
    for (let k = 0; k < 2; k++) {
      const o = ac.createOscillator(), g = ac.createGain(), bp = ac.createBiquadFilter();
      const t0 = t + k * .32;
      o.type = 'triangle'; o.frequency.setValueAtTime(1500, t0); o.frequency.exponentialRampToValueAtTime(2300, t0 + .06); o.frequency.exponentialRampToValueAtTime(1150, t0 + .26);
      bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 2.5;
      env(g, t0, .02, .018, .26); o.connect(bp); bp.connect(g); g.connect(ambBus); o.start(t0); o.stop(t0 + .35);
    }
  }
  const api = {
    init,
    get muted() { return muted; },
    toggle() { muted = !muted; store.set('ck_mute', muted ? '1' : '0'); if (master) master.gain.setTargetAtTime(muted ? 0 : .9, now(), .05); return muted; },
    bus(k, on) { const b = k === 'amb' ? ambBus : sfx; if (b) b.gain.setTargetAtTime(on ? 1 : 0, now(), .05); },
    setScene,
    suspend() { if (ac && ac.state === 'running') ac.suspend().catch(() => {}); },
    resume() { if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); },
    note(i) { const s = HICAZ[Math.min(i, HICAZ.length - 1)]; return 587.33 * Math.pow(2, s / 12); },
    land(hard) { if (!ac) return; const t = now(); noise(.05, .22, 'bandpass', 2600, 1.4, t); tone(170, .3, .09, 'sine', t, false); glass(rand(2100, 2600), .07 + hard * .05, .3, t); },
    perfect(c, golden) {
      if (!ac) return; const t = now(); const f = api.note(c - 1);
      glass(f, .34, 1.5, t); glass(f * 2, .1, .8, t + .01);
      if (c >= 3) { tone(f / 2, .05, 1.4, 'triangle', t + .02); tone(f * .75, .035, 1.2, 'sine', t + .04); }
      if (golden) { for (let i = 0; i < 4; i++) glass(api.note(c + 2 + i * 2), .12, .6, t + .06 + i * .06); }
    },
    whoosh() { if (!ac) return; noise(.16, .05, 'bandpass', 700, 1.2, now(), 2600); },
    creak() { if (!ac) return; const t = now(); const o = ac.createOscillator(), g = ac.createGain(), bp = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(70, t + .3); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 6; env(g, t, .05, .05, .32); o.connect(bp); bp.connect(g); g.connect(dry); o.start(t); o.stop(t + .45); },
    crash(n) {
      if (!ac) return; const t = now();
      noise(.5, .3, 'highpass', 2600, .5, t); tone(90, .35, .25, 'sine', t, false);
      for (let i = 0; i < Math.min(14, 5 + n * 2); i++) glass(rand(2400, 6200), rand(.04, .1), rand(.15, .45), t + i * rand(.015, .04));
    },
    chime() { if (!ac) return; const t = now(); [0, 4, 7, 12].forEach((s, i) => glass(392 * Math.pow(2, s / 12), .07, 1.2, t + i * .09)); },
    record() { if (!ac) return; const t = now(); [0, 4, 5, 7, 12, 16].forEach((s, i) => glass(587.33 * Math.pow(2, (HICAZ[i * 2] || s) / 12), .16, 1.1, t + i * .085)); },
    click() { if (!ac) return; glass(1800, .06, .15); },
    tick() { if (!ac) return; const t = now(); noise(.018, .08, 'bandpass', 3200, 2, t); tone(1400, .025, .04, 'sine', t, false); },
    start() { if (!ac) return; const t = now(); glass(880, .1, .7, t); glass(1318, .07, .7, t + .07); },
    gull,
  };
  return api;
})();

// ------------------------------------------------------------------ game state
const G = {
  state: 'title', prev: null, t: 0, timeScale: 1, slow: 1,
  pieces: [], score: 0, best: parseInt(store.get('ck_best', '0'), 10) || 0, combo: 0, maxCombo: 0, perfects: 0,
  hang: null, drop: null, topple: null, bodies: [], risk: 0, warned: false, recordShown: false,
  cam: { x: 0, y: 0, z: 1, tx: 0, ty: 0, tz: 1 }, shake: 0, flash: 0,
  phase: 0, phaseFrom: 0, phaseT: 1, overAt: 0, spawnIn: 0, lastGolden: false,
  tutorial: store.get('ck_tut', '0') !== '1', tutDone: 0,
  mode: 'classic', mod: null, ph0: 0, seed: 1, ch: null, revived: false, panel: null, offerRevive: false, runSugar: 0,
  total: parseInt(store.get('ck_total', '0'), 10) || 0, skin: parseInt(store.get('ck_skin', '0'), 10) || 0,
  venue: parseInt(store.get('ck_venue', '0'), 10) || 0,
};
G.shownTotal = G.total;
const owned = new Set(store.get('ck_owned', '').split(',').filter(Boolean).map(Number));
function skinOpen(i) { const s = SKINS[i]; return !!s && (i === 0 || owned.has(i) || (s.need > 0 && G.total >= s.need)); }
if (!(G.skin > 0 && skinOpen(G.skin))) G.skin = 0;
// mekânlar da aynı kural: bardak sayısıyla açılır ya da şekerle alınır
const vowned = new Set(store.get('ck_vowned', '').split(',').filter(Boolean).map(Number));
function venueOpen(i) { const v = VENUES[i]; return !!v && (i === 0 || vowned.has(i) || G.total >= v.need); }
if (!venueOpen(G.venue)) G.venue = 0;
// şeker cüzdanı + kalıcı sayaçlar (başarımlar bunlardan okunur)
const jget = (k, d) => { try { return Object.assign(d, JSON.parse(store.get(k, '{}'))); } catch (e) { return d; } };
const ST = jget('ck_stats', { gold: 0, bestH: 0, bestCombo: 0, bestScore: 0, dailyBest: 0, loginBest: 0, spins: 0, chWins: 0 });
function saveStats() { store.set('ck_stats', JSON.stringify(ST)); }
const Wallet = {
  n: parseInt(store.get('ck_sugar', '0'), 10) || 0,
  add(k) { this.n += k; store.set('ck_sugar', this.n); ui.wallet(true); },
  spend(k) { if (this.n < k) return false; this.n -= k; store.set('ck_sugar', this.n); ui.wallet(false); return true; },
};
let rng = Math.random;   // oyun akışı rastgeleliği (günlük modda tohumlu)

// ------------------------------------------------------------------ günlük çay
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dailyToday() {
  const key = dayKey(), num = +key.replace(/-/g, '');
  const r = seeded(num); r(); r();
  return { key, num, mod: DAILY[r() * DAILY.length | 0], ph0: r() * PHASES.length | 0 };
}
function readPair(k) { const v = store.get(k, '').split('|'); return { key: v[0] || '', n: parseInt(v[1], 10) || 0 }; }
function dailyBest() { const p = readPair('ck_daily'); return p.key === dayKey() ? p.n : 0; }
function dailyStreak() {
  // dün ya da bugün oynandıysa seri sürüyor
  const p = readPair('ck_streak'), y = new Date(); y.setDate(y.getDate() - 1);
  return p.key === dayKey() || p.key === dayKey(y) ? p.n : 0;
}
function markDailyPlayed() {
  const p = readPair('ck_streak'), today = dayKey();
  if (p.key === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const n = p.key === dayKey(y) ? p.n + 1 : 1;
  store.set('ck_streak', today + '|' + n);
  ST.dailyBest = Math.max(ST.dailyBest, n); saveStats();
}
// giriş serisi: art arda gelinen her gün bir hediye, 7 günde bir döngü
function loginState() {
  const p = readPair('ck_login'), y = new Date(); y.setDate(y.getDate() - 1);
  const claimed = p.key === dayKey(), n = claimed || p.key === dayKey(y) ? p.n : 0;
  return { claimed, n, slot: (claimed ? n - 1 : n) % GIFT.length };
}
function claimGift() {
  const s = loginState(); if (s.claimed) return;
  const n = s.n + 1, r = GIFT[s.slot];
  store.set('ck_login', dayKey() + '|' + n);
  ST.loginBest = Math.max(ST.loginBest, n); saveStats();
  Wallet.add(r); Snd.chime(); vibrate([20, 30, 20]);
  toast(`${tr('Günlük hediye')} <em>+${r}</em>`);
  checkAch(); renderGift(); refreshTitle();
}
// seri koruma: tek gün kaçtıysa (son kayıt evvelsi gün) seri şekerle kurtarılır
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); }
const STREAKS = [{ k: 'ck_login', name: 'Hediye serisi' }, { k: 'ck_streak', name: 'Günlük çay serisi' }];
const fixCost = (n) => Math.min(150, 40 + n * 10);
function rescuable(k) { const p = readPair(k); return p.key === daysAgo(2) && p.n >= 2 ? p.n : 0; }
function fixStreak(k, el) {
  const n = rescuable(k); if (!n) return;
  if (!Wallet.spend(fixCost(n))) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); Snd.click(); vibrate(30); return; }
  store.set(k, daysAgo(1) + '|' + n);
  Snd.record(); vibrate([20, 30, 20]); toast(`${tr('Seri kurtarıldı')} · <em>${n} ${tr('gün')}</em>`);
  renderGift(); refreshTitle();
}
// haftalık hedefler: pazartesi başlar, günlük görevlerin üstüne daha büyük ödül
const WEEK = [
  { k: 'glass', t: 'Bu hafta {n} bardak diz', n: 300, r: 150 },
  { k: 'days', t: 'Bu hafta {n} farklı gün oyna', n: 5, r: 200 },
];
function weekKey() { const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dayKey(d); }
let WS = null;
function week() {
  if (WS && WS.key === weekKey()) return WS;
  try { WS = JSON.parse(store.get('ck_week', 'null')); } catch (e) { WS = null; }
  if (!WS || WS.key !== weekKey()) { WS = { key: weekKey(), p: [0, 0], done: [false, false], last: '' }; store.set('ck_week', JSON.stringify(WS)); }
  return WS;
}
function weekText(i) { return tr(WEEK[i].t).replace('{n}', WEEK[i].n); }
function weekEvent(k, v) {
  const ws = week(); let changed = false;
  if (k === 'runs' && ws.last !== dayKey()) { ws.last = dayKey(); k = 'days'; v = 1; }
  WEEK.forEach((w, i) => {
    if (w.k !== k || ws.done[i]) return;
    ws.p[i] += v; changed = true;
    if (ws.p[i] >= w.n) { ws.done[i] = true; Wallet.add(w.r); toast(`🗓️ ${weekText(i)} <em>+${w.r}</em>`); Snd.chime(); }
  });
  if (changed || k === 'days') store.set('ck_week', JSON.stringify(ws));
}
// çark: günde bir bedava, portallarda reklamla bir tane daha
function spinsUsed() { const p = readPair('ck_spin'); return p.key === dayKey() ? p.n : 0; }
function spinState() { const u = spinsUsed(); return { free: u < 1, extra: u === 1 && !!window.PF && rewardReady() }; }
function setupMode() {
  if (G.mode === 'daily') { const d = dailyToday(); G.mod = d.mod; G.ph0 = d.ph0; rng = seeded(d.num * 7 + 1); }
  else { G.mod = null; G.ph0 = 0; G.seed = G.mode === 'challenge' ? G.ch.seed : 1 + (Math.random() * 2147483646 | 0); rng = seeded(G.seed); }
}
// meydan okuma: link bardak dizisini (tohum) ve geçilecek puanı taşır; kurallar klasikle aynı, ikinci şans yok
const CH_URL = 'https://ardazeybek-dev.github.io/tea-tower/';
const chSum = (s, n) => ((s % 1296) * 7 + n * 13) % 1296;
function chLink(seed, n) { return `${CH_URL}?c=${seed.toString(36)}.${n.toString(36)}.${chSum(seed, n).toString(36)}`; }
function readChallenge() {
  if (window.PF) return null;
  let m = null;
  try {
    const u = new URL(location.href);
    m = /^([0-9a-z]{1,7})\.([0-9a-z]{1,4})\.([0-9a-z]{1,2})$/.exec(u.searchParams.get('c') || '');
    // yenileyince ya da ana ekrandan açınca tekrar tetiklenmesin
    if (u.searchParams.has('c')) { u.searchParams.delete('c'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
  } catch (e) {}
  if (!m) return null;
  const seed = parseInt(m[1], 36), target = parseInt(m[2], 36);
  if (!(seed > 0 && seed < 2147483648 && target > 0 && target <= 5000 && chSum(seed, target) === parseInt(m[3], 36))) return null;
  return { seed, target, done: false };
}
// kazanma ödülü tohum başına bir kez ve yalnızca gerçek bir hedefte (elle yazılmış ?c=…1 linkleri şeker basmasın)
const CH_PRIZE = 30;
function chReward() {
  const k = G.ch.seed.toString(36), won = store.get('ck_chwon', '').split(',').filter(Boolean);
  if (G.ch.target < 10 || won.includes(k)) return 0;
  won.push(k); store.set('ck_chwon', won.slice(-40).join(','));
  ST.chWins = (ST.chWins || 0) + 1; saveStats();
  G.runSugar += CH_PRIZE; Wallet.add(CH_PRIZE);
  return CH_PRIZE;
}
// paylaşılan skor ancak adil bir koşudan çıkarsa meydan okumaya dönüşür
const chShareable = () => !window.PF && G.mode !== 'daily' && !G.revived && G.score >= 5;
const parts = [], rings = [], floaters = [];
// gün batımı/şafak huzmesindeki tozlar: huzme boyunca (v) ve enine (w) konum
const motes = Array.from({ length: 30 }, () => ({ v: Math.random(), w: Math.random() * 2 - 1, s: rand(.6, 1.4), ph: rand(0, TAU), sp: rand(.5, 1.3) }));
let ferry = { x: -1, t: 6 }, gulls = [], gullTimer = 6;
// kapadokya balonları: ekran oranında konum, yavaşça süzülür
const balloons = [[.12, .2, .004], [.36, .34, .006], [.62, .14, .0035], [.84, .3, .005]].map(([x, y, v], i) => ({ x, y, v, ph: i * 1.7, k: i }));

function topY() { return G.pieces.length * PH; }
function topX() { return G.pieces.length ? G.pieces[G.pieces.length - 1].tx : 0; }
function camMinY(z) { return -40 + (H * .80 - H * .5) / (S * (z || 1)); }

function newPieceSpec() {
  const n = G.pieces.length;
  let golden = false;
  const gr = rng(), r = rng();
  if (n >= 3 && !G.lastGolden && gr < ((G.mod && G.mod.gold) || .15)) golden = true;
  G.lastGolden = golden;
  return { tea: r < .2 ? 0 : r < .62 ? 1 : r < .88 ? 2 : 3, golden };
}
function swingParams(n) {
  const m = G.mod || {};
  const Ah = Math.min(152, 100 + n * 2.4) * (m.A || 1);
  const T = Math.max(1.12, 2.6 - n * .052) * (m.T || 1);
  return { A: Math.asin(Ah / L), T };
}
function spawnHang() {
  const n = G.pieces.length, sp = swingParams(n);
  const dir = n % 2 ? 1 : -1;
  G.hang = { spec: newPieceSpec(), ph: dir > 0 ? Math.PI / 2 : -Math.PI / 2, A: sp.A, T: sp.T, px: topX(), it: 0, theta: 0, retract: 0, released: false };
  G.hang.theta = G.hang.A * Math.sin(G.hang.ph);
}
function hangPos(h) {
  const pivotY = topY() + HC + L + (1 - easeOutBack(clamp(h.it, 0, 1))) * 320;
  return { x: h.px + L * Math.sin(h.theta), y: pivotY - L * Math.cos(h.theta), pivotY };
}

function resetWorld() {
  G.pieces.length = 0; G.bodies.length = 0; parts.length = 0; rings.length = 0; floaters.length = 0;
  G.drop = null; G.topple = null; G.score = 0; G.combo = 0; G.maxCombo = 0; G.perfects = 0; G.risk = 0; G.warned = false; G.recordShown = false;
  G.lastGolden = false; G.revived = false; G.offerRevive = false; G.runSugar = 0;
  G.recCrossed = false; G.recT = 0; G.mile = 0; G.chBeat = false;
}
function demoTower() {
  resetWorld();
  const xs = [0, 5, -3];
  xs.forEach((x, i) => G.pieces.push({ x, tx: x, tea: [1, 2, 0, 1][i], golden: i === 2, born: -10 }));
  spawnHang(); G.hang.it = 1;
  G.phase = 0; G.phaseFrom = 0; G.phaseT = 1;
}

function startGame(mode) {
  Snd.init(); Snd.start();
  if (mode) G.mode = mode;
  if (G.mode === 'challenge' && !G.ch) G.mode = 'classic';
  setupMode();
  // rekor şeridi koşu başındaki en yüksek kuleye sabitlenir (koşu içinde ST.bestH büyür)
  G.bestH0 = G.mode === 'daily' ? 0 : ST.bestH;
  for (const p of G.pieces) burst(p.tx, G.pieces.indexOf(p) * PH + 50, 6, 'puff');
  resetWorld();
  G.state = 'playing';
  G.phaseFrom = G.phase; G.phase = G.ph0; G.phaseT = G.phaseFrom === G.phase ? 1 : 0;
  spawnHang();
  ui.score(0, false); ui.combo(''); ui.target();
  if (G.mod) floater(0, 230, `${tr('Günlük çay')} · ${tr(G.mod.name)}`, '#ffe2a8', 22, true);
  misEvent('runs', 1); if (G.mode === 'daily') misEvent('daily', 1);
  store.set('ck_runs', (parseInt(store.get('ck_runs', '0'), 10) || 0) + 1);
  show('title', false); show('over', false); show('pause', false); show('hud', true);
  show('tutorial', G.tutorial);
}
function tap() {
  if (G.panel) return;
  if (G.state === 'title') { startGame(G.ch ? 'challenge' : 'classic'); return; }
  // ikinci şans açıkken boş yere dokunmak hakkı yakmasın: seçim butonlarla
  if (G.state === 'over' && G.offerRevive) return;
  if (G.state === 'over') { if (performance.now() - G.overAt > 450) startGame(); return; }
  if (G.state !== 'playing') return;
  const h = G.hang;
  if (!h || h.released || h.it < .55) return;
  const p = hangPos(h);
  h.released = true;
  G.drop = { x: p.x, y: p.y, vy: -60, ang: h.theta, spec: h.spec };
  Snd.whoosh();
}

function land() {
  const d = G.drop; G.drop = null;
  const n = G.pieces.length;
  const tx0 = topX(), ty = topY();
  let off = d.x - tx0;
  const perfTol = Math.max(4.5, 7 - n * .06);
  const perfect = Math.abs(off) <= perfTol;
  if (perfect) off = 0;
  const piece = { x: tx0 + off, tx: tx0 + off, tea: d.spec.tea, golden: d.spec.golden, born: G.t };
  G.pieces.push(piece);
  const st = stability();
  if (st.fail >= 0) { beginTopple(st.fail, st.side); return; }
  G.total++; store.set('ck_total', G.total);
  // puan
  let gain = 1;
  if (perfect) {
    G.combo++; G.perfects++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    gain = 2 + (d.spec.golden ? 3 : 0) + (G.combo >= 5 ? 1 : 0);
    straighten(G.combo >= 3 ? .5 : .82);
    Snd.perfect(G.combo, d.spec.golden);
    perfectFx(piece.tx, ty, G.combo, d.spec.golden);
    vibrate(G.combo >= 3 ? [12, 30, 12] : 10);
    floater(piece.tx, ty + PH + 26, G.combo > 1 ? `Mükemmel ×${G.combo}` : 'Mükemmel', '#fff1c4', 30);
    if (G.combo >= 3 && G.combo % 3 === 0) floater(piece.tx, ty + PH + 64, 'Denge!', '#ffd27a', 20, true);
  } else {
    G.combo = 0;
    const hard = clamp(Math.abs(off) / SUP, 0, 1);
    Snd.land(hard);
    G.shake = Math.max(G.shake, 2 + hard * 5);
    burst(piece.tx + off * .3, ty + 4, 6 + (hard * 10 | 0), 'drop');
    if (d.spec.golden) gain += 1;
  }
  G.score += gain;
  if (gain > 1) floater(piece.tx + 74, ty + PH - 10, `+${gain}`, '#ffffff', 20, true);
  // şeker: her bardak 1, mükemmel +1, yaldızlı +2; anında cüzdana (sekme kapansa da kaybolmaz)
  const sg = 1 + (perfect ? 1 : 0) + (d.spec.golden ? 2 : 0);
  G.runSugar += sg; Wallet.add(sg);
  if (d.spec.golden) { ST.gold++; misEvent('gold', 1); }
  misEvent('glass', 1); if (perfect) misEvent('perfect', 1);
  misEvent('height', G.pieces.length); misEvent('combo', G.combo);
  ST.bestH = Math.max(ST.bestH, G.pieces.length); ST.bestCombo = Math.max(ST.bestCombo, G.combo); ST.bestScore = Math.max(ST.bestScore, G.score);
  saveStats(); checkAch();
  ui.score(G.score, true); ui.combo(G.combo >= 2 ? `Kombo ×${G.combo}` : '');
  // risk uyarısı
  const st2 = stability();
  G.risk = st2.risk;
  if (G.risk > .72 && !G.warned) { G.warned = true; Snd.creak(); floater(topX(), topY() + 120, 'Dikkat, sallanıyor!', '#ffb4a0', 20); }
  if (G.risk < .5) G.warned = false;
  // rekor yüksekliği geçildi: hafif kutlama (puan rekorunun konfetisiyle yarışmasın)
  const h = G.pieces.length;
  if (G.bestH0 >= 3 && !G.recCrossed && h > G.bestH0) {
    G.recCrossed = true; G.recT = G.t; G.flash = 1; Snd.chime(); vibrate([12, 40, 12]);
    rings.push({ x: piece.tx, y: ty + PH, t: 0, max: .9, r0: 40, r1: 180, golden: true });
    floater(topX(), topY() + 200, tr('Rekor yükseklik!'), '#ffe08a', 26, true);
  }
  // her 25 katta bir kilometre taşı: şeker ödülü
  if (h % 25 === 0 && h / 25 > G.mile) {
    G.mile = h / 25; const b = 10 * G.mile;
    G.runSugar += b; Wallet.add(b); Snd.record(); confetti(24); vibrate([15, 30, 15, 30, 15]);
    floater(topX(), topY() + 240, `${tr('Kat')} ${h}! +${b}`, '#ffe08a', 30, true);
  }
  // meydan okuma hedefi geçildi
  if (G.mode === 'challenge' && !G.chBeat && G.score > G.ch.target) {
    G.chBeat = true; G.flash = 1; Snd.record(); confetti(30); vibrate([15, 30, 15]); ui.target();
    floater(topX(), topY() + 200, tr('Hedef geçildi!'), '#ffe08a', 30, true);
  }
  // rekor
  if (G.best > 0 && G.score > G.best && !G.recordShown) {
    G.recordShown = true; Snd.record(); floater(topX(), topY() + 160, 'Yeni rekor!', '#ffe08a', 30); confetti(30);
  }
  // evre
  const ph = (G.ph0 + Math.floor(G.pieces.length / PHASE_LEN)) % PHASES.length;
  if (ph !== G.phase) { G.phaseFrom = currentPhaseBlend(); G.phase = ph; G.phaseT = 0; Snd.chime(); G.phaseBanner = { t: 0, text: PHASES[ph].name }; }
  // öğretici
  if (G.tutorial) { G.tutDone++; if (G.tutDone >= 2) { G.tutorial = false; store.set('ck_tut', '1'); show('tutorial', false); } }
  G.spawnIn = .26;
}
function stability() {
  const P = G.pieces, n = P.length;
  let sum = 0, risk = 0, fail = -1, side = 1;
  for (let k = n - 1; k >= 0; k--) {
    sum += P[k].tx;
    const com = sum / (n - k);
    const base = k === 0 ? 0 : P[k - 1].tx, sup = k === 0 ? TRAY_SUP : SUP;
    const r = Math.abs(com - base) / sup;
    if (r > 1) { fail = k; side = Math.sign(com - base) || 1; }
    else risk = Math.max(risk, r);
  }
  return { fail, side, risk };
}
function straighten(f) {
  const P = G.pieces; let prevOld = 0, prevNew = 0;
  for (const p of P) { const rel = p.tx - prevOld; prevOld = p.tx; p.tx = prevNew + rel * f; prevNew = p.tx; }
}
function beginTopple(k, side) {
  // k: destek seviyesi (0 = tepsi); devrilen grup: P[k..]
  const P = G.pieces;
  const group = P.splice(k);
  G.single = group.length === 1;
  const baseX = k === 0 ? 0 : P[k - 1].tx;
  const sup = k === 0 ? TRAY_SUP : SUP;
  G.topple = { group, k, side, px: baseX + side * sup * .92, py: k * PH, a: 0, w: .6 + group.length * .05, t: 0 };
  G.state = 'toppling';
  G.slow = .35; G.combo = 0; ui.combo('');
  Snd.creak(); vibrate(30);
  G.hang && (G.hang.retract = .001);
}
function breakTopple() {
  const T = G.topple; G.topple = null;
  const s = -T.side; // matematiksel açı işareti
  const ang = s * T.a, ca = Math.cos(ang), sa = Math.sin(ang), om = s * T.w;
  T.group.forEach((p, i) => {
    const bx = p.tx - T.px, by = (T.k + i) * PH + 50 - T.py;
    const rx = bx * ca - by * sa, ry = bx * sa + by * ca;
    G.bodies.push({ p, x: T.px + rx, y: T.py + ry, vx: -om * ry + rand(-40, 40), vy: om * rx + rand(-20, 60), a: ang, va: om * rand(.7, 1.6) + rand(-2, 2), alive: true });
  });
}
function shatter(b) {
  b.alive = false;
  Snd.crash(1);
  G.shake = Math.max(G.shake, 9);
  burst(b.x, b.y, 18, 'shard');
  burst(b.x, b.y, 14, 'tea', TEA[b.p.tea]);
  burst(b.x, b.y, 7, 'porcelain');
}
function endGame() {
  G.state = 'over'; G.overAt = performance.now();
  const daily = G.mode === 'daily';
  let rec;
  if (daily) {
    G.prevBest = dailyBest(); rec = G.score > G.prevBest;
    if (rec) store.set('ck_daily', dayKey() + '|' + G.score);
    markDailyPlayed();
  } else {
    rec = G.score > G.best;
    G.prevBest = G.best;
    if (rec) { G.best = G.score; store.set('ck_best', G.best); }
  }
  $('finalScore').textContent = G.score;
  $('statBest').textContent = daily ? Math.max(G.score, G.prevBest) : G.best; $('statPerfect').textContent = G.perfects; $('statCombo').textContent = G.maxCombo;
  $('statBestLbl').textContent = tr(daily ? 'Bugün' : 'En iyi');
  $('overReason').textContent = G.single ? 'Bardak kaydı' : 'Kule devrildi';
  const firstRun = G.prevBest === 0;
  $('recordBadge').textContent = firstRun ? 'İlk kulen!' : 'Yeni rekor!';
  if (daily) $('recordBadge').textContent = tr('Günün rekoru!');
  // rekora az kaldıysa aynı rozette, sakin renkte söyle
  const gap = G.prevBest - G.score, near = !rec && G.score > 0 && gap > 0 && gap <= Math.max(3, Math.ceil(G.prevBest * .2));
  if (near) $('recordBadge').textContent = `${tr('Rekora')} ${gap} ${tr('puan kaldı!')}`;
  $('recordBadge').classList.toggle('near', near);
  show('recordBadge', (rec && G.score > 0) || near);
  $('overMode').textContent = daily ? `${tr('Günlük çay')} · ${tr(G.mod.name)} · ${tr('Seri')} ${dailyStreak()}` : '';
  show('overMode', daily);
  if (G.mode === 'challenge') {
    // meydan okumada rozet hedefi anlatır, kişisel rekor ikinci planda
    const won = G.score > G.ch.target, prize = won ? chReward() : 0;
    if (won) G.ch.done = true;
    $('recordBadge').textContent = won ? tr('Meydan okumayı kazandın!') + (prize ? ` +${prize}` : '') : `${tr('Hedefe')} ${G.ch.target + 1 - G.score} ${tr('puan kaldı!')}`;
    $('recordBadge').classList.toggle('near', !won); show('recordBadge', true);
    $('overMode').textContent = `${tr('Meydan okuma')} · ${tr('Hedef')} ${G.ch.target}`; show('overMode', true);
    if (won) rec = true;
  }
  $('chLbl').textContent = tr(G.mode === 'challenge' && G.score > G.ch.target ? 'Rövanşa çağır' : 'Arkadaşına meydan oku');
  show('chBtn', chShareable());
  overUnlock();
  // ikinci şans: koşu başına bir kez, yalnızca iyi giden bir koşuda (her ölümde değil)
  const canRevive = G.mode === 'classic' && !G.revived && G.pieces.length > 0 && G.score >= 10 && G.score >= G.prevBest * .5 && rewardReady();
  $('reviveLbl').textContent = tr(window.PF ? 'Reklam izle, devam et' : 'İkinci şans');
  $('reviveBtn').disabled = false;
  show('reviveBtn', canRevive); show('reviveNote', false);
  setOffer(canRevive);
  if (canRevive && window.PF && window.PF.offerReward) window.PF.offerReward();
  $('earnN').textContent = '+' + G.runSugar;
  checkAch(); flushToasts();
  $('titleBest').querySelector('b').textContent = G.best;
  refreshTitle();
  show('hud', false); show('tutorial', false); show('over', true);
  syncInstall();
  if (rec && G.score > 0) { setTimeout(() => { Snd.record(); confetti(60); }, 280); }
}
// ikinci şans sunulurken "Bir el daha" ikincil, ekrana dokunma kapalı
function setOffer(on) {
  G.offerRevive = on;
  $('againBtn').className = 'btn ' + (on ? 'second' : 'primary');
  show('overHint', !on);
}
function rewardReady() { return !window.PF || !window.PF.canReward || window.PF.canReward(); }
function revive() {
  if (G.state !== 'over' || G.revived) return;
  G.revived = true; G.offerRevive = false; G.bodies.length = 0; G.topple = null; G.toOverIn = 0; G.slow = 1;
  straighten(.35); G.risk = stability().risk; G.warned = false; G.combo = 0;
  G.state = 'playing';
  show('over', false); show('hud', true);
  spawnHang();
  ui.score(G.score, true); ui.combo('');
  G.flash = .8; Snd.chime(); vibrate([10, 40, 10]);
  floater(topX(), topY() + PH + 60, tr('İkinci şans!'), '#ffe08a', 28, true);
  if (window.PF && window.PF.gameplayStart) window.PF.gameplayStart();
}
function askRevive() {
  if (G.state !== 'over' || G.revived) return;
  const btn = $('reviveBtn'); btn.disabled = true;
  const done = (ok) => {
    btn.disabled = false;
    if (ok) { revive(); return; }
    setOffer(false); show('reviveBtn', false); $('reviveNote').textContent = tr('Reklam şu an yok, sonra tekrar dene'); show('reviveNote', true);
  };
  if (window.PF && window.PF.rewarded) window.PF.rewarded(done); else done(true);
}
// oyun sonu: yeni açılan bardak ya da sıradakine kalan
function overUnlock() {
  const before = G.shownTotal;
  const fresh = SKINS.filter((s, i) => s.need > G.shownTotal && s.need <= G.total && !owned.has(i));
  const freshV = VENUES.filter((v, i) => v.need > G.shownTotal && v.need <= G.total && !vowned.has(i));
  G.shownTotal = G.total;
  const el = $('unlockNote');
  el.classList.toggle('new', fresh.length + freshV.length > 0);
  if (fresh.length || freshV.length) {
    const msg = [];
    if (fresh.length) msg.push(`${tr('Yeni bardak açıldı')}: ${fresh.map((s) => tr(s.name)).join(', ')}`);
    if (freshV.length) msg.push(`${tr('Yeni mekân açıldı')}: ${freshV.map((v) => tr(v.name)).join(', ')}`);
    el.textContent = msg.join(' · '); show('unlockNote', true); return;
  }
  // sıradaki hedef: bardak ya da mekân, hangisi daha yakınsa
  const next = SKINS.find((s, i) => s.need > G.total && !owned.has(i));
  const nextV = VENUES.find((v, i) => v.need > G.total && !vowned.has(i));
  const isV = nextV && (!next || nextV.need < next.need), tgt = isV ? nextV : next;
  if (!tgt) { show('unlockNote', false); return; }
  const from = Math.max(0, ...(isV ? VENUES : SKINS).map((s) => s.need).filter((n) => n < tgt.need));
  const pct = (t) => clamp((t - from) / (tgt.need - from), 0, 1) * 100;
  el.innerHTML = '<span></span><div class="ubar"><i></i></div>';
  el.firstChild.textContent = `${tr(isV ? 'Sıradaki mekân' : 'Sıradaki bardak')}: ${tr(tgt.name)} · ${tgt.need - G.total} ${tr('bardak kaldı')}`;
  const bar = el.querySelector('i'); bar.style.width = pct(before) + '%';
  show('unlockNote', true); void bar.offsetWidth; bar.style.width = pct(G.total) + '%';
}
function refreshTitle() {
  const d = dailyToday(), best = dailyBest(), streak = dailyStreak();
  let sub = tr(d.mod.name);
  if (best) sub += ` · ${tr('Bugün')} ${best}`;
  if (streak) sub += ` · ${tr('Seri')} ${streak}`;
  $('dailySub').textContent = sub;
  show('titleBest', !G.ch); show('chChip', !!G.ch);
  if (G.ch) $('chTarget').textContent = G.ch.target;
  $('ctaTxt').textContent = tr(G.ch ? 'Meydan okumayı kabul et' : 'Başlamak için dokun');
  const fresh = SKINS.some((s, i) => i > 0 && skinOpen(i) && store.get('ck_seen' + i, '0') !== '1')
    || VENUES.some((v, i) => i > 0 && venueOpen(i) && store.get('ck_vseen' + i, '0') !== '1');
  $('cupsBtn').classList.toggle('dot', fresh);
  const ls = loginState(), sp = spinState();
  const fixable = STREAKS.some((s) => rescuable(s.k) && !(s.k === 'ck_login' && ls.claimed));
  $('giftBtn').classList.toggle('dot', !ls.claimed || sp.free || fixable);
  $('giftSub').textContent = fixable ? tr('Seriyi kurtar') : !ls.claimed ? tr('Hediyen hazır') : sp.free ? tr('Çark hazır') : `${tr('Seri')} ${ls.n}`;
  const md = missions().list.filter((m) => m.done).length;
  $('achSub').textContent = `${tr('Bugün')} ${md}/3`;
  $('achBtn').classList.toggle('dot', md < 3 && store.get('ck_misSeen', '') !== dayKey());
  ui.wallet(false);
}
// paneller (koleksiyon, hediye, başarımlar): açıkken oyun dokunuşu kapalı
// ayarlar moladan da açılır; mola ekranı arkada saklanır, kapanınca geri gelir
function openPanel(id) {
  if (G.panel || !(G.state === 'title' || (id === 'set' && G.state === 'paused'))) return;
  G.panel = id;
  if (id === 'cups') renderCups(); else if (id === 'gift') renderGift(); else if (id === 'set') renderSet(); else { renderAch(); store.set('ck_misSeen', dayKey()); }
  if (G.state === 'paused') show('pause', false);
  show(id, true);
}
function closePanel() {
  if (!G.panel || wheelAnim) return;
  show(G.panel, false); G.panel = null;
  if (G.state === 'paused') show('pause', true);
  refreshTitle();
}
const GFX_NOTE = { eco: 'Daha az efekt, daha uzun pil', auto: 'Cihaza göre kendini ayarlar', high: 'En keskin görüntü' };
function renderSet() {
  document.querySelectorAll('.set-row[data-k]').forEach((el) => el.setAttribute('aria-checked', SET[el.dataset.k] ? 'true' : 'false'));
  document.querySelectorAll('#gfxSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === SET.gfx ? 'true' : 'false'));
  $('gfxNote').textContent = tr(GFX_NOTE[SET.gfx]);
  $('tutNote').textContent = tr(G.tutorial ? 'Bir sonraki elde gösterilecek' : 'Bir sonraki elde ipucu');
  show('vibRow', !!navigator.vibrate);
}
function toggleSet(k) {
  SET[k] = !SET[k]; saveSet();
  if (k === 'vib') vibrate(15); else Snd.bus(k, SET[k]);
  Snd.click(); renderSet();
}
function setGfx(v) {
  if (!GFX_CAP[v] || v === SET.gfx) return;
  SET.gfx = v; saveSet(); dprCap = GFX_CAP[v]; slowT = 0;
  resize(); Snd.click(); renderSet();
}
function openCups() { openPanel('cups'); }
function closeCups() { if (G.panel === 'cups') closePanel(); }
// koleksiyon iki sekme: bardaklar | mekânlar
function renderCups(note) {
  const venues = G.cupTab === 'venues';
  document.querySelectorAll('#cupTabs button').forEach((b) => b.setAttribute('aria-pressed', (b.dataset.t === 'venues') === venues ? 'true' : 'false'));
  $('cupsTitle').textContent = tr(venues ? 'Mekânlar' : 'Bardaklar');
  $('cupTabs').classList.toggle('dot-v', VENUES.some((v, i) => i > 0 && venueOpen(i) && store.get('ck_vseen' + i, '0') !== '1'));
  if (venues) { renderVenues(note); return; }
  const grid = $('cupGrid'); grid.textContent = ''; grid.className = 'cup-grid';
  $('cupTotal').textContent = note || `${tr('Toplam')} ${G.total} ${tr('bardak')}`;
  SKINS.forEach((s, i) => {
    const open = skinOpen(i);
    if (open) store.set('ck_seen' + i, '1');
    const b = document.createElement('button');
    b.className = 'cup' + (open ? '' : ' locked') + (!open && Wallet.n >= s.price ? ' buy' : '') + (G.skin === i ? ' on' : '');
    b.setAttribute('aria-pressed', G.skin === i ? 'true' : 'false');
    const sp = makeGlass(TEA[1], false, i), c = document.createElement('canvas');
    c.width = sp.c.width; c.height = sp.c.height; c.getContext('2d').drawImage(sp.c, 0, 0);
    const name = document.createElement('b'); name.textContent = tr(s.name);
    const sub = document.createElement('span');
    if (open) sub.textContent = G.skin === i ? tr('Seçili') : '';
    else { sub.className = 'price'; sub.innerHTML = `<svg><use href="#i-sugar"/></svg>${s.price}`; }
    b.append(c, name, sub);
    b.addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); if (open) { selectSkin(i); Snd.click(); } else buySkin(i, b); });
    grid.append(b);
  });
}
const VTHUMB = [];
const VTHUMB_PH = [1, 4, 3, 5];   // her mekân kendi vaktinde: gün batımı, sabah, şafak, öğle
function venueThumb(i) {
  if (VTHUMB[i]) return VTHUMB[i];
  const d = Math.min(window.devicePixelRatio || 1, 2), tw = 150, th = 88;
  const c = mk(tw * d, th * d), g = c.getContext('2d'), P = PHASES[VTHUMB_PH[i]], V = VENUES[i];
  const u = .4 * d, bw = Math.ceil(tw * d * 1.25), bh = Math.ceil(170 * u);
  const sc = buildScene(V.id, u, bw, bh, true);
  let gr = g.createLinearGradient(0, 0, 0, c.height);
  gr.addColorStop(0, rgb(P.skyTop)); gr.addColorStop(.5, rgb(P.skyMid)); gr.addColorStop(.8, rgb(P.skyBot));
  g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  const hy = c.height * .7;
  g.fillStyle = rgb(P.sun); g.beginPath(); g.arc(P.sx * c.width, Math.min(P.sy * c.height * 1.1, hy - 10 * d), P.sr * .45 * d, 0, TAU); g.fill();
  sc.comp = maskCanvas(bw, bh + Math.ceil(c.height - hy) + 2); sc.T = maskCanvas(bw, bh); sc.E = maskCanvas(bw, bh);
  composeHorizon(sc.comp, sc.layers, bh, P, V, u, sc.T, sc.E, c.width, true);
  g.drawImage(sc.comp.c, (c.width - bw) / 2, hy - bh + d);
  if (sc.kk) g.drawImage(tinted(sc.kk, mixc(mixc(P.city, P.seaDeep, .2), hazeOf(P), .18)), c.width * .18, hy + 8 * d - sc.kk.c.height);
  if (sc.balloons) [[.2, .22, 0], [.55, .14, 2], [.8, .3, 1]].forEach(([x, y, k]) => { const b = sc.balloons[k].c; g.drawImage(b, x * c.width - b.width / 2, y * c.height); });
  freeScene(sc);
  c.className = 'vthumb';
  return (VTHUMB[i] = c);
}
function renderVenues(note) {
  const grid = $('cupGrid'); grid.textContent = ''; grid.className = 'venue-grid';
  $('cupTotal').textContent = note || `${tr('Toplam')} ${G.total} ${tr('bardak')}`;
  VENUES.forEach((v, i) => {
    const open = venueOpen(i);
    if (open) store.set('ck_vseen' + i, '1');
    const b = document.createElement('button');
    b.className = 'venue' + (open ? '' : ' locked') + (!open && Wallet.n >= v.price ? ' buy' : '') + (G.venue === i ? ' on' : '');
    b.setAttribute('aria-pressed', G.venue === i ? 'true' : 'false');
    const name = document.createElement('b'); name.textContent = tr(v.name);
    const sub = document.createElement('span');
    if (open) sub.textContent = G.venue === i ? tr('Seçili') : tr(v.sub);
    else { sub.className = 'price'; sub.innerHTML = `<svg><use href="#i-sugar"/></svg>${v.price} <i>· ${v.need} ${tr('bardak')}</i>`; }
    b.append(venueThumb(i), name, sub);
    b.addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); if (open) { selectVenue(i); Snd.click(); } else buyVenue(i, b); });
    grid.append(b);
  });
}
function buyVenue(i, el) {
  const v = VENUES[i];
  if (!Wallet.spend(v.price)) {
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); Snd.click(); vibrate(30);
    $('cupTotal').textContent = `${v.price - Wallet.n} ${tr('şeker daha lazım')} · ${tr('ya da')} ${v.need - G.total} ${tr('bardak')}`;
    return;
  }
  vowned.add(i); store.set('ck_vowned', [...vowned].join(','));
  Snd.record(); vibrate([20, 30, 20]);
  selectVenue(i); checkAch();
}
function buySkin(i, el) {
  const s = SKINS[i];
  if (!Wallet.spend(s.price)) {
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); Snd.click(); vibrate(30);
    $('cupTotal').textContent = `${s.price - Wallet.n} ${tr('şeker daha lazım')}` + (s.need ? ` · ${tr('ya da')} ${s.need - G.total} ${tr('bardak')}` : '');
    return;
  }
  owned.add(i); store.set('ck_owned', [...owned].join(','));
  Snd.record(); vibrate([20, 30, 20]);
  selectSkin(i); checkAch();
}
function selectSkin(i) {
  if (!skinOpen(i)) return;
  G.skin = i; store.set('ck_skin', i);
  SPR.glass = TEA.map((t) => makeGlass(t, false, G.skin));
  if (G.panel === 'cups') renderCups();
}

function selectVenue(i) {
  if (!venueOpen(i)) return;
  const same = i === G.venue;
  G.venue = i; store.set('ck_venue', i);
  if (!same) { buildBackground(); applyVenue(); }
  if (G.panel === 'cups') renderCups();
}
function applyVenue() {
  const v = VENUES[G.venue];
  Snd.setScene({ water: v.water, call: v.call });
  $('venueEyebrow').textContent = tr(v.eyebrow);
  ferry.x = -1; ferry.t = 3;
}

// hediye paneli: 7 günlük seri + çark
function renderGift() {
  const ls = loginState(), box = $('days'); box.textContent = '';
  const dn = Math.max(1, ls.claimed ? ls.n : ls.n + 1);
  $('loginTitle').textContent = window.PF && window.PF.lang === 'en' ? `Day ${dn}` : `${dn}. gün`;
  GIFT.forEach((r, i) => {
    const el = document.createElement('div');
    const done = i < ls.slot || (ls.claimed && i === ls.slot);
    el.className = 'day' + (done ? ' done' : '') + (!ls.claimed && i === ls.slot ? ' today' : '') + (i === GIFT.length - 1 ? ' big' : '');
    el.innerHTML = `<span>${i + 1}</span><svg><use href="#i-sugar"/></svg><b>${r}</b>`;
    box.append(el);
  });
  const fx = $('fixBox'); fx.textContent = '';
  for (const s of STREAKS) {
    const n = rescuable(s.k); if (!n || (s.k === 'ck_login' && ls.claimed)) continue;
    const b = document.createElement('button'); b.className = 'fix-btn';
    b.innerHTML = `<span><b></b><small></small></span><i class="price"><svg><use href="#i-sugar"/></svg>${fixCost(n)}</i>`;
    b.querySelector('b').textContent = `${tr(s.name)} · ${n} ${tr('gün')}`;
    b.querySelector('small').textContent = tr('Dün kaçtı, şekerle kurtar');
    b.addEventListener('click', (e) => { e.stopPropagation(); fixStreak(s.k, b); });
    fx.append(b);
  }
  show('fixBox', fx.childElementCount > 0);
  const cb = $('claimBtn');
  cb.disabled = ls.claimed;
  cb.textContent = ls.claimed ? tr('Yarın yeni hediye') : `${tr('Hediyeyi al')} +${GIFT[ls.slot]}`;
  const sp = spinState(), btn = $('spinBtn');
  btn.disabled = !!wheelAnim || (!sp.free && !sp.extra);
  $('spinLbl').textContent = sp.free ? tr('Çarkı çevir') : sp.extra ? tr('Reklam izle, bir daha çevir') : tr('Çark yarın yenilenir');
  drawWheel();
}
let wheelRot = 0, wheelAnim = 0;
function drawWheel() {
  const cvw = $('wheel'), d = Math.min(window.devicePixelRatio || 1, 2), R = 120;
  if (cvw.width !== 240 * d) { cvw.width = cvw.height = 240 * d; }
  const g = cvw.getContext('2d'), n = WHEEL.length, seg = TAU / n;
  g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, 240, 240);
  g.translate(R, R); g.rotate(wheelRot);
  const cols = ['#fff6e8', '#c0452a', '#f6dcb8', '#9a2b17'];
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + i * seg, jack = WHEEL[i].v >= 100;
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R - 6, a0, a0 + seg); g.closePath();
    g.fillStyle = jack ? '#e8b64a' : cols[i % 4]; g.fill();
    g.strokeStyle = 'rgba(90,30,10,.25)'; g.lineWidth = 1; g.stroke();
    g.save(); g.rotate(a0 + seg / 2); g.translate(R * .64, 0); g.rotate(Math.PI / 2);
    const light = !jack && i % 2 === 1;
    g.fillStyle = light ? '#fff4e6' : '#5a1c12';
    g.font = `800 ${jack ? 22 : 19}px Fraunces, Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(WHEEL[i].v, 0, 0);
    // küçük şeker küpü
    g.translate(0, 17); g.fillStyle = light ? 'rgba(255,244,230,.9)' : 'rgba(90,28,18,.75)';
    g.beginPath(); g.moveTo(0, -5); g.lineTo(5, -2.5); g.lineTo(5, 3); g.lineTo(0, 5.5); g.lineTo(-5, 3); g.lineTo(-5, -2.5); g.closePath(); g.fill();
    g.restore();
  }
  // pirinç çember + göbek
  const rim = g.createLinearGradient(-R, -R, R, R);
  rim.addColorStop(0, '#f7dc92'); rim.addColorStop(.5, '#c08f36'); rim.addColorStop(1, '#8a5e1c');
  g.beginPath(); g.arc(0, 0, R - 3, 0, TAU); g.strokeStyle = rim; g.lineWidth = 6; g.stroke();
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * seg; g.beginPath(); g.arc(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3), 2.6, 0, TAU); g.fillStyle = '#fff3c4'; g.fill(); }
  g.beginPath(); g.arc(0, 0, 18, 0, TAU); g.fillStyle = rim; g.fill();
  g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fillStyle = '#5a1c12'; g.fill();
}
function askSpin() {
  if (wheelAnim || G.panel !== 'gift') return;
  const sp = spinState();
  if (sp.free) { spin(); return; }
  if (!sp.extra) return;
  $('spinBtn').disabled = true;
  window.PF.rewarded((ok) => { if (ok) spin(); else { renderGift(); $('spinLbl').textContent = tr('Reklam şu an yok, sonra tekrar dene'); } });
}
function spin() {
  store.set('ck_spin', dayKey() + '|' + (spinsUsed() + 1));
  ST.spins++; saveStats();
  // ağırlıklı seçim
  let r = Math.random() * WHEEL.reduce((a, s) => a + s.w, 0), k = 0;
  while (r >= WHEEL[k].w) { r -= WHEEL[k].w; k++; }
  // ödül dönüş başlarken kaydedilir: sekme kapanırsa hak da ödül de kaybolmasın (sayaç dönüş bitince güncellenir)
  const v = WHEEL[k].v;
  Wallet.n += v; store.set('ck_sugar', Wallet.n);
  const n = WHEEL.length, seg = TAU / n;
  const from = wheelRot % TAU;
  const to = TAU * 5 + (TAU - (k + .5) * seg) + rand(-.36, .36) * seg;
  const t0 = performance.now(), dur = 4200;
  let lastSeg = Math.floor(from / seg);
  show('wheelWin', false);
  $('spinBtn').disabled = true;
  const stepFn = (now) => {
    const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 4);
    wheelRot = from + (to - from) * e;
    const sgi = Math.floor(wheelRot / seg);
    if (sgi !== lastSeg) { lastSeg = sgi; Snd.tick(); }
    drawWheel();
    if (t < 1) { wheelAnim = requestAnimationFrame(stepFn); return; }
    wheelAnim = 0;
    ui.wallet(true);
    if (v >= 100) { Snd.record(); vibrate([30, 40, 30]); } else { Snd.chime(); vibrate([20, 30, 20]); }
    $('wheelWin').innerHTML = `<span>+${v} <svg style="width:22px;height:22px;vertical-align:-3px"><use href="#i-sugar"/></svg></span>`;
    show('wheelWin', true);
    checkAch(); renderGift();
  };
  wheelAnim = requestAnimationFrame(stepFn);
}

// başarımlar: bir kez kazanılır, şeker ödülü anında cüzdana
const ACH = [
  { id: 'h10', name: 'İlk kat', desc: 'Bir elde 10 bardak diz', n: 10, r: 20, v: () => ST.bestH },
  { id: 'h25', name: 'Mahalle kahvesi', desc: 'Bir elde 25 bardak diz', n: 25, r: 50, v: () => ST.bestH },
  { id: 'h50', name: 'Galata boyu', desc: 'Bir elde 50 bardak diz', n: 50, r: 150, v: () => ST.bestH },
  { id: 'c5', name: 'Usta eli', desc: 'Üst üste 5 mükemmel', n: 5, r: 25, v: () => ST.bestCombo },
  { id: 'c10', name: 'Ayar ustası', desc: 'Üst üste 10 mükemmel', n: 10, r: 60, v: () => ST.bestCombo },
  { id: 'c20', name: 'Tek nefes', desc: 'Üst üste 20 mükemmel', n: 20, r: 150, v: () => ST.bestCombo },
  { id: 's30', name: 'Demli', desc: 'Bir elde 30 puan', n: 30, r: 25, v: () => ST.bestScore },
  { id: 's60', name: 'Tavşan kanı', desc: 'Bir elde 60 puan', n: 60, r: 60, v: () => ST.bestScore },
  { id: 's100', name: 'Çaycıbaşı', desc: 'Bir elde 100 puan', n: 100, r: 150, v: () => ST.bestScore },
  { id: 'g10', name: 'Yaldız', desc: '10 yaldızlı bardak diz', n: 10, r: 30, v: () => ST.gold },
  { id: 'g50', name: 'Altın tepsi', desc: '50 yaldızlı bardak diz', n: 50, r: 100, v: () => ST.gold },
  { id: 't100', name: 'Yüz bardak', desc: 'Toplam 100 bardak', n: 100, r: 30, v: () => G.total },
  { id: 't500', name: 'Beş yüz bardak', desc: 'Toplam 500 bardak', n: 500, r: 80, v: () => G.total },
  { id: 't1000', name: 'Bin bardak', desc: 'Toplam 1000 bardak', n: 1000, r: 200, v: () => G.total },
  { id: 'd3', name: 'Müdavim', desc: 'Günlük çayda 3 günlük seri', n: 3, r: 40, v: () => ST.dailyBest },
  { id: 'd7', name: 'Kahvenin demirbaşı', desc: 'Günlük çayda 7 günlük seri', n: 7, r: 120, v: () => ST.dailyBest },
  { id: 'l7', name: 'Bir hafta', desc: '7 gün üst üste hediye al', n: 7, r: 60, v: () => ST.loginBest },
  { id: 'k4', name: 'Koleksiyoncu', desc: '4 bardak tasarımı aç', n: 4, r: 50, v: () => SKINS.filter((s, i) => skinOpen(i)).length },
  { id: 'k9', name: 'Tam takım', desc: 'Bütün bardakları aç', n: SKINS.length, r: 300, v: () => SKINS.filter((s, i) => skinOpen(i)).length },
  { id: 'v4', name: 'Gezgin', desc: 'Bütün mekânları aç', n: VENUES.length, r: 150, v: () => VENUES.filter((v, i) => venueOpen(i)).length },
];
const achDone = new Set(store.get('ck_ach', '').split(',').filter(Boolean));
// günlük görevler: her gün tarihten seçilen 3 görev, best olanlar tek elde en iyi değere bakar
const MIS = [
  { k: 'glass', t: 'Bugün {n} bardak diz', n: [40, 60, 90], r: [30, 45, 70] },
  { k: 'perfect', t: 'Bugün {n} mükemmel', n: [15, 25, 40], r: [30, 45, 70] },
  { k: 'height', t: 'Bir elde {n} bardak diz', n: [12, 18, 25], r: [30, 45, 70], best: true },
  { k: 'combo', t: 'Üst üste {n} mükemmel', n: [4, 6, 8], r: [30, 45, 70], best: true },
  { k: 'gold', t: 'Bugün {n} yaldızlı bardak', n: [3, 5, 8], r: [30, 50, 70] },
  { k: 'runs', t: 'Bugün {n} el oyna', n: [3, 5, 8], r: [20, 35, 50] },
  { k: 'daily', t: 'Günlük çayı oyna', n: [1, 1, 1], r: [40, 40, 40] },
];
let MS = null;
function missions() {
  if (MS && MS.key === dayKey()) return MS;
  try { MS = JSON.parse(store.get('ck_mis', 'null')); } catch (e) { MS = null; }
  if (!MS || MS.key !== dayKey()) {
    const r = seeded(+dayKey().replace(/-/g, '') * 13 + 5); r();
    const pool = MIS.map((m, i) => i), list = [];
    while (list.length < 3) { const i = pool.splice(r() * pool.length | 0, 1)[0]; list.push({ i, l: r() * 3 | 0, p: 0, done: false }); }
    MS = { key: dayKey(), list };
    store.set('ck_mis', JSON.stringify(MS));
  }
  return MS;
}
function misText(m) { const d = MIS[m.i]; return tr(d.t).replace('{n}', d.n[m.l]); }
function misEvent(k, v) {
  weekEvent(k, v);
  const ms = missions(); let changed = false;
  for (const m of ms.list) {
    const d = MIS[m.i]; if (d.k !== k || m.done) continue;
    const p = d.best ? Math.max(m.p, v) : m.p + v;
    if (p === m.p) continue;
    m.p = p; changed = true;
    if (p >= d.n[m.l]) { m.done = true; Wallet.add(d.r[m.l]); toast(`✅ ${misText(m)} <em>+${d.r[m.l]}</em>`); Snd.chime(); }
  }
  if (changed) store.set('ck_mis', JSON.stringify(ms));
}
function checkAch() {
  for (const a of ACH) {
    if (achDone.has(a.id) || a.v() < a.n) continue;
    achDone.add(a.id); store.set('ck_ach', [...achDone].join(','));
    Wallet.add(a.r);
    toast(`🏆 ${tr(a.name)} <em>+${a.r}</em>`);
  }
  if (G.panel === 'ach') renderAch();
}
function renderAch() {
  const list = $('achList'); list.textContent = '';
  const head = (txt) => { const h = document.createElement('div'); h.className = 'list-head'; h.textContent = txt; list.append(h); };
  const ms = missions();
  head(`${tr('Bugünün görevleri')} · ${ms.list.filter((m) => m.done).length}/3`);
  for (const m of ms.list) {
    const d = MIS[m.i], n = d.n[m.l], v = Math.min(m.p, n);
    const el = document.createElement('div'); el.className = 'ach mis' + (m.done ? ' done' : '');
    el.innerHTML = `<b></b><span class="rw">${m.done ? '✓' : `+${d.r[m.l]}<svg><use href="#i-sugar"/></svg>`}</span><small>${v}/${n}</small>` + (m.done ? '' : `<div class="bar"><i style="width:${(v / n * 100).toFixed(1)}%"></i></div>`);
    el.querySelector('b').textContent = misText(m);
    list.append(el);
  }
  const ws = week(), left = 7 - (new Date().getDay() + 6) % 7;
  head(`${tr('Bu haftanın hedefleri')} · ${left} ${tr('gün kaldı')}`);
  WEEK.forEach((w, i) => {
    const v = Math.min(ws.p[i], w.n), done = ws.done[i];
    const el = document.createElement('div'); el.className = 'ach mis' + (done ? ' done' : '');
    el.innerHTML = `<b></b><span class="rw">${done ? '✓' : `+${w.r}<svg><use href="#i-sugar"/></svg>`}</span><small>${v}/${w.n}</small>` + (done ? '' : `<div class="bar"><i style="width:${(v / w.n * 100).toFixed(1)}%"></i></div>`);
    el.querySelector('b').textContent = weekText(i);
    list.append(el);
  });
  head(`${tr('Başarımlar')} · ${achDone.size}/${ACH.length}`);
  const sorted = ACH.slice().sort((a, b) => achDone.has(a.id) - achDone.has(b.id));
  for (const a of sorted) {
    const done = achDone.has(a.id), v = Math.min(a.v(), a.n);
    const el = document.createElement('div'); el.className = 'ach' + (done ? ' done' : '');
    el.innerHTML = `<b></b><span class="rw">${done ? '✓' : `+${a.r}<svg><use href="#i-sugar"/></svg>`}</span><small></small>` + (done ? '' : `<div class="bar"><i style="width:${(v / a.n * 100).toFixed(1)}%"></i></div>`);
    el.querySelector('b').textContent = tr(a.name);
    el.querySelector('small').textContent = done ? tr(a.desc) : `${tr(a.desc)} · ${v}/${a.n}`;
    list.append(el);
  }
}
// üstte kısa bildirim (sıralı)
const toastQ = [];
let toastBusy = false;
// oyun sırasında ekran sakin kalsın: bildirimler el bitince gösterilir
const quiet = () => G.state === 'playing' || G.state === 'toppling' || G.state === 'paused';
function toast(html) { toastQ.push(html); if (!toastBusy && !quiet()) nextToast(); }
function flushToasts() { if (!toastBusy && toastQ.length) nextToast(); }
function nextToast() {
  const el = $('toast'), h = quiet() ? null : toastQ.shift();
  if (!h) { toastBusy = false; show('toast', false); return; }
  toastBusy = true;
  el.innerHTML = `<svg><use href="#i-sugar"/></svg><span>${h}</span>`;
  show('toast', false); void el.offsetWidth; show('toast', true);
  setTimeout(nextToast, 2400);
}
function share() {
  const ch = chShareable(), url = ch ? chLink(G.seed, G.score) : CH_URL;
  const text = ch ? `${tr('Çay Kulesi')}: ${G.score} ${tr('puan yaptım. Aynı bardaklarla beni geçebilir misin?')} 🍵`
    : `${tr('Çay Kulesi')}: ${G.score} ${tr('puanlık kule diktim!')} 🍵`;
  try {
    if (navigator.share) { navigator.share({ title: tr('Çay Kulesi'), text, url }).catch(() => {}); return; }
    navigator.clipboard.writeText(text + ' ' + url).then(() => toast(tr('Kopyalandı')), () => {});
  } catch (e) {}
}

// ------------------------------------------------------------------ effects
function vibrate(p) { try { if (navigator.vibrate && !Snd.muted && SET.vib) navigator.vibrate(p); } catch (e) {} }
function burst(x, y, n, kind, col) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), sp = rand(60, 260);
    const p = { x, y, vx: Math.cos(a) * sp, vy: Math.abs(Math.sin(a)) * sp * .9 + 60, life: 0, max: rand(.5, 1.1), size: rand(1.5, 4), kind, rot: rand(0, TAU), vr: rand(-12, 12), g: 900, col };
    if (kind === 'puff') { p.vx *= .4; p.vy = rand(10, 80); p.g = -20; p.size = rand(10, 22); p.max = rand(.5, .8); }
    if (kind === 'drop') { p.vx = rand(-90, 90); p.vy = rand(60, 180); p.size = rand(1.2, 2.6); p.max = rand(.4, .7); p.col = TEA[1]; }
    if (kind === 'tea') { p.size = rand(1.5, 4.5); }
    if (kind === 'shard') { p.size = rand(2, 6); p.vy += 80; }
    if (kind === 'porcelain') { p.size = rand(3, 7); }
    parts.push(p);
  }
}
function perfectFx(x, y, c, golden) {
  rings.push({ x, y: y + PH, t: 0, max: .6, r0: 24, r1: 70 + Math.min(c, 8) * 6, golden });
  if (c >= 3) rings.push({ x, y: y + PH, t: -.08, max: .7, r0: 30, r1: 100 + Math.min(c, 8) * 8, golden });
  const n = (10 + Math.min(c, 10) * 2 + (golden ? 14 : 0)) * (eco() ? .5 : 1);
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), sp = rand(80, 260);
    parts.push({ x: x + Math.cos(a) * 26, y: y + PH + Math.sin(a) * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .5 + rand(40, 200), life: 0, max: rand(.5, .95), size: rand(4, 10) * (golden ? 1.3 : 1), kind: 'spark', g: -60, rot: 0, vr: 0 });
  }
  G.flash = Math.min(1, .35 + c * .08);
}
function confetti(n) {
  const cx = G.cam.x, cy = G.cam.y + (H * .5) / (S * G.cam.z);
  for (let i = 0; i < n; i++) parts.push({ x: cx + rand(-1, 1) * W / (S * G.cam.z) * .5, y: cy + rand(0, 60), vx: rand(-60, 60), vy: rand(-40, 60), life: 0, max: rand(1.6, 2.6), size: rand(4, 7), kind: Math.random() < .5 ? 'sugar' : 'spark', g: 240, rot: rand(0, TAU), vr: rand(-6, 6) });
}
function floater(x, y, text, color, size, keep) { if (!keep) for (const f of floaters) f.t = Math.max(f.t, .95); floaters.push({ x, y, text, color, size, t: 0 }); }

// ------------------------------------------------------------------ update
let tdisp = 0;
function currentPhaseBlend() { return G.phaseT >= 1 ? G.phase : G.phaseFrom; }
function update(dt) {
  G.t += dt;
  G.slow = lerp(G.slow, 1, 1 - Math.exp(-dt * 1.6));
  const sdt = (G.state === 'toppling' || G.state === 'over') ? dt * G.slow : dt;
  G.phaseT = Math.min(1, G.phaseT + dt / 2.2);
  if (G.phaseBanner) { G.phaseBanner.t += dt; if (G.phaseBanner.t > 2.4) G.phaseBanner = null; }
  // askı
  const h = G.hang;
  if (h) {
    h.it = Math.min(1.2, h.it + dt / .5);
    h.ph += sdt * TAU / h.T;
    h.theta = h.A * Math.sin(h.ph);
    const n = G.pieces.length;
    let target = topX();
    const d0 = G.mod && G.mod.drift ? 1 : 10;
    if (n >= d0) target += Math.sin(G.t * .55) * Math.min(46, (n - d0 + 1) * 3.4);
    h.px = lerp(h.px, target, 1 - Math.exp(-dt * 3));
    if (h.released || h.retract) { h.retract = Math.min(1, (h.retract || 0) + dt / .4); }
  }
  // düşen set
  if (G.drop) {
    const d = G.drop;
    d.vy -= 2700 * dt; d.y += d.vy * dt; d.ang *= Math.exp(-dt * 16);
    if (d.y <= topY()) { d.y = topY(); land(); }
  }
  if (G.state === 'playing' && !G.drop && G.hang && G.hang.released) {
    G.spawnIn -= dt; if (G.spawnIn <= 0) spawnHang();
  }
  // parçalar
  for (const p of G.pieces) p.x = lerp(p.x, p.tx, 1 - Math.exp(-dt * 9));
  // devrilme
  if (G.topple) {
    const T = G.topple; T.t += sdt;
    T.w += (4 + 10 * Math.sin(T.a + .25)) * sdt; T.a += T.w * sdt;
    if (T.a > .55 || T.t > 1.1) breakTopple();
  }
  for (const b of G.bodies) {
    if (!b.alive) continue;
    b.vy -= 2300 * sdt; b.x += b.vx * sdt; b.y += b.vy * sdt; b.a += b.va * sdt;
    if (b.y < -20) shatter(b);
  }
  if (G.state === 'toppling' && !G.topple && G.bodies.every((b) => !b.alive)) { G.toOverIn = (G.toOverIn || .55) - dt; if (G.toOverIn <= 0) { G.toOverIn = 0; endGame(); } }
  else if (G.state !== 'toppling') G.toOverIn = 0;
  // efekt parçacıkları
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life += sdt;
    if (p.life >= p.max) { parts.splice(i, 1); continue; }
    p.vy -= p.g * sdt; p.x += p.vx * sdt; p.y += p.vy * sdt; p.rot += p.vr * sdt;
    if (p.kind !== 'spark' && p.kind !== 'puff' && p.kind !== 'steam') { p.vx *= Math.exp(-sdt * 1.2); if (p.y < -30) { p.y = -30; p.vy *= -.3; p.vx *= .6; } }
    if (p.kind === 'steam') { p.vx += Math.sin(p.life * 3 + p.rot) * 12 * sdt; }
  }
  for (let i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t > rings[i].max) rings.splice(i, 1); }
  for (let i = floaters.length - 1; i >= 0; i--) { floaters[i].t += dt; if (floaters[i].t > 1.3) floaters.splice(i, 1); }
  // buhar
  if (G.pieces.length && (G.state !== 'over')) {
    tdisp += dt;
    const sti = eco() ? .32 : .16;
    while (tdisp > sti) {
      tdisp -= sti; const tp = G.pieces[G.pieces.length - 1];
      parts.push({ x: tp.x + rand(-12, 12), y: topY() - 6, vx: rand(-6, 6), vy: rand(16, 30), life: 0, max: rand(1.8, 2.6), size: rand(7, 12), kind: 'steam', g: -4, rot: rand(0, TAU), vr: 0 });
    }
  }
  // kamera
  const c = G.cam;
  if (G.state === 'over' || G.state === 'toppling') {
    const hgt = Math.max(topY(), PH);
    const fit = clamp((H * .36) / ((hgt + 170) * S), .1, 1);
    if (G.state === 'over') {
      c.tz = fit;
      c.ty = (hgt + 170) / 2 - 60 - (H * .2) / (S * c.z);
      c.tx = topX() * .5;
    } else {
      c.tz = lerp(1, fit, .3); c.ty = Math.max(camMinY(), topY() + 40); c.tx = topX() * .8;
    }
  } else if (G.state === 'title') {
    c.tz = 1; c.ty = camMinY() - H * .07 / S; c.tx = 0;
  } else {
    c.tz = 1;
    c.ty = Math.max(camMinY(), topY() + 72);
    c.tx = topX() * .82;
  }
  const k = 1 - Math.exp(-dt * 3.2);
  c.x = lerp(c.x, c.tx, k); c.y = lerp(c.y, c.ty, k); c.z = lerp(c.z, c.tz, 1 - Math.exp(-dt * 2.2));
  G.shake *= Math.exp(-dt * 7); G.flash *= Math.exp(-dt * 5);
  // vapur & martılar
  for (const b of balloons) { b.x += b.v * dt; b.ph += dt * .3; if (b.x > 1.15) b.x = -.15; }
  for (const m of motes) { m.v += dt * .012 * m.sp; m.w += Math.sin(G.t * .4 + m.ph) * dt * .03; if (m.v > 1) { m.v = 0; m.w = Math.random() * 2 - 1; } }
  ferry.t -= dt;
  if (ferry.t <= 0 && ferry.x < 0) { ferry.x = 0; }
  if (ferry.x >= 0) { ferry.x += dt / 28; if (ferry.x > 1) { ferry.x = -1; ferry.t = rand(14, 26); } }
  gullTimer -= dt;
  if (gullTimer <= 0) {
    gullTimer = rand(7, 16); const dir = Math.random() < .5 ? 1 : -1;
    const flock = VENUES[G.venue].call === 'bird', n = flock ? 5 + (Math.random() * 4 | 0) : (Math.random() * 3 | 0) + 1;
    const y0 = rand(.12, .36), v = rand(.04, .065), s = rand(.75, 1.1);
    for (let i = 0; i < n; i++) {
      const k = flock ? Math.ceil(i / 2) * (i % 2 ? 1 : -1) : i, back = flock ? Math.abs(k) * .028 : i * .05;
      gulls.push({ x: dir > 0 ? -.1 - back : 1.1 + back, y: y0 + (flock ? k * .014 : i * .02), dir, s: flock ? s : rand(.75, 1.15), ph: rand(0, TAU), v: flock ? v : rand(.045, .07), fs: flock ? 7 : 4.5 });
    }
    if (G.state !== 'paused') Snd.gull();
  }
  for (let i = gulls.length - 1; i >= 0; i--) { const gg = gulls[i]; gg.x += gg.dir * gg.v * dt; gg.ph += dt * gg.fs; if (gg.dir > 0 ? gg.x > 1.25 : gg.x < -.25) gulls.splice(i, 1); }
}

// ------------------------------------------------------------------ render
function blendedPhase() {
  const a = PHASES[G.phaseFrom], b = PHASES[G.phase], t = easeInOut(G.phaseT);
  const o = {};
  for (const k in b) {
    const va = a[k], vb = b[k];
    if (Array.isArray(vb)) o[k] = vb.length === 4 ? [lerp(va[0], vb[0], t), lerp(va[1], vb[1], t), lerp(va[2], vb[2], t), lerp(va[3], vb[3], t)] : mixc(va, vb, t);
    else if (typeof vb === 'number') o[k] = lerp(va, vb, t);
    else o[k] = t < .5 ? va : vb;
  }
  return o;
}
function drawBackground(P) {
  const c = G.cam;
  const rise = Math.max(0, (c.y - camMinY(c.z)) * S * c.z); // px
  const hx = -c.x * S * .15;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // gökyüzü
  const alt = clamp(rise / 2400, 0, 1);
  let gr = ctx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, rgb(mixc(P.skyTop, [14, 18, 48], alt * .55)));
  gr.addColorStop(.42, rgb(mixc(P.skyMid, P.skyTop, alt * .6)));
  gr.addColorStop(.72, rgb(mixc(P.skyBot, P.skyMid, alt * .7)));
  gr.addColorStop(1, rgb(mixc(P.skyBot, P.skyMid, alt)));
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  // yıldızlar
  const sa = clamp(P.stars + alt * .5, 0, 1);
  if (sa > .02) {
    const sstep = eco() ? 2 : 1;
    for (let si = 0; si < BG.stars.length; si += sstep) {
      const s = BG.stars[si];
      const tw = .55 + .45 * Math.sin(G.t * 1.7 + s[3]);
      ctx.fillStyle = `rgba(255,250,235,${sa * tw * .9})`;
      const y = (s[1] * H + rise * .05) % H;
      ctx.fillRect(s[0] * W, y, s[2], s[2]);
    }
  }
  // güneş / ay
  const sx = P.sx * W + hx * .3, sy = P.sy * H + rise * .12, sr = P.sr * S;
  SUN.x = sx; SUN.y = sy;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = .55; ctx.drawImage(tinted(SPR.softM, P.glow), sx - sr * 6, sy - sr * 6, sr * 12, sr * 12);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = rgb(P.sun); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
  if (P.night > .7) {
    const top = mixc(P.skyTop, [14, 18, 48], alt * .55), mid = mixc(P.skyMid, P.skyTop, alt * .6);
    ctx.fillStyle = rgb(mixc(top, mid, clamp(sy / (H * .42), 0, 1)), clamp((P.night - .7) * 3.4, 0, 1));
    ctx.beginPath(); ctx.arc(sx + sr * .4, sy - sr * .22, sr * .92, 0, TAU); ctx.fill();
  }
  // bulutlar (dünya yüksekliğine bağlı)
  for (let i = 0; i < 9; i++) {
    const wy = 420 + i * 520;
    const m = BG.clouds[i % 4];
    const sy2 = H * .5 - (wy - c.y) * S * .55;
    if (sy2 < -100 || sy2 > H + 60) continue;
    const drift = ((i * .37 + G.t * .006 * (1 + i % 3)) % 1.4) - .2;
    const cxp = drift * W, cw = m.c.width / DPR, ch = m.c.height / DPR;
    ctx.globalAlpha = .8 - P.night * .25;
    ctx.drawImage(tinted(m, P.cloud), cxp - cw / 2, sy2 - ch / 2, cw, ch);
    ctx.globalAlpha *= .6; ctx.drawImage(tinted(m.sh, mixc(PT.cloud, PT.skyTop, .5)), cxp - cw / 2, sy2 - ch / 2, cw, ch);
  }
  ctx.globalAlpha = 1;
  // ufuk: önceden birleştirilmiş tek tuval (kara katmanları + su/vadi)
  const V = VENUES[G.venue], nt = P.night;
  const hy = H * .6 + rise * .3;
  if (hy < H + 40) {
    const bw = BG.bw / DPR, bh = BG.bh / DPR, ox = (W - bw) / 2 + hx, ty = hy - bh + 2;
    const ta = G.phaseT >= 1 ? 1 : easeInOut(G.phaseT), ca = ta < 1 ? horizonFor(G.phaseFrom) : null, cb = horizonFor(G.phase, ca), ch = cb.c.height / DPR;
    if (ca) { ctx.drawImage(ca.c, ox, ty, bw, ch); ctx.globalAlpha = ta; }
    ctx.drawImage(cb.c, ox, ty, bw, ch); ctx.globalAlpha = 1;
    if (ty + ch < H) { ctx.fillStyle = rgb(ca ? mixc(ca.low, cb.low, ta) : cb.low); ctx.fillRect(0, ty + ch - 1, W, H - ty - ch + 1); }
    if (nt > .05) {
      for (const w of BG.wins) {
        const f = .6 + .4 * Math.sin(G.t * .7 + w[2] * 30);
        ctx.fillStyle = `rgba(255,${200 + w[2] * 40 | 0},120,${nt * f * (w[2] > .3 ? .95 : .4)})`;
        ctx.fillRect(ox + w[0] / DPR, ty + w[1] / DPR, 1.6 * S, 1.6 * S);
      }
    }
    const hz = hazeOf(P);
    if (V.water) {
      // güneş/ay yolu: ufka yakın ince ve sık, yakında geniş; yavaş kıpırdar
      const shs = eco() ? 2 : 1;
      for (let i = 0; i < 46; i += shs) {
        const yy = hy + 3 + Math.pow(i / 46, 1.7) * H * .32;
        const spread = 10 + i * 1.9;
        const xx = sx + Math.sin(i * 12.9 + G.t * (.35 + (i % 5) * .12)) * spread;
        const a = (.3 + .4 * Math.sin(G.t * 1.1 + i * 1.7)) * (1 - i / 46) * (1 - P.night * .25);
        ctx.fillStyle = rgb(P.shimmer, Math.max(0, a));
        ctx.fillRect(xx - (4 + i * .7) / 2, yy, 4 + i * .7, .8 + i * .025);
      }
    }
    // kız kulesi ve suya yansıması
    if (BG.kk) {
      const kw = BG.kk.c.width / DPR, kh = BG.kk.c.height / DPR, kx = W * .2 - kw / 2 + hx * 1.2, kt = hy + 22 * S - kh, yb = hy + 22 * S - 4 * S;
      const kc = tinted(BG.kk, mixc(mixc(P.city, P.seaDeep, .2), hz, .18));
      ctx.drawImage(kc, kx, kt, kw, kh);
      ctx.globalAlpha = .26; ctx.setTransform(DPR, 0, 0, -DPR * .45, 0, DPR * yb * 1.45); ctx.drawImage(kc, 0, 0, kc.width, kc.height * 50 / 54, kx, kt, kw, kh - 4 * S);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = 1;
      if (nt > .3) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = nt * .7; ctx.drawImage(SPR.warm, W * .2 - 6 * S + hx * 1.2, kt + 10 * S, 12 * S, 12 * S); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    }
    // vapur / gulet ve yansıması
    if (BG.fe && ferry.x >= 0) {
      const fw = BG.fe.c.width / DPR, fh = BG.fe.c.height / DPR;
      const fx = lerp(-fw, W + fw, ferry.x) + hx, fy = hy + 40 * S, yb = fy - fh * .08;
      const fc = tinted(BG.fe, mixc(V.city ? mixc(vtint(P.city, V.city, nt), P.seaDeep, .25) : mixc(P.city, P.seaDeep, .1), hz, .12));
      ctx.drawImage(fc, fx - fw / 2, fy - fh, fw, fh);
      ctx.globalAlpha = .22; ctx.setTransform(DPR, 0, 0, -DPR * .7, 0, DPR * yb * 1.7); ctx.drawImage(fc, 0, 0, fc.width, fc.height * .92, fx - fw / 2, fy - fh, fw, fh * .92);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = 1;
      ctx.fillStyle = rgb(P.shimmer, .22); ctx.fillRect(fx - fw / 2, yb, fw, .9);
      if (nt > .3) {
        ctx.fillStyle = `rgba(255,220,140,${nt})`;
        if (BG.kk) for (let i = 0; i < 7; i++) ctx.fillRect(fx - fw / 2 + (12 + i * 7) * S, fy - fh + 10.5 * S, 2.2 * S, 1.6 * S);
        else for (let i = 0; i < 3; i++) ctx.fillRect(fx - fw / 2 + (20 + i * 9) * S, fy - fh + 26 * S, 2 * S, 1.4 * S);
      }
    }
    // rize: tepelerin arasında süzülen sis
    if (BG.mist) {
      ctx.globalAlpha = .3 * (1 - nt * .5);
      const mist = tinted(SPR.mistM, P.cloud);
      for (let k = 0; k < 2; k++) {
        const mx = ((G.t * .006 * (k ? 1.4 : 1) + k * .5) % 1.6 - .3) * W;
        ctx.drawImage(mist, mx - W * .7, hy - (18 + k * 16) * S - 22 * S, W * 1.4, 44 * S);
      }
      ctx.globalAlpha = 1;
    }
  }
  // balonlar (kapadokya): pusla örtülür, gece koyulaşır, sepet ateşi parlar
  if (BG.balloons) {
    const veil = mixc(hazeOf(P), P.skyTop, nt), va = .18 + nt * .55;
    for (const b of balloons) {
      const sp = BG.balloons[b.k], w = sp.c.width / DPR, h = sp.c.height / DPR;
      const x = b.x * W + hx * (.4 + b.k * .1), y = b.y * H + rise * .18 + Math.sin(b.ph) * 2.5 * S;
      ctx.drawImage(sp.c, x - w / 2, y - h / 2, w, h);
      ctx.globalAlpha = va * (b.k % 2 ? 1.3 : 1); ctx.drawImage(tinted(sp, veil), x - w / 2, y - h / 2, w, h); ctx.globalAlpha = 1;
      if (nt > .3 && Math.sin(G.t * 1.3 + b.k * 2) > .2) {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = nt * .8;
        ctx.drawImage(SPR.warm, x - 7 * S, y + h * .12 - 7 * S, 14 * S, 14 * S);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    }
  }
  // martılar / kuşlar: uzakta küçük, ağır kanat
  if (V.call !== 'none') {
    const bs = V.call === 'bird' ? .5 : .85;
    ctx.strokeStyle = rgb(mixc(P.bird, hazeOf(P), .25), .8); ctx.lineWidth = 1.4 * S * bs; ctx.lineCap = 'round';
    for (const gg of gulls) {
      const x = gg.x * W, y = gg.y * H + rise * .2, s = 6 * S * gg.s * bs, f = Math.sin(gg.ph) * .5;
      ctx.beginPath(); ctx.moveTo(x - s, y - s * f * .8); ctx.quadraticCurveTo(x - s * .5, y - s * (.6 + f * .5), x, y); ctx.quadraticCurveTo(x + s * .5, y - s * (.6 + f * .5), x + s, y - s * f * .8); ctx.stroke();
    }
  }
}
function worldTransform(shx, shy) {
  const c = G.cam, k = S * c.z;
  ctx.setTransform(DPR * k, 0, 0, DPR * k, DPR * (W / 2 + shx - c.x * k), DPR * (H / 2 + shy + c.y * k));
}
function drawSprite(sp, x, y) { ctx.drawImage(sp.c, x - sp.ox, y - sp.oy, sp.w, sp.h); }
// yansıma yalnız tepedeki bardaklarda (kamera oraya bakar)
let REFL = null, PT = PHASES[0], reflOn = true;
const SUN = { x: 0, y: 0 };
function drawPiece(p, x, y, sq) {
  // x,y: tabak altı (ekran-aşağı koordinat)
  if (sq) { ctx.save(); ctx.translate(x, y); ctx.scale(1 + sq * .5, 1 - sq); ctx.translate(-x, -y); }
  drawSprite(SPR.contact, x, y - 1);
  drawSprite(p.golden ? SPR.saucerGold : SPR.saucer, x, y);
  drawSprite(p.golden ? SPR.glassGold : SPR.glass[p.tea], x, y - LIFT);
  if (REFL && reflOn) { const a = ctx.globalAlpha, r = SPR.reflM; ctx.globalAlpha = a * .3; ctx.drawImage(REFL, x - r.ox, y - LIFT - r.oy, r.w, r.h); ctx.globalAlpha = a; }
  if (sq) ctx.restore();
}
function drawLights(P) {
  // çay bahçesi ampulleri
  const y0 = -360, span = 520;
  ctx.strokeStyle = 'rgba(40,24,30,0.55)'; ctx.lineWidth = 1.1;
  const bulbs = [];
  for (const row of [[-span, 0, 70], [0, span, 54]]) {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, x = lerp(row[0], row[1], t), y = y0 + Math.sin(t * Math.PI) * row[2] - (row[0] < 0 ? 0 : 18);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      if (i % 3 === 1) bulbs.push([x, y + 5]);
    }
    ctx.stroke();
  }
  for (const b of bulbs) {
    ctx.fillStyle = P.night > .2 ? '#ffe2a2' : 'rgba(255,246,224,0.85)';
    ctx.beginPath(); ctx.ellipse(b[0], b[1], 3.2, 4.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(40,24,30,0.6)'; ctx.fillRect(b[0] - 1.6, b[1] - 6.5, 3.2, 2.6);
  }
  return bulbs;
}
function drawTable() {
  // masa üstü
  const top = 34, front = -48;
  let gr = ctx.createLinearGradient(0, -top, 0, -front);
  gr.addColorStop(0, '#6e3d24'); gr.addColorStop(.5, '#8a5032'); gr.addColorStop(1, '#a8673e');
  ctx.fillStyle = gr; ctx.fillRect(-40000, -top, 80000, top - front);
  ctx.fillStyle = 'rgba(255,220,170,0.08)'; for (let i = 0; i < 5; i++) ctx.fillRect(-40000, -top + 8 + i * 15, 80000, 1);
  // ön kenar
  gr = ctx.createLinearGradient(0, -front, 0, -front + 13);
  gr.addColorStop(0, '#c98a56'); gr.addColorStop(.3, '#8c4f2c'); gr.addColorStop(1, '#4a2414');
  ctx.fillStyle = gr; ctx.fillRect(-40000, -front, 80000, 13);
  // kilim örtü
  ctx.save();
  const pat = SPR.kilimPattern;
  if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / SPR.tile.s, 1 / SPR.tile.s).translate(0, 0));
  ctx.fillStyle = pat; ctx.translate(0, -front + 13); ctx.fillRect(-40000, 0, 80000, 40000);
  gr = ctx.createLinearGradient(0, 0, 0, 60);
  gr.addColorStop(0, 'rgba(20,6,6,0.55)'); gr.addColorStop(1, 'rgba(20,6,6,0)');
  ctx.fillStyle = gr; ctx.fillRect(-40000, 0, 80000, 60);
  ctx.restore();
}
function drawRecordLine() {
  const c = G.cam, half = W / (2 * S * c.z), y = -G.bestH0 * PH;
  const fade = G.recCrossed ? 1 - clamp((G.t - G.recT) / 1.4, 0, 1) : 1;
  if (fade <= 0) return;
  const glow = G.recCrossed ? 1 : .82 + .18 * Math.sin(G.t * 2.4);
  ctx.globalAlpha = fade * glow;
  ctx.beginPath(); ctx.moveTo(c.x - half, y); ctx.lineTo(c.x + half, y);
  ctx.strokeStyle = 'rgba(60,24,20,0.35)'; ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = '#ffd77a'; ctx.lineWidth = 3; ctx.setLineDash([14, 9]); ctx.stroke(); ctx.setLineDash([]);
  const txt = `${tr('Rekor')} · ${G.bestH0}`;
  ctx.font = '800 15px Nunito, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(txt).width, x = c.x + half - 14;
  ctx.fillStyle = 'rgba(60,24,20,0.78)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - tw - 12, y - 14, tw + 24, 28, 14) : ctx.rect(x - tw - 12, y - 14, tw + 24, 28); ctx.fill();
  ctx.fillStyle = '#ffe2a8'; ctx.fillText(txt, x, y + 1);
  ctx.globalAlpha = 1;
}
function drawAski(h) {
  const p = hangPos(h);
  const rt = h.retract ? easeOutCubic(h.retract) : 0;
  ctx.save();
  ctx.translate(h.px, -p.pivotY - rt * 420);
  ctx.rotate(-h.theta);
  // zincir
  const ringY = L - PH - 44;
  ctx.strokeStyle = '#7a5520'; ctx.lineWidth = 2.6; ctx.setLineDash([5, 3]);
  ctx.beginPath(); ctx.moveTo(0, -200); ctx.lineTo(0, ringY - 8); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#e8c46e'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(-.6, -200); ctx.lineTo(-.6, ringY - 8); ctx.stroke(); ctx.setLineDash([]);
  // halka + kollar
  const open = h.released ? clamp(rt * 3, 0, 1) : 0;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const ex = sx * (63 + open * 22), ey = L - 9;
    ctx.strokeStyle = '#6e4a18'; ctx.lineWidth = 4.4;
    ctx.beginPath(); ctx.moveTo(sx * 4, ringY); ctx.quadraticCurveTo(sx * 46, ringY + 20, ex, ey); ctx.stroke();
    ctx.strokeStyle = '#f2d384'; ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.moveTo(sx * 4, ringY); ctx.quadraticCurveTo(sx * 46, ringY + 20, ex, ey); ctx.stroke();
    ctx.strokeStyle = '#8c6224'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.quadraticCurveTo(ex + sx * 4, ey + 6, ex - sx * 5, ey + 7); ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(0, ringY - 6, 9, 9, 0, 0, TAU); ctx.strokeStyle = '#7a5520'; ctx.lineWidth = 3.6; ctx.stroke();
  ctx.strokeStyle = '#f6dc90'; ctx.lineWidth = 1.2; ctx.stroke();
  if (!h.released) drawPiece(h.spec, 0, L, 0);
  ctx.restore();
}
// bir vaktin karışımdaki ağırlığı (geçişte ikisi paylaşır)
function phaseW(i) { const t = easeInOut(G.phaseT); return (G.phase === i ? t : 0) + (G.phaseFrom === i ? 1 - t : 0); }
function drawVines() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (let k = 0; k < 2; k++) {
    const sp = SPR.vines[k], a = .022 * Math.sin(G.t * .7 + k * 2) + .01 * Math.sin(G.t * 1.9 + k);
    ctx.save();
    if (k) { ctx.translate(W + 4 * S, -8 * S); ctx.scale(-.8, .8); } else ctx.translate(-4 * S, -2 * S);
    ctx.rotate(a); ctx.drawImage(sp.c, 0, 0, sp.w * S, sp.h * S);
    ctx.restore();
  }
}
function drawDust(P, k) {
  // güneşten terasa inen iki huzme ve içinde yavaşça süzülen tozlar
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const dx = W * .5 - SUN.x, dy = H * 1.05 - SUN.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) - Math.PI / 2;
  const col = tinted(SPR.beam, mixc(PT.glow, [255, 230, 200], .3));
  ctx.save(); ctx.translate(SUN.x, SUN.y); ctx.rotate(ang);
  ctx.globalAlpha = .13 * k * (.85 + .15 * Math.sin(G.t * .5));
  ctx.drawImage(col, -len * .38, 0, len * .76, len * .85); ctx.restore();
  const ca = Math.cos(ang + Math.PI / 2), sa = Math.sin(ang + Math.PI / 2), n = eco() ? 15 : motes.length;
  for (let i = 0; i < n; i++) {
    const m = motes[i], d = m.v * len, half = d * .22;
    const x = SUN.x + ca * d - sa * m.w * half, y = SUN.y + sa * d + ca * m.w * half;
    const a = (1 - Math.abs(m.w)) * Math.sin(m.v * Math.PI) * (.55 + .45 * Math.sin(G.t * 2.2 * m.sp + m.ph)) * k;
    if (a < .03) continue;
    const s = (3 + m.v * 5) * m.s * S;
    ctx.globalAlpha = a; ctx.drawImage(SPR.warm, x - s, y - s, s * 2, s * 2);
  }
  ctx.globalAlpha = 1;
}
function render() {
  const P = blendedPhase();
  drawBackground(P);
  // ince katmanlar varılan vaktin rengini alır: geçiş boyunca her kare yeniden boyanmasın
  PT = PHASES[G.phase];
  REFL = tinted(SPR.reflM, mixc(mixc(PT.skyMid, PT.skyBot, .5), PT.glow, .25));
  const shx = (Math.random() - .5) * G.shake * S, shy = (Math.random() - .5) * G.shake * S;
  worldTransform(shx, shy);
  const bulbs = drawLights(P);
  drawTable();
  drawSprite(SPR.tray, 0, 0);
  if (G.bestH0 >= 3 && G.state !== 'title') drawRecordLine();
  // kule
  const n = G.pieces.length;
  const trem = G.state === 'playing' && G.risk > .7 ? (G.risk - .7) / .3 : 0;
  const vh = H / (2 * S * G.cam.z), lo = Math.max(0, Math.floor((G.cam.y - vh) / PH) - 1), hi = Math.min(n, Math.ceil((G.cam.y + vh) / PH) + 1);
  for (let i = lo; i < hi; i++) {
    const p = G.pieces[i];
    const age = G.t - p.born;
    const sq = age < .5 ? Math.sin(age * 20) * Math.exp(-age * 9) * .12 : 0;
    const tr = trem && i > n - 4 ? Math.sin(G.t * 42 + i) * trem * .9 : 0;
    reflOn = i >= n - 6;
    drawPiece(p, p.x + tr, -i * PH, sq);
  }
  reflOn = true;
  // devrilen grup
  if (G.topple) {
    const T = G.topple;
    ctx.save(); ctx.translate(T.px, -T.py); ctx.rotate(T.side * T.a); ctx.translate(-T.px, T.py);
    T.group.forEach((p, i) => drawPiece(p, p.tx, -(T.k + i) * PH, 0));
    ctx.restore();
  }
  for (const b of G.bodies) {
    if (!b.alive) continue;
    ctx.save(); ctx.translate(b.x, -b.y); ctx.rotate(-b.a); drawPiece(b.p, 0, 50, 0); ctx.restore();
  }
  // düşen
  if (G.drop) { const d = G.drop; ctx.save(); ctx.translate(d.x, -d.y); ctx.rotate(-d.ang); drawPiece(d.spec, 0, 0, 0); ctx.restore(); }
  // öğretici kılavuz
  if (G.tutorial && G.state === 'playing' && G.hang && !G.hang.released) {
    const off = Math.abs(hangPos(G.hang).x - topX());
    const ok = off < SUP * .6;
    ctx.setLineDash([6, 7]); ctx.lineWidth = ok ? 2.6 : 1.6; ctx.strokeStyle = ok ? 'rgba(255,226,140,0.95)' : 'rgba(255,248,236,0.45)';
    ctx.beginPath(); ctx.moveTo(topX(), -topY() - 4); ctx.lineTo(topX(), -topY() - HC - 10); ctx.stroke(); ctx.setLineDash([]);
  }
  // askı
  if (G.hang && (G.state === 'playing' || G.state === 'paused' || (G.hang.retract && G.hang.retract < 1))) drawAski(G.hang);
  // parçacıklar (normal)
  for (const p of parts) {
    const t = p.life / p.max;
    if (p.kind === 'tea' || p.kind === 'drop') { ctx.fillStyle = rgb(p.col || TEA[1], 1 - t * .6); ctx.beginPath(); ctx.arc(p.x, -p.y, p.size, 0, TAU); ctx.fill(); }
    else if (p.kind === 'shard') { ctx.save(); ctx.translate(p.x, -p.y); ctx.rotate(p.rot); ctx.fillStyle = `rgba(235,245,255,${.8 - t * .6})`; ctx.beginPath(); ctx.moveTo(-p.size, 0); ctx.lineTo(0, -p.size * .5); ctx.lineTo(p.size * .7, p.size * .4); ctx.fill(); ctx.restore(); }
    else if (p.kind === 'porcelain' || p.kind === 'sugar') { ctx.save(); ctx.translate(p.x, -p.y); ctx.rotate(p.rot); ctx.fillStyle = p.kind === 'sugar' ? `rgba(255,253,246,${1 - t * t})` : `rgba(246,238,226,${1 - t})`; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * (p.kind === 'sugar' ? 1 : .6)); if (p.kind === 'sugar') { ctx.fillStyle = `rgba(200,180,150,${.5 * (1 - t * t)})`; ctx.fillRect(-p.size / 2, p.size * .2, p.size, p.size * .3); } ctx.restore(); }
  }
  drawVines();
  // renk grade
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(gradeOverlay(P.grade), 0, 0, cv.width, cv.height);
  ctx.globalCompositeOperation = 'lighter';
  const dk = phaseW(1) + phaseW(3) * .7;
  if (dk > .02) drawDust(P, dk);
  worldTransform(shx, shy);
  // gece ışıkları
  if (P.night > .15) {
    for (const b of bulbs) { ctx.globalAlpha = P.night * .8; ctx.drawImage(SPR.warm, b[0] - 22, b[1] - 22, 44, 44); }
    for (let i = Math.max(0, n - 7); i < n; i++) { ctx.globalAlpha = P.night * .32; ctx.drawImage(SPR.warm, G.pieces[i].x - 44, -i * PH - 96, 88, 88); }
    ctx.globalAlpha = 1;
  }
  // altın bardak pırıltısı
  for (let i = Math.max(0, n - 8); i < n; i++) {
    const p = G.pieces[i]; if (!p.golden) continue;
    const tw = .5 + .5 * Math.sin(G.t * 3 + i * 2);
    ctx.globalAlpha = .5 * tw; ctx.drawImage(SPR.spark, p.x + 14 - 10, -i * PH - 100 - 10, 20, 20);
  }
  if (G.hang && G.hang.spec.golden && !G.hang.released && G.state !== 'over') {
    const hp = hangPos(G.hang); const tw = .5 + .5 * Math.sin(G.t * 5);
    ctx.globalAlpha = .4 + .5 * tw; ctx.drawImage(SPR.spark, hp.x + 16 - 12, -hp.y - 100 - 12, 24, 24);
  }
  ctx.globalAlpha = 1;
  // halkalar
  for (const r of rings) {
    if (r.t < 0) continue;
    const t = r.t / r.max, e = easeOutCubic(t), rr = lerp(r.r0, r.r1, e);
    ctx.strokeStyle = r.golden ? `rgba(255,214,110,${(1 - t) * .9})` : `rgba(255,236,190,${(1 - t) * .85})`;
    ctx.lineWidth = 3.5 * (1 - t) + .5;
    ctx.beginPath(); ctx.ellipse(r.x, -r.y, rr, rr * .17, 0, 0, TAU); ctx.stroke();
  }
  // parlama
  if (G.flash > .02 && n) { const p = G.pieces[n - 1]; ctx.globalAlpha = G.flash * .8; ctx.drawImage(SPR.warm, p.x - 90, -(n - 1) * PH - 140, 180, 180); ctx.globalAlpha = 1; }
  for (const p of parts) {
    if (p.kind !== 'spark') continue;
    const t = p.life / p.max, s = p.size * (1 - t * .5);
    ctx.globalAlpha = 1 - t; ctx.drawImage(SPR.spark, p.x - s, -p.y - s, s * 2, s * 2);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // buhar & toz
  for (const p of parts) {
    if (p.kind !== 'steam' && p.kind !== 'puff') continue;
    const t = p.life / p.max, s = p.size * (1 + t * 1.6);
    ctx.globalAlpha = (p.kind === 'steam' ? .16 : .5) * Math.sin(t * Math.PI);
    ctx.drawImage(SPR.soft, p.x - s, -p.y - s, s * 2, s * 2);
  }
  ctx.globalAlpha = 1;
  // yazılar
  for (const f of floaters) {
    const t = f.t / 1.3, e = easeOutCubic(Math.min(1, f.t / .35));
    ctx.globalAlpha = t < .7 ? 1 : 1 - (t - .7) / .3;
    ctx.font = `700 ${f.size * (.7 + .3 * e)}px Fraunces, Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const y = -f.y - t * 40;
    ctx.fillStyle = 'rgba(60,16,20,0.35)'; ctx.fillText(f.text, f.x, y + 2);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, y);
  }
  ctx.globalAlpha = 1;
  // vinyet + evre başlığı
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.phaseBanner && G.state === 'playing') {
    const b = G.phaseBanner, a = b.t < .4 ? b.t / .4 : b.t > 1.8 ? 1 - (b.t - 1.8) / .6 : 1;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `600 12px Nunito, sans-serif`; ctx.fillStyle = 'rgba(255,236,200,0.85)';
    const ty = 152 + (1 - easeOutCubic(clamp(b.t / .5, 0, 1))) * 10;
    ctx.fillText('V A K İ T', W / 2, ty);
    ctx.font = `italic 600 24px Fraunces, Georgia, serif`; ctx.fillStyle = '#fff6e6';
    ctx.fillText(b.text, W / 2, ty + 24);
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ UI
function show(id, on) { const el = $(id); if (el) el.classList.toggle('hidden', !on); }
const ui = {
  score(v, bump) { const el = $('score'); el.textContent = v; if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 160); } },
  target() {
    const el = $('target'), on = G.mode === 'challenge';
    el.classList.toggle('hidden', !on); el.classList.toggle('won', on && G.chBeat);
    if (on) el.textContent = G.chBeat ? `✓ ${tr('Hedef')} ${G.ch.target}` : `${tr('Hedef')} ${G.ch.target}`;
  },
  combo(txt) { const el = $('combo'); if (txt) { el.textContent = txt; el.classList.add('show'); } else el.classList.remove('show'); },
  wallet(gain) {
    document.querySelectorAll('.walletN').forEach((el) => { el.textContent = Wallet.n; });
    const w = document.querySelector('.wallet');
    if (gain && w && G.state === 'title') { w.classList.remove('gain'); void w.offsetWidth; w.classList.add('gain'); }
  },
};
function pause() {
  if (G.state !== 'playing' && G.state !== 'toppling') return;
  G.prev = G.state; G.state = 'paused'; show('pause', true); Snd.suspend();
}
function resume() {
  if (G.state !== 'paused' || G.panel) return;
  G.state = G.prev || 'playing'; show('pause', false); Snd.init(); Snd.resume(); last = performance.now();
}
function goHome() {
  show('pause', false); show('over', false); show('hud', false); show('tutorial', false);
  if (G.ch && G.ch.done) { G.ch = null; G.mode = 'classic'; }
  G.state = 'title'; G.phaseFrom = G.phase; demoTower(); G.phaseFrom = 0; G.phaseT = 1;
  $('titleBest').querySelector('b').textContent = G.best;
  refreshTitle(); flushToasts(); syncInstall();
  show('title', true);
}
function syncMute() { document.body.classList.toggle('muted', Snd.muted); }
// ana ekrana ekle: tarayıcı izin verince, oyuncu 2 el oynadıktan sonra başlıkta küçük bir buton
let installEv = null;
function installReady() {
  const later = store.get('ck_inst', '');
  return !!installEv && !window.PF && (parseInt(store.get('ck_runs', '0'), 10) || 0) >= 2 && later !== 'done' && (!later || later < daysAgo(3));
}
function syncInstall() { const on = installReady(); show('installBtn', on); show('installBtnO', on); }
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEv = e; syncInstall(); });
window.addEventListener('appinstalled', () => { store.set('ck_inst', 'done'); installEv = null; syncInstall(); });
function askInstall() {
  if (!installEv) return;
  const ev = installEv; installEv = null; syncInstall();
  ev.prompt();
  if (ev.userChoice) ev.userChoice.then((c) => store.set('ck_inst', c && c.outcome === 'accepted' ? 'done' : dayKey()), () => {});
}

window.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest && e.target.closest('button');
  if (btn) return;
  if (G.state === 'paused') return;
  e.preventDefault();
  Snd.init();
  tap();
}, { passive: false });
document.querySelectorAll('.soundBtn').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); Snd.toggle(); syncMute(); Snd.click(); }));
$('pauseBtn').addEventListener('click', (e) => { e.stopPropagation(); pause(); });
$('resumeBtn').addEventListener('click', (e) => { e.stopPropagation(); resume(); });
$('homeBtn').addEventListener('click', (e) => { e.stopPropagation(); goHome(); });
$('againBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); startGame(); });
$('reviveBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); askRevive(); });
$('dailyBtn').addEventListener('click', (e) => { e.stopPropagation(); if (G.state === 'title' && !G.panel) startGame('daily'); });
document.querySelectorAll('#cupTabs button').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); if (G.cupTab === b.dataset.t) return; G.cupTab = b.dataset.t; Snd.click(); renderCups(); }));
$('cupsBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); Snd.click(); openPanel('cups'); });
$('giftBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); Snd.click(); openPanel('gift'); });
$('achBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); Snd.click(); openPanel('ach'); });
$('setBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); Snd.click(); openPanel('set'); });
$('setBtnP').addEventListener('click', (e) => { e.stopPropagation(); Snd.click(); openPanel('set'); });
document.querySelectorAll('.set-row[data-k]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); if (G.state !== 'paused') Snd.init(); toggleSet(b.dataset.k); }));
document.querySelectorAll('#gfxSeg button').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); setGfx(b.dataset.v); }));
$('tutBtn').addEventListener('click', (e) => { e.stopPropagation(); G.tutorial = true; G.tutDone = 0; store.set('ck_tut', '0'); Snd.click(); renderSet(); });
for (const id of ['cupsClose', 'giftClose', 'achClose', 'setClose']) $(id).addEventListener('click', (e) => { e.stopPropagation(); closePanel(); });
$('claimBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); claimGift(); });
$('spinBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); askSpin(); });
$('shareBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); Snd.click(); share(); });
$('chBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); Snd.click(); share(); });
$('chX').addEventListener('click', (e) => { e.stopPropagation(); Snd.click(); G.ch = null; G.mode = 'classic'; refreshTitle(); });
for (const id of ['installBtn', 'installBtnO']) $(id).addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); Snd.click(); askInstall(); });
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (G.state === 'paused') resume(); else { Snd.init(); tap(); } }
  else if (e.code === 'KeyP' || e.code === 'Escape') { if (G.panel) closePanel(); else G.state === 'paused' ? resume() : pause(); }
  else if (e.code === 'KeyM') { Snd.init(); Snd.toggle(); syncMute(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); Snd.suspend(); } });
window.addEventListener('blur', () => pause());
let rT = 0;
window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 120); });
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// ------------------------------------------------------------------ loop
let last = performance.now(), frames = 0, fpsT = 0, fps = 60, workSum = 0, workN = 0, slowT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const idle = G.state === 'paused' ? 95 : G.state === 'title' && !wheelAnim ? 31 : 0;
  if (idle && now - last < idle) return;
  let dt = (now - last) / 1000; last = now;
  if (!(dt > 0)) dt = 0;
  const realDt = Math.min(dt, 1);
  dt = Math.min(dt, 1 / 20);
  const w0 = performance.now();
  if (G.state !== 'paused') update(dt * G.timeScale);
  render();
  const work = performance.now() - w0;
  workSum += work; workN++;
  frames++; fpsT += realDt;
  if (idle) { frames = 0; fpsT = 0; slowT = 0; }
  else if (fpsT >= 1) {
    fps = frames / fpsT; frames = 0; fpsT = 0;
    // uyarlanabilir çözünürlük
    if (fps < 42 && DPR > 1.5 && !window.__fixDpr) { slowT++; if (slowT >= 3) { dprCap = 1.5; slowT = 0; resize(); } } else slowT = 0;
  }
}

// ------------------------------------------------------------------ test kancası
window.__game = {
  get state() { return G.state; }, get score() { return G.score; }, get best() { return G.best; },
  get height() { return G.pieces.length; }, get combo() { return G.combo; }, get risk() { return G.risk; },
  get phase() { return PHASES[G.phase].name; },
  get canTap() { return G.state === 'playing' && !!G.hang && !G.hang.released && G.hang.it >= .55; },
  get offset() { return G.hang ? hangPos(G.hang).x - topX() : null; },
  get fps() { return fps; },
  perf() { const r = { fps, avgWorkMs: workN ? workSum / workN : 0, dpr: DPR, frames: workN }; workSum = 0; workN = 0; return r; },
  get mode() { return G.mode; }, get total() { return G.total; }, get skin() { return G.skin; },
  get canRevive() { const b = $('reviveBtn'); return G.state === 'over' && !b.classList.contains('hidden'); },
  get daily() { return G.mod ? G.mod.name : null; }, get revived() { return G.revived; },
  get venue() { return VENUES[G.venue].id; }, selectVenue, setPhase(i) { G.phase = G.phaseFrom = i; G.phaseT = 1; },
  _trans(i) { G.phaseFrom = G.phase; G.phase = i; G.phaseT = 0; }, _bg() { drawBackground(blendedPhase()); },
  setTotal(n) { G.total = n; store.set('ck_total', n); }, selectSkin, revive: () => askRevive(), openCups, closeCups,
  get sugar() { return Wallet.n; }, addSugar(k) { Wallet.add(k); }, get panel() { return G.panel; }, openPanel, closePanel,
  get ach() { return [...achDone]; }, get login() { return loginState(); }, get spins() { return spinState(); },
  get offerRevive() { return G.offerRevive; }, get seed() { return G.seed; }, get seq() { return G.pieces.map((p) => p.tea + (p.golden ? 'g' : '')).join(''); }, get ch() { return G.ch; }, chLink, setCh(c) { G.ch = c; G.mode = c ? 'challenge' : 'classic'; refreshTitle(); }, get week() { return week(); }, get bestH0() { return G.bestH0; },
  start: (m) => startGame(m), tap: () => tap(), pause, resume, home: goHome, _spr: () => SPR,
  setTimeScale(s) { G.timeScale = s; },
  step(dt, n) { n = n || 1; for (let i = 0; i < n; i++) update(dt); render(); },
  // tam ortada bırakmak için askıyı ortaya kadar ilerlet
  aimPerfect(maxSteps) {
    for (let i = 0; i < (maxSteps || 4000); i++) { if (this.canTap && Math.abs(this.offset) < 1.2) return true; update(1 / 600); }
    return false;
  },
  aimOffset(target, maxSteps) {
    for (let i = 0; i < (maxSteps || 6000); i++) { if (this.canTap && Math.abs(this.offset - target) < 1.5) return true; update(1 / 600); }
    return false;
  },
};

// ------------------------------------------------------------------ boot
resize();
applyVenue();
syncMute();
$('titleBest').querySelector('b').textContent = G.best;
// eski kayıtlı oyuncular: bu sürümden önceki rekorlar başarımlara sayılsın
ST.bestScore = Math.max(ST.bestScore, G.best); ST.dailyBest = Math.max(ST.dailyBest, dailyStreak());
saveStats(); checkAch();
G.ch = readChallenge(); if (G.ch) G.mode = 'challenge';
refreshTitle();
demoTower();
// günün ilk açılışında hediye paneli kendiliğinden gelsin (meydan okuma linkiyle gelen önce onu görsün)
if (!loginState().claimed && !G.ch) setTimeout(() => openPanel('gift'), 700);
G.cam.y = G.cam.ty = camMinY() - H * .07 / S; G.cam.x = 0;
requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {});
})();
