/* Life Choices: the walkable Miami map. A canvas world with a character, buildings you walk into,
   streets with traffic, and time that passes as you walk. All game rules stay in the engine. */
(function () {
  'use strict';
  var G = window.GAME;
  var W = 1500, H = 1800;
  var MAINLAND = [[96, 32], [984, 32], [1032, 904], [888, 1200], [824, 1768], [96, 1768]];
  var ISLAND = [[1152, 400], [1344, 448], [1368, 1072], [1192, 1032]];
  var CAUSE = [[[720, 496], [1208, 680]], [[760, 768], [1208, 680]]];
  var TINT = { gardens: '#d6e5bd', hialeah: '#f1d6b4', wynwood: '#f0c3d6', flats: '#c4b9a6', downtown: '#c4d4e6', havana: '#f5d9a0', beach: '#fbe8b0', gables: '#c9e6bf', grove: '#b9dfc6', kendall: '#e4dfc0', homestead: '#dce6b2' };
  var SHIRTS = ['#d9533f', '#2d6cdf', '#8e44ad', '#e0a100', '#1e8a6c', '#c2185b', '#37474f'];
  var SKINS = ['#f2c9a0', '#e0a878', '#c68a5e', '#a06a42', '#7a4a2c', '#5a3820'];
  var HAIRS = ['#2a1b12', '#4a2c17', '#111111', '#7a4a1f', '#b0813a'];

  // ---------- geometry ----------
  function inPoly(x, y, p) {
    var c = false, i, j;
    for (i = 0, j = p.length - 1; i < p.length; j = i++) {
      if (((p[i][1] > y) !== (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) c = !c;
    }
    return c;
  }
  function distSeg(x, y, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy));
  }
  function walkable(x, y) {
    if (inPoly(x, y, MAINLAND) || inPoly(x, y, ISLAND)) return true;
    for (var i = 0; i < CAUSE.length; i++) if (distSeg(x, y, CAUSE[i][0], CAUSE[i][1]) < 22) return true;
    return false;
  }
  function onIsland(x) { return x > 1090; }
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  function center(id) { var a = G.AREAS[id]; return [a.x * 4, a.y * 4]; }
  function nearestArea(x, y) {
    var best = 'havana', bd = 1e9;
    G.AREA_ORDER.forEach(function (k) {
      var c = center(k), d = Math.hypot(c[0] - x, c[1] - y);
      if (d < bd) { bd = d; best = k; }
    });
    return best;
  }

  // ---------- places ----------
  function at(area, dx, dy) { return function () { var c = center(area); return [c[0] + dx, c[1] + dy]; }; }
  var PLACES = [
    { id: 'home', emoji: '🏠', color: '#e8a15a', label: function () { return 'Home'; },
      pos: function (s) { var c = center(s.area); return [c[0] - 62, c[1] + 40]; },
      ids: ['coast', 'coast_years', 'save', 'get_fit', 'quit_smoking', 'cut_drinking', 'propose', 'baby'],
      blurb: function (s) { return s.home === 'own' ? 'Your own place in ' + G.area(s).short + '.' : s.home === 'rent' ? 'Your rented place in ' + G.area(s).short + '.' : 'The family home in ' + G.area(s).short + '.'; },
      empty: 'Nothing to do at home right now.' },
    { id: 'work', emoji: '🏢', color: '#4a7fc1', label: function (s) { return s.job ? 'Work' : 'Job center'; },
      pos: at('downtown', 70, -50), ids: ['job_search', 'work_hard', 'work_coast', 'quit', 'side_hustle'],
      blurb: function (s) { return s.job ? 'You work here as a ' + G.jobTitle(s).toLowerCase() + '.' : 'Hiring boards, recruiters, and a lot of people with résumés.'; },
      empty: 'You are too young to work, or you are locked up.' },
    { id: 'school', emoji: '🎓', color: '#7a5bb5', label: function () { return 'School'; },
      pos: at('gables', 76, 0), ids: ['study', 'coast_school', 'skip_class', 'dropout', 'ged', 'school_again'],
      blurb: function (s) { return s.edu.inSchool ? 'Your classes, your grades, and the people who notice them.' : 'The campus is open to anyone ready to go back.'; },
      empty: 'There is nothing for you here right now.' },
    { id: 'clinic', emoji: '🏥', color: '#d96a6a', label: function () { return 'Clinic'; },
      pos: at('havana', -84, 64), ids: ['checkup'], blurb: function () { return 'Catch problems early, before they get expensive.'; },
      empty: 'You do not need a checkup yet.' },
    { id: 'realtor', emoji: '🏘️', color: '#3f9d8f', label: function () { return 'Realtor'; },
      pos: at('downtown', -76, 54), ids: ['buy_home', 'move'], blurb: function () { return 'Homes for sale, and listings in every part of Miami.'; },
      empty: 'Nothing for sale that you can reach yet.' },
    { id: 'casino', emoji: '🎰', color: '#c0392b', label: function () { return 'Casino'; },
      pos: at('gardens', 56, 46), ids: ['gamble'], blurb: function () { return 'Bright lights, free drinks, and the house always wins in the end.'; },
      empty: 'You have to be 21 to get in.' },
    { id: 'gunshop', emoji: '🎯', color: '#6b7280', label: function () { return 'Gun shop'; },
      pos: at('hialeah', 58, 32), ids: ['buy_gun'], blurb: function () { return 'Licensed, legal, and serious.'; },
      empty: 'They will not sell you anything right now.' },
    { id: 'club', emoji: '🎵', color: '#d6459b', label: function () { return 'Nightclub'; },
      pos: at('wynwood', 58, 34), ids: ['date'], blurb: function () { return 'Loud, crowded, and full of people you have not met.'; },
      empty: 'Nothing is open for you right now.' },
    { id: 'pier', emoji: '🏖️', color: '#e6a23c', label: function () { return 'Beach'; },
      pos: at('beach', 66, 8), ids: ['date'], blurb: function () { return 'Sand, sun, and a lot of people looking for someone.'; },
      empty: 'Nothing is open for you right now.' },
    { id: 'corner', emoji: '🚏', color: '#475569', label: function () { return 'The corner'; },
      pos: at('flats', 8, 52), ids: ['crew', 'leave_crew', 'rk_shoplift', 'rk_car', 'rk_assault', 'rk_fraud', 'rk_deal', 'rk_store', 'rk_bank'],
      blurb: function () { return 'People who look at you a little too long. Some of them are offering things.'; },
      empty: 'Nobody here wants anything from you right now.' }
  ];
  var KEYS = {
    home: 'home house apartment sleep bed rest family relax', work: 'work job office career hire apply boss paycheck money quit',
    school: 'school class college university study learn campus exam graduate degree', clinic: 'doctor hospital clinic checkup health sick medical',
    realtor: 'realtor move moving buy house real estate neighborhood', casino: 'casino gamble gambling bet slots poker lucky',
    gunshop: 'gun guns weapon pistol protection firearm', club: 'club nightclub party dance date meet drinks night girlfriend boyfriend',
    pier: 'beach pier ocean sand swim sun water relax date', corner: 'corner street crew gang hustle hood rob steal crime dealer'
  };
  var MAPPED = {};
  PLACES.forEach(function (p) { p.ids.forEach(function (i) { MAPPED[i] = true; }); });
  function placeById(id) { for (var i = 0; i < PLACES.length; i++) if (PLACES[i].id === id) return PLACES[i]; return null; }
  function placePos(p, s) { return p.pos(s); }
  function placeActions(s, id) {
    var p = placeById(id);
    if (!p) return [];
    var avail = G.availableActions(s);
    var list = avail.filter(function (a) { return p.ids.indexOf(a.id) >= 0 || (id === 'home' && !MAPPED[a.id]); });
    return list;
  }

  // ---------- terrain (drawn once) ----------
  var terrain = null;
  function path(ctx, p) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r * f))); g = Math.max(0, Math.min(255, Math.round(g * f))); b = Math.max(0, Math.min(255, Math.round(b * f)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function buildTerrain() {
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    // sea
    var sg = x.createLinearGradient(0, 0, W, H);
    sg.addColorStop(0, '#2b9db3'); sg.addColorStop(1, '#1b7f98');
    x.fillStyle = sg; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 3; x.lineCap = 'round';
    for (var i = 0; i < 260; i++) {
      var wx = hash(i * 7 + 1) * W, wy = hash(i * 13 + 5) * H;
      if (inPoly(wx, wy, MAINLAND) || inPoly(wx, wy, ISLAND)) continue;
      x.beginPath(); x.moveTo(wx, wy); x.quadraticCurveTo(wx + 14, wy - 6, wx + 28, wy); x.stroke();
    }
    // sand rims
    [MAINLAND, ISLAND].forEach(function (poly) {
      path(x, poly); x.lineJoin = 'round'; x.strokeStyle = '#f6e6b4'; x.lineWidth = 44; x.stroke();
      path(x, poly); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 56; x.globalAlpha = .25; x.stroke(); x.globalAlpha = 1;
    });
    // causeways
    CAUSE.forEach(function (s) {
      x.lineCap = 'round'; x.strokeStyle = '#8c8f94'; x.lineWidth = 40; x.beginPath(); x.moveTo(s[0][0], s[0][1]); x.lineTo(s[1][0], s[1][1]); x.stroke();
      x.strokeStyle = '#b9bcc2'; x.lineWidth = 30; x.beginPath(); x.moveTo(s[0][0], s[0][1]); x.lineTo(s[1][0], s[1][1]); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; x.setLineDash([16, 18]); x.beginPath(); x.moveTo(s[0][0], s[0][1]); x.lineTo(s[1][0], s[1][1]); x.stroke(); x.setLineDash([]);
    });
    // land per polygon
    [MAINLAND, ISLAND].forEach(function (poly, pi) {
      x.save(); path(x, poly); x.clip();
      x.fillStyle = '#efe3cc'; x.fillRect(0, 0, W, H);
      // district tints
      G.AREA_ORDER.forEach(function (k) {
        var ct = center(k);
        var g = x.createRadialGradient(ct[0], ct[1], 20, ct[0], ct[1], 250);
        g.addColorStop(0, TINT[k] || '#e8e0cc'); g.addColorStop(.7, TINT[k] || '#e8e0cc'); g.addColorStop(1, 'rgba(239,227,204,0)');
        x.fillStyle = g; x.beginPath(); x.arc(ct[0], ct[1], 250, 0, 7); x.fill();
      });
      // streets and blocks
      var step = 120;
      for (var gy = 0; gy < H; gy += step) {
        for (var gx = 0; gx < W; gx += step) {
          var cx = gx + step / 2, cy = gy + step / 2;
          if (!inPoly(cx, cy, poly)) continue;
          var ar = nearestArea(cx, cy), tint = TINT[ar] || '#e8e0cc';
          var seed = gx * 31 + gy * 17;
          var r0 = hash(seed);
          if (r0 < 0.16) { // park
            x.fillStyle = '#bcd9a4'; x.fillRect(gx + 12, gy + 12, step - 24, step - 24);
            for (var t = 0; t < 7; t++) { x.fillStyle = 'rgba(52,120,64,.85)'; x.beginPath(); x.arc(gx + 22 + hash(seed + t) * 76, gy + 22 + hash(seed + t * 3) * 76, 8 + hash(seed + t * 5) * 6, 0, 7); x.fill(); }
            continue;
          }
          var n = 2 + Math.floor(hash(seed + 9) * 3);
          var tall = ar === 'downtown' || ar === 'beach';
          for (var b = 0; b < n; b++) {
            var bw = 30 + hash(seed + b * 11) * 30, bh = 28 + hash(seed + b * 7) * 30;
            var bx = gx + 14 + (b % 2) * 52 + hash(seed + b) * 8, by = gy + 14 + Math.floor(b / 2) * 52 + hash(seed + b * 2) * 8;
            var hf = tall ? 0.8 : 1.0;
            var base = shade(tint, 0.78 + hash(seed + b * 3) * 0.2);
            x.fillStyle = 'rgba(60,50,40,.25)'; x.fillRect(bx + 4, by + 6, bw, bh);
            x.fillStyle = base; x.fillRect(bx, by, bw, bh);
            x.fillStyle = shade(tint, 0.6 * hf); x.fillRect(bx, by, bw, 7);
          }
        }
      }
      // roads over blocks
      x.strokeStyle = '#d6c6a4'; x.lineCap = 'butt';
      for (var rx = 0; rx <= W; rx += step) { x.lineWidth = rx % 480 === 0 ? 26 : 14; x.beginPath(); x.moveTo(rx, 0); x.lineTo(rx, H); x.stroke(); }
      for (var ry = 0; ry <= H; ry += step) { x.lineWidth = ry % 480 === 0 ? 26 : 14; x.beginPath(); x.moveTo(0, ry); x.lineTo(W, ry); x.stroke(); }
      x.strokeStyle = 'rgba(255,255,255,.65)'; x.lineWidth = 2; x.setLineDash([10, 14]);
      for (var ax = 0; ax <= W; ax += 480) { x.beginPath(); x.moveTo(ax, 0); x.lineTo(ax, H); x.stroke(); }
      for (var ay = 0; ay <= H; ay += 480) { x.beginPath(); x.moveTo(0, ay); x.lineTo(W, ay); x.stroke(); }
      x.setLineDash([]);
      // palms on the beach island
      if (pi === 1) {
        for (var pm = 0; pm < 40; pm++) {
          var px = 1160 + hash(pm * 3) * 200, py = 420 + hash(pm * 5) * 640;
          if (!inPoly(px, py, ISLAND)) continue;
          x.fillStyle = '#2f7d4a'; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill();
          x.fillStyle = '#3d9a5c'; x.beginPath(); x.arc(px - 3, py - 3, 6, 0, 7); x.fill();
        }
      }
      x.restore();
    });
    // district names
    x.textAlign = 'center'; x.font = '700 40px system-ui, sans-serif'; x.fillStyle = 'rgba(40,50,60,.22)';
    G.AREA_ORDER.forEach(function (k) {
      var ct = center(k), a = G.AREAS[k];
      x.fillText(a.short.toUpperCase(), ct[0], ct[1] - 70);
    });
    return c;
  }

  // ---------- ambient life ----------
  var peds = [], cars = [];
  function initAmbient() {
    var i;
    for (i = 0; i < 34; i++) {
      var horiz = hash(i * 3 + 1) < 0.5;
      var line = 120 * Math.floor(1 + hash(i * 5 + 2) * 13);
      peds.push({ h: horiz, line: line + (hash(i) < .5 ? -14 : 14), p: 100 + hash(i * 9) * 800, v: (hash(i * 11) < .5 ? -1 : 1) * (22 + hash(i * 7) * 22), col: SHIRTS[i % SHIRTS.length] });
    }
    for (i = 0; i < 12; i++) {
      var hz = i % 2 === 0;
      var ln = 480 * (1 + (i % 3));
      cars.push({ h: hz, line: ln + (i % 4 < 2 ? -6 : 6), p: hash(i * 13) * 1700, v: (i % 4 < 2 ? 1 : -1) * (90 + hash(i * 3) * 50), col: ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#fefae0', '#6d597a'][i % 6] });
    }
  }
  initAmbient();

  // ---------- the world object ----------
  var world = { el: null, app: null, cb: null };
  var cv, ctx, hud, label, hint, mic;
  var cam = { x: 0, y: 0 }, vw = 360, vh = 600, dpr = 1, k = 1;
  var pl = { x: 0, y: 0, dir: 1, ph: 0, moving: false };
  var keys = {}, target = null, route = [], dragging = false, inside = null, lastArea = null, lastSave = 0, lastLabel = 0, hintUntil = 0, time = 0, pulse = 0;
  var started = false;

  function build() {
    var el = document.createElement('div');
    el.className = 'worldbox';
    cv = document.createElement('canvas');
    cv.className = 'worldcv';
    hud = document.createElement('div');
    hud.className = 'whud';
    label = document.createElement('div');
    label.className = 'wlabel';
    hint = document.createElement('div');
    hint.className = 'whint';
    hint.textContent = 'Tap the map to walk. Walk into a building to go inside.';
    mic = document.createElement('button');
    mic.className = 'wmic';
    mic.type = 'button';
    mic.setAttribute('aria-label', 'Say where to go');
    mic.textContent = '🎤';
    mic.addEventListener('click', function (e) { e.stopPropagation(); if (world.cb && world.cb.micMap) world.cb.micMap(); });
    mic.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    el.appendChild(mic);
    hud.appendChild(label);
    hud.appendChild(hint);
    el.appendChild(cv);
    el.appendChild(hud);
    ctx = cv.getContext('2d');
    world.el = el;
    cv.addEventListener('pointerdown', function (e) { if (!canMove(true)) return; dragging = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } tapAt(e); });
    cv.addEventListener('pointermove', function (e) { if (dragging && canMove(true)) tapAt(e, true); });
    cv.addEventListener('pointerup', function () { dragging = false; });
    cv.addEventListener('pointercancel', function () { dragging = false; });
    window.addEventListener('keydown', function (e) {
      var kk = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].indexOf(kk) < 0) return;
      if (!canMove(false)) return;
      if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
      keys[kk] = true; target = null; route = []; e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { delete keys[e.key.toLowerCase()]; });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(el);
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!world.el) return;
    var r = world.el.getBoundingClientRect();
    if (r.width < 10) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = r.width; vh = r.height;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
    k = Math.max(0.55, Math.min(1.0, Math.min(vw, vh) / 780));
  }

  function canMove(strict) {
    var a = world.app;
    if (!a || a.screen !== 'game' || !a.S) return false;
    var s = a.S;
    return !s.dead && s.cur && s.cur.kind === 'free' && !a.place && !a.modal;
  }

  function screenToWorld(e) {
    var r = cv.getBoundingClientRect();
    var sx = e.clientX - r.left, sy = e.clientY - r.top;
    return [cam.x + (sx - vw / 2) / k, cam.y + (sy - vh / 2) / k];
  }
  function clampWalk(p) {
    if (walkable(p[0], p[1])) return p;
    for (var t = 1; t <= 40; t++) {
      var f = t / 40, x = p[0] + (pl.x - p[0]) * f, y = p[1] + (pl.y - p[1]) * f;
      if (walkable(x, y)) return [x, y];
    }
    return [pl.x, pl.y];
  }
  function routeTo(p) {
    var pts = [];
    var a = onIsland(pl.x), b = onIsland(p[0]);
    if (a !== b) {
      var cs = pl.y > 640 && p[1] > 560 ? CAUSE[1] : CAUSE[0];
      if (Math.abs(pl.y - 496) > Math.abs(pl.y - 768) && !a) cs = CAUSE[1];
      pts = a ? [cs[1], cs[0]] : [cs[0], cs[1]];
    }
    pts.push(p);
    return pts;
  }
  function tapAt(e, drag) {
    var s = world.app.S;
    var p = screenToWorld(e);
    // tapping a building heads for its door
    for (var i = 0; i < PLACES.length; i++) {
      var pp = placePos(PLACES[i], s);
      if (Math.hypot(pp[0] - p[0], pp[1] - p[1]) < 52) {
        if (inside === PLACES[i].id && !drag) { world.cb.openPlace(PLACES[i].id); return; }
        p = [pp[0], pp[1] + 34];
        break;
      }
    }
    p = clampWalk(p);
    target = p; route = routeTo(p); keys = {};
    hintUntil = 0; hint.style.opacity = 0;
  }

  // ---------- state sync ----------
  function appearance(s) {
    var h = 0, id = s.id || 'x';
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return { shirt: SHIRTS[Math.abs(h) % SHIRTS.length], skin: SKINS[Math.abs(h >> 3) % SKINS.length], hair: HAIRS[Math.abs(h >> 5) % HAIRS.length] };
  }
  function syncPlayer(s) {
    if (!s) return;
    if (lastArea !== s.area || !s.pos) {
      var home = PLACES[0].pos(s);
      if (!s.pos || (lastArea && lastArea !== s.area)) { s.pos = { x: home[0], y: home[1] + 36 }; target = null; route = []; }
      lastArea = s.area;
    }
    if (s !== world._s) {
      world._s = s;
      pl.x = s.pos.x; pl.y = s.pos.y; cam.x = pl.x; cam.y = pl.y;
      inside = null; target = null; route = [];
      lastArea = s.area;
      for (var qi = 0; qi < PLACES.length; qi++) {
        var qp = placePos(PLACES[qi], s);
        if (Math.hypot(qp[0] - pl.x, qp[1] + 34 - pl.y) < 30 || Math.hypot(qp[0] - pl.x, qp[1] - pl.y) < 34) inside = PLACES[qi].id;
      }
      hintUntil = performance.now() + 9000; hint.style.opacity = 1;
    }
  }

  function night(s) { return Math.floor(s.t / 3) % 2 === 1; }

  function onMonth(s) {
    var u = G.u;
    G.tick(s, 1);
    s.ctr.wm = (s.ctr.wm || 0) + 1;
    var a = nearestArea(pl.x, pl.y);
    var ar = G.AREAS[a];
    var p = 0.1 + ar.risk * 0.05;
    if (night(s)) p *= 1.4;
    if (!s.dead && G.age(s) >= 16 && u.chance(s, p)) {
      target = null; route = []; keys = {};
      s.ctr.wm = 0;
      G.goOut(s, a, night(s));
      world.cb.changed();
      return true;
    }
    if (s.dead || s.ctr.wm >= 5) {
      s.ctr.wm = 0;
      target = null; route = []; keys = {};
      G.next(s);
      world.cb.changed();
      return true;
    }
    return false;
  }

  // ---------- update ----------
  function update(dt) {
    var a = world.app, s = a && a.S;
    if (!s || a.screen !== 'game') return;
    syncPlayer(s);
    pulse += dt;
    var moving = false;
    if (canMove(false)) {
      var dx = 0, dy = 0;
      if (keys.arrowleft || keys.a) dx -= 1;
      if (keys.arrowright || keys.d) dx += 1;
      if (keys.arrowup || keys.w) dy -= 1;
      if (keys.arrowdown || keys.s) dy += 1;
      if (dx || dy) { var l = Math.hypot(dx, dy); dx /= l; dy /= l; }
      else if (route.length) {
        var w = route[0], ddx = w[0] - pl.x, ddy = w[1] - pl.y, dd = Math.hypot(ddx, ddy);
        if (dd < 8) { route.shift(); if (!route.length) target = null; } else { dx = ddx / dd; dy = ddy / dd; }
      }
      if (dx || dy) {
        var sp = (G.age(s) < 13 ? 150 : 215) * dt;
        var nx = pl.x + dx * sp, ny = pl.y + dy * sp;
        if (!walkable(nx, ny)) {
          if (walkable(nx, pl.y)) ny = pl.y;
          else if (walkable(pl.x, ny)) nx = pl.x;
          else { nx = pl.x; ny = pl.y; route = []; target = null; }
        }
        var moved = Math.hypot(nx - pl.x, ny - pl.y);
        if (moved > 0) {
          moving = true;
          if (Math.abs(dx) > 0.2) pl.dir = dx > 0 ? 1 : -1;
          pl.x = nx; pl.y = ny;
          s.pos = { x: Math.round(pl.x), y: Math.round(pl.y) };
          s.ctr.walk = (s.ctr.walk || 0) + moved;
          if (s.ctr.walk >= 280) {
            s.ctr.walk -= 280;
            if (onMonth(s)) return;
          }
        }
      }
      // doors
      var found = null;
      for (var i = 0; i < PLACES.length; i++) {
        var pp = placePos(PLACES[i], s);
        if (Math.hypot(pp[0] - pl.x, pp[1] + 34 - pl.y) < 30 || Math.hypot(pp[0] - pl.x, pp[1] - pl.y) < 34) { found = PLACES[i].id; break; }
      }
      if (found && found !== inside) { inside = found; keys = {}; route = []; target = null; world.cb.openPlace(found); }
      if (!found && inside) {
        var ip = placePos(placeById(inside), s);
        if (Math.hypot(ip[0] - pl.x, ip[1] - pl.y) > 90) inside = null;
      }
    }
    pl.moving = moving;
    if (moving) pl.ph += dt * 11;
    var f = Math.min(1, dt * 6);
    cam.x += (pl.x - cam.x) * f; cam.y += (pl.y - cam.y) * f;
    var hx = vw / 2 / k, hy = vh / 2 / k;
    cam.x = hx * 2 >= W + 160 ? W / 2 : Math.max(hx - 80, Math.min(W - hx + 80, cam.x));
    cam.y = hy * 2 >= H + 160 ? H / 2 : Math.max(hy - 80, Math.min(H - hy + 80, cam.y));
    var now = performance.now();
    if (moving && now - lastSave > 2500) { lastSave = now; world.cb.save(); }
    // ambient
    peds.forEach(function (p) {
      p.p += p.v * dt;
      if (p.p > (p.h ? 1050 : 1760)) p.v = -Math.abs(p.v);
      if (p.p < 60) p.v = Math.abs(p.v);
    });
    cars.forEach(function (c) {
      c.p += c.v * dt;
      if (c.p > 1800) c.p = 0;
      if (c.p < 0) c.p = 1800;
    });
    if (now - lastLabel > 400) {
      lastLabel = now;
      var ar = G.AREAS[nearestArea(pl.x, pl.y)];
      label.textContent = ar.short + ' · ' + (night(s) ? 'Night' : 'Day');
      if (hintUntil && now > hintUntil) { hint.style.opacity = 0; hintUntil = 0; }
    }
  }

  // ---------- drawing ----------
  function person(x, y, sc, look, ph, moving, dir, age, tag) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(0, 3, 13, 5, 0, 0, 7); ctx.fill();
    var sw = moving ? Math.sin(ph) * 5 : 0;
    ctx.fillStyle = '#2f3b52';
    ctx.fillRect(-7 + sw * .4, -9, 5, 12); ctx.fillRect(2 - sw * .4, -9, 5, 12);
    var bob = moving ? Math.abs(Math.sin(ph)) * -2 : 0;
    ctx.translate(0, bob);
    ctx.fillStyle = look.shirt;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -29, 20, 22, 6) : ctx.rect(-10, -29, 20, 22); ctx.fill();
    ctx.fillStyle = look.skin;
    ctx.fillRect(-14, -27 + sw * .3, 4, 10); ctx.fillRect(10, -27 - sw * .3, 4, 10);
    ctx.beginPath(); ctx.arc(0, -37, 10, 0, 7); ctx.fill();
    ctx.fillStyle = age >= 62 ? '#d9d9de' : look.hair;
    ctx.beginPath(); ctx.arc(0, -39, 10.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(dir > 0 ? 2 : -5, -38, 3, 3);
    ctx.fillRect(dir > 0 ? 6 : -1, -38, 3, 3);
    ctx.restore();
    if (tag) {
      ctx.font = '600 ' + Math.round(12 / k) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      var tw = ctx.measureText(tag).width + 10 / k;
      ctx.fillStyle = 'rgba(15,26,32,.78)';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - tw / 2, y - sc * 64 - 14 / k, tw, 18 / k, 6 / k) : ctx.rect(x - tw / 2, y - sc * 64 - 14 / k, tw, 18 / k); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(tag, x, y - sc * 64);
    }
  }

  function draw() {
    var a = world.app, s = a && a.S;
    if (!s || a.screen !== 'game') return;
    if (!terrain) terrain = buildTerrain();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#2b9db3';
    ctx.fillRect(0, 0, vw, vh);
    ctx.save();
    ctx.translate(vw / 2, vh / 2);
    ctx.scale(k, k);
    ctx.translate(-cam.x, -cam.y);
    ctx.drawImage(terrain, 0, 0);
    var x0 = cam.x - vw / 2 / k - 60, x1 = cam.x + vw / 2 / k + 60, y0 = cam.y - vh / 2 / k - 60, y1 = cam.y + vh / 2 / k + 60;
    // cars
    cars.forEach(function (c) {
      var cx = c.h ? c.p : c.line, cy = c.h ? c.line : c.p;
      if (cx < x0 || cx > x1 || cy < y0 || cy > y1 || !inPoly(cx, cy, MAINLAND)) return;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(cx - (c.h ? 11 : 6), cy - (c.h ? 5 : 10) + 3, c.h ? 22 : 12, c.h ? 12 : 22);
      ctx.fillStyle = c.col; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx - (c.h ? 11 : 6), cy - (c.h ? 5 : 10), c.h ? 22 : 12, c.h ? 12 : 22, 4); else ctx.rect(cx - (c.h ? 11 : 6), cy - (c.h ? 5 : 10), c.h ? 22 : 12, c.h ? 12 : 22);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(cx - (c.h ? 3 : 4), cy - (c.h ? 3 : 4), c.h ? 8 : 8, c.h ? 6 : 6);
    });
    // pedestrians
    peds.forEach(function (p) {
      var px = p.h ? p.p : p.line, py = p.h ? p.line : p.p;
      if (px < x0 || px > x1 || py < y0 || py > y1 || !inPoly(px, py, MAINLAND)) return;
      person(px, py, 0.5, { shirt: p.col, skin: '#d9a679', hair: '#3a2a1c' }, time * 6 + p.p * .1, true, p.v > 0 ? 1 : -1, 30, null);
    });
    // places
    PLACES.forEach(function (pl2) {
      var pp = placePos(pl2, s);
      if (pp[0] < x0 - 80 || pp[0] > x1 + 80 || pp[1] < y0 - 80 || pp[1] > y1 + 80) return;
      var has = placeActions(s, pl2.id).length > 0;
      ctx.globalAlpha = has ? 1 : 0.6;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(pp[0], pp[1] + 24, 40, 10, 0, 0, 7); ctx.fill();
      ctx.fillStyle = shade(pl2.color, 0.78); ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pp[0] - 36, pp[1] - 26, 72, 52, 10); else ctx.rect(pp[0] - 36, pp[1] - 26, 72, 52);
      ctx.fill();
      ctx.fillStyle = pl2.color; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pp[0] - 36, pp[1] - 34, 72, 26, 10); else ctx.rect(pp[0] - 36, pp[1] - 34, 72, 26);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(pp[0] - 8, pp[1] + 4, 16, 22);
      ctx.font = '26px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#000';
      ctx.fillText(pl2.emoji, pp[0], pp[1] - 8);
      var name = pl2.label(s);
      ctx.font = '700 ' + Math.round(12 / k) + 'px system-ui, sans-serif';
      var tw = ctx.measureText(name).width + 12 / k;
      ctx.fillStyle = 'rgba(15,26,32,.82)'; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pp[0] - tw / 2, pp[1] + 32, tw, 18 / k, 6 / k); else ctx.rect(pp[0] - tw / 2, pp[1] + 32, tw, 18 / k);
      ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(name, pp[0], pp[1] + 32 + 13 / k);
      ctx.globalAlpha = 1;
    });
    // target marker
    if (target) {
      var r = 10 + Math.sin(pulse * 8) * 3;
      ctx.strokeStyle = 'rgba(217,83,63,.95)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(target[0], target[1], r, 0, 7); ctx.stroke();
    }
    // player
    var age = G.age(s);
    var sc = age < 5 ? 0.55 : age < 13 ? 0.7 : age < 18 ? 0.88 : 1;
    person(pl.x, pl.y, sc, appearance(s), pl.ph, pl.moving, pl.dir, age, s.name.split(' ')[0]);
    ctx.restore();
    if (night(s)) {
      ctx.fillStyle = 'rgba(12,22,58,.42)';
      ctx.fillRect(0, 0, vw, vh);
    }
  }

  var last = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    time += dt;
    try { update(dt); draw(); } catch (e) { if (window.console) console.error(e); }
    requestAnimationFrame(frame);
  }

  world.attach = function (app, cb) {
    world.app = app; world.cb = cb;
    if (!world.el) build();
    if (!started) { started = true; requestAnimationFrame(frame); }
    setTimeout(resize, 0);
    return world.el;
  };
  // "go to the beach", "I want a job": walk to the place that fits best
  world.goToText = function (text) {
    var s = world.app && world.app.S;
    if (!s) return null;
    var words = String(text || '').toLowerCase().replace(/[^a-z ]+/g, ' ').split(/\s+/);
    var best = null, bs = 0;
    PLACES.forEach(function (p) {
      var keys = (KEYS[p.id] || '').split(' '), sc = 0;
      words.forEach(function (w) { if (w && keys.indexOf(w) >= 0) sc += (w === p.id || w === p.label(s).toLowerCase()) ? 2 : 1; });
      if (p.label(s).toLowerCase().split(' ').every(function (w) { return words.indexOf(w) >= 0; })) sc += 2;
      if (sc > bs) { bs = sc; best = p; }
    });
    if (!best || !canMove(false)) return null;
    var pp = placePos(best, s);
    var dest = clampWalk([pp[0], pp[1] + 34]);
    target = dest; route = routeTo(dest); keys = {};
    if (inside === best.id) { world.cb.openPlace(best.id); }
    return best.label(s);
  };
  world.places = PLACES;
  world.placeById = placeById;
  world.placeActions = placeActions;
  world.reset = function () { world._s = null; };
  window.GAME.world = world;
})();
