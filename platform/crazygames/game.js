/* Çay Kulesi — tek dosyalık Canvas2D oyun motoru */
(() => {
'use strict';
const T = (s) => (window.PF ? window.PF.t(s) : s);

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
const hex = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgb = (c, a) => a == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const shade = (c, k) => k >= 0 ? mixc(c, [255, 240, 220], k) : mixc(c, [20, 4, 2], -k);
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

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
  { name: T('İkindi'), skyTop: '#ea9a70', skyMid: '#f6c386', skyBot: '#fde2ae', sun: '#fff4d6', glow: '#ffcf86', far: '#d89c7c', city: '#7c4b46', sea: '#c97c5c', seaDeep: '#8c4a44', shimmer: '#ffe4ab', cloud: '#fff0dc', bird: '#5a3030', grade: [255, 214, 172, .16], stars: 0, night: 0, sx: .74, sy: .40, sr: 26 },
  { name: T('Gün batımı'), skyTop: '#46377a', skyMid: '#c0587c', skyBot: '#f89a5c', sun: '#ffd8a6', glow: '#ff8c6a', far: '#9c5c7c', city: '#3c2444', sea: '#7e4466', seaDeep: '#3e2448', shimmer: '#ffb488', cloud: '#f6b2a2', bird: '#2a1a2e', grade: [242, 172, 196, .22], stars: .25, night: .5, sx: .7, sy: .535, sr: 36 },
  { name: T('Gece'), skyTop: '#0a1430', skyMid: '#182a56', skyBot: '#33497c', sun: '#f4f1e6', glow: '#a9c0ff', far: '#1e2d55', city: '#0b1226', sea: '#14213f', seaDeep: '#0a1228', shimmer: '#d4dcff', cloud: '#3c4c7a', bird: '#c8d0ee', grade: [128, 148, 214, .42], stars: 1, night: 1, sx: .26, sy: .2, sr: 19 },
  { name: T('Şafak'), skyTop: '#2c3a6e', skyMid: '#8e6c9c', skyBot: '#f6b2a0', sun: '#ffe8d2', glow: '#ffaea0', far: '#7c6e96', city: '#3a3456', sea: '#6c6492', seaDeep: '#3a3660', shimmer: '#ffd2c2', cloud: '#f4c8c6', bird: '#2a2440', grade: [222, 192, 222, .24], stars: .35, night: .55, sx: .24, sy: .52, sr: 30 },
  { name: T('Sabah'), skyTop: '#7db4dc', skyMid: '#b8d7e8', skyBot: '#f6e2cc', sun: '#fffaf0', glow: '#fff0d2', far: '#a8bdcc', city: '#6c8396', sea: '#6c9cb4', seaDeep: '#3e6e8a', shimmer: '#ffffff', cloud: '#ffffff', bird: '#3a4a5a', grade: [255, 244, 234, .08], stars: 0, night: 0, sx: .3, sy: .33, sr: 24 },
  { name: T('Öğle'), skyTop: '#4e96ce', skyMid: '#8cc0e2', skyBot: '#dcefee', sun: '#ffffff', glow: '#fffae6', far: '#93b2c4', city: '#55707f', sea: '#3c86a6', seaDeep: '#24607e', shimmer: '#ffffff', cloud: '#ffffff', bird: '#33424e', grade: [255, 250, 240, .05], stars: 0, night: 0, sx: .62, sy: .15, sr: 22 },
].map((p) => {
  const o = { ...p };
  for (const k of ['skyTop', 'skyMid', 'skyBot', 'sun', 'glow', 'far', 'city', 'sea', 'seaDeep', 'shimmer', 'cloud', 'bird']) o[k] = hex(p[k]);
  return o;
});
const PHASE_LEN = 7;

// ------------------------------------------------------------------ canvas / sizing
const cv = $('c');
const ctx = cv.getContext('2d', { alpha: false });
let W = 390, H = 844, DPR = 1, S = 1, dprCap = 2.5;
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
function makeGlass(tea, golden) {
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
function buildSprites() {
  SPR.glass = TEA.map((t) => makeGlass(t, false));
  SPR.glassGold = makeGlass(hex('#a8381c'), true);
  SPR.saucer = makeSaucer(false);
  SPR.saucerGold = makeSaucer(true);
  SPR.tray = makeTray();
  SPR.tile = makeTile();
  SPR.soft = makeGlow([255, 255, 255]);
  SPR.warm = makeGlow([255, 196, 120]);
  SPR.spark = makeSpark();
  SPR.softM = { c: SPR.soft };
  SPR.contact = sprite(90, 20, 45, 10, (g) => softEllipse(g, 0, 0, 40, 6.5, [40, 14, 6], .42));
  SPR.kilimPattern = ctx.createPattern(SPR.tile.c, 'repeat');
}

// ------------------------------------------------------------------ background (ekran uzayı maskeleri)
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
function buildBackground() {
  const u = S * DPR;
  const bw = Math.ceil(W * DPR * 1.5), bh = Math.ceil(170 * u);
  const rnd = seeded(7);
  // uzak tepeler
  const far = maskCanvas(bw, bh);
  far.g.fillStyle = '#fff';
  far.g.beginPath(); far.g.moveTo(0, bh);
  for (let x = 0; x <= bw; x += 6) {
    const t = x / bw;
    const y = bh - (34 + 16 * Math.sin(t * 7.3 + 1) + 10 * Math.sin(t * 17.1) + 6 * Math.sin(t * 41)) * u;
    far.g.lineTo(x, y);
  }
  far.g.lineTo(bw, bh); far.g.fill();
  for (let x = 0; x < bw; x += 5 * u) { if (rnd() < .5) { const hh = (3 + rnd() * 7) * u, t = x / bw; const y0 = bh - (34 + 16 * Math.sin(t * 7.3 + 1) + 10 * Math.sin(t * 17.1) + 6 * Math.sin(t * 41)) * u; far.g.fillRect(x, y0 - hh + 2 * u, 4 * u, hh); } }
  // yakın siluet
  const city = maskCanvas(bw, bh);
  const g = city.g; g.fillStyle = '#fff';
  let x = 0;
  while (x < bw) { const w = (7 + rnd() * 16) * u, h = (5 + rnd() * 14) * u; g.fillRect(x, bh - h, w + 1, h); if (rnd() < .3) { g.beginPath(); g.moveTo(x, bh - h); g.lineTo(x + w / 2, bh - h - 5 * u); g.lineTo(x + w, bh - h); g.fill(); } x += w; }
  g.fillRect(0, bh - 6 * u, bw, 6 * u);
  drawMosque(g, bw * .18, bh - 4 * u, u, .78, [[-62, 70, 2], [62, 70, 2]]);
  drawMosque(g, bw * .43, bh - 8 * u, u, 1.0, [[-66, 88, 3], [66, 88, 3], [-84, 70, 2], [84, 70, 2]]);
  // galata
  { const gx = bw * .62, gb = bh - 10 * u; g.fillRect(gx - 7 * u, gb - 58 * u, 14 * u, 58 * u); g.fillRect(gx - 8.4 * u, gb - 50 * u, 16.8 * u, 3 * u);
    g.beginPath(); g.moveTo(gx - 8 * u, gb - 58 * u); g.lineTo(gx, gb - 78 * u); g.lineTo(gx + 8 * u, gb - 58 * u); g.fill(); g.fillRect(gx - .7 * u, gb - 84 * u, 1.4 * u, 7 * u); }
  drawMosque(g, bw * .8, bh - 5 * u, u, .7, [[-60, 72, 2], [60, 72, 2], [-74, 60, 1], [74, 60, 1]]);
  drawMosque(g, bw * .97, bh - 3 * u, u, .5, [[-58, 70, 2]]);
  // gece pencereleri
  const data = g.getImageData(0, 0, bw, bh).data;
  const wins = [];
  for (let i = 0; i < 1400 && wins.length < 170; i++) {
    const px = rnd() * bw | 0, py = (bh - rnd() * 40 * u) | 0;
    if (py > 0 && py < bh - 3 * u && data[(py * bw + px) * 4 + 3] > 200) wins.push([px, py, rnd()]);
  }
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
  // bulutlar
  const clouds = [];
  for (let i = 0; i < 4; i++) {
    const cw = (150 + i * 30) * u, ch = 80 * u, m = maskCanvas(cw, ch);
    const r2 = seeded(31 + i * 7);
    for (let j = 0; j < 14; j++) {
      const cx = cw * (.18 + r2() * .64), cy = ch * (.6 + r2() * .08), r = (10 + r2() * 18) * u * (1.15 - 1.6 * Math.abs(cx / cw - .5));
      const gr = m.g.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.7, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      m.g.fillStyle = gr; m.g.beginPath(); m.g.arc(cx, cy, r, 0, TAU); m.g.fill();
    }
    clouds.push(m);
  }
  const stars = []; const r3 = seeded(99);
  for (let i = 0; i < 140; i++) stars.push([r3(), r3() * .75, .4 + r3() * 1.2, r3() * TAU]);
  BG = { bw, bh, far, city, kk, fe, clouds, wins, stars, ov: mk(Math.ceil(W / 3), Math.ceil(H / 3)), ovKey: '' };
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
  let ac = null, master = null, dry = null, verb = null, amb = null;
  let muted = store.get('ck_mute', '0') === '1', forced = false;
  const HICAZ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16, 17, 19, 20, 22, 24, 25, 28];
  function init() {
    if (ac) { if (ac.state === 'suspended' && !document.hidden) ac.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    master = ac.createGain(); master.gain.value = (muted || forced) ? 0 : .9;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ac.destination);
    dry = ac.createGain(); dry.connect(master);
    verb = ac.createConvolver();
    const len = ac.sampleRate * 2.2, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = .32; verb.connect(vg); vg.connect(master);
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
    s.connect(lp); lp.connect(g); g.connect(master); s.start(); lfo.start();
    amb = { g };
  }
  function gull() {
    if (!ac || muted || forced || ac.state !== 'running') return;
    const t = now() + .05;
    for (let k = 0; k < 2; k++) {
      const o = ac.createOscillator(), g = ac.createGain(), bp = ac.createBiquadFilter();
      const t0 = t + k * .32;
      o.type = 'triangle'; o.frequency.setValueAtTime(1500, t0); o.frequency.exponentialRampToValueAtTime(2300, t0 + .06); o.frequency.exponentialRampToValueAtTime(1150, t0 + .26);
      bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 2.5;
      env(g, t0, .02, .018, .26); o.connect(bp); bp.connect(g); g.connect(dry); g.connect(verb); o.start(t0); o.stop(t0 + .35);
    }
  }
  const api = {
    init,
    get muted() { return muted; },
    toggle() { muted = !muted; store.set('ck_mute', muted ? '1' : '0'); if (master) master.gain.setTargetAtTime((muted || forced) ? 0 : .9, now(), .05); return muted; },
    setForced(v) { forced = !!v; if (master) master.gain.setTargetAtTime((muted || forced) ? 0 : .9, now(), .02); if (forced) api.suspend(); else if (!document.hidden) api.resume(); },
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
};
const parts = [], rings = [], floaters = [];
let ferry = { x: -1, t: 6 }, gulls = [], gullTimer = 6;

function topY() { return G.pieces.length * PH; }
function topX() { return G.pieces.length ? G.pieces[G.pieces.length - 1].tx : 0; }
function camMinY(z) { return -40 + (H * .80 - H * .5) / (S * (z || 1)); }

function newPieceSpec() {
  const n = G.pieces.length;
  let golden = false;
  if (n >= 3 && !G.lastGolden && Math.random() < .15) golden = true;
  G.lastGolden = golden;
  const r = Math.random();
  return { tea: r < .2 ? 0 : r < .62 ? 1 : r < .88 ? 2 : 3, golden };
}
function swingParams(n) {
  const Ah = Math.min(152, 100 + n * 2.4);
  const T = Math.max(1.12, 2.6 - n * .052);
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
  G.lastGolden = false;
}
function demoTower() {
  resetWorld();
  const xs = [0, 5, -3];
  xs.forEach((x, i) => G.pieces.push({ x, tx: x, tea: [1, 2, 0, 1][i], golden: i === 2, born: -10 }));
  spawnHang(); G.hang.it = 1;
  G.phase = 0; G.phaseFrom = 0; G.phaseT = 1;
}

function startGame() {
  Snd.init(); Snd.start();
  for (const p of G.pieces) burst(p.tx, G.pieces.indexOf(p) * PH + 50, 6, 'puff');
  resetWorld();
  G.state = 'playing';
  G.phaseFrom = G.phase; G.phase = 0; G.phaseT = G.phaseFrom === 0 ? 1 : 0;
  spawnHang();
  ui.score(0, false); ui.combo('');
  show('title', false); show('over', false); show('pause', false); show('hud', true);
  show('tutorial', G.tutorial);
  PF.gameplayStart();
}
let adLock = false;
function tap() {
  if (adLock) return;
  if (G.state === 'title') { startGame(); return; }
  if (G.state === 'over') { if (performance.now() - G.overAt > 450) PF.adBreak(startGame); return; }
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
  // puan
  let gain = 1;
  if (perfect) {
    G.combo++; G.perfects++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    gain = 2 + (d.spec.golden ? 3 : 0) + (G.combo >= 5 ? 1 : 0);
    straighten(G.combo >= 3 ? .5 : .82);
    Snd.perfect(G.combo, d.spec.golden);
    perfectFx(piece.tx, ty, G.combo, d.spec.golden);
    vibrate(G.combo >= 3 ? [12, 30, 12] : 10);
    floater(piece.tx, ty + PH + 26, G.combo > 1 ? `${T('Mükemmel')} ×${G.combo}` : T('Mükemmel'), '#fff1c4', 30);
    if (G.combo >= 3 && G.combo % 3 === 0) floater(piece.tx, ty + PH + 64, T('Denge!'), '#ffd27a', 20, true);
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
  ui.score(G.score, true); ui.combo(G.combo >= 2 ? `${T('Kombo')} ×${G.combo}` : '');
  // risk uyarısı
  const st2 = stability();
  G.risk = st2.risk;
  if (G.risk > .72 && !G.warned) { G.warned = true; Snd.creak(); floater(topX(), topY() + 120, T('Dikkat, sallanıyor!'), '#ffb4a0', 20); }
  if (G.risk < .5) G.warned = false;
  // rekor
  if (G.best > 0 && G.score > G.best && !G.recordShown) {
    G.recordShown = true; Snd.record(); floater(topX(), topY() + 160, T('Yeni rekor!'), '#ffe08a', 30); confetti(30);
  }
  // evre
  const ph = Math.floor(G.pieces.length / PHASE_LEN) % PHASES.length;
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
  G.state = 'over'; G.overAt = performance.now(); PF.gameplayStop();
  const rec = G.score > G.best;
  G.prevBest = G.best;
  if (rec) { G.best = G.score; store.set('ck_best', G.best); }
  $('finalScore').textContent = G.score;
  $('statBest').textContent = G.best; $('statPerfect').textContent = G.perfects; $('statCombo').textContent = G.maxCombo;
  $('overReason').textContent = T(G.single ? 'Bardak kaydı' : 'Kule devrildi');
  const firstRun = G.prevBest === 0;
  $('recordBadge').textContent = T(firstRun ? 'İlk kulen!' : 'Yeni rekor!');
  show('recordBadge', rec && G.score > 0);
  $('titleBest').querySelector('b').textContent = G.best;
  show('hud', false); show('tutorial', false); show('over', true);
  if (rec && G.score > 0) { setTimeout(() => { Snd.record(); confetti(60); }, 280); if (!firstRun) PF.happy(); }
}

// ------------------------------------------------------------------ effects
function vibrate(p) { try { if (navigator.vibrate && !Snd.muted) navigator.vibrate(p); } catch (e) {} }
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
  const n = 10 + Math.min(c, 10) * 2 + (golden ? 14 : 0);
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
    if (n >= 10) target += Math.sin(G.t * .55) * Math.min(46, (n - 9) * 3.4);
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
    while (tdisp > .16) {
      tdisp -= .16; const tp = G.pieces[G.pieces.length - 1];
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
  ferry.t -= dt;
  if (ferry.t <= 0 && ferry.x < 0) { ferry.x = 0; }
  if (ferry.x >= 0) { ferry.x += dt / 28; if (ferry.x > 1) { ferry.x = -1; ferry.t = rand(14, 26); } }
  gullTimer -= dt;
  if (gullTimer <= 0) { gullTimer = rand(7, 16); const dir = Math.random() < .5 ? 1 : -1; for (let i = 0; i < (Math.random() * 3 | 0) + 1; i++) gulls.push({ x: dir > 0 ? -.1 - i * .05 : 1.1 + i * .05, y: rand(.12, .38) + i * .02, dir, s: rand(.8, 1.2), ph: rand(0, TAU), v: rand(.05, .08) }); if (G.state !== 'paused') Snd.gull(); }
  for (let i = gulls.length - 1; i >= 0; i--) { const gg = gulls[i]; gg.x += gg.dir * gg.v * dt; gg.ph += dt * 9; if (gg.x < -.2 || gg.x > 1.2) gulls.splice(i, 1); }
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
    for (const s of BG.stars) {
      const tw = .55 + .45 * Math.sin(G.t * 1.7 + s[3]);
      ctx.fillStyle = `rgba(255,250,235,${sa * tw * .9})`;
      const y = (s[1] * H + rise * .05) % H;
      ctx.fillRect(s[0] * W, y, s[2], s[2]);
    }
  }
  // güneş / ay
  const sx = P.sx * W + hx * .3, sy = P.sy * H + rise * .12, sr = P.sr * S;
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
    ctx.globalAlpha = .75 - P.night * .25;
    ctx.drawImage(tinted(m, P.cloud), cxp - cw / 2, sy2 - ch / 2, cw, ch);
  }
  ctx.globalAlpha = 1;
  // ufuk
  const hy = H * .6 + rise * .3;
  if (hy < H + 40) {
    const bw = BG.bw / DPR, bh = BG.bh / DPR, ox = (W - bw) / 2 + hx;
    ctx.drawImage(tinted(BG.far, mixc(P.far, P.skyBot, .25)), ox - 20, hy - bh + 6, bw, bh);
    ctx.drawImage(tinted(BG.city, P.city), ox, hy - bh + 2, bw, bh);
    if (P.night > .05) {
      for (const w of BG.wins) {
        const f = .6 + .4 * Math.sin(G.t * .7 + w[2] * 30);
        ctx.fillStyle = `rgba(255,${200 + w[2] * 40 | 0},120,${P.night * f * (w[2] > .3 ? .95 : .4)})`;
        ctx.fillRect(ox + w[0] / DPR, hy - bh + 2 + w[1] / DPR, 1.6 * S, 1.6 * S);
      }
    }
    // deniz
    gr = ctx.createLinearGradient(0, hy, 0, hy + H * .4);
    gr.addColorStop(0, rgb(mixc(P.sea, P.skyBot, .25))); gr.addColorStop(1, rgb(P.seaDeep));
    ctx.fillStyle = gr; ctx.fillRect(0, hy, W, H - hy + 2);
    // parıltı
    for (let i = 0; i < 46; i++) {
      const yy = hy + 4 + Math.pow(i / 46, 1.6) * H * .32;
      const spread = 18 + i * 2.2;
      const xx = sx + Math.sin(i * 12.9 + G.t * (.6 + (i % 5) * .2)) * spread;
      const a = (.25 + .35 * Math.sin(G.t * 2 + i)) * (1 - i / 46);
      ctx.fillStyle = rgb(P.shimmer, Math.max(0, a));
      ctx.fillRect(xx - (6 + i * .5) / 2, yy, 6 + i * .5, 1.2);
    }
    // kız kulesi
    const kw = BG.kk.c.width / DPR, kh = BG.kk.c.height / DPR;
    ctx.drawImage(tinted(BG.kk, mixc(P.city, P.seaDeep, .2)), W * .2 - kw / 2 + hx * 1.2, hy + 22 * S - kh, kw, kh);
    if (P.night > .3) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = P.night * .7; ctx.drawImage(SPR.warm, W * .2 - 6 * S + hx * 1.2, hy + 22 * S - kh + 10 * S, 12 * S, 12 * S); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    // vapur
    if (ferry.x >= 0) {
      const fw = BG.fe.c.width / DPR, fh = BG.fe.c.height / DPR;
      const fx = lerp(-fw, W + fw, ferry.x) + hx, fy = hy + 40 * S;
      ctx.drawImage(tinted(BG.fe, mixc(P.city, P.seaDeep, .1)), fx - fw / 2, fy - fh, fw, fh);
      ctx.fillStyle = rgb(P.shimmer, .25); ctx.fillRect(fx - fw / 2, fy + 1, fw, 1.2);
      if (P.night > .3) { ctx.fillStyle = `rgba(255,220,140,${P.night})`; for (let i = 0; i < 7; i++) ctx.fillRect(fx - fw / 2 + (12 + i * 7) * S, fy - fh + 10.5 * S, 2.2 * S, 1.6 * S); }
    }
  }
  // martılar
  ctx.strokeStyle = rgb(P.bird, .85); ctx.lineWidth = 1.6 * S; ctx.lineCap = 'round';
  for (const gg of gulls) {
    const x = gg.x * W, y = gg.y * H + rise * .2, s = 7 * S * gg.s, f = Math.sin(gg.ph) * .6;
    ctx.beginPath(); ctx.moveTo(x - s, y - s * f * .8); ctx.quadraticCurveTo(x - s * .5, y - s * (.6 + f * .5), x, y); ctx.quadraticCurveTo(x + s * .5, y - s * (.6 + f * .5), x + s, y - s * f * .8); ctx.stroke();
  }
}
function worldTransform(shx, shy) {
  const c = G.cam, k = S * c.z;
  ctx.setTransform(DPR * k, 0, 0, DPR * k, DPR * (W / 2 + shx - c.x * k), DPR * (H / 2 + shy + c.y * k));
}
function drawSprite(sp, x, y) { ctx.drawImage(sp.c, x - sp.ox, y - sp.oy, sp.w, sp.h); }
function drawPiece(p, x, y, sq) {
  // x,y: tabak altı (ekran-aşağı koordinat)
  if (sq) { ctx.save(); ctx.translate(x, y); ctx.scale(1 + sq * .5, 1 - sq); ctx.translate(-x, -y); }
  drawSprite(SPR.contact, x, y - 1);
  drawSprite(p.golden ? SPR.saucerGold : SPR.saucer, x, y);
  drawSprite(p.golden ? SPR.glassGold : SPR.glass[p.tea], x, y - LIFT);
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
  ctx.fillStyle = gr; ctx.fillRect(-1400, -top, 2800, top - front);
  ctx.fillStyle = 'rgba(255,220,170,0.08)'; for (let i = 0; i < 5; i++) ctx.fillRect(-1400, -top + 8 + i * 15, 2800, 1);
  // ön kenar
  gr = ctx.createLinearGradient(0, -front, 0, -front + 13);
  gr.addColorStop(0, '#c98a56'); gr.addColorStop(.3, '#8c4f2c'); gr.addColorStop(1, '#4a2414');
  ctx.fillStyle = gr; ctx.fillRect(-1400, -front, 2800, 13);
  // kilim örtü
  ctx.save();
  const pat = SPR.kilimPattern;
  if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / SPR.tile.s, 1 / SPR.tile.s).translate(0, 0));
  ctx.fillStyle = pat; ctx.translate(0, -front + 13); ctx.fillRect(-1400, 0, 2800, 2600);
  gr = ctx.createLinearGradient(0, 0, 0, 60);
  gr.addColorStop(0, 'rgba(20,6,6,0.55)'); gr.addColorStop(1, 'rgba(20,6,6,0)');
  ctx.fillStyle = gr; ctx.fillRect(-1400, 0, 2800, 60);
  ctx.restore();
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
function render() {
  const P = blendedPhase();
  drawBackground(P);
  const shx = (Math.random() - .5) * G.shake * S, shy = (Math.random() - .5) * G.shake * S;
  worldTransform(shx, shy);
  const bulbs = drawLights(P);
  drawTable();
  drawSprite(SPR.tray, 0, 0);
  // kule
  const n = G.pieces.length;
  const trem = G.state === 'playing' && G.risk > .7 ? (G.risk - .7) / .3 : 0;
  for (let i = 0; i < n; i++) {
    const p = G.pieces[i];
    const age = G.t - p.born;
    const sq = age < .5 ? Math.sin(age * 20) * Math.exp(-age * 9) * .12 : 0;
    const tr = trem && i > n - 4 ? Math.sin(G.t * 42 + i) * trem * .9 : 0;
    drawPiece(p, p.x + tr, -i * PH, sq);
  }
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
  // renk grade
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(gradeOverlay(P.grade), 0, 0, cv.width, cv.height);
  ctx.globalCompositeOperation = 'lighter';
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
    ctx.fillText(T('V A K İ T'), W / 2, ty);
    ctx.font = `italic 600 24px Fraunces, Georgia, serif`; ctx.fillStyle = '#fff6e6';
    ctx.fillText(b.text, W / 2, ty + 24);
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ UI
function show(id, on) { const el = $(id); if (el) el.classList.toggle('hidden', !on); }
const ui = {
  score(v, bump) { const el = $('score'); el.textContent = v; if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 160); } },
  combo(txt) { const el = $('combo'); if (txt) { el.textContent = txt; el.classList.add('show'); } else el.classList.remove('show'); },
};
function pause() {
  if (G.state !== 'playing' && G.state !== 'toppling') return;
  G.prev = G.state; G.state = 'paused'; show('pause', true); Snd.suspend(); if (!document.hidden && document.hasFocus()) PF.gameplayStop();
}
function resume() {
  if (G.state !== 'paused') return;
  G.state = G.prev || 'playing'; show('pause', false); Snd.init(); Snd.resume(); last = performance.now(); PF.gameplayStart();
}
function goHome() {
  PF.gameplayStop();
  show('pause', false); show('over', false); show('hud', false); show('tutorial', false);
  G.state = 'title'; G.phaseFrom = G.phase; demoTower(); G.phaseFrom = 0; G.phaseT = 1;
  $('titleBest').querySelector('b').textContent = G.best;
  show('title', true);
}
PF.bind({ mute(on) { Snd.setForced(on); }, pauseInput(on) { adLock = !!on; } });
function syncMute() { document.body.classList.toggle('muted', Snd.muted); }

