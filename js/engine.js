/* Miami Life: engine. State, time, money, health, legal, cards and results.
   Content (events, actions) lives in separate files and is registered with GAME.E / GAME.A. */
(function () {
  'use strict';
  var G = (window.GAME = window.GAME || {});

  // ---------- registry ----------
  G.events = [];
  G.byId = {};
  G.pools = {};
  G.actions = [];
  G.actionById = {};
  G.E = function (ev) {
    ev.pool = ev.pool || 'life';
    G.events.push(ev);
    G.byId[ev.id] = ev;
    (G.pools[ev.pool] = G.pools[ev.pool] || []).push(ev);
    return ev;
  };
  G.A = function (a) {
    G.actions.push(a);
    G.actionById[a.id] = a;
    return a;
  };

  // ---------- random (state-based so reloading cannot reroll a result) ----------
  function rnd(s) {
    s.rng = (s.rng + 0x6d2b79f5) | 0;
    var t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function chance(s, p) { return rnd(s) < p; }
  function ri(s, a, b) { return a + Math.floor(rnd(s) * (b - a + 1)); }
  function pick(s, arr) { return arr[Math.floor(rnd(s) * arr.length)]; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function wpick(s, items, wf) {
    var tot = 0, ws = [], i;
    for (i = 0; i < items.length; i++) {
      var w = wf ? wf(items[i]) : 1;
      w = Math.max(0, +w || 0);
      ws.push(w);
      tot += w;
    }
    if (tot <= 0) return null;
    var r = rnd(s) * tot;
    for (i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r < 0) return items[i];
    }
    return items[items.length - 1];
  }
  function fmt$(n) {
    var neg = n < 0;
    var v = Math.round(Math.abs(n));
    var str = '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return neg ? '-' + str : str;
  }

  // ---------- small helpers ----------
  function age(s) { return Math.floor(s.t / 12); }
  function yr(s) { return G.cfg.startYear + Math.floor((s.t - s.t0) / 12); }
  function area(s) { return G.AREAS[s.area] || G.AREAS.havana; }
  function kidAge(s, k) { return Math.floor((s.t - k.born) / 12); }
  function jobTitle(s) { return s.job ? G.JOB[s.job.id].ladder[s.job.lvl] : ''; }
  function recent(s, id, months) { return s.seen[id] != null && s.t - s.seen[id] < months; }
  function newName(s) { return pick(s, G.NAMES); }
  function first(str) { return String(str || '').split(' ')[0]; }
  function stage(a) {
    if (a < 5) return 'Early childhood';
    if (a < 13) return 'Childhood';
    if (a < 18) return 'Teen years';
    if (a < 30) return 'Young adult';
    if (a < 50) return 'Adult';
    if (a < 65) return 'Middle age';
    return 'Later life';
  }

  function vars(s, ctx) {
    var v = {
      name: s.name,
      first: first(s.name),
      age: age(s),
      area: area(s).name,
      areaShort: area(s).short,
      flavor: area(s).flavor,
      job: s.job ? jobTitle(s) : 'your job',
      partner: s.partner ? s.partner.name : 'your partner',
      kid: s.kids.length ? s.kids[0].name : 'your kid',
      offense: s.case ? s.case.name : 'the charge',
      money: fmt$(s.money)
    };
    if (ctx) {
      if (ctx.area && G.AREAS[ctx.area]) {
        v.here = G.AREAS[ctx.area].name;
        v.hereShort = G.AREAS[ctx.area].short;
        v.hereFlavor = G.AREAS[ctx.area].flavor;
      }
      if (ctx.vars) for (var k in ctx.vars) v[k] = ctx.vars[k];
    }
    return v;
  }
  function fill(str, s, ctx) {
    if (typeof str === 'function') str = str(s, ctx || {});
    if (str == null) return '';
    var v = vars(s, ctx);
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; });
  }
  function firstSentence(t) {
    t = String(t || '').trim();
    var m = t.match(/^[^.!?]+[.!?]/);
    var out = m ? m[0] : t;
    return out.length > 150 ? out.slice(0, 147) + '...' : out;
  }
  function addLog(s, text, kind) {
    if (!text) return;
    s.log.push({ a: age(s), y: yr(s), t: text, k: kind || '' });
    if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
  }

  // ---------- jobs ----------
  function payFor(s, id, lvl) {
    var j = G.JOB[id];
    return j.pay[lvl] * (0.94 + rnd(s) * 0.12);
  }
  function setJob(s, spec) {
    if (spec == null) {
      if (s.job) s.flags.lastJob = s.job.id;
      s.job = null;
      return;
    }
    if (typeof spec === 'string') spec = { id: spec, lvl: 0 };
    var lvl = spec.lvl || 0;
    s.job = { id: spec.id, lvl: lvl, yrs: 0, pay: payFor(s, spec.id, lvl) };
    s.stats.jobsHeld++;
    notePeak(s);
  }
  function notePeak(s) {
    if (s.job && s.job.pay > s.stats.topPay) {
      s.stats.topPay = s.job.pay;
      s.stats.topJob = jobTitle(s);
    }
  }
  function promote(s) {
    if (!s.job) return false;
    var j = G.JOB[s.job.id];
    if (s.job.lvl >= j.ladder.length - 1) return false;
    s.job.lvl++;
    s.job.pay = Math.max(s.job.pay * 1.12, payFor(s, s.job.id, s.job.lvl));
    s.job.yrs = 0;
    notePeak(s);
    return true;
  }
  function eligibleJobs(s) {
    var a = age(s);
    return G.JOBS.filter(function (j) {
      if (a < j.minAge) return false;
      if (s.edu.level < j.min) return false;
      if (j.major && j.major.indexOf(s.edu.major) < 0) return false;
      if (j.noFelony && s.record.felony) return false;
      if (s.edu.inSchool && s.edu.inSchool !== 'hs' && j.min >= 4) return false;
      return true;
    });
  }
  function hireOdds(s, j) {
    var p = 0.5;
    if (s.edu.level >= 4) p += 0.08;
    if (s.edu.level >= 5) p += 0.1;
    if (s.edu.level <= 1 && age(s) >= 18) p -= 0.1;
    if (s.edu.grades >= 85) p += 0.05;
    if (s.rep >= 2) p += 0.08;
    if (s.flags.exConvict) p -= 0.05;
    if (s.record.felony) p *= 0.35;
    else if (s.record.convictions > 0) p *= 0.75;
    if (s.flags.fired) p *= 0.85;
    if (j.min === 0) p += 0.15;
    return clamp(p, 0.04, 0.9);
  }
  function makeOffers(s) {
    var jobs = eligibleJobs(s).filter(function (j) { return !s.job || j.id !== s.job.id; });
    var offers = [];
    var pool = jobs.slice();
    var tries = 0;
    while (pool.length && offers.length < 3 && tries < 12) {
      tries++;
      var j = pick(s, pool);
      pool.splice(pool.indexOf(j), 1);
      if (chance(s, hireOdds(s, j))) offers.push(j.id);
    }
    s.offers = offers;
    return offers;
  }

  // ---------- conditions ----------
  function addCond(s, c) {
    if (Array.isArray(c)) { c.forEach(function (x) { addCond(s, x); }); return; }
    if (s.cond.indexOf(c) < 0) s.cond.push(c);
  }
  function cure(s, c) {
    if (Array.isArray(c)) { c.forEach(function (x) { cure(s, x); }); return; }
    var i = s.cond.indexOf(c);
    if (i >= 0) s.cond.splice(i, 1);
  }

  // ---------- family ----------
  function addKid(s, n) {
    for (var i = 0; i < (n || 1); i++) s.kids.push({ name: newName(s), born: s.t });
  }

  // ---------- death ----------
  function die(s, d) {
    if (s.dead) return;
    if (typeof d === 'string') d = { cause: d };
    s.dead = true;
    s.ending = { cause: d.cause || 'Died', kind: d.kind || 'other', text: d.text || '', reckless: !!d.reckless, age: age(s), t: s.t, inPrison: !!s.prison };
    addLog(s, (d.cause || 'Died') + '.', 'big');
  }

  // ---------- legal ----------
  function startPrison(s, years) {
    years = Math.max(0.1, years);
    s.prison = { until: s.t + Math.round(years * 12), years: years };
    s.record.prisonYears += years;
    if (s.job) { s.flags.lastJob = s.job.id; }
    s.job = null;
    s.case = null;
    s.flags.fired = true;
  }
  // mode: 'pd' | 'private' | 'plea'
  function resolveCase(s, mode) {
    var c = s.case;
    if (!c) return { verdict: 'dismissed' };
    var sev = c.sev;
    var pConv = 0.3 + 0.55 * c.evidence;
    if (mode === 'private') pConv -= 0.18;
    if (mode === 'plea') pConv = 1;
    pConv += 0.04 * Math.min(3, s.record.convictions);
    pConv = clamp(pConv, 0.08, 0.96);
    if (rnd(s) > pConv) return { verdict: 'cleared' };
    var range = G.SENT[sev] || [1, 3];
    var base = range[0] + rnd(s) * (range[1] - range[0]);
    var f = mode === 'plea' ? 0.7 : mode === 'private' ? 0.85 : 1;
    f *= 1 + 0.1 * Math.min(4, s.record.convictions);
    var years = base * f;
    if (sev <= 1) return { verdict: 'probation', years: 0 };
    if (sev === 2) {
      if (chance(s, 0.6)) return { verdict: 'probation', years: 0 };
      return { verdict: 'jail', years: Math.max(0.2, Math.round(years * 12) / 12) };
    }
    years = Math.max(1, Math.round(years));
    return { verdict: 'prison', years: years };
  }

  // ---------- effects ----------
  function fx(s, f, ctx) {
    if (!f) return;
    if (f.money) s.money += f.money;
    if (f.debt) s.debt = Math.max(0, s.debt + f.debt);
    if (f.edu) {
      var e = f.edu;
      if (e.grades) s.edu.grades = clamp(s.edu.grades + e.grades, 0, 100);
      if (e.level != null) s.edu.level = Math.max(s.edu.level, e.level);
      if (e.setLevel != null) s.edu.level = e.setLevel;
      if (e.inSchool !== undefined) {
        s.edu.inSchool = e.inSchool;
        if (e.inSchool) s.edu.yrs = 0;
        else delete s.flags.tuition;
      }
      if (e.major) s.edu.major = e.major;
      if (e.need != null) s.edu.need = e.need;
    }
    if (f.job !== undefined) setJob(s, f.job);
    if (f.promote) promote(s);
    if (f.pay && s.job) s.job.pay *= 1 + f.pay;
    if (f.rep) s.rep = clamp(s.rep + f.rep, -4, 4);
    if (f.area) { if (f.area !== s.area) s.stats.moves++; s.area = f.area; s.stats.areas[f.area] = 1; }
    if (f.home) s.home = f.home;
    if (f.mortgage != null) s.mortgage = f.mortgage;
    if (f.rentMod != null) s.rentMod = f.rentMod;
    if (f.habit) for (var k in f.habit) s.habits[k] = f.habit[k];
    if (f.hup) for (var k2 in f.hup) s.habits[k2] = Math.max(s.habits[k2] || 0, f.hup[k2]);
    if (f.cond) addCond(s, f.cond);
    if (f.cure) cure(s, f.cure);
    if (f.flag) for (var k3 in f.flag) { if (f.flag[k3]) s.flags[k3] = f.flag[k3]; else delete s.flags[k3]; }
    if (f.ctr) for (var k4 in f.ctr) s.ctr[k4] = (s.ctr[k4] || 0) + f.ctr[k4];
    if (f.partner !== undefined) {
      if (f.partner === null) s.partner = null;
      else s.partner = { name: f.partner === true ? newName(s) : f.partner, since: s.t, works: chance(s, 0.7) };
    }
    if (f.kid) addKid(s, f.kid === true ? 1 : f.kid);
    if (f.wanted) {
      var wo = G.OFF[f.wanted.off] || { sev: 3, name: 'a crime' };
      s.wanted = { off: f.wanted.off, name: wo.name, sev: wo.sev, evidence: f.wanted.evidence == null ? 0.5 : f.wanted.evidence, until: s.t + 84 };
    }
    if (f.clearWanted) s.wanted = null;
    if (f.case) {
      var o = G.OFF[f.case.off] || { sev: 3, name: 'a crime' };
      s.case = { off: f.case.off, name: o.name, sev: f.case.sev || o.sev, violent: !!o.violent, evidence: f.case.evidence == null ? 0.5 : f.case.evidence };
      s.record.arrests++;
      s.stats.arrests++;
      s.wanted = null;
    }
    if (f.convict) {
      s.record.convictions++;
      if ((s.case && s.case.sev >= 3) || f.convict === 'felony') s.record.felony = true;
      s.case = null;
    }
    if (f.clearCase) s.case = null;
    if (f.prison) startPrison(s, f.prison);
    if (f.queue) f.queue.forEach(function (q) { s.queue.push({ id: q.id, due: s.t + (q.after != null ? q.after : 1), ctx: q.ctx || null }); });
    if (f.dequeue) s.queue = s.queue.filter(function (q) { return q.id !== f.dequeue; });
    if (f.cls != null) s.cls = f.cls;
    if (f.pension != null) s.pension = f.pension;
    if (f.fn) f.fn(s, ctx, api);
  }

  // ---------- time ----------
  function monthly(s) {
    var a = age(s);
    var inc = 0, exp = 0;
    if (!s.prison) {
      if (s.job) inc += (s.job.pay * 0.78) / 12;
      if (s.pension) inc += s.pension;
      if (s.partner && s.partner.works) inc += 1700;
      if (a >= 18) {
        exp += s.home === 'family' ? 350 : 650;
        if (s.home === 'rent') exp += area(s).rent * (s.rentMod || 1);
        if (s.home === 'own') exp += s.mortgage;
        if (s.partner) exp += 450;
        s.kids.forEach(function (k) { if (kidAge(s, k) < 18) exp += 400; });
        var ins = s.job && s.job.pay > 40000 ? 0.5 : 1;
        s.cond.forEach(function (c) { exp += G.COND[c].cost * ins; });
        exp += [0, 150, 300][s.habits.smoke || 0];
        exp += [0, 60, 200][s.habits.drink || 0];
        exp += [0, 220, 650][s.habits.drugs || 0];
        exp += [0, 120, 450][s.habits.gamble || 0];
      }
    }
    s.money += inc - exp;
    if (s.money < 0) s.money *= 1 + 0.16 / 12;
    if (s.debt > 0) {
      s.debt *= Math.pow(1.05, 1 / 12);
      if (s.money > 800 && s.job) {
        var p = Math.min(s.debt, 120);
        s.money -= p;
        s.debt -= p;
      }
    }
    if (s.money > s.stats.peakMoney) s.stats.peakMoney = s.money;
  }

  function hazard(s, a) {
    if (a < 50) return 0;
    var h = 0.003 * Math.exp(0.095 * (a - 50));
    var m = 1 + 0.35 * s.habits.smoke + 0.12 * s.habits.drink + 0.35 * s.habits.drugs;
    s.cond.forEach(function (c) { m *= G.COND[c].mult; });
    if (s.habits.fit > 0) m *= 0.85;
    if (s.habits.fit < 0) m *= 1.15;
    return Math.min(0.9, h * m);
  }
  G.hazard = hazard;

  function naturalDeath(s, a) {
    var c = s.cond;
    if (c.indexOf('cancer') >= 0) return { cause: 'Died of cancer', kind: 'health', text: 'The cancer came back and this time it stayed.' };
    if (c.indexOf('lung') >= 0) return { cause: 'Died of lung disease', kind: 'health', text: 'Your lungs gave out in the end.' };
    if (c.indexOf('heart') >= 0) return { cause: 'Died of heart failure', kind: 'health', text: 'Your heart stopped. It was quick.' };
    if (c.indexOf('liver') >= 0) return { cause: 'Died of liver failure', kind: 'health', text: 'Years of damage caught up with you.' };
    if (a >= 85) return { cause: 'Died of old age', kind: 'natural', text: 'You went peacefully, after a long life.' };
    return { cause: 'Died in your sleep', kind: 'natural', text: 'You went to bed and did not wake up.' };
  }

  function healthRoll(s, a) {
    if (a < 25) return;
    if (s.queue.some(function (q) { return q.id === 'h_scare'; })) return;
    var p = 0.004 + 0.0007 * Math.max(0, a - 35) + 0.016 * s.habits.smoke + 0.009 * s.habits.drink + 0.014 * s.habits.drugs;
    if (s.habits.fit < 0) p += 0.006;
    if (s.habits.fit > 0) p -= 0.003;
    if (s.job && G.JOB[s.job.id].risky) p += 0.003;
    if (chance(s, Math.max(0, p))) s.queue.push({ id: 'h_scare', due: s.t + ri(s, 1, 8) });
    else if (s.cond.length && chance(s, 0.14) && !s.queue.some(function (q) { return q.id === 'h_flare'; })) s.queue.push({ id: 'h_flare', due: s.t + ri(s, 1, 8) });
  }

  function yearly(s) {
    var a = age(s);
    if (s.habits.smoke === 1 && chance(s, 0.08)) s.habits.smoke = 2;
    if (s.habits.drink === 1 && chance(s, 0.05)) s.habits.drink = 2;
    if (s.habits.drugs === 1 && chance(s, 0.14)) s.habits.drugs = 2;
    if (s.edu.inSchool) {
      s.edu.yrs++;
      if (s.edu.inSchool !== 'hs' && typeof s.flags.tuition === 'number') s.debt += s.flags.tuition;
    }
    if (s.job) { s.job.yrs++; s.job.pay *= 1.025; notePeak(s); }
    if (s.wanted && s.t >= s.wanted.until) s.wanted = null;
    // school checks
    var sc = s.edu.inSchool;
    if (sc && sc !== 'hs') {
      var need = s.edu.need || 4;
      if (s.edu.grades < 32 && !s.queue.some(function (q) { return q.id === 'sch_flunk'; })) s.queue.push({ id: 'sch_flunk', due: s.t + 1 });
      else if (s.edu.yrs >= need && !s.queue.some(function (q) { return q.id === 'sch_graduate'; })) s.queue.push({ id: 'sch_graduate', due: s.t + 1 });
    }
    if (s.edu.inSchool === 'hs' && a >= 19) s.edu.inSchool = null; // safety
    // wanted: they come for you eventually
    if (s.wanted && !s.queue.some(function (q) { return q.id === 'lg_caught'; })) {
      if (chance(s, 0.1 + 0.3 * s.wanted.evidence)) s.queue.push({ id: 'lg_caught', due: s.t + ri(s, 1, 9) });
    }
    // broke and renting
    if (s.money < -6000 && s.home === 'rent' && !recent(s, 'm_eviction', 24) && !s.queue.some(function (q) { return q.id === 'm_eviction'; })) {
      s.queue.push({ id: 'm_eviction', due: s.t + 1 });
    }
    healthRoll(s, a);
    // yearly mortality
    if (!s.dead) {
      var h = hazard(s, a);
      if (h > 0 && rnd(s) < h) die(s, naturalDeath(s, a));
    }
  }

  function advance(s, months) {
    months = Math.max(0, Math.round(months || 0));
    for (var i = 0; i < months && !s.dead; i++) {
      s.t++;
      monthly(s);
      if (s.t % 12 === 0) yearly(s);
    }
  }

  // ---------- snapshots and result chips ----------
  function snap(s) {
    return {
      age: age(s), money: s.money, debt: s.debt,
      job: s.job ? s.job.id + ':' + s.job.lvl : '', jobTitle: s.job ? jobTitle(s) : '',
      area: s.area, home: s.home,
      level: s.edu.level, school: s.edu.inSchool, grades: s.edu.grades, major: s.edu.major,
      partner: s.partner ? s.partner.name : '', kids: s.kids.length,
      cond: s.cond.slice(), habits: JSON.parse(JSON.stringify(s.habits)),
      arrests: s.record.arrests, convictions: s.record.convictions, felony: s.record.felony,
      prison: !!s.prison, prisonYears: s.prison ? s.prison.years : 0,
      armed: !!s.flags.armed, wanted: !!s.wanted
    };
  }
  function chips(a, b) {
    var c = [];
    function add(t, k) { c.push({ t: t, k: k || 'n' }); }
    var dm = b.money - a.money;
    if (Math.abs(dm) >= 100) add('Money ' + (dm > 0 ? '+' : '') + fmt$(dm), dm > 0 ? 'good' : 'bad');
    var dd = b.debt - a.debt;
    if (Math.abs(dd) >= 100) add('Debt ' + (dd > 0 ? '+' : '') + fmt$(dd), dd > 0 ? 'bad' : 'good');
    if (a.job !== b.job) {
      if (!b.job) add('No job', 'bad');
      else if (!a.job) add('New job: ' + b.jobTitle, 'good');
      else if (a.job.split(':')[0] === b.job.split(':')[0] && +b.job.split(':')[1] > +a.job.split(':')[1]) add('Promoted: ' + b.jobTitle, 'good');
      else add('New job: ' + b.jobTitle, 'n');
    }
    if (a.area !== b.area) add('Now in ' + G.AREAS[b.area].short, 'n');
    if (a.home !== b.home) add(b.home === 'own' ? 'Own a home' : b.home === 'rent' ? 'Renting' : 'Living with family', 'n');
    if (a.level !== b.level) add(G.EDU[b.level], 'good');
    if (a.school !== b.school) add(b.school ? 'Now in school' : 'Out of school', 'n');
    if (b.grades - a.grades >= 5) add('Grades up', 'good');
    if (a.grades - b.grades >= 5) add('Grades down', 'bad');
    if (!a.partner && b.partner) add('With ' + b.partner, 'good');
    if (a.partner && !b.partner) add('Single again', 'bad');
    if (b.kids > a.kids) add(b.kids - a.kids > 1 ? 'New kids' : 'New child', 'good');
    b.cond.forEach(function (x) { if (a.cond.indexOf(x) < 0) add(G.COND[x].name.charAt(0).toUpperCase() + G.COND[x].name.slice(1), 'bad'); });
    a.cond.forEach(function (x) { if (b.cond.indexOf(x) < 0) add('Recovered from ' + G.COND[x].name, 'good'); });
    ['smoke', 'drink', 'drugs', 'gamble'].forEach(function (h) {
      var nm = { smoke: 'smoking', drink: 'drinking', drugs: 'drug use', gamble: 'gambling' }[h];
      if (b.habits[h] > a.habits[h]) add('More ' + nm, 'bad');
      if (b.habits[h] < a.habits[h]) add('Less ' + nm, 'good');
    });
    if (b.habits.fit > a.habits.fit) add('Getting fit', 'good');
    if (b.arrests > a.arrests) add('Arrested', 'bad');
    if (b.convictions > a.convictions) add('Convicted', 'bad');
    if (!a.felony && b.felony) add('Felony on your record', 'bad');
    if (!a.prison && b.prison) add('Sentenced: ' + (b.prisonYears >= 1 ? Math.round(b.prisonYears) + ' years' : 'under a year'), 'bad');
    if (a.prison && !b.prison) add('Released', 'good');
    if (!a.armed && b.armed) add('Armed', 'n');
    if (!a.wanted && b.wanted) add('Wanted', 'bad');
    if (a.wanted && !b.wanted) add('No longer wanted', 'good');
    if (b.age > a.age) add('Now ' + b.age, 'n');
    return c;
  }

  // ---------- cards ----------
  function eligible(s, ev, ctx) {
    var a = age(s);
    if (ev.age && (a < ev.age[0] || a > ev.age[1])) return false;
    if (ev.at != null && a < ev.at) return false;
    var last = s.seen[ev.id];
    if (last != null) {
      if (ev.once || ev.at != null) return false;
      var cool = (ev.cool != null ? ev.cool : 3) * 12;
      if (s.t - last < cool) return false;
    }
    if (ev.when && !ev.when(s, ctx || {})) return false;
    return true;
  }
  function draw(s, pool, ctx) {
    var c = (G.pools[pool] || []).filter(function (ev) { return eligible(s, ev, ctx); });
    if (!c.length) return null;
    return wpick(s, c, function (ev) {
      var w = ev.w;
      if (typeof w === 'function') w = w(s, ctx || {});
      return w == null ? 1 : w;
    });
  }
  function show(s, id, ctx) {
    s.cur = { kind: 'event', id: id, ctx: ctx || null };
    s.seen[id] = s.t;
  }

  function nextCard(s) {
    if (s.dead) { s.cur = { kind: 'ending' }; return; }
    var a = age(s);
    if (s.prison) {
      if (s.t >= s.prison.until) {
        s.prison = null;
        s.flags.exConvict = true;
        show(s, 'p_release');
        return;
      }
      var pe = draw(s, 'prison');
      show(s, pe ? pe.id : 'p_time');
      return;
    }
    var qi = -1, i;
    for (i = 0; i < s.queue.length; i++) { if (s.queue[i].due <= s.t) { qi = i; break; } }
    if (qi >= 0) {
      var q = s.queue.splice(qi, 1)[0];
      if (G.byId[q.id]) { show(s, q.id, q.ctx); return; }
    }
    var ms = (G.pools.ms || []).filter(function (ev) { return eligible(s, ev); }).sort(function (x, y) { return x.at - y.at; })[0];
    if (ms) { show(s, ms.id); return; }
    var streak = s.ctr.incStreak || 0;
    var pInc = a < 13 ? 1 : a < 18 ? 0.55 : 0.45;
    if (streak >= 2) pInc = 0;
    if ((s.ctr.freeStreak || 0) >= 2) pInc = 1;
    if (a < 13 || rnd(s) < pInc) {
      var ev = draw(s, 'life');
      if (ev) {
        s.ctr.incStreak = streak + 1;
        s.ctr.freeStreak = 0;
        show(s, ev.id);
        return;
      }
    }
    if (a < 13) { show(s, 'c_quiet'); return; }
    s.ctr.incStreak = 0;
    s.ctr.freeStreak = (s.ctr.freeStreak || 0) + 1;
    s.cur = { kind: 'free' };
  }

  function visibleChoices(s, ev, ctx) {
    var list = typeof ev.choices === 'function' ? ev.choices(s, ctx || {}) : ev.choices || [];
    return list.filter(function (c) { return !c.when || c.when(s, ctx || {}); });
  }

  function defaultTime(ev) {
    switch (ev.pool) {
      case 'out': return 1;
      case 'sch': case 'wrk': return 12;
      case 'prison': return 12;
      default: return 6;
    }
  }

  function finish(s, before, ev, ctx, o) {
    var text = fill(o.text, s, ctx);
    var lg = o.log === false ? null : (o.log ? fill(o.log, s, ctx) : firstSentence(text));
    if (lg && !s.dead) addLog(s, lg, o.kind || '');
    var tm = o.time;
    if (tm == null) tm = ev && ev.time != null ? ev.time : ev ? defaultTime(ev) : 0;
    if (typeof tm === 'function') tm = tm(s, ctx);
    if (!s.dead && tm > 0) advance(s, tm);
    var title = ev ? fill(ev.title, s, ctx) : '';
    s.cur = {
      kind: 'result', title: title, text: text,
      chips: chips(before, snap(s)),
      next: s.dead ? null : o.next || null, nextCtx: o.nextCtx || null,
      dead: s.dead
    };
  }

  function applyOutcome(s, o, ctx) {
    fx(s, o.fx, ctx);
    if (o.fn) o.fn(s, ctx, api);
    if (o.die) die(s, o.die);
  }

  G.choose = function (s, idx) {
    var cur = s.cur;
    if (!cur || cur.kind !== 'event') return false;
    var ev = G.byId[cur.id];
    var ctx = cur.ctx || {};
    var ch = visibleChoices(s, ev, ctx)[idx];
    if (!ch) return false;
    var cost = typeof ch.cost === 'function' ? ch.cost(s, ctx) : ch.cost || 0;
    if (cost > 0 && s.money < cost) return false;
    var before = snap(s);
    s.money -= cost;
    var outs = typeof ch.out === 'function' ? ch.out(s, ctx) : ch.out;
    var o = wpick(s, outs, function (x) {
      var w = x.w;
      if (typeof w === 'function') w = w(s, ctx);
      return w == null ? 1 : w;
    }) || outs[0];
    if (o.gen) o = o.gen(s, ctx, api) || { text: '' };
    if (o.time == null && ch.time != null) o.time = ch.time;
    applyOutcome(s, o, ctx);
    finish(s, before, ev, ctx, o);
    return true;
  };

  G.next = function (s) {
    var cur = s.cur;
    if (cur && cur.kind === 'result') {
      if (s.dead || cur.dead) { s.cur = { kind: 'ending' }; return; }
      if (cur.next && G.byId[cur.next]) { show(s, cur.next, cur.nextCtx); return; }
    }
    nextCard(s);
  };

  // actions from the free menu
  G.availableActions = function (s) {
    return G.actions.filter(function (a) { return !a.show || a.show(s); });
  };
  G.doAction = function (s, id, arg) {
    if (!s.cur || s.cur.kind !== 'free') return false;
    var a = G.actionById[id];
    if (!a) return false;
    var before = snap(s);
    var r = a.run(s, api, arg) || {};
    if (r.out) {
      var o = r.out;
      applyOutcome(s, o, {});
      finish(s, before, { title: a.label, pool: 'x', time: r.time != null ? r.time : 12 }, {}, o);
      return true;
    }
    var ev = null;
    if (r.ev) ev = G.byId[r.ev];
    else if (r.pool) {
      ev = draw(s, r.pool, r.ctx);
      if (!ev && r.fallback) ev = G.byId[r.fallback];
    }
    if (!ev) ev = G.byId.x_quietyear;
    show(s, ev.id, r.ctx || null);
    return true;
  };
  G.goOut = function (s, areaId, night) {
    if (!s.cur || s.cur.kind !== 'free') return false;
    var ctx = { area: areaId, night: !!night };
    var ev = draw(s, 'out', ctx) || G.byId.o_nothing;
    show(s, ev.id, ctx);
    return true;
  };
  G.moveTo = function (s, areaId) {
    if (!s.cur || s.cur.kind !== 'free') return false;
    show(s, 'x_move', { area: areaId });
    return true;
  };

  G.view = function (s) {
    var cur = s.cur;
    if (!cur) return null;
    if (cur.kind === 'event') {
      var ev = G.byId[cur.id];
      var ctx = cur.ctx || {};
      var list = visibleChoices(s, ev, ctx).map(function (c) {
        var cost = typeof c.cost === 'function' ? c.cost(s, ctx) : c.cost || 0;
        return {
          label: fill(c.label, s, ctx),
          hint: c.hint ? fill(c.hint, s, ctx) : '',
          cost: cost,
          disabled: cost > 0 && s.money < cost
        };
      });
      return { kind: 'event', title: fill(ev.title, s, ctx), text: fill(ev.text, s, ctx), choices: list, pool: ev.pool, ctx: ctx };
    }
    return cur;
  };

  // ---------- state ----------
  G.newState = function (spec) {
    spec = spec || {};
    var s = {
      v: 1, id: 'L' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
      rng: (Math.random() * 4294967296) | 0,
      name: (spec.name || 'Alex Rivera').trim() || 'Alex Rivera',
      t: 0, t0: 0,
      area: spec.area || 'havana', home: 'family', rentMod: 1, mortgage: 0, pension: 0,
      cls: spec.cls == null ? 1 : spec.cls,
      money: 0, debt: spec.debt || 0,
      edu: { level: 0, inSchool: null, yrs: 0, grades: spec.grades || 60 + Math.floor(Math.random() * 20), major: null, need: 4 },
      job: null, rep: 0, offers: [],
      record: { arrests: 0, convictions: 0, felony: false, prisonYears: 0 },
      wanted: null, case: null, prison: null,
      habits: { smoke: 0, drink: 0, drugs: 0, gamble: 0, fit: 0 },
      cond: [], partner: null, kids: [], flags: {}, ctr: {}, seen: {}, queue: [], log: [],
      cur: null, dead: false, ending: null,
      stats: { peakMoney: 0, jobsHeld: 0, topJob: null, topPay: 0, moves: 0, arrests: 0, areas: {} }
    };
    var a = spec.age || 0;
    s.t = a * 12 + ri(s, 0, 11);
    s.t0 = s.t;
    a = age(s);
    s.stats.areas[s.area] = 1;
    if (a >= 5 && a < 18) s.edu.inSchool = 'hs';
    if (a >= 18) {
      s.edu.level = spec.edu != null ? spec.edu : 2;
      s.edu.major = spec.major || null;
      s.home = spec.home || 'rent';
    } else if (a >= 13 && spec.home) s.home = spec.home;
    if (spec.home === 'own') s.mortgage = Math.round(area(s).rent * 0.85);
    if (spec.roommates) s.rentMod = 0.6;
    s.money = spec.money != null ? spec.money : a >= 18 ? s.cls * 2500 + ri(s, 0, 2000) : ri(s, 0, 150);
    if (spec.job) setJob(s, { id: spec.job, lvl: spec.jobLvl || 0 });
    if (spec.partner) s.partner = { name: newName(s), since: s.t - 12 * ri(s, 1, 4), works: true };
    if (spec.kids) {
      for (var i = 0; i < spec.kids; i++) s.kids.push({ name: newName(s), born: s.t - 12 * ri(s, 4, 12) });
    }
    if (spec.habits) for (var h in spec.habits) s.habits[h] = spec.habits[h];
    s.stats.peakMoney = Math.max(0, s.money);
    var where = area(s).name;
    addLog(s, a === 0 ? 'You were born in ' + where + '.' : 'Your story starts at ' + a + ' in ' + where + '.', 'big');
    nextCard(s);
    return s;
  };

  // fill in anything a newer version expects, so older saves keep working
  G.migrate = function (s) {
    if (!s) return s;
    s.flags = s.flags || {}; s.ctr = s.ctr || {}; s.seen = s.seen || {}; s.queue = s.queue || [];
    s.log = s.log || []; s.cond = s.cond || []; s.kids = s.kids || []; s.offers = s.offers || [];
    s.habits = Object.assign({ smoke: 0, drink: 0, drugs: 0, gamble: 0, fit: 0 }, s.habits || {});
    s.record = Object.assign({ arrests: 0, convictions: 0, felony: false, prisonYears: 0 }, s.record || {});
    s.stats = Object.assign({ peakMoney: 0, jobsHeld: 0, topJob: null, topPay: 0, moves: 0, arrests: 0, areas: {} }, s.stats || {});
    s.stats.areas = s.stats.areas || {};
    s.edu = Object.assign({ level: 0, inSchool: null, yrs: 0, grades: 70, major: null, need: 4 }, s.edu || {});
    if (s.pension == null) s.pension = 0;
    if (s.rentMod == null) s.rentMod = 1;
    if (s.mortgage == null) s.mortgage = 0;
    return s;
  };

  G.summary = function (s) {
    var a = s.ending ? s.ending.age : age(s);
    var big = s.log.filter(function (l) { return l.k === 'big' || l.k === 'milestone'; });
    return {
      name: s.name, age: a, years: a, cause: s.ending ? s.ending.cause : '', text: s.ending ? s.ending.text : '',
      kind: s.ending ? s.ending.kind : '', reckless: s.ending ? s.ending.reckless : false,
      net: Math.round(s.money - s.debt), peak: Math.round(s.stats.peakMoney),
      topJob: s.stats.topJob, jobs: s.stats.jobsHeld,
      kids: s.kids.length, partner: s.partner ? s.partner.name : '',
      arrests: s.record.arrests, convictions: s.record.convictions, prisonYears: Math.round(s.record.prisonYears * 10) / 10,
      places: Object.keys(s.stats.areas).length, edu: G.EDU[s.edu.level],
      avg: G.cfg.lifeExp, highlights: big
    };
  };

  // ---------- api handed to content functions ----------
  var api = {
    rnd: rnd, chance: chance, ri: ri, pick: pick, clamp: clamp, wpick: wpick,
    fmt$: fmt$, age: age, yr: yr, area: area, kidAge: kidAge, jobTitle: jobTitle,
    fx: fx, addLog: addLog, setJob: setJob, promote: promote, makeOffers: makeOffers,
    eligibleJobs: eligibleJobs, hireOdds: hireOdds, resolveCase: resolveCase,
    recent: recent, newName: newName, die: die, fill: fill, advance: advance, stage: stage
  };
  G.api = api;
  G.u = api;
  G.stage = stage;
  G.age = age;
  G.yr = yr;
  G.area = area;
  G.jobTitle = jobTitle;
  G.fmt$ = fmt$;
  G.kidAge = kidAge;
  G.fill = fill;
  G.hireOdds = hireOdds;
  G.eligibleJobs = eligibleJobs;
  G.visibleChoices = visibleChoices;
})();
