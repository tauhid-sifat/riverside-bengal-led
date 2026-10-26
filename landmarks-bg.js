/* ============================================================
   LandmarkBG — a quiet line-art panorama of Bangladesh
   1920x960 · Canvas2D · zero dependencies

   Six national landmarks in three parallax layers, drawn as
   precise ivory-and-gold line work on deep ink green.
   A one-time pen reveal, then endless slow drift.

   API: LandmarkBG.init(canvas); LandmarkBG.draw(T, dt);
   Test lock: index.html?bt=14  (freezes the background clock)
   ============================================================ */
var LandmarkBG = (function () {
'use strict';

var W = 1920, H = 960;
var IV  = '252,244,226';
var GA  = '219,182,109';
var RE  = '201,54,56';
var TE  = '105,182,142';

var QS = (typeof location !== 'undefined' && location.search) || '';
var FIXBT = (QS.match(/[?&]bt=([0-9.]+)/) || [])[1];
var RM = typeof matchMedia === 'function' &&
         matchMedia('(prefers-reduced-motion: reduce)').matches;

var g = null;
var GROUPS = [], DOODLES = [], MIST = [];

/* ---------------- utils ---------------- */
function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

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
function sharpPath(q, closed) {
  var p = new Path2D();
  if (!q.length) return p;
  p.moveTo(q[0][0], q[0][1]);
  for (var i = 1; i < q.length; i++) p.lineTo(q[i][0], q[i][1]);
  if (closed) p.closePath();
  return p;
}
function lenOf(q) {
  var L = 0;
  for (var i = 1; i < q.length; i++)
    L += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
  return L;
}
function pointAt(q, dist) {
  var d = 0;
  for (var i = 1; i < q.length; i++) {
    var seg = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
    if (d + seg >= dist) {
      var t = seg ? (dist - d) / seg : 0;
      return [q[i - 1][0] + (q[i][0] - q[i - 1][0]) * t,
              q[i - 1][1] + (q[i][1] - q[i - 1][1]) * t];
    }
    d += seg;
  }
  return q[q.length - 1];
}
function circlePts(cx, cy, r, n) {
  var pts = [];
  for (var i = 0; i < n; i++) {
    var a = i / n * 6.283;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/* ---------------- stroke registry ---------------- */
var CUR = null;
function G(name, layer, cx, base, start, dur, alpha, fn) {
  var group = { name: name, layer: layer, cx: cx, base: base,
                start: start, dur: dur, alpha: alpha, strokes: [], glow: null };
  GROUPS.push(group);
  CUR = group;
  fn(add, cx, base);
  for (var i = 0; i < group.strokes.length; i++) {
    group.strokes[i].ord = i;
    group.strokes[i].cnt = group.strokes.length;
  }
  var minX = Infinity, maxX = -Infinity;
  for (var j = 0; j < group.strokes.length; j++) {
    var q = group.strokes[j].q;
    for (var k = 0; k < q.length; k++) {
      if (q[k][0] < minX) minX = q[k][0];
      if (q[k][0] > maxX) maxX = q[k][0];
    }
  }
  group.minX = minX;
  group.maxX = maxX;
  CUR = null;
}
function add(q, o) {
  o = o || {};
  var st = {
    q: q,
    p: o.sharp ? sharpPath(q, o.closed) : smoothPath(q, o.closed),
    len: lenOf(q) * 1.04,
    w: o.w || 1.2,
    col: o.col || IV,
    a: o.a == null ? 0.45 : o.a,
    fill: o.fill || 0
  };
  CUR.strokes.push(st);
}

/* ============================================================
   LANDMARKS
   ============================================================ */

/* National Martyrs' Memorial, Savar — seven folded fins */
function drawMartyrs(a, cx, base) {
  var w = 24, gap = 8;
  var H = [70, 110, 150, 190, 150, 110, 70];
  var total = 7 * w + 6 * gap;
  var x0 = cx - total / 2;
  for (var i = 0; i < 7; i++) {
    var x = x0 + i * (w + gap);
    var h = H[i];
    a([[x, base], [x + w / 2, base - h], [x + w, base]],
      { sharp: true, closed: true, w: 1.2, a: 0.55, fill: 0.03 });
    a([[x + w / 2, base - 4], [x + w / 2, base - h + 8]],
      { sharp: true, w: 0.8, a: 0.22 });
    a([[x + w / 2, base - h + 10], [x + w * 0.78, base - 10]],
      { sharp: true, w: 0.7, a: 0.12 });
  }
  a([[x0 - 12, base], [x0 + total + 12, base]],
    { sharp: true, w: 2, a: 0.5 });
  a([[x0 - 20, base + 7], [x0 + total + 20, base + 7]],
    { sharp: true, w: 1.4, a: 0.3 });
  a([[x0 + 10, base + 16], [x0 + total * 0.42, base + 16]],
    { sharp: true, w: 1, a: 0.18 });
  a([[x0 + total * 0.58, base + 16], [x0 + total - 10, base + 16]],
    { sharp: true, w: 1, a: 0.18 });
}

/* Shaheed Minar, Dhaka — central column, flanking walls, red sun */
function drawShaheed(a, cx, base) {
  var s = 1;
  a([[cx - 46 * s, base], [cx - 40 * s, base - 44 * s],
     [cx - 18 * s, base - 62 * s], [cx, base - 66 * s],
     [cx + 18 * s, base - 62 * s], [cx + 40 * s, base - 44 * s],
     [cx + 46 * s, base]],
    { w: 1, a: 0.35, fill: 0.02 });
  a([[cx - 4 * s, base], [cx - 3 * s, base - 118 * s],
     [cx - 1 * s, base - 126 * s], [cx + 1 * s, base - 126 * s],
     [cx + 3 * s, base - 118 * s], [cx + 4 * s, base]],
    { sharp: true, w: 1.5, a: 0.55, fill: 0.03 });
  a([[cx - 4 * s, base - 126 * s], [cx, base - 134 * s],
     [cx + 4 * s, base - 126 * s]],
    { w: 1.2, a: 0.4 });
  a([[cx - 38 * s, base], [cx - 37 * s, base - 54 * s],
     [cx - 31 * s, base - 54 * s], [cx - 30 * s, base]],
    { sharp: true, w: 1.2, a: 0.45, fill: 0.025 });
  a([[cx + 30 * s, base], [cx + 31 * s, base - 54 * s],
     [cx + 37 * s, base - 54 * s], [cx + 38 * s, base]],
    { sharp: true, w: 1.2, a: 0.45, fill: 0.025 });
  a([[cx - 52 * s, base], [cx + 52 * s, base]],
    { sharp: true, w: 2, a: 0.5 });
  a([[cx - 58 * s, base + 6 * s], [cx + 58 * s, base + 6 * s]],
    { sharp: true, w: 1.2, a: 0.25 });
  a(circlePts(cx, base - 86 * s, 6 * s, 24),
    { closed: true, w: 1.2, col: RE, a: 0.55, fill: 0.3 });
}

/* Lalbagh Fort, Dhaka — Bibi Pari's tomb inside the fort wall */
function drawLalbagh(a, cx, base) {
  a([[cx - 80, base], [cx + 80, base]], { sharp: true, w: 2, a: 0.45 });
  a([[cx - 80, base], [cx - 80, base - 18]], { sharp: true, w: 1.2, a: 0.35 });
  a([[cx + 80, base], [cx + 80, base - 18]], { sharp: true, w: 1.2, a: 0.35 });
  a([[cx - 16, base], [cx - 16, base - 26], [cx - 8, base - 34],
     [cx, base - 36], [cx + 8, base - 34], [cx + 16, base - 26],
     [cx + 16, base]],
    { w: 1.2, a: 0.4 });
  a([[cx - 70, base - 18], [cx - 70, base - 52],
     [cx + 70, base - 52], [cx + 70, base - 18]],
    { sharp: true, w: 1.2, a: 0.5, fill: 0.03 });
  a([[cx - 42, base - 52], [cx - 38, base - 72], [cx - 24, base - 88],
     [cx, base - 94], [cx + 24, base - 88], [cx + 38, base - 72],
     [cx + 42, base - 52]],
    { w: 1.4, a: 0.55, fill: 0.035 });
  a([[cx, base - 94], [cx, base - 104]], { sharp: true, w: 1, a: 0.4 });
  a(circlePts(cx, base - 106, 2.5, 10),
    { closed: true, col: GA, w: 1, a: 0.5, fill: 0.3 });
  [-1, 1].forEach(function (d) {
    var tx = cx + d * 62;
    a([[tx, base - 18], [tx, base - 54]], { sharp: true, w: 1.2, a: 0.35 });
    a([[tx - 8, base - 18], [tx - 8, base - 54]], { sharp: true, w: 0.8, a: 0.25 });
    a([[tx + 8, base - 18], [tx + 8, base - 54]], { sharp: true, w: 0.8, a: 0.25 });
    a([[tx - 10, base - 54], [tx, base - 64], [tx + 10, base - 54]],
      { w: 1, a: 0.35, fill: 0.02 });
  });
  for (var i = -2; i <= 2; i++) {
    var ax = cx + i * 22;
    a([[ax, base - 52], [ax, base - 64], [ax + 3, base - 68],
       [ax + 6, base - 64], [ax + 6, base - 52]],
      { sharp: true, w: 0.8, a: 0.25 });
  }
}

/* Sixty Dome Mosque, Bagerhat — long facade, many domes */
function drawSixty(a, cx, base) {
  a([[cx - 100, base], [cx + 100, base]], { sharp: true, w: 2, a: 0.45 });
  a([[cx - 94, base], [cx - 94, base - 20], [cx + 94, base - 20],
     [cx + 94, base]],
    { sharp: true, w: 1.2, a: 0.4 });
  a([[cx - 90, base - 20], [cx - 90, base - 64], [cx + 90, base - 64],
     [cx + 90, base - 20]],
    { sharp: true, w: 1.4, a: 0.5, fill: 0.025 });
  for (var i = -4; i <= 4; i++) {
    var dx = cx + i * 20;
    var dh = (i === 0 ? 22 : 16);
    a([[dx - 10, base - 64], [dx - 8, base - 64 - dh * 0.5],
       [dx - 4, base - 64 - dh], [dx, base - 64 - dh - 4],
       [dx + 4, base - 64 - dh], [dx + 8, base - 64 - dh * 0.5],
       [dx + 10, base - 64]],
      { w: 1.1, a: 0.45, fill: 0.02 });
    a([[dx, base - 64 - dh - 4], [dx, base - 64 - dh - 10]],
      { sharp: true, w: 0.7, a: 0.3 });
  }
  for (var j = -3; j <= 3; j++) {
    var ax = cx + j * 26;
    a([[ax - 5, base - 20], [ax - 5, base - 38], [ax, base - 44],
       [ax + 5, base - 38], [ax + 5, base - 20]],
      { sharp: true, w: 0.9, a: 0.3 });
  }
  [-1, 1].forEach(function (d) {
    var tx = cx + d * 96;
    a([[tx - 6, base - 20], [tx - 6, base - 74], [tx + 6, base - 74],
       [tx + 6, base - 20]],
      { sharp: true, w: 1.2, a: 0.4 });
    a([[tx - 8, base - 74], [tx, base - 84], [tx + 8, base - 74]],
      { w: 1, a: 0.35, fill: 0.02 });
  });
}

/* Ahsan Manzil, Dhaka — riverbank palace with a central dome */
function drawAhsan(a, cx, base) {
  var w = 80;
  a([[cx - w, base], [cx - w, base - 44], [cx + w, base - 44],
     [cx + w, base]],
    { sharp: true, w: 1.4, a: 0.5, fill: 0.03 });
  a([[cx - 24, base - 44], [cx - 24, base - 62], [cx + 24, base - 62],
     [cx + 24, base - 44]],
    { sharp: true, w: 1.2, a: 0.45, fill: 0.03 });
  a([[cx - 20, base - 62], [cx - 20, base - 72], [cx + 20, base - 72],
     [cx + 20, base - 62]],
    { sharp: true, w: 1, a: 0.4, fill: 0.025 });
  a([[cx - 22, base - 72], [cx - 18, base - 96], [cx - 8, base - 112],
     [cx, base - 116], [cx + 8, base - 112], [cx + 18, base - 96],
     [cx + 22, base - 72]],
    { w: 1.5, a: 0.55, fill: 0.035 });
  a([[cx, base - 116], [cx, base - 126]], { sharp: true, w: 1, a: 0.4 });
  a(circlePts(cx, base - 128, 2.5, 10),
    { closed: true, col: GA, w: 1, a: 0.5, fill: 0.3 });
  [-1, 1].forEach(function (d) {
    var dx = cx + d * 52;
    a([[dx - 16, base - 44], [dx - 12, base - 56], [dx - 5, base - 62],
       [dx, base - 64], [dx + 5, base - 62], [dx + 12, base - 56],
       [dx + 16, base - 44]],
      { w: 1.1, a: 0.45, fill: 0.025 });
    a([[dx, base - 64], [dx, base - 70]], { sharp: true, w: 0.8, a: 0.3 });
  });
  for (var i = -3; i <= 3; i++) {
    if (i === 0) continue;
    var wx = cx + i * 20;
    a([[wx - 4, base - 4], [wx - 4, base - 22], [wx, base - 27],
       [wx + 4, base - 22], [wx + 4, base - 4]],
      { sharp: true, w: 0.8, a: 0.3 });
  }
  a([[cx - 24, base - 44], [cx - 24, base]], { sharp: true, w: 0.8, a: 0.25 });
  a([[cx + 24, base - 44], [cx + 24, base]], { sharp: true, w: 0.8, a: 0.25 });
  a([[cx - w - 8, base], [cx + w + 8, base]], { sharp: true, w: 2, a: 0.45 });
  a([[cx - w - 14, base + 6], [cx + w + 14, base + 6]],
    { sharp: true, w: 1.2, a: 0.2 });
  [cx - 40, cx + 40].forEach(function (rx) {
    a([[rx - 8, base + 13], [rx + 8, base + 13]], { sharp: true, w: 0.8, a: 0.1 });
  });
}

/* Jatiya Sangsad Bhaban, Dhaka — circular chamber in a geometric complex */
function drawSangsad(a, cx, base) {
  var w = 100;
  a([[cx - w, base], [cx - w, base - 14], [cx + w, base - 14],
     [cx + w, base]],
    { sharp: true, w: 1.6, a: 0.5, fill: 0.03 });
  [-1, 1].forEach(function (d) {
    var x = cx + d * 78;
    a([[x - 26, base - 14], [x - 26, base - 58], [x - 14, base - 66],
       [x + 14, base - 66], [x + 26, base - 58], [x + 26, base - 14]],
      { sharp: true, w: 1.3, a: 0.45, fill: 0.03 });
    for (var i = 0; i < 4; i++) {
      var sx = x - 18 + i * 12;
      a([[sx, base - 20], [sx, base - 50]], { sharp: true, w: 0.8, a: 0.25 });
    }
    a([[x - 20, base - 66], [x + 20, base - 66]], { sharp: true, w: 1, a: 0.35 });
  });
  a([[cx - 55, base - 14], [cx - 55, base - 64], [cx + 55, base - 64],
     [cx + 55, base - 14]],
    { sharp: true, w: 1.6, a: 0.55, fill: 0.04 });
  for (var i = -4; i <= 4; i++) {
    var rx = cx + i * 12;
    a([[rx, base - 16], [rx, base - 62]], { sharp: true, w: 0.8, a: 0.3 });
  }
  a([[cx - 58, base - 64], [cx - 48, base - 78], [cx - 32, base - 88],
     [cx - 16, base - 94], [cx, base - 96], [cx + 16, base - 94],
     [cx + 32, base - 88], [cx + 48, base - 78], [cx + 58, base - 64]],
    { w: 1.4, a: 0.5, fill: 0.03 });
  a([[cx - 28, base - 88], [cx, base - 100], [cx + 28, base - 88]],
    { w: 1.1, a: 0.4 });
  a([[cx - 6, base - 100], [cx - 6, base - 108], [cx + 6, base - 108],
     [cx + 6, base - 100]],
    { sharp: true, w: 1, a: 0.4, fill: 0.02 });
  a([[cx - w - 20, base + 10], [cx + w + 20, base + 10]],
    { sharp: true, w: 1, a: 0.15 });
  for (var i = 0; i < 5; i++) {
    var lx = cx - 80 + i * 40;
    a([[lx, base + 16], [lx + 20, base + 16]], { sharp: true, w: 0.8, a: 0.1 });
  }
}

/* ============================================================
   ARCHITECTURAL FRIEZE + DISTANT SKYLINE
   ============================================================ */
function drawFrieze(a) {
  for (var i = 0; i < 12; i++) {
    var x = i * 160 + 20;
    a([[x, 160], [x, 100], [x + 18, 60], [x + 40, 36],
       [x + 62, 60], [x + 80, 100], [x + 80, 160]],
      { w: 0.8, a: 0.12 });
    a([[x + 40, 36], [x + 40, 24]], { sharp: true, w: 0.7, a: 0.14 });
    a(circlePts(x + 40, 20, 2, 8),
      { closed: true, sharp: true, w: 0.6, col: GA, a: 0.16, fill: 0.1 });
    a([[x + 40, 160], [x + 40, 182]], { sharp: true, w: 0.6, a: 0.06 });
  }
  a([[0, 160], [1920, 160]], { sharp: true, w: 0.8, a: 0.1 });
  a([[0, 184], [1920, 184]], { sharp: true, w: 0.6, a: 0.06 });
}

function drawSkyline(a) {
  a([[0, 760], [1920, 760]], { sharp: true, w: 0.8, a: 0.12 });
  for (var i = 0; i < 16; i++) {
    var x = i * 120 + 30;
    var kind = i % 4;
    if (kind === 0) {
      a([[x - 24, 760], [x - 20, 728], [x - 10, 712], [x, 706],
         [x + 10, 712], [x + 20, 728], [x + 24, 760]],
        { w: 0.9, a: 0.15, fill: 0.012 });
      a([[x, 706], [x, 696]], { sharp: true, w: 0.6, a: 0.12 });
    } else if (kind === 1) {
      a([[x - 6, 760], [x - 6, 700], [x + 6, 700], [x + 6, 760]],
        { sharp: true, w: 0.8, a: 0.14 });
      a([[x - 10, 700], [x, 688], [x + 10, 700]],
        { w: 0.8, a: 0.14 });
    } else if (kind === 2) {
      a([[x, 760], [x + 4, 712]], { sharp: true, w: 1, a: 0.14 });
      for (var k = -2; k <= 2; k++)
        a([[x + 4, 712], [x + 4 + k * 10, 700 - Math.abs(k) * 4]],
          { w: 0.7, col: TE, a: 0.12 });
    } else {
      a([[x - 18, 760], [x - 18, 730], [x, 712], [x + 18, 730], [x + 18, 760]],
        { w: 0.8, a: 0.12 });
    }
  }
}

/* ============================================================
   FLOATING DOODLES
   ============================================================ */
function shapeShapla() {
  var st = [];
  for (var i = 0; i < 6; i++) {
    var a = i / 6 * 6.283;
    var dx = Math.cos(a), dy = Math.sin(a);
    var q = [[0, 0],
             [dx * 4 - dy * 3, dy * 4 + dx * 3],
             [dx * 12, dy * 12],
             [dx * 4 + dy * 3, dy * 4 - dx * 3],
             [0, 0]];
    st.push({ p: smoothPath(q, true), w: 0.9, col: IV, a: 0.22 });
  }
  st.push({ p: sharpPath(circlePts(0, 0, 2.2, 8), true), w: 0.7, col: GA, a: 0.35 });
  return st;
}
function shapeLeaf() {
  var q = [[0, -9], [5, -3], [4, 5], [0, 9], [-4, 5], [-5, -3], [0, -9]];
  return [
    { p: smoothPath(q, true), w: 0.9, col: TE, a: 0.22 },
    { p: sharpPath([[0, -7], [0, 7]], false), w: 0.6, col: TE, a: 0.15 }
  ];
}
function shapeBird() {
  return [
    { p: smoothPath([[-10, 0], [-4, -4], [0, 0], [4, -4], [10, 0]], false),
      w: 1, col: IV, a: 0.25 },
    { p: smoothPath([[-2, 0], [0, 2], [2, 0]], false), w: 0.7, col: IV, a: 0.15 }
  ];
}
function shapeDiamond() {
  return [
    { p: sharpPath([[0, -6], [5, 0], [0, 6], [-5, 0]], true),
      w: 0.9, col: GA, a: 0.25 },
    { p: sharpPath([[0, -2], [2, 0], [0, 2], [-2, 0]], true),
      w: 0.6, col: RE, a: 0.25 }
  ];
}
function shapeCloud() {
  return [
    { p: sharpPath([[-24, 0], [-10, -3], [6, -1], [24, 0]], false),
      w: 0.7, col: IV, a: 0.10 },
    { p: sharpPath([[-18, 4], [-2, 2], [16, 4]], false),
      w: 0.6, col: IV, a: 0.07 }
  ];
}
var SHAPES = {
  shapla: shapeShapla, leaf: shapeLeaf, bird: shapeBird,
  diamond: shapeDiamond, cloud: shapeCloud
};
function seedDoodles() {
  DOODLES = [];
  var r = mulberry(913);
  function D(kind, x, y, s, speed, spin, phase) {
    DOODLES.push({
      strokes: SHAPES[kind](), x: x, y: y, s: s * 1.55,
      speed: speed, spin: spin, phase: phase,
      alpha: 0.55 + r() * 0.3
    });
  }
  D('shapla', 120, 260, 1.0, 6, true, 0.2);
  D('shapla', 1700, 340, 0.8, 4, true, 1.4);
  D('shapla', 260, 840, 0.9, 5, true, 2.2);
  D('shapla', 1520, 870, 0.8, 7, true, 3.1);
  D('leaf', 80, 420, 0.9, 8, true, 0.7);
  D('leaf', 600, 200, 0.8, 5, true, 1.9);
  D('leaf', 1300, 240, 0.9, 6, true, 3.4);
  D('leaf', 1840, 560, 0.8, 4, true, 4.6);
  D('leaf', 700, 860, 0.8, 9, true, 5.1);
  D('leaf', 1100, 880, 0.9, 6, true, 0.9);
  D('bird', 400, 180, 1.1, 11, false, 1.2);
  D('bird', 1000, 220, 0.9, 9, false, 2.8);
  D('bird', 1600, 160, 0.8, 13, false, 4.2);
  D('diamond', 300, 520, 0.9, 5, true, 1.1);
  D('diamond', 900, 300, 0.8, 7, true, 2.6);
  D('diamond', 1200, 600, 0.9, 4, true, 3.9);
  D('diamond', 1780, 700, 0.8, 6, true, 5.4);
  D('cloud', 300, 120, 0.9, 3, false, 0.5);
  D('cloud', 1400, 110, 0.8, 2, false, 2.1);
  D('shapla', 620, 400, 1.0, 5, true, 4.4);
  D('shapla', 1300, 460, 0.9, 6, true, 5.8);
  D('leaf', 1000, 120, 0.9, 4, true, 3.7);
  D('leaf', 1500, 500, 0.8, 7, true, 2.4);
  D('leaf', 200, 720, 0.9, 5, true, 4.9);
  D('bird', 700, 300, 0.9, 10, false, 5.5);
  D('bird', 1200, 160, 0.8, 12, false, 3.2);
  D('diamond', 500, 760, 0.8, 6, true, 1.7);
  D('diamond', 1400, 800, 0.9, 5, true, 4.1);
  D('cloud', 800, 80, 0.9, 3, false, 3.6);
  D('cloud', 1700, 220, 0.8, 2, false, 5.2);
}
function drawDoodles(T, ox) {
  var span = W + 240;
  DOODLES.forEach(function (D) {
    var x = ((D.x + T * D.speed) % span + span) % span - 120;
    var y = D.y + Math.sin(T * 0.18 + D.phase) * 8;
    var edge = Math.min(1, Math.min((x + 120) / 100, (W + 120 - x) / 100));
    if (edge <= 0.01) return;
    g.save();
    g.translate(x + ox, y);
    g.rotate(D.spin ? D.phase + T * 0.035 : Math.sin(T * 0.2 + D.phase) * 0.12);
    g.scale(D.s, D.s);
    for (var i = 0; i < D.strokes.length; i++) {
      var S = D.strokes[i];
      g.strokeStyle = 'rgba(' + S.col + ',' + (S.a * D.alpha * edge) + ')';
      g.lineWidth = S.w;
      g.setLineDash([]);
      g.stroke(S.p);
    }
    g.restore();
  });
}

/* ============================================================
   MIST
   ============================================================ */
function seedMist() {
  MIST = [];
  [{ x: 160, y: 826, w: 360, h: 24, sp: 7, a: 0.05 },
   { x: 760, y: 866, w: 460, h: 30, sp: 5, a: 0.035 },
   { x: 1420, y: 836, w: 380, h: 26, sp: 6, a: 0.04 }]
  .forEach(function (M) {
    var grd = g.createRadialGradient(0, 0, 0, 0, 0, M.w);
    grd.addColorStop(0, 'rgba(' + IV + ',' + M.a + ')');
    grd.addColorStop(0.55, 'rgba(' + IV + ',' + (M.a * 0.5) + ')');
    grd.addColorStop(1, 'rgba(' + IV + ',0)');
    M.grd = grd;
    MIST.push(M);
  });
}
function drawMist(T, ox) {
  MIST.forEach(function (M) {
    var span = W + 2 * M.w;
    var x = ((M.x + T * M.sp) % span + span) % span - M.w;
    g.save();
    g.translate(x + ox, M.y);
    g.scale(1, M.h / M.w);
    g.fillStyle = M.grd;
    g.beginPath(); g.arc(0, 0, M.w, 0, 6.283); g.fill();
    g.restore();
  });
}

/* ============================================================
   BUILD
   ============================================================ */
function build() {
  GROUPS = [];
  var horizon = { name: 'horizon', layer: 'far', cx: 0, base: 0,
                  start: 0, dur: 1.8, alpha: 0.8, strokes: [], glow: null };
  GROUPS.push(horizon);
  CUR = horizon;
  add([[0, 735], [400, 732], [900, 738], [1400, 733], [1920, 739]],
      { sharp: true, w: 0.8, a: 0.06 });
  add([[0, 795], [1920, 795]], { sharp: true, w: 0.7, a: 0.035 });
  add([[0, 850], [1920, 850]], { sharp: true, w: 0.9, a: 0.055 });
  for (var i = 0; i < 7; i++) {
    var x = 80 + i * 280;
    add([[x, 850], [x + 36, 850]], { sharp: true, w: 0.7, a: 0.04 });
  }
  for (var j = 0; j < horizon.strokes.length; j++) {
    horizon.strokes[j].ord = j;
    horizon.strokes[j].cnt = horizon.strokes.length;
  }
  horizon.minX = 0;
  horizon.maxX = 1920;
  CUR = null;

  G('frieze', 'far', 0, 0, 0.0, 2.5, 0.8, drawFrieze);
  G('skyline', 'far', 0, 0, 0.5, 3.0, 0.8, drawSkyline);

  G('martyrs', 'far', 140, 730, 0.2, 3.0, 0.75, drawMartyrs);
  G('shaheed', 'mid', 380, 790, 2.0, 2.4, 1.0, drawShaheed);
  G('lalbagh', 'mid', 555, 845, 4.0, 2.4, 1.0, drawLalbagh);
  G('sixty', 'mid', 1355, 845, 6.0, 2.6, 1.0, drawSixty);
  G('ahsan', 'mid', 1585, 790, 8.0, 2.6, 1.0, drawAhsan);
  G('sangsad', 'far', 1790, 730, 10.0, 3.0, 0.75, drawSangsad);

  GROUPS.forEach(function (L) {
    L.cullMargin = (L.name === 'horizon' || L.name === 'frieze' ||
                    L.name === 'skyline') ? 0 : 260;
    if (L.name === 'horizon' || L.name === 'frieze' || L.name === 'skyline') return;
    L.scale = L.name === 'shaheed' ? 1.25 : 1.15;
    var r = L.name === 'martyrs' ? 220 : L.name === 'sangsad' ? 200 :
            L.name === 'sixty' ? 210 : L.name === 'ahsan' ? 160 :
            L.name === 'lalbagh' ? 150 : 130;
    var cy = L.base - 40;
    var grd = g.createRadialGradient(L.cx, cy, 10, L.cx, cy, r);
    grd.addColorStop(0, 'rgba(' + GA + ',0.24)');
    grd.addColorStop(0.55, 'rgba(' + GA + ',0.09)');
    grd.addColorStop(1, 'rgba(' + GA + ',0)');
    L.glow = { grd: grd, cx: L.cx, cy: cy, r: r, ph: L.cx * 0.01 };
  });

  seedDoodles();
  seedMist();
}

/* ============================================================
   DRAW
   ============================================================ */
function drawWatermark(T) {
  var cx = 960, cy = 420, R = 250;
  g.save();
  g.translate(cx, cy);
  g.rotate(T * 0.004);
  g.strokeStyle = 'rgba(' + IV + ',0.035)';
  g.lineWidth = 1;
  for (var i = 0; i < 8; i++) {
    var a = i / 8 * 6.283, dx = Math.cos(a), dy = Math.sin(a);
    var q = [[0, 0],
             [dx * 30 - dy * 45, dy * 30 + dx * 45],
             [dx * 130 - dy * 60, dy * 130 + dx * 60],
             [dx * R, dy * R],
             [dx * 130 + dy * 60, dy * 130 - dx * 60],
             [dx * 30 + dy * 45, dy * 30 - dx * 45],
             [0, 0]];
    g.stroke(smoothPath(q, true));
  }
  g.strokeStyle = 'rgba(' + GA + ',0.045)';
  g.lineWidth = 1.2;
  g.stroke(sharpPath(circlePts(0, 0, 26, 40), true));
  g.strokeStyle = 'rgba(' + IV + ',0.018)';
  g.lineWidth = 1;
  g.stroke(sharpPath(circlePts(0, 0, R + 18, 60), true));
  g.restore();
}

function drawLayer(layer, T, ox, oy, shift) {
  for (var copy = 0; copy < 2; copy++) {
    g.save();
    g.translate(ox - shift + copy * W, oy);
    for (var i = 0; i < GROUPS.length; i++) {
      var L = GROUPS[i];
      if (L.layer !== layer) continue;
      var rv = clamp01((T - L.start) / L.dur);
      if (rv <= 0) continue;
      var gx = ox - shift + copy * W;
      var margin = L.cullMargin || 0;
      if (L.maxX + gx < -margin || L.minX + gx > W + margin) continue;
      g.save();
      if (L.scale && L.scale !== 1) {
        g.translate(L.cx, L.base);
        g.scale(L.scale, L.scale);
        g.translate(-L.cx, -L.base);
      }
      if (L.glow) {
        g.globalAlpha = (0.75 + 0.25 * Math.sin(T * 0.18 + L.glow.ph)) *
                        Math.min(1, rv * 3);
        g.fillStyle = L.glow.grd;
        g.beginPath();
        g.arc(L.glow.cx, L.glow.cy, L.glow.r, 0, 6.283);
        g.fill();
        g.globalAlpha = 1;
      }
      for (var j = 0; j < L.strokes.length; j++) {
        var S = L.strokes[j];
        var local = clamp01((rv * 1.35 - (S.ord / S.cnt) * 1.05) / 0.3);
        if (local <= 0.01) continue;
        var a = S.a * L.alpha * 1.55 * Math.min(1, local);
        if (S.fill) {
          g.fillStyle = 'rgba(' + S.col + ',' +
            (S.fill * Math.min(1, local) * L.alpha * 1.2) + ')';
          g.fill(S.p);
        }
        g.strokeStyle = 'rgba(' + S.col + ',' + a + ')';
        g.lineWidth = S.w;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.setLineDash(local < 1 ? [S.len * local, 1e6] : []);
        g.stroke(S.p);
        g.setLineDash([]);
        if (local < 1 && S.len > 4) {
          var pt = pointAt(S.q, S.len * local);
          g.fillStyle = 'rgba(' + GA + ',0.7)';
          g.beginPath();
          g.arc(pt[0], pt[1], 1.6, 0, 6.283);
          g.fill();
        }
      }
      g.restore();
    }
    g.restore();
  }
}

function draw(T, dt) {
  if (FIXBT) T = parseFloat(FIXBT);
  else if (RM) T = 26;

  g.clearRect(0, 0, W, H);
  var bg = g.createRadialGradient(960, 460, 120, 960, 500, 1100);
  bg.addColorStop(0, '#0a2419');
  bg.addColorStop(0.55, '#04150c');
  bg.addColorStop(1, '#010604');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  var floor = g.createLinearGradient(0, 700, 0, 920);
  floor.addColorStop(0, 'rgba(' + TE + ',0)');
  floor.addColorStop(0.45, 'rgba(' + TE + ',0.025)');
  floor.addColorStop(1, 'rgba(1,6,3,0.35)');
  g.fillStyle = floor;
  g.fillRect(0, 700, W, 220);

  var hg = g.createRadialGradient(960, 820, 20, 960, 820, 900);
  hg.addColorStop(0, 'rgba(' + GA + ',0.055)');
  hg.addColorStop(1, 'rgba(' + GA + ',0)');
  g.fillStyle = hg;
  g.fillRect(0, 0, W, H);

  drawWatermark(T);

  var farX = Math.sin(T * 0.035 + 0.7) * 18,
      farY = Math.sin(T * 0.028 + 1.1) * 4,
      midX = Math.sin(T * 0.05 + 2.1) * 30,
      midY = Math.sin(T * 0.04 + 3.2) * 6,
      nearX = Math.sin(T * 0.07 + 4.2) * 45;

  var scrollT = Math.max(0, T - 42);
  var ramp = Math.min(1, scrollT / 8);
  var farShift = (4 * scrollT * ramp) % W;
  var midShift = (10 * scrollT * ramp) % W;

  drawLayer('far', T, farX, farY, farShift);
  drawLayer('mid', T, midX, midY, midShift);
  drawMist(T, nearX * 0.5);
  drawDoodles(T, nearX);
}

return { init: init, draw: draw };
function init(canvas) { g = canvas.getContext('2d'); build(); }
})();