window.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest && e.target.closest('button');
  if (btn) return;
  if (G.state === 'paused') return;
  e.preventDefault();
  if (G.state === 'over') return;
  Snd.init();
  tap();
}, { passive: false });
window.addEventListener('pointerup', (e) => {
  if (e.target.closest && e.target.closest('button')) return;
  if (G.state === 'over') { Snd.init(); tap(); }
});
document.querySelectorAll('.soundBtn').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); Snd.init(); Snd.toggle(); syncMute(); Snd.click(); }));
$('pauseBtn').addEventListener('click', (e) => { e.stopPropagation(); pause(); });
$('resumeBtn').addEventListener('click', (e) => { e.stopPropagation(); resume(); });
$('homeBtn').addEventListener('click', (e) => { e.stopPropagation(); goHome(); });
$('againBtn').addEventListener('click', (e) => { e.stopPropagation(); if (adLock) return; Snd.init(); PF.adBreak(startGame); });
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (G.state === 'paused') resume(); else { Snd.init(); tap(); } }
  else if (e.code === 'KeyP' || e.code === 'Escape') { G.state === 'paused' ? resume() : pause(); }
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
  if (fpsT >= 1) {
    fps = frames / fpsT; frames = 0; fpsT = 0;
    // uyarlanabilir çözünürlük
    if (fps < 42 && DPR > 1.5) { slowT++; if (slowT >= 3) { dprCap = 1.5; slowT = 0; resize(); } } else slowT = 0;
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
  perf() { const r = { fps, avgWorkMs: workN ? workSum / workN : 0, dpr: DPR }; workSum = 0; workN = 0; return r; },
  start: () => startGame(), tap: () => tap(), pause, resume, home: goHome, _spr: () => SPR,
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
syncMute();
$('titleBest').querySelector('b').textContent = G.best;
demoTower();
G.cam.y = G.cam.ty = camMinY() - H * .07 / S; G.cam.x = 0;
requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {});
})();
