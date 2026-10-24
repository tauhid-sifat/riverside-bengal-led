/* ============================================================
   MuralBG — "Riverside Bengal" hand-illustrated panorama
   Canvas2D mural engine · 1920x960 (2:1) · palette from logos.

   One artist's continuous landscape: braided river, Padma-style
   cable bridge right, moored country boats + sail left, village
   homes, mango tree, palms and banana on the left bank, cycle
   rickshaw on the near right bank, lotus + paddy terraces,
   two egrets crossing the sky. Centre stays clear for content.

   API: MuralBG.init(canvas); MuralBG.draw(revealT, dt);
   Test lock: index.html?bt=14  (freezes mural + sketch clock)
   ============================================================ */
var MuralBG = (function () {
'use strict';

var W = 1920, H = 960;
var IV  = '252,244,226';   /* ivory ink            */
var GA  = '219,182,109';   /* gold accent          */
var RE  = '201,54,56';    /* red accent           */
var TE  = '105,182,142';  /* vegetation ink       */
var TED = '50,114,88';    /* deep teal water wash */

var QS = (typeof location !== 'undefined' && location.search) || '';
var FIXBT = (QS.match(/[?&]bt=([0-9.]+)/) || [])[1];

var g = null, SSL = null;
var dynStamp = [];

/* ---------------- utils ---------------- */
function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function rv(t, el) {
  var E = ELS[el] || { s: 0, d: 1 };
  return clamp01((t - E.s) / E.d);
}
/* jit a point list ONCE (fixed hand tremor, never flickers) */
function jit(pts, seed, amp) {
  if (seed == null) return pts;
  var r = mulberry(seed), out = [];
  for (var i = 0; i < pts.length; i++)
    out.push([pts[i][0] + (r() - 0.5) * 2 * amp, pts[i][1] + (r() - 0.5) * 2 * amp]);
  return out;
}
/* quadratic-smoothed stroke through jittered points */
function smoothPath(q, closed) {
  var n = q.length, p = new Path2D();
  if (n < 2) { p.closePath(); return p; }
  if (n < 3) { p.moveTo(q[0][0], q[0][1]); p.lineTo(q[1][0], q[1][1]); return p; }
  p.moveTo(q[0][0], q[0][1]);
  if (closed) {
    for (var i = 1; i <= n; i++) {
      var a = q[i % n], b = q[(i + 1) % n];
      p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    p.closePath();
  } else {
    for (var i = 1; i < n - 1; i++) {
      p.quadraticCurveTo(q[i][0], q[i][1],
        (q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2);
    }
    var L = q[n - 1];
    p.quadraticCurveTo(L[0], L[1], L[0], L[1]);
  }
  return p;
}
function lenOf(q) {
  var L = 0;
  for (var i = 1; i < q.length; i++)
    L += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
  return L;
}

/* ---------------- stroke registry ---------------- */
/* each stroke: layer, element key, in-element draw ORDER (ix/cnt) */
var LAYERS, COUNTER;
function SK(q, o) {
  var el = o.el || 'bank';
  COUNTER[el] = COUNTER[el] || 0;
  var s = {
    q: q, p: smoothPath(q, o.closed), len: lenOf(q) * 1.06,
    w: o.w || 2, col: o.col || IV, a: o.a == null ? 0.5 : o.a,
    lay: o.lay || 'mid', el: el, ix: COUNTER[el]++
  };
  LAYERS[s.lay].push(s);
  return s;
}

/* ============================================================
   WORLD LAYOUT (canvas coords)
   ============================================================ */
var BANK = [[-60,606],[160,614],[360,600],[560,630],[780,606],[1000,650],[1200,618],[1420,644],[1640,608],[1980,638]];
var RIVERFILL = BANK.concat([[1980, 980], [-60, 980]]);
var DEEPBAND  = [[-60,760],[300,772],[700,756],[1100,790],[1500,762],[1980,782],[1980,980],[-60,980]];
var HILLS1 = [[-60,558],[110,542],[250,552],[380,540],[500,548]];
var HILLS2 = [[-60,524],[140,510],[300,520],[450,508]];
var HILLR  = [[1340,552],[1500,540],[1680,548],[1880,536],[1980,542]];
var REEDS  = [[1396,604],[1452,600],[1512,606],[1566,601]];

var ELS = {
  bank:   { s: 0.0,  d: 2.4 },
  hills:  { s: 0.8,  d: 1.8 },
  bridge: { s: 2.6,  d: 3.4 },
  vill:   { s: 4.4,  d: 3.4 },
  palms:  { s: 6.0,  d: 3.4 },
  boats:  { s: 7.6,  d: 3.2 },
  rick:   { s: 9.0,  d: 3.0 },
  flora:  { s: 10.4, d: 2.8 }
};

var boPass = 0; /* boat stroke sequencing */
function boRv(rvE, k) { return clamp01((rvE * 1.3 - k * 0.18) / 0.34); }

/* ============================================================
   BUILD
   ============================================================ */
function build() {
  LAYERS = { far: [], mid: [], near: [] };
  COUNTER = {};
  var i, k, q, pts;
  var r = mulberry(31);

  /* ---------- RIVER + BANK ---------- */
  SK(jit(BANK, 11, 1.4), { w: 2.6, a: 0.62, el: 'bank' });
  SK(jit(BANK.map(function (p) { return [p[0], p[1] + 24]; }), 12, 1.6),
     { w: 1.2, a: 0.18, el: 'bank' });
  for (i = 0; i < 26; i++) {
    var fx = 40 + r() * 1820;
    var fb = sampleBank(fx / 1980) || [fx, 620];
    var off = 5 + r() * 15;
    SK([[fx, fb[1] + off], [fx + 3 + r() * 3, fb[1] + off + 1.6]],
       { w: 1.2, a: 0.14, el: 'bank' });
  }

  /* ---------- HILLS ---------- */
  SK(jit(HILLS1, 21, 1.2), { w: 1.5, a: 0.15, lay: 'far', el: 'hills' });
  SK(jit(HILLS2, 22, 1.2), { w: 1.3, a: 0.09, lay: 'far', el: 'hills' });
  SK(jit(HILLR, 23, 1.2),  { w: 1.4, a: 0.10, lay: 'far', el: 'hills' });
  SK(HILLR.map(function (p) { return [p[0], p[1] + 16]; }),
     { w: 1, a: 0.05, lay: 'far', el: 'hills' });

  /* ---------- BRIDGE ---------- */
  var bx = 1730, by = 430;
  function B(p) { return p.map(function (qq) { return [qq[0] + bx, qq[1] + by]; }); }
  SK(jit(B([[-380, 2], [-210, -1], [0, 4], [180, -1], [372, 2]]), 41, 0.9),
     { w: 3.1, a: 0.8, el: 'bridge' });
  SK(jit(B([[-380, -8], [-180, -5], [20, -3], [350, -7]]), 42, 0.7),
     { w: 1.1, a: 0.30, el: 'bridge' });
  SK(jit(B([[-380, 7], [-140, 9], [160, 10], [372, 8]]), 43, 0.7),
     { w: 1.4, a: 0.20, el: 'bridge' });
  SK(jit(B([[-380, 2], [-412, 22], [-444, 62]]), 48, 1),
     { w: 2, a: 0.5, el: 'bridge' });
  SK(jit(B([[-198, 268], [-194, 130], [-187, 10], [-184, -104], [-182, -238]]), 44, 1.1),
     { w: 2.9, a: 0.62, el: 'bridge' });
  SK(jit(B([[-182, 268], [-180, 150], [-177, 60], [-173, -108], [-170, -238]]), 45, 1.1),
     { w: 2.9, a: 0.62, el: 'bridge' });
  SK(B([[-189, -246], [-163, -246]]), { w: 3.2, a: 0.66, el: 'bridge' });
  SK(B([[-193, -40], [-172, -40]]),   { w: 2, a: 0.5, el: 'bridge' });
  SK(jit(B([[62, 268], [64, 150], [66, 50], [68, -118], [70, -258]]), 46, 1.1),
     { w: 2.9, a: 0.62, el: 'bridge' });
  SK(jit(B([[98, 268], [96, 160], [94, 66], [92, -126], [90, -258]]), 47, 1.1),
     { w: 2.9, a: 0.62, el: 'bridge' });
  SK(B([[64, -266], [94, -266]]), { w: 3.2, a: 0.66, el: 'bridge' });
  SK(B([[58, -36], [102, -36]]),  { w: 2, a: 0.5, el: 'bridge' });
  var A0 = [-175, -242], B0 = [79, -262];
  [[-372, -6], [-312, -4], [-250, -2], [-110, -4], [-50, -2], [16, 2]]
    .forEach(function (a) {
      SK(B([A0, [(A0[0] + a[0]) / 2 + 4, (A0[1] - a[1]) / 2 + 3], a]),
         { w: 1.35, col: GA, a: 0.52, el: 'bridge' });
      SK(B([[a[0], a[1]], [a[0], a[1] - 5]]), { w: 1.4, a: 0.4, el: 'bridge' });
    });
  [[-16, 2], [46, 4], [144, -2], [206, 2], [268, 4], [330, 2]]
    .forEach(function (a) {
      SK(B([B0, [(B0[0] + a[0]) / 2 - 3, (B0[1] - a[1]) / 2 + 3], a]),
         { w: 1.35, col: GA, a: 0.52, el: 'bridge' });
      SK(B([[a[0], a[1]], [a[0], a[1] - 5]]), { w: 1.4, a: 0.4, el: 'bridge' });
    });
  SK(jit(B([[-198, 274], [-187, 294], [-196, 314]]), null, 0),
     { w: 1.6, a: 0.09, el: 'bridge' });
  SK(jit(B([[62, 274], [73, 294], [64, 314]]), null, 0),
     { w: 1.6, a: 0.09, el: 'bridge' });

  /* ---------- VILLAGE ---------- */
  drawHousePaths(210, 594, 1.15, false, 51);
  drawHousePaths(368, 606, 0.85, true, 52);
  drawTreePaths(84, 586, 1.0, 61);
  drawBanana(316, 598, 0.85, 71);
  drawBanana(434, 606, 0.62, 72);

  /* ---------- PALMS ---------- */
  drawPalmPaths(452, 600, 1.15, 0, 81);
  drawPalmPaths(46, 610, 0.8, 1, 82);

  /* ---------- PADDY TERRACES ---------- */
  var PAD1 = [[30, 468], [140, 460], [280, 466], [420, 456], [470, 462]];
  [PAD1,
   PAD1.map(function (p) { return [p[0] - 6, p[1] + 26]; }),
   PAD1.map(function (p) { return [p[0] - 12, p[1] + 52]; })]
  .forEach(function (pp, pi) {
    SK(jit(pp, 91 + pi, 1), { w: 1.1, a: 0.15, el: 'flora' });
    var r2 = mulberry(95 + pi);
    for (k = 0; k < 8; k++) {
      var fx = 50 + r2() * 390;
      var fy = pp[0][1] - 4 - r2() * 4;
      SK([[fx, fy], [fx + (r2() - 0.5) * 6, fy - 4 - r2() * 3]],
         { w: 1, a: 0.12, el: 'flora' });
    }
  });

  /* ---------- BOATS (dynamic: pre-jittered points kept) ---------- */
  BOATS.push(mkSailboat(285, 806, 1.12, 101));
  BOATS.push(mkPoleboat(556, 836, 1.0, 111));
  BOATS.push(mkPoleboat(1512, 700, 0.72, 112));

  /* ---------- RICKSHAW + ROAD ---------- */
  drawRickshawPaths(1608, 872, 1.02, 121);
  SK(jit([[1290, 884], [1470, 880], [1660, 878], [1980, 874]], 131, 0.9),
     { w: 1.6, a: 0.26, lay: 'near', el: 'rick' });
  SK(jit([[1290, 893], [1500, 889], [1980, 884]], null, 0),
     { w: 1.1, a: 0.16, lay: 'near', el: 'rick' });
  SK(jit([[1316, 890], [1344, 886]], null, 0), { w: 1, a: 0.13, lay: 'near', el: 'rick' });

  /* ---------- LOTUS + REEDS ---------- */
  drawLotus(96, 856, 1.0, 141);
  drawLotus(232, 878, 0.72, 142);
  drawLotus(1850, 800, 0.8, 143);
  REEDS.forEach(function (rp, ri) {
    for (k = 0; k < 5; k++) {
      var rx = rp[0] + k * 14;
      SK(jit([[rx, rp[1] + 12], [rx + 6, rp[1] - 26 - k * 3]], 151 + ri * 7 + k, 1.1),
         { w: 1.3, col: TE, a: 0.28, el: 'flora' });
    }
  });

  /* finalize per-element counters */
  SLcounts();
  SSL = { fill: smoothPath(jit(RIVERFILL, null, 0), true),
          deep: smoothPath(jit(DEEPBAND, null, 0), true) };
}
var BOATS = [];
function SLcounts() {
  var all = LAYERS.far.concat(LAYERS.mid, LAYERS.near);
  var cnt = {}, seen = {};
  all.forEach(function (s) { cnt[s.el] = (cnt[s.el] || 0) + 1; });
  all.forEach(function (s) {
    s.cnt = cnt[s.el];
    if (seen[s.el] == null) seen[s.el] = 0;
    s.ix = seen[s.el]++;
  });
}
function sampleBank(f) {
  var x = f * 1980 - 60;
  for (var i = 1; i < BANK.length; i++) {
    if (x <= BANK[i][0]) {
      var t = (x - BANK[i - 1][0]) / (BANK[i][0] - BANK[i - 1][0]);
      return [x, BANK[i - 1][1] + (BANK[i][1] - BANK[i - 1][1]) * t];
    }
  }
  return [x, BANK[BANK.length - 1][1]];
}

/* ---------- house ---------- */
function drawHousePaths(x, y, s, flip, j) {
  function T(p) { return p.map(function (qq) { return [x + (flip ? -qq[0] : qq[0]) * s, y + qq[1] * s]; }); }
  SK(jit(T([[-58, -42], [-28, -74], [0, -82], [28, -74], [58, -42]]), j * 3 + 1, 1.4),
     { w: 2.6, a: 0.74, el: 'vill' });
  SK(jit(T([[-58, -42], [-24, -46], [0, -48], [24, -46], [58, -42]]), j * 3 + 2, 1),
     { w: 1.6, a: 0.38, el: 'vill' });
  for (var i = 0; i < 5; i++) {
    var yy = -48 - i * 6.4, xa = 40 - i * 5, xb = -40 + i * 5;
    SK(jit(T([[xa, yy], [0, yy - 6], [xb, yy]]), j * 3 + 3, 0.8),
       { w: 0.9, a: 0.17, el: 'vill' });
  }
  SK(jit(T([[-44, -42], [-42, -2]]), j * 3 + 4, 0.8), { w: 2, a: 0.52, el: 'vill' });
  SK(jit(T([[44, -42], [46, -2]]), j * 3 + 5, 0.8),   { w: 2, a: 0.52, el: 'vill' });
  SK(jit(T([[-47, -2], [49, -2]]), j * 3 + 6, 0.7),   { w: 1.6, a: 0.4, el: 'vill' });
  SK(jit(T([[-16, -2], [-16, -30], [-2, -30], [-2, -2]]), j * 3 + 7, 0.8),
     { w: 1.7, a: 0.55, el: 'vill' });
  SK([[x - 13 * s, y - 2 * s], [x - 13 * s, y - 26 * s]], { w: 1, a: 0.26, el: 'vill' });
  SK(jit(T([[16, -34], [28, -34], [28, -22], [16, -22]]), j * 3 + 8, 0.7),
     { w: 1.3, a: 0.45, el: 'vill' });
  SK([[x + 20 * s, y - 30 * s], [x + 26 * s, y - 25 * s]], { w: 0.9, a: 0.25, el: 'vill' });
  SK([[x + 50 * s, y - 2 * s], [x + 50 * s, y - 20 * s]], { w: 1.2, a: 0.36, el: 'vill' });
  SK([[x + 62 * s, y - 2 * s], [x + 62 * s, y - 20 * s]], { w: 1.2, a: 0.36, el: 'vill' });
  SK([[x + 45 * s, y - 20 * s], [x + 67 * s, y - 20 * s]], { w: 1.2, a: 0.36, el: 'vill' });
  SK([[x - 40 * s, y - 17 * s], [x - 22 * s, y - 17 * s]], { w: 0.9, a: 0.18, el: 'vill' });
}

/* ---------- mango / banyan ---------- */
function drawTreePaths(x, y, s, j) {
  function T(p) { return p.map(function (qq) { return [x + qq[0] * s, y + qq[1] * s]; }); }
  SK(jit(T([[0, 0], [3, -18], [1, -34], [6, -50]]), j, 1.2), { w: 4.4, a: 0.7, el: 'vill' });
  SK(jit(T([[-14, 0], [-7, -8], [-2, -2]]), null, 0), { w: 1.9, a: 0.44, el: 'vill' });
  SK(jit(T([[12, 0], [7, -10], [2, -3]]), null, 0),   { w: 1.9, a: 0.44, el: 'vill' });
  SK(jit(T([[-52, -84], [-28, -108], [4, -118], [34, -106], [52, -84],
            [40, -66], [12, -58], [-18, -62], [-44, -68]]), j + 1, 1.6),
     { w: 2.2, a: 0.66, el: 'vill', closed: true });
  SK(jit(T([[-30, -92], [-12, -104], [8, -100], [22, -88], [6, -78], [-16, -82]]),
          j + 2, 1.4),
     { w: 1.4, a: 0.2, el: 'vill', closed: true });
  SK(jit(T([[8, -80], [24, -92], [38, -84], [30, -70], [12, -68]]), j + 3, 1.4),
     { w: 1.4, a: 0.16, el: 'vill', closed: true });
  var r = mulberry(j + 4);
  for (var k = 0; k < 9; k++) {
    var hx = -40 + r() * 76, hy = -64 - r() * 46;
    SK([[x + hx * s, y + hy * s],
        [x + (hx + Math.sin(r() * 6) * 9) * s, y + (hy - 7) * s]],
       { w: 0.9, a: 0.13, el: 'vill' });
  }
  [-18, 4, 16].forEach(function (rx, kx) {
    SK(jit(T([[rx, -58], [rx - 2, -40], [rx + 2, -22], [rx, -9]]), j + 5 + kx, 0.8),
       { w: 1.2, a: 0.26, el: 'vill' });
    SK(jit(T([[rx - 3, -56], [rx - 1, -40], [rx + 3, -20], [rx + 1, -12]]), j + 8 + kx, 0.7),
       { w: 0.8, a: 0.13, el: 'vill' });
  });
}

/* ---------- banana ---------- */
function drawBanana(x, y, s, j) {
  SK(jit([[x, y], [x + 2 * s, y - 14 * s], [x, y - 28 * s]], j, 1),
     { w: 3.6, a: 0.62, el: 'vill' });
  [[-40, -66], [-6, -76], [30, -64], [12, -50]].forEach(function (L, li) {
    var sp = jit([[x, y - 26 * s],
                  [x + L[0] * 0.5 * s, y + L[1] * 0.5 * s - 4],
                  [x + L[0] * s, y + L[1] * s]], j + 1 + li, 1.2);
    SK(sp, { w: 1.4, col: TE, a: 0.48, el: 'vill' });
    var bl = jit([[x, y - 26 * s],
                  [x + L[0] * 0.5 * s, y + (L[1] * 0.5 - 10) * s],
                  [x + L[0] * s, y + (L[1] - 3) * s],
                  [x + L[0] * 0.5 * s, y + (L[1] * 0.5 + 9) * s],
                  [x, y - 26 * s]], j + 4 + li, 1.4);
    SK(bl, { w: 1.1, col: TE, a: 0.16, el: 'vill', closed: true });
  });
}

/* ---------- coconut palm ---------- */
function drawPalmPaths(x, y, s, j) {
  var cx0 = x + 20 * s, cy0 = y - 196 * s;
  SK(jit([[x, y], [x + 4 * s, y - 50 * s], [x + 10 * s, y - 98 * s], [x + 16 * s, y - 150 * s], [x + 20 * s, y - 196 * s]],
         j, 1.4),
     { w: 3.2, a: 0.72, el: 'vill' });
  for (var i = 0; i < 9; i++) {
    var tt = (i + 0.5) / 9;
    SK([[x + tt * 20 * s - 4 * s, y - tt * 196 * s],
        [x + tt * 20 * s + 4 * s, y - tt * 196 * s + 2 * s]],
       { w: 1, a: 0.22, el: 'palms' });
  }
  /* 7 hand-placed frond tips (relative to crown base): mostly
     horizontal arcs that droop at the ends — coconut silhouette */
  var TIPS = [[76, -34], [66, -10], [46, 8], [16, 16], [-18, 12], [-44, -2], [-64, -22]];
  var perps = [-14, -12, -10, -6, -10, -12, -14];
  for (var f = 0; f < 7; f++) {
    var T3 = TIPS[f], hi = perps[f], P3 = [T3[0], T3[1]];
    var spine = [
      [cx0, cy0],
      [cx0 + P3[0] * 0.42 - hi * 0.5, cy0 + P3[1] * 0.42 - hi * 0.42],
      [cx0 + P3[0] * 0.82 - hi * 0.7, cy0 + P3[1] * 0.82],
      [cx0 + P3[0] + 4, cy0 + P3[1] + 10]
    ];
    SK(jit(spine, j + 2 + f, 1.2),
       { w: 1.9, col: TE, a: 0.6, el: 'palms' });
    var rr = mulberry(j * 7 + 3 + f);
    var droop = 1.15;
    var spx = spine[3][0] - spine[0][0], spy = spine[3][1] - spine[0][1];
    var spl = Math.max(1, Math.hypot(spx, spy));
    var ux = spx / spl, uy = spy / spl;
    for (var lf = 1; lf <= 5; lf++) {
      var fl = lf / 6;
      var lux = ux * fl * spl, luy = uy * fl * spl;
      var pax0 = cx0 - hi * 0.2 + lux - hi * (1 - fl) * 0.3;
      var pay0 = cy0 + luy;
      var drop = 7 + lf * 1.4;
      SK(jit([[pax0, pay0],
              [pax0 + ux * 5 - uy * droop * 0.28 * drop,
               pay0 + uy * 5 + ux * droop * 0.28 * drop]],
             null, 0),
         { w: 0.9, col: TE, a: 0.3, el: 'palms' });
      SK(jit([[pax0, pay0],
              [pax0 - ux * 5 + uy * -(0.22 * drop),
               pay0 + uy * 5 - ux * -(0.22 * drop)]],
             null, 0),
         { w: 0.9, col: TE, a: 0.26, el: 'palms' });
    }
  }
  SK([[x + 22 * s, y - 190 * s], [x + 28 * s, y - 200 * s]], { w: 2.2, col: GA, a: 0.5, el: 'palms' });
  SK([[x + 31 * s, y - 186 * s], [x + 34 * s, y - 193 * s]], { w: 1.5, col: GA, a: 0.4, el: 'palms' });
}

/* ================= BOATS (dynamic, pre-jittered) ============ */
function mkSailboat(x, y, s, j) {
  function T(p) { return p.map(function (qq) { return [x + qq[0] * s, y + qq[1] * s]; }); }
  var strokes = [
    { q: T(jit([[-150, -24], [-95, -13], [-30, -8], [40, -8], [100, -16], [152, -34]], 101, 1.3)),
      w: 2.4, a: 0.58 },
    { q: T(jit([[-150, -24], [-152, -6], [-110, -4], [30, -4], [110, -12], [152, -34]], 102, 1)),
      w: 1.7, a: 0.46 },
    { q: T(jit([[-140, -14], [-40, -10], [60, -12], [130, -22]], 103, 0.8)),
      w: 0.9, a: 0.16 },
    { q: T(jit([[-142, -18], [-60, -13], [50, -16], [126, -26]], 104, 0.8)),
      w: 0.9, a: 0.12 },
    { q: T(jit([[146, -32], [156, -40], [160, -35]], null, 0)), w: 1.5, col: GA, a: 0.55 },
    { q: T(jit([[-24, -16], [-38, -60], [-46, -120]], 105, 1)), w: 1.7, a: 0.5 },
    { q: T(jit([[-99, -14], [-104, -34], [-111, -52]], 106, 1)), w: 1.6, a: 0.5 },
    { q: T(jit([[-104, -38], [-108, -44]], null, 0)), w: 0.9, a: 0.4 }
  ];
  return { x: x, y: y, s: s, kind: 'sail', strokes: strokes };
}
function mkPoleboat(x, y, s, j) {
  function T(p) { return p.map(function (qq) { return [x + qq[0] * s, y + qq[1] * s]; }); }
  var strokes = [
    { q: T(jit([[-118, -16], [-60, -8], [20, -8], [80, -14], [112, -24]], 111, 1.2)),
      w: 2.1, a: 0.52 },
    { q: T(jit([[-118, -16], [-116, -2], [-60, -2], [60, -4], [112, -24]], 112, 0.9)),
      w: 1.5, a: 0.42 },
    { q: T(jit([[-104, -9], [90, -15]], null, 0)), w: 0.9, a: 0.15 },
    { q: T(jit([[20, -8], [24, -62], [38, -122]], 113, 1.3)),
      w: 1.1, col: TE, a: 0.3 },
    { q: T(jit([[-62, -8], [-72, -40], [-84, -66]], 114, 1)), w: 1.3, a: 0.28 },
    { q: T(jit([[36, -120], [44, -40]], null, 0)), w: 0.9, col: TE, a: 0.2 }
  ];
  return { x: x, y: y, s: s, kind: 'pole', strokes: strokes };
}
function drawBoats(T, offX, aEnv) {
  BOATS.forEach(function (B2, bi) {
    var rvE = rv(T, 'boats');
    var bob = Math.sin(T * 0.9 + bi * 1.9) * 2.2;
    for (var k = 0; k < B2.strokes.length; k++) {
      var S = B2.strokes[k];
      var local = boRv(rvE, S.ixK == null ? (S.ixK = k) : S.ixK, k);
      void k;
      if (local <= 0.02 || aEnv <= 0.01) continue;
      dyn(S.col || IV, S.w, S.a * Math.min(1, local) * aEnv);
      var q = S.q;
      if (bob) {
        q = q.map(function (p) { return [p[0], p[1] + bob]; });
      }
      g.stroke(smoothPath(q, false));
    }
    /* sail (sailboat only) */
    if (B2.kind === 'sail' && rvE > 0.6) {
      drawSailLive(T, B2, Math.min(1, (rvE - 0.6) / 0.4) * aEnv);
    }
    /* reflection */
    dyn(IV, 1.2, 0.07 * aEnv);
    var pts = [];
    for (var x = B2.x - 125 * B2.s; x <= B2.x + 130 * B2.s; x += 34) {
      pts.push([x, B2.y + 11 + Math.sin(T * 1.1 + x * 0.05 + bi) * 1.8]);
    }
    dynPath(pts.slice(0, Math.ceil(pts.length * rvE)));
  });
}
/* sail with billow, drawn live */
function drawSailLive(T, B2, a) {
  if (a <= 0.01) return;
  var x = B2.x, y = B2.y, s = B2.s;
  var bl = Math.sin(T * 0.5) * 3.2 * s;
  var yard = [
    [x + (-46) * s, y + (-120) * s],
    [x + (14 + bl) * s, y + (-102) * s],
    [x + (80 + bl * 1.4) * s, y + (-62) * s],
    [x + (138) * s, y + (-36) * s]
  ];
  var foot = [
    [x + (138) * s, y + (-36) * s],
    [x + (76) * s, y + (-30) * s],
    [x + (-22) * s, y + (-15) * s],
    [x + (-46) * s, y + (-120) * s]
  ];
  dyn(GA, 1.6, 0.72 * a);
  dynPath(jit(yard, null, 0));
  dyn(IV, 1.3, 0.5 * a);
  dynPath(jit(foot, null, 0));
  /* reef lines */
  dyn(IV, 0.9, 0.25 * a);
  dynPath([[x + (-30) * s, y + (-92) * s], [x + (60 + bl) * s, y + (-70) * s], [x + (110) * s, y + (-48) * s]]);
  /* pennant */
  var fl = Math.sin(T * 1.7) * 3;
  dyn(RE, 1.3, 0.55 * a);
  dynPath([[x + (-44) * s, y + (-122) * s], [x + (-60 + fl) * s, y + (-126) * s], [x + (-56 + fl) * s, y + (-116) * s]]);
}

/* ---------------- per-frame dyn primitives ---------------- */
function dyn(col, w, a) {
  g.strokeStyle = 'rgba(' + col + ',' + a + ')';
  g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.setLineDash([]);
}
function dynPath(q) {
  if (q.length < 2) return;
  g.beginPath();
  g.moveTo(q[0][0], q[0][1]);
  for (var i = 1; i < q.length - 1; i++) {
    g.quadraticCurveTo(q[i][0], q[i][1],
      (q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2);
  }
  var L = q[q.length - 1];
  g.quadraticCurveTo(L[0], L[1], L[0], L[1]);
  g.stroke();
}

/* currents */
var CURR = [
  { y: 676, x0: 150, x1: 570,  am: 2.6, wl: 220, sp: 0.42, a: 0.11, w: 1.5 },
  { y: 704, x0: 90,  x1: 640,  am: 3,   wl: 270, sp: 0.35, a: 0.09, w: 1.8 },
  { y: 748, x0: 700, x1: 1240, am: 2.6, wl: 250, sp: 0.31, a: 0.07, w: 1.4 },
  { y: 786, x0: 1310, x1: 1900, am: 3,  wl: 280, sp: 0.37, a: 0.09, w: 1.7 },
  { y: 868, x0: 620, x1: 1320, am: 3.4, wl: 320, sp: 0.25, a: 0.07, w: 1.5 },
  { y: 908, x0: 60,  x1: 780,  am: 3.6, wl: 340, sp: 0.22, a: 0.08, w: 1.8 },
  { y: 936, x0: 1160, x1: 1960, am: 3.8, wl: 360, sp: 0.2, a: 0.08, w: 1.8 }
];
function drawCurrents(T, a) {
  if (a <= 0.01) return;
  CURR.forEach(function (C, ci) {
    dyn(IV, C.w, C.a * a);
    var pts = [];
    for (var x = C.x0; x <= C.x1; x += 44) {
      pts.push([x, C.y
        + Math.sin(x / C.wl * 6.283 + T * C.sp + ci) * C.am
        + Math.sin(x / (C.wl * 0.37) + T * C.sp * 2.3 + ci * 2) * 1.1]);
    }
    dynPath(pts);
  });
}

/* smoke */
var SMOKEO = { x: 210, y: 492 };
function drawSmoke(T, a) {
  if (a <= 0.01) return;
  var base = [[SMOKEO.x, SMOKEO.y]];
  for (var i = 1; i <= 5; i++) {
    base.push([SMOKEO.x + 2 + Math.sin(T * 0.75 + i * 1.05) * (3 + i * 2.4) + i * 2,
               SMOKEO.y - i * 12 - Math.sin(T * 0.5 + i) * 2.5]);
  }
  dyn(IV, 1.2, 0.18 * a);
  dynPath(base);
  dyn(IV, 0.7, 0.08 * a);
  dynPath(base.slice(1));
}

/* egrets */
function drawEgret(T, x, y, s, a, ph) {
  if (a <= 0.01) return;
  var flap = Math.cos(T * 2.3 + ph), wu = flap * 14 * s;
  dyn(IV, 1.9, a);
  dynPath([[x - 16 * s, y + 2 * s], [x - 4 * s, y + 7 * s], [x + 8 * s, y + 4 * s], [x + 16 * s, y - 3 * s]]);
  dyn(IV, 1.6, a * 0.85);
  dynPath([[x + 8 * s, y + 4 * s], [x + 16 * s, y + 1 * s], [x + 22 * s, y - 6 * s], [x + 26 * s, y - 9 * s]]);
  dyn(IV, 1.2, a * 0.8);
  dynPath([[x + 26 * s, y - 9 * s], [x + 36 * s, y - 6 * s]]);
  g.fillStyle = 'rgba(' + IV + ',' + a * 0.9 + ')';
  g.beginPath(); g.arc(x + 24 * s, y - 8 * s, 2 * s, 0, 6.283); g.fill();
  dyn(IV, 1, a * 0.45);
  dynPath([[x + 10 * s, y + 6 * s], [x + 2 * s, y + 11 * s], [x - 8 * s, y + 15 * s]]);
  dyn(IV, 1.8, a);
  dynPath([[x + 2 * s, y - 2 * s], [x - 6 * s, y - 8 * s - wu * 0.5], [x - 18 * s, y - 15 * s - wu]]);
  dyn(IV, 1.2, a * 0.55);
  dynPath([[x - 18 * s, y - 15 * s - wu], [x - 6 * s, y - 4 * s - wu * 0.2], [x + 6 * s, y]]);
}
var EG = [
  { y0: 234, sp: 40, off: 0,  s: 1.15, a: 0.5 },
  { y0: 308, sp: 31, off: 33, s: 0.85, a: 0.34 }
];
function drawBirds(T, a) {
  if (a <= 0.01) return;
  EG.forEach(function (E, i) {
    var arm = W + 420;
    var tt = (T + E.off) * E.sp;
    var x = ((tt % arm) + arm) % arm - 210;
    var y = E.y0 + Math.sin(T * 0.16 + i * 2) * 26;
    var edge = Math.min(1, Math.min((x + 210) / 150, (W + 210 - x) / 150));
    drawEgret(T, x, y, E.s, E.a * edge * a, i * 1.4);
  });
}

/* ---------------- rickshaw (uses registry) ---------------- */
function drawRickshawPaths(x, y, s, j) {
  function T(p) { return p.map(function (qq) { return [x + qq[0] * s, y + qq[1] * s]; }); }
  var k;
  /* wheels: front (0,-24) r24, rear (110,-26) r26 — cleft 10-pt circles + spokes */
  function WHEEL(wx, wy, wr, jw, nsp) {
    var cpts = [];
    for (var k3 = 0; k3 < 10; k3++) {
      var ang = k3 / 10 * 6.283 - 0.4;
      cpts.push([x + (wx + Math.cos(ang) * wr) * s, y + (wy + Math.sin(ang) * wr) * s]);
    }
    SK(cpts, { w: 2.2, a: 0.66, lay: 'near', el: 'rick' });
    for (var k4 = 0; k4 < nsp; k4++) {
      var ang4 = k4 / nsp * 6.283 + 0.3;
      SK(jit(T([[wx + Math.cos(ang4) * wr * 0.16, wy + Math.sin(ang4) * wr * 0.16],
                [wx + Math.cos(ang4) * wr * 0.85, wy + Math.sin(ang4) * wr * 0.85]]), jw + k4, 0.6),
         { w: 1, a: 0.4, lay: 'near', el: 'rick' });
    }
  }
  WHEEL(0, -24, 24, 122, 8);
  WHEEL(110, -26, 26, 123, 9);
  SK(jit(T([[30, -48], [48, -90], [78, -106], [108, -96], [136, -64], [150, -46], [154, -38]]), j, 1),
     { w: 2.6, a: 0.74, lay: 'near', el: 'rick' });
  SK(jit(T([[150, -46], [136, -46], [108, -50], [78, -52], [48, -52], [30, -48]]), j + 1, 0.8),
     { w: 1.5, a: 0.36, lay: 'near', el: 'rick' });
  SK(jit(T([[46, -58], [78, -92]]), null, 0), { w: 0.9, a: 0.18, lay: 'near', el: 'rick' });
  SK(jit(T([[70, -60], [100, -88]]), null, 0), { w: 0.9, a: 0.18, lay: 'near', el: 'rick' });
  for (k = 0; k < 6; k++) {
    var sx = 32 + k * 20;
    SK(jit(T([[sx, -50], [sx + 4, -43], [sx + 8, -50]]), null, 0),
       { w: 1.1, col: GA, a: 0.32, lay: 'near', el: 'rick' });
  }
  SK(jit(T([[84, -78], [90, -70], [96, -78], [90, -86]]), null, 0),
     { w: 1.1, col: RE, a: 0.45, lay: 'near', el: 'rick' });
  SK(jit(T([[100, -74], [106, -66], [112, -74], [106, -82]]), null, 0),
     { w: 1.1, col: GA, a: 0.35, lay: 'near', el: 'rick' });
  SK(jit(T([[56, -46], [56, -4]]), null, 0), { w: 1.7, a: 0.36, lay: 'near', el: 'rick' });
  SK(jit(T([[124, -46], [124, -6]]), null, 0), { w: 1.7, a: 0.36, lay: 'near', el: 'rick' });
  SK(jit(T([[30, -44], [34, -6]]), null, 0), { w: 1.7, a: 0.36, lay: 'near', el: 'rick' });
  SK(jit(T([[30, -6], [124, -8]]), null, 0), { w: 1.5, a: 0.32, lay: 'near', el: 'rick' });
  SK(jit(T([[0, -24], [26, -22], [56, -24]]), 121 + 9, 0.9),
     { w: 1.6, a: 0.4, lay: 'near', el: 'rick' });
  SK(jit(T([[30, -6], [80, -8], [124, -6]]), j + 2, 0.8),
     { w: 1.4, a: 0.3, lay: 'near', el: 'rick' });
}

/* ---------- lotus ---------- */
function drawLotus(x, y, s, j) {
  function T(p) { return p.map(function (qq) { return [x + qq[0] * s, y + qq[1] * s]; }); }
  /* pad: cleft circle */
  SK(jit(T([[-18, -6], [-30, -12], [-34, -20], [-28, -26], [-16, -26], [-8, -18], [-12, -10]]),
         j, 1), { w: 1.2, col: TE, a: 0.32, el: 'flora', closed: true });
  SK(jit(T([[-24, -10], [-22, -16], [-20, -20]]), null, 0),
     { w: 0.8, col: TE, a: 0.16, el: 'flora' });
  /* bloom: five arching petals */
  for (var k2 = -2; k2 <= 2; k2++) {
    var bx2 = k2 * 6, by2 = -8;
    var tipx = k2 * 12, tipy = by2 - 34 + (k2 < 0 ? -k2 * 8 : k2 * 6) - (k2 ? 0 : 8);
    SK(jit(T([[bx2 - 4, by2 + 2],
              [bx2 - 5 + k2, by2 - 12],
              [tipx - 3, tipy],
              [tipx + 1, tipy - 2],
              [bx2 + 5, by2 - 10],
              [bx2 + 4, by2 + 2]]),
            j + 2 + k2, 0.8),
       { w: 1.25, col: RE, a: 0.55, el: 'flora', closed: true });
  }
  SK(jit(T([[-4, -40], [-2, -48]]), null, 0), { w: 1.4, col: GA, a: 0.5, el: 'flora' });
  /* bud */
  SK(jit(T([[34, 0], [32, -16], [38, -26], [42, -18], [40, -2]]), j + 5, 0.8),
     { w: 1, col: TE, a: 0.28, el: 'flora' });
  /* water reflection */
  dynStamp.push(T([[[-6, 0], [0, 3], [8, 1]], [[-20, 4], [-6, 7], [10, 5]]]));
}

/* ============================================================
   MASTER DRAW
   ============================================================ */
function draw(T, dt) {
  if (FIXBT) T = parseFloat(FIXBT);
  g.clearRect(0, 0, W, H);
  var grd = g.createRadialGradient(960, 470, 150, 960, 480, 1080);
  grd.addColorStop(0, '#082015');
  grd.addColorStop(0.55, '#041309');
  grd.addColorStop(1, '#020905');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);

  /* river washes, staged */
  var rb = rv(T, 'bank');
  if (rb > 0) {
    g.fillStyle = 'rgba(' + TED + ',' + (0.10 * rb) + ')';
    g.fill(SSL.fill);
    g.fillStyle = 'rgba(' + TED + ',' + (0.05 * rb) + ')';
    g.fill(SSL.deep);
  }

  var farX = Math.sin(T * 0.05) * 6,
      midX = Math.sin(T * 0.07 + 1) * 12,
      nearX = Math.sin(T * 0.09 + 2) * 18;

  /* registry pass per layer */
  ['far', 'mid', 'near'].forEach(function (lay) {
    var off = lay === 'far' ? farX : lay === 'mid' ? midX : nearX;
    g.save(); g.translate(off, 0);
    var list = LAYERS[lay];
    for (var i = 0; i < list.length; i++) {
      var S = list[i];
      var rvE = rv(T, S.el);
      if (rvE <= 0) continue;
      var local = clamp01((rvE * 1.34 - (S.ix / S.cnt) * 1.1) / 0.3);
      if (local <= 0.02) continue;
      var gain = lay === 'far' ? 1.7 : lay === 'mid' ? 1.5 : 1.35;
      g.strokeStyle = 'rgba(' + S.col + ',' + Math.min(0.95, S.a * gain * Math.min(1, local)) + ')';
      g.lineWidth = S.w;
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.setLineDash(local < 1 ? [S.len * local, 1e6] : []);
      g.stroke(S.p);
    }
    g.setLineDash([]);
    g.restore();
  });

  /* life */
  var dynA = clamp01((T - 12.6) / 3);
  if (dynA > 0.01) {
    dynStamp.splice(0).forEach(function (dq) {
      dyn(TE, 1, 0.12 * dynA);
      dq.forEach(function (pts) { dynPath(pts); });
    });
    g.save(); g.translate(midX, 0);
    drawCurrents(T, dynA);
    drawBoats(T, 0, dynA);
    g.restore();
    g.save(); g.translate(farX, 0);
    drawSmoke(T, dynA);
    drawBirds(T, dynA);
    g.restore();
  }
}

return { init: init, draw: draw };
function init(canvas) { g = canvas.getContext('2d'); build(); }
})();
