/* Life Choices: voice and typed input. Listens (or reads what you typed) and matches it to the choices on screen.
   Nothing is chosen for you: the best matches come back and you confirm. */
(function () {
  'use strict';
  var G = window.GAME;
  var STOP = {};
  ('i im i\'m ill i\'ll the a an to my me and it its would like want will lets let\'s let please just do going gonna wanna can could should that this then so of for on in at up is am be some something').split(' ').forEach(function (w) { STOP[w] = 1; });
  var GROUPS = [
    ['job', 'work', 'hire', 'hired', 'employ', 'employed', 'career', 'apply', 'application'],
    ['rob', 'robbery', 'steal', 'stealing', 'stole', 'heist', 'robbed', 'theft', 'thief'],
    ['police', 'cop', 'cops', 'officer', 'law'],
    ['fight', 'punch', 'hit', 'attack', 'swing', 'brawl'],
    ['run', 'flee', 'escape', 'bolt', 'sprint'],
    ['comply', 'surrender', 'cooperate', 'give', 'hand', 'obey'],
    ['pay', 'buy', 'purchase', 'afford', 'spend'],
    ['quit', 'resign', 'leave'],
    ['study', 'learn', 'homework', 'cram', 'read'],
    ['school', 'college', 'university', 'campus', 'class', 'classes', 'education'],
    ['home', 'house', 'apartment', 'place'],
    ['gun', 'weapon', 'pistol', 'firearm', 'draw'],
    ['lawyer', 'attorney', 'counsel'],
    ['guilty', 'plead', 'plea', 'confess'],
    ['doctor', 'hospital', 'clinic', 'checkup', 'physician', 'medical'],
    ['baby', 'child', 'kid', 'pregnant', 'kids'],
    ['marry', 'marriage', 'propose', 'proposal', 'wedding', 'engaged'],
    ['date', 'dating', 'romance', 'partner', 'girlfriend', 'boyfriend', 'meet'],
    ['save', 'saving', 'cheap', 'budget'],
    ['drink', 'drinking', 'alcohol', 'beer', 'booze'],
    ['smoke', 'smoking', 'cigarette', 'cigarettes', 'tobacco'],
    ['fit', 'gym', 'exercise', 'workout', 'shape'],
    ['skip', 'ditch', 'cut', 'truant'],
    ['no', 'nope', 'pass', 'decline', 'refuse', 'ignore', 'never'],
    ['yes', 'sure', 'okay', 'accept', 'agree', 'take'],
    ['wait', 'time', 'year', 'years', 'coast', 'rest', 'nothing']
  ];
  var HEAD = {};
  GROUPS.forEach(function (g) { g.forEach(function (w) { HEAD[w] = g[0]; }); });

  function stem(w) {
    if (HEAD[w]) return HEAD[w];
    if (w.length > 5 && /ing$/.test(w)) w = w.slice(0, -3);
    else if (w.length > 4 && /ed$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && /s$/.test(w)) w = w.slice(0, -1);
    return HEAD[w] || w;
  }
  function tokens(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(function (w) { return w && !STOP[w]; }).map(stem);
  }

  // items: [{label, text, cmd}]. Returns the best matches, strongest first.
  function match(heard, items) {
    var hs = tokens(heard);
    if (!hs.length) return [];
    var hset = {};
    hs.forEach(function (w) { hset[w] = 1; });
    var lower = String(heard || '').toLowerCase();
    var scored = items.map(function (it) {
      var ts = tokens(it.text || it.label);
      var lab = tokens(it.label);
      var hit = 0, seen = {};
      ts.forEach(function (w) { if (hset[w] && !seen[w]) { seen[w] = 1; hit += lab.indexOf(w) >= 0 ? 1.4 : 0.7; } });
      var s = hit / Math.sqrt(Math.max(2, ts.length));
      if (lower.indexOf(String(it.label).toLowerCase()) >= 0) s += 2;
      return { item: it, score: s };
    }).filter(function (x) { return x.score > 0.25; });
    scored.sort(function (a, b) { return b.score - a.score; });
    // spoken numbers: "number two", "the second one"
    var nums = { first: 0, one: 0, second: 1, two: 1, third: 2, three: 2, fourth: 3, four: 3, fifth: 4, five: 4 };
    var m = lower.match(/\b(?:option|number|choice|the)?\s*(first|second|third|fourth|fifth|one|two|three|four|five)\b(?:\s+(?:one|option|choice))?/);
    if (m && nums[m[1]] != null && items[nums[m[1]]] && !scored.length) scored.push({ item: items[nums[m[1]]], score: 1 });
    return scored.slice(0, 3).map(function (x) { return x.item; });
  }

  // ---------- listening ----------
  function nativeSR() {
    var c = window.Capacitor;
    if (!c || !(c.isNativePlatform && c.isNativePlatform())) return null;
    try { return (c.Plugins && c.Plugins.SpeechRecognition) || (c.registerPlugin && c.registerPlugin('SpeechRecognition')); } catch (e) { return null; }
  }
  function webSR() { return window.SpeechRecognition || window.webkitSpeechRecognition || null; }
  function supported() { return !!(nativeSR() || webSR()); }

  var live = null;
  // cb(err, text)
  function listen(cb) {
    var n = nativeSR();
    if (n) {
      (async function () {
        try {
          var perm = await n.requestPermissions();
          if (perm && perm.speechRecognition && perm.speechRecognition !== 'granted') { cb('denied'); return; }
          var res = await n.start({ language: 'en-US', maxResults: 3, prompt: 'What do you want to do?', partialResults: false, popup: true });
          var m = res && res.matches && res.matches[0];
          cb(m ? null : 'none', m || '');
        } catch (e) { cb('error'); }
      })();
      return;
    }
    var SR = webSR();
    if (!SR) { cb('unsupported'); return; }
    try {
      if (live) { try { live.abort(); } catch (e) { /* ignore */ } }
      var r = new SR();
      live = r;
      r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1; r.continuous = false;
      var done = false;
      r.onresult = function (ev) {
        done = true;
        var t = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : '';
        cb(t ? null : 'none', t);
      };
      r.onerror = function (ev) { if (done) return; done = true; cb(ev && ev.error === 'not-allowed' ? 'denied' : 'error'); };
      r.onend = function () { if (!done) { done = true; cb('none'); } };
      r.start();
    } catch (e) { cb('error'); }
  }
  function stop() { if (live) { try { live.abort(); } catch (e) { /* ignore */ } live = null; } }

  G.voice = { match: match, listen: listen, stop: stop, supported: supported, tokens: tokens };
})();
