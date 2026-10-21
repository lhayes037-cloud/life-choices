/* Miami Life: screens. Start screen, story, free menu, map, life panel, history, ending, saving. */
(function () {
  'use strict';
  var G = window.GAME;
  var root = document.getElementById('app');
  var app = { screen: 'boot', tab: 'story', S: null, meta: { past: [], lockUntil: 0 }, sel: null, custom: false, modal: null, darkOpen: false, toast: '', recorded: false, form: null };
  var store = { db: null, uid: null, chain: Promise.resolve(), timer: null };
  window.__app = app;

  // ---------- helpers ----------
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(n) { return G.fmt$(n); }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function cap(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }

  // ---------- saving (shared db when available, localStorage otherwise) ----------
  function docRef(name) { return store.db.doc('data/users/' + store.uid + '/' + name); }
  async function initStore() {
    try {
      if (window.claude && window.claude.use) {
        var db = await window.claude.use('db');
        var user = await window.claude.use('user');
        var uid = db && user ? await user.id() : null;
        if (db && uid) { store.db = db; store.uid = uid; }
      }
    } catch (e) { store.db = null; }
  }
  async function readJson(name, lsKey) {
    if (store.db) {
      try {
        var snap = await docRef(name).get();
        if (snap.exists && snap.data() && snap.data().json) return JSON.parse(snap.data().json);
      } catch (e) { /* fall through */ }
    }
    var raw = lsGet(lsKey);
    if (raw) { try { return JSON.parse(raw); } catch (e) { return null; } }
    return null;
  }
  function writeJson(name, lsKey, obj) {
    var json = JSON.stringify(obj);
    lsSet(lsKey, json);
    if (!store.db) return;
    store.chain = store.chain.then(function () { return docRef(name).set({ v: 1, json: json }); }).catch(function () { /* keep local copy */ });
  }
  function saveSoon() {
    clearTimeout(store.timer);
    store.timer = setTimeout(function () {
      if (app.S) writeJson('save', 'ml_save', app.S);
      writeJson('meta', 'ml_meta', app.meta);
    }, 350);
  }
  function clearSave() { lsSet('ml_save', ''); if (store.db) store.chain = store.chain.then(function () { return docRef('save').set({ v: 1, json: '' }); }).catch(function () {}); }

  // ---------- layout ----------
  function layout() {
    var w = window.innerWidth;
    var l = w < 600 ? 'narrow' : w < 1000 ? 'mid' : 'wide';
    if (root.getAttribute('data-layout') !== l) root.setAttribute('data-layout', l);
  }
  window.addEventListener('resize', layout);
  layout();

  // ---------- start screen ----------
  function locked() { return G.cfg.cooldownDays > 0 && app.meta.lockUntil > Date.now(); }
  function lockText() {
    var d = Math.ceil((app.meta.lockUntil - Date.now()) / 86400000);
    return 'Your last life ended in a reckless act. You can start a new one in ' + d + (d === 1 ? ' day.' : ' days.');
  }
  function defaultForm() { return { name: '', age: 18, area: 'havana', bg: 1, edu: 2, job: '', smoke: false, drink: false }; }
  function startHtml() {
    var h = '<div class="start"><div class="brand">Life <span>Choices</span></div>';
    h += '<p class="tag">Live a whole life in Miami. Every choice follows you, and the same choice can go a different way next time.</p>';
    if (locked()) h += '<div class="panel" style="margin-bottom:14px">' + esc(lockText()) + '</div>';
    if (app.S && !app.S.dead) {
      h += '<div class="panel row" style="justify-content:space-between"><div><b>' + esc(app.S.name) + '</b><div class="note">Age ' + G.age(app.S) + ' in ' + esc(G.area(app.S).name) + '</div></div><button class="btn" data-a="continue">Continue</button></div>';
    }
    h += '<div class="sec">Start from a point in life</div><div class="grid presets">';
    G.PRESETS.forEach(function (p, i) {
      h += '<button class="preset" data-a="preset:' + i + '"' + (locked() ? ' disabled' : '') + '><span class="who">' + esc(p.spec.name) + ', ' + p.spec.age + '</span><b>' + esc(p.title) + '</b><small>' + esc(p.blurb) + '</small></button>';
    });
    h += '</div>';
    h += '<div class="sec">Or make your own</div>';
    if (!app.custom) {
      h += '<button class="btn ghost" data-a="custom">Create a character</button>';
    } else {
      var f = app.form || (app.form = defaultForm());
      h += '<div class="panel"><div class="form">';
      h += '<label>Name<input id="f-name" value="' + esc(f.name) + '" placeholder="Alex Rivera" maxlength="30"></label>';
      h += '<label>Starting age<input id="f-age" type="number" min="0" max="85" value="' + f.age + '"></label>';
      h += '<label>Where in Miami<select id="f-area">' + G.AREA_ORDER.map(function (k) { return '<option value="' + k + '"' + (f.area === k ? ' selected' : '') + '>' + esc(G.AREAS[k].name) + '</option>'; }).join('') + '</select></label>';
      h += '<label>Family money<select id="f-bg">' + G.BACKGROUNDS.map(function (b, i) { return '<option value="' + i + '"' + (+f.bg === i ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select></label>';
      if (f.age >= 18) {
        h += '<label>Education<select id="f-edu">' + [1, 2, 3, 4, 5, 6].map(function (i) { return '<option value="' + i + '"' + (+f.edu === i ? ' selected' : '') + '>' + G.EDU[i] + '</option>'; }).join('') + '</select></label>';
        h += '<label>Job<select id="f-job">' + G.CUSTOM_JOBS.map(function (j) { return '<option value="' + j.id + '"' + (f.job === j.id ? ' selected' : '') + '>' + esc(j.label) + '</option>'; }).join('') + '</select></label>';
      }
      if (f.age >= 16) {
        h += '<label class="check"><input id="f-smoke" type="checkbox"' + (f.smoke ? ' checked' : '') + '> Smokes</label>';
        h += '<label class="check"><input id="f-drink" type="checkbox"' + (f.drink ? ' checked' : '') + '> Drinks</label>';
      }
      h += '</div><div class="row" style="margin-top:16px"><button class="btn" data-a="start-custom"' + (locked() ? ' disabled' : '') + '>Begin</button><button class="btn ghost" data-a="custom-off">Cancel</button></div>';
      h += '<p class="note">A job needs the right education and age. If you do not qualify, you start without it.</p></div>';
    }
    if (app.meta.past && app.meta.past.length) {
      h += '<div class="sec">Past lives</div><div class="past">';
      app.meta.past.slice().reverse().slice(0, 8).forEach(function (p) {
        h += '<div><b>' + esc(p.name) + '</b>, ' + p.age + '. ' + esc(p.cause) + (p.topJob ? '. Best job: ' + esc(p.topJob) : '') + '. ' + esc(p.edu) + '.</div>';
      });
      h += '</div>';
    }
    return h + '</div>';
  }
  function readForm() {
    var f = app.form || (app.form = defaultForm());
    function v(id) { var e = document.getElementById(id); return e; }
    if (v('f-name')) f.name = v('f-name').value;
    if (v('f-age')) f.age = Math.max(0, Math.min(85, parseInt(v('f-age').value, 10) || 0));
    if (v('f-area')) f.area = v('f-area').value;
    if (v('f-bg')) f.bg = +v('f-bg').value;
    if (v('f-edu')) f.edu = +v('f-edu').value;
    if (v('f-job')) f.job = v('f-job').value;
    if (v('f-smoke')) f.smoke = v('f-smoke').checked;
    if (v('f-drink')) f.drink = v('f-drink').checked;
  }
  function beginLife(spec) {
    app.S = G.newState(spec);
    app.recorded = false;
    app.screen = 'game';
    app.tab = 'story';
    app.sel = null;
    app.modal = null;
    saveSoon();
    render();
  }
  function customSpec() {
    readForm();
    var f = app.form;
    var spec = { name: f.name, age: f.age, area: f.area, cls: f.bg };
    if (f.age >= 18) {
      spec.edu = f.edu;
      spec.home = 'rent';
      if (f.edu >= 5) { spec.major = 'liberal'; spec.debt = 15000; }
      if (f.job) {
        var j = G.JOB[f.job];
        if (j && f.edu >= j.min && f.age >= j.minAge) {
          spec.job = f.job;
          if (j.major && f.edu >= 5) spec.major = j.major[0];
        }
      }
    }
    var habits = {};
    if (f.age >= 16 && f.smoke) habits.smoke = 1;
    if (f.age >= 16 && f.drink) habits.drink = 1;
    spec.habits = habits;
    return spec;
  }

  // ---------- game panels ----------
  function groupOrder() {
    return [['life', 'Time'], ['school', 'School'], ['work', 'Work'], ['money', 'Money and home'], ['people', 'People'], ['body', 'Body'], ['risk', 'The rough side']];
  }
  function storyHtml(s) {
    var v = G.view(s);
    var h = '<section class="p-story card story' + (app.tab === 'story' ? '' : '') + '">';
    if (!v) return h + '</section>';
    h += '<div class="stagefoot">' + esc(G.stage(G.age(s))) + ' · ' + G.yr(s) + '</div>';
    if (v.kind === 'event') {
      h += '<h3>' + esc(v.title) + '</h3><p>' + esc(v.text) + '</p><div class="choices">';
      v.choices.forEach(function (c, i) {
        h += '<button class="choice" data-a="choose:' + i + '"' + (c.disabled ? ' disabled' : '') + '><span>' + esc(c.label) + (c.hint ? '<small>' + esc(c.hint) + '</small>' : '') + '</span>' + (c.cost ? '<span class="cost">' + $(c.cost) + '</span>' : '') + '</button>';
      });
      h += '</div>';
    } else if (v.kind === 'result') {
      h += '<h3>' + esc(v.title) + '</h3><p>' + esc(v.text) + '</p>';
      if (v.chips && v.chips.length) h += '<div class="chips">' + v.chips.map(function (c) { return '<span class="chip ' + c.k + '">' + esc(c.t) + '</span>'; }).join('') + '</div>';
      h += '<div class="choices"><button class="choice" data-a="next" style="justify-content:center">' + (v.dead ? 'See how it ended' : 'Continue') + '</button></div>';
    } else if (v.kind === 'free') {
      h += freeHtml(s);
    } else if (v.kind === 'ending') {
      h += endingHtml(s);
    }
    return h + '</section>';
  }
  function freeHtml(s) {
    var acts = G.availableActions(s);
    var h = '<div class="free"><h3>What now?</h3><p class="note">Nothing is forcing your hand. Pick what to do with the next stretch of your life, or open the Map to go out.</p>';
    groupOrder().forEach(function (g) {
      var list = acts.filter(function (a) { return a.group === g[0]; });
      if (!list.length) return;
      h += '<div class="grp"><h4>' + g[1] + '</h4><div class="acts">' + list.map(actHtml(s)).join('') + '</div></div>';
    });
    var dark = acts.filter(function (a) { return a.group === 'reckless'; });
    if (dark.length) {
      h += '<div class="grp"><details class="dark"' + (app.darkOpen ? ' open' : '') + '><summary data-a="dark">Dark roads</summary><p class="note">These are the choices that end lives. You always get a chance to back out, but not always a way out afterward.</p><div class="acts">' + dark.map(actHtml(s, true)).join('') + '</div></details></div>';
    }
    return h + '</div>';
  }
  function actHtml(s, dark) {
    return function (a) {
      var label = typeof a.label === 'function' ? a.label(s) : a.label;
      return '<button class="act' + (dark ? ' dark' : '') + '" data-a="act:' + a.id + '">' + esc(label) + (a.hint ? '<small>' + esc(a.hint) + '</small>' : '') + '</button>';
    };
  }
  function endingHtml(s) {
    var m = G.summary(s);
    var h = '<div class="end"><div class="stagefoot">The end</div><h2>' + esc(m.name) + ', ' + m.age + '</h2><div class="big">' + esc(m.cause) + '. ' + esc(m.text) + '</div>';
    var diff = m.age - m.avg;
    h += '<p>' + (m.reckless ? 'This was a choice that went the way those choices usually go.' : diff >= 0 ? 'You lived ' + (diff === 0 ? 'right at' : diff + ' years past') + ' the average of ' + m.avg + '.' : 'You lived ' + (-diff) + ' years short of the average of ' + m.avg + '.') + '</p>';
    h += '<div class="stat">';
    h += '<span>Education</span><span>' + esc(m.edu) + '</span>';
    h += '<span>Best job</span><span>' + esc(m.topJob || 'None') + '</span>';
    h += '<span>Jobs held</span><span>' + m.jobs + '</span>';
    h += '<span>Money at the end</span><span>' + $(m.net) + '</span>';
    h += '<span>Most you ever had</span><span>' + $(m.peak) + '</span>';
    h += '<span>Children</span><span>' + m.kids + '</span>';
    h += '<span>Partner</span><span>' + esc(m.partner || 'None') + '</span>';
    h += '<span>Arrests / convictions</span><span>' + m.arrests + ' / ' + m.convictions + '</span>';
    h += '<span>Years in prison</span><span>' + m.prisonYears + '</span>';
    h += '<span>Parts of Miami you lived in</span><span>' + m.places + '</span>';
    h += '</div>';
    if (locked()) h += '<p class="note">' + esc(lockText()) + '</p>';
    h += '<div class="row"><button class="btn" data-a="new">Start another life</button></div></div>';
    return h;
  }
  function lifeHtml(s) {
    var a = G.age(s), ar = G.area(s);
    var rows = [];
    function row(k, v) { rows.push('<dt>' + k + '</dt><dd>' + v + '</dd>'); }
    row('Age', a + ' · ' + esc(G.stage(a)));
    row('Money', $(s.money));
    if (s.debt > 50) row('Debt', $(s.debt));
    row('Lives in', esc(ar.short) + (s.home === 'own' ? ' · owns' : s.home === 'rent' ? ' · renting' : ' · family'));
    row('Education', esc(s.edu.inSchool && s.edu.inSchool !== 'hs' ? 'In college' : s.edu.inSchool === 'hs' ? 'In school' : G.EDU[s.edu.level]));
    row('Work', s.prison ? 'In prison' : s.job ? esc(G.jobTitle(s)) + '<br><span class="note">' + $(Math.round(s.job.pay / 100) * 100) + ' a year</span>' : a < 14 ? 'Too young' : 'No job');
    row('Partner', esc(s.partner ? s.partner.name : 'None'));
    row('Children', s.kids.length);
    var tags = [];
    s.cond.forEach(function (c) { tags.push('<span class="tagx bad">' + esc(cap(G.COND[c].name)) + '</span>'); });
    if (s.habits.smoke) tags.push('<span class="tagx">' + (s.habits.smoke > 1 ? 'Heavy smoker' : 'Smoker') + '</span>');
    if (s.habits.drink) tags.push('<span class="tagx">' + (s.habits.drink > 1 ? 'Heavy drinker' : 'Drinks') + '</span>');
    if (s.habits.drugs) tags.push('<span class="tagx bad">Drug use</span>');
    if (s.habits.gamble) tags.push('<span class="tagx">Gambles</span>');
    if (s.habits.fit > 0) tags.push('<span class="tagx">Fit</span>');
    if (s.flags.armed) tags.push('<span class="tagx">Armed</span>');
    row('Health and habits', tags.length ? '<div class="tags">' + tags.join('') + '</div>' : 'Fine');
    var rec = [];
    if (s.wanted) rec.push('<span class="tagx bad">Wanted</span>');
    if (s.record.felony) rec.push('<span class="tagx bad">Felony</span>');
    else if (s.record.convictions) rec.push('<span class="tagx bad">Convicted</span>');
    else if (s.record.arrests) rec.push('<span class="tagx">Arrested</span>');
    row('Record', rec.length ? '<div class="tags">' + rec.join('') + '</div>' : 'Clean');
    return '<section class="p-life card life"><h3>Your life</h3><dl>' + rows.join('') + '</dl></section>';
  }
  function logHtml(s) {
    var items = s.log.slice(-60).reverse();
    return '<section class="p-log card logp"><h3>Your story so far</h3><ul class="log">' + items.map(function (l) {
      return '<li class="' + (l.k === 'big' || l.k === 'milestone' ? 'big' : '') + '"><b>' + l.a + '</b><span>' + esc(l.t) + '</span></li>';
    }).join('') + '</ul></section>';
  }
  function mapHtml(s) {
    var sel = app.sel && G.AREAS[app.sel] ? G.AREAS[app.sel] : G.area(s);
    var h = '<section class="p-map card map"><h3>Miami</h3>';
    h += '<svg class="mapsvg" viewBox="0 0 390 450" role="img" aria-label="Map of Miami areas">';
    h += '<path d="M24 8 L246 8 L258 226 L222 300 L206 442 L24 442 Z" fill="var(--land)"/>';
    h += '<path d="M288 100 L336 112 L342 268 L298 258 Z" fill="var(--land)"/>';
    h += '<path d="M180 124 L302 170 M190 192 L302 170" stroke="var(--road)" stroke-width="5" stroke-linecap="round" fill="none"/>';
    G.AREA_ORDER.forEach(function (k) {
      var a = G.AREAS[k];
      var cls = 'node' + (k === s.area ? ' here' : '') + (sel.id === k ? ' sel' : '') + (a.risk >= 3 ? ' rough' : '');
      var tx = a.lx === 0 ? a.x : a.lx === -1 ? a.x - 16 : a.x + 16;
      var ty = a.lx === 0 ? a.y - 20 : a.y + 5;
      var anc = a.lx === 0 ? 'middle' : a.lx === -1 ? 'end' : 'start';
      h += '<g class="' + cls + '" data-a="sel:' + k + '" tabindex="0" role="button" aria-label="' + esc(a.name) + '"><circle cx="' + a.x + '" cy="' + a.y + '" r="12"/><circle cx="' + a.x + '" cy="' + a.y + '" r="22" fill="transparent" stroke="none"/>';
      h += '<text x="' + tx + '" y="' + ty + '" text-anchor="' + anc + '">' + esc(a.short) + '</text></g>';
    });
    h += '</svg>';
    var free = s.cur && s.cur.kind === 'free';
    h += '<div class="mapinfo"><h4>' + esc(sel.name) + (sel.id === s.area ? ' · you live here' : '') + '</h4><p>' + esc(sel.flavor) + '</p>';
    h += '<div class="facts"><span class="tagx">Rent about ' + $(sel.rent) + '</span><span class="tagx' + (sel.risk >= 3 ? ' bad' : '') + '">' + ['Calm', 'Average', 'Busy', 'Rough'][sel.risk] + '</span><span class="tagx">Nightlife ' + ['none', 'quiet', 'lively', 'wild'][sel.night] + '</span></div>';
    h += '<div class="row"><button class="btn small" data-a="out-day"' + (free ? '' : ' disabled') + '>Go out by day</button><button class="btn small" data-a="out-night"' + (free && G.age(s) >= 16 ? '' : ' disabled') + '>Go out at night</button>';
    if (sel.id !== s.area) h += '<button class="btn small ghost" data-a="move"' + (free && G.age(s) >= 18 ? '' : ' disabled') + '>Move here</button>';
    h += '</div>' + (free ? '' : '<p class="note" style="margin-top:8px">Finish what is in front of you first.</p>') + '</div></section>';
    return h;
  }
  function gameHtml() {
    var s = app.S;
    var panels = [['story', storyHtml(s)], ['map', mapHtml(s)], ['life', lifeHtml(s)], ['log', logHtml(s)]];
    var h = '<div class="game"><header class="top"><div class="who"><h2>' + esc(s.name) + '</h2><small>' + esc(G.stage(G.age(s))) + ' · ' + G.yr(s) + '</small></div><div class="pills">';
    h += '<span class="pill">Age ' + G.age(s) + '</span><span class="pill' + (s.money < 0 ? ' neg' : '') + '">' + $(s.money) + '</span>';
    h += '<span class="pill opt">' + esc(G.area(s).short) + '</span>';
    h += '<button class="menu-btn" data-a="menu" aria-label="Menu">☰</button></div></header><main class="panels">';
    panels.forEach(function (p) {
      var html = p[1].replace('<section class="', '<section data-panel="' + p[0] + '" class="' + (app.tab === p[0] ? 'on ' : ''));
      h += html;
    });
    h += '</main><nav class="tabs" role="tablist">';
    [['story', 'Story'], ['map', 'Map'], ['life', 'Life'], ['log', 'History']].forEach(function (t) {
      h += '<button class="tab" role="tab" aria-selected="' + (app.tab === t[0]) + '" data-a="tab:' + t[0] + '">' + t[1] + '</button>';
    });
    h += '</nav>';
    if (app.modal === 'menu') {
      h += '<div class="modal" data-a="modal-bg"><div class="card"><h3>Menu</h3><p class="note">Your life saves itself after every choice.</p><div class="row"><button class="btn" data-a="to-start">Start screen</button><button class="btn ghost" data-a="close">Close</button></div></div></div>';
    }
    if (app.toast) h += '<div class="toast">' + esc(app.toast) + '</div>';
    return h + '</div>';
  }

  // ---------- render ----------
  function render() {
    layout();
    if (app.screen === 'boot') { root.innerHTML = '<div class="start"><div class="brand">Life <span>Choices</span></div></div>'; return; }
    if (app.screen === 'start') { root.innerHTML = startHtml(); return; }
    if (app.S && app.S.cur && app.S.cur.kind === 'ending' && !app.recorded) recordEnding();
    root.innerHTML = gameHtml();
  }
  function recordEnding() {
    app.recorded = true;
    var m = G.summary(app.S);
    app.meta.past = (app.meta.past || []).concat([{ name: m.name, age: m.age, cause: m.cause, topJob: m.topJob, edu: m.edu }]).slice(-20);
    if (m.reckless && G.cfg.cooldownDays > 0) app.meta.lockUntil = Date.now() + G.cfg.cooldownDays * 86400000;
    clearSave();
    saveSoon();
  }
  function toStory() {
    app.tab = 'story';
    saveSoon();
    render();
    if (root.getAttribute('data-layout') === 'narrow') window.scrollTo(0, 0);
  }

  // ---------- input ----------
  root.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-a]');
    if (!el) return;
    var a = el.getAttribute('data-a');
    var s = app.S;
    var p = a.split(':');
    var cmd = p[0], arg = p.slice(1).join(':');
    if (cmd === 'modal-bg') { if (ev.target === el) { app.modal = null; render(); } return; }
    if (cmd === 'dark') { app.darkOpen = !app.darkOpen; return; }
    if (cmd === 'preset') { if (!locked()) beginLife(Object.assign({}, G.PRESETS[+arg].spec)); return; }
    if (cmd === 'custom') { app.custom = true; render(); return; }
    if (cmd === 'custom-off') { readForm(); app.custom = false; render(); return; }
    if (cmd === 'start-custom') { if (!locked()) beginLife(customSpec()); return; }
    if (cmd === 'continue') { app.screen = 'game'; render(); return; }
    if (cmd === 'new' || cmd === 'to-start') { app.screen = 'start'; app.modal = null; render(); return; }
    if (cmd === 'menu') { app.modal = 'menu'; render(); return; }
    if (cmd === 'close') { app.modal = null; render(); return; }
    if (cmd === 'tab') { app.tab = arg; render(); window.scrollTo(0, 0); return; }
    if (cmd === 'sel') { app.sel = arg; render(); return; }
    if (!s) return;
    if (cmd === 'choose') { if (G.choose(s, +arg)) toStory(); else { flash('You cannot afford that.'); } return; }
    if (cmd === 'next') { G.next(s); toStory(); return; }
    if (cmd === 'act') { G.doAction(s, arg); toStory(); return; }
    if (cmd === 'out-day' || cmd === 'out-night') {
      var ar = app.sel || s.area;
      G.goOut(s, ar, cmd === 'out-night');
      toStory();
      return;
    }
    if (cmd === 'move') { G.moveTo(s, app.sel); toStory(); return; }
  });
  root.addEventListener('keydown', function (ev) {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('g[data-a]')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  root.addEventListener('input', function (ev) {
    if (app.screen === 'start' && ev.target.id === 'f-age') {
      var before = app.form ? app.form.age : 18;
      readForm();
      var crossed = (before >= 18) !== (app.form.age >= 18) || (before >= 16) !== (app.form.age >= 16);
      if (crossed && document.activeElement === ev.target) { /* wait for blur to re-render so typing is not interrupted */ }
    }
  });
  root.addEventListener('change', function (ev) {
    if (app.screen === 'start' && app.custom && ev.target.closest('.form')) { readForm(); render(); }
  });
  function flash(t) {
    app.toast = t; render();
    setTimeout(function () { app.toast = ''; if (app.screen === 'game') render(); }, 1800);
  }

  // ---------- boot ----------
  (async function boot() {
    render();
    await initStore();
    var meta = await readJson('meta', 'ml_meta');
    if (meta) app.meta = Object.assign({ past: [], lockUntil: 0 }, meta);
    var saved = await readJson('save', 'ml_save');
    if (saved && saved.v) {
      app.S = G.migrate(saved);
      app.recorded = !!(app.S.cur && app.S.cur.kind === 'ending') && false;
      app.screen = app.S.dead ? 'start' : 'game';
      if (app.S.dead) app.S = null;
    } else {
      app.screen = 'start';
    }
    render();
  })();
})();
