/* Miami Life: adult life. Work, money, relationships, health, older years, and the shared "x" screens. */
(function () {
  'use strict';
  var G = window.GAME, E = G.E, u = G.u, $ = G.fmt$;
  function ins(s) { return !!(s.job && s.job.pay >= 35000); }
  function adult(s) { return u.age(s) >= 18; }

  // ---------- shared fallback and screens ----------
  E({
    id: 'x_quietyear', pool: 'x', title: 'A quiet year', cool: 0,
    text: 'Nothing big happens. You keep your head down, get through the days, and the year goes by.',
    choices: [{ label: 'Keep going', out: [{ text: 'The year goes by.', log: false, time: 12 }] }]
  });

  E({
    id: 'x_offer', pool: 'x', title: 'Job offers', cool: 0,
    text: function (s) {
      var n = (s.offers || []).length;
      return n === 1 ? 'One place gets back to you. Here is what is on the table.' : 'A few places get back to you. Here is what is on the table.';
    },
    choices: function (s) {
      var list = (s.offers || []).map(function (id) {
        var j = G.JOB[id];
        return {
          label: 'Take the ' + j.ladder[0].toLowerCase() + ' job', hint: $(Math.round(j.pay[0] / 1000) * 1000) + ' a year',
          out: [{ text: 'You start work as a ' + j.ladder[0].toLowerCase() + '. The first week is a blur of names and rules.', fx: { job: id, rep: 0, flag: { fired: false } }, log: 'You started working as a ' + j.ladder[0].toLowerCase() + '.', kind: 'milestone', time: 1 }]
        };
      });
      list.push({ label: s.job ? 'Stay where you are' : 'Keep looking', out: [{ text: s.job ? 'You decide to stay put.' : 'You pass and keep looking.', time: s.job ? 0 : 2 }] });
      return list;
    }
  });

  E({
    id: 'x_quit', pool: 'x', title: 'Quit your job?', cool: 0,
    text: 'You are thinking about walking out. It would feel great for about a day.',
    choices: [
      { label: 'Quit', out: [{ text: 'You hand in your notice. The last day is strangely emotional.', fx: { job: null }, log: 'You quit your job.', time: 1 }] },
      { label: 'Stay', out: [{ text: 'You stay. The paycheck matters more than the feeling.', time: 0 }] }
    ]
  });

  E({
    id: 'x_move', pool: 'x', title: 'Moving', cool: 0,
    text: function (s, ctx) {
      var a = G.AREAS[ctx.area];
      return a.name + '. ' + a.flavor + ' Rent runs about ' + $(a.rent * (s.rentMod || 1)) + ' a month. You will need the deposit and the first month.';
    },
    choices: [
      {
        label: 'Move there', cost: function (s, ctx) { return Math.round(G.AREAS[ctx.area].rent * (s.rentMod || 1) * 1.6); },
        out: [{ text: 'You pack up and move. New streets, new faces, new corner store.', fx: { area: '__area', home: 'rent' }, log: 'You moved to a new neighborhood.', time: 1, gen: null }]
      },
      { label: 'Never mind', out: [{ text: 'You decide to stay where you are.', time: 0 }] }
    ]
  });
  // the move needs the chosen area: wrap the outcome so it reads from ctx
  (function () {
    var ev = G.byId.x_move;
    ev.choices[0].out = [{
      gen: function (s, ctx) {
        return { text: 'You pack up and move to ' + G.AREAS[ctx.area].short + '. New streets, new faces, a new corner store.', fx: { area: ctx.area, home: 'rent' }, log: 'You moved to ' + G.AREAS[ctx.area].name + '.', time: 1 };
      }
    }];
  })();

  E({
    id: 'x_side', pool: 'x', title: 'A side hustle', cool: 0,
    text: 'You could use some extra money. There are a few ways to get it.',
    choices: [
      { label: 'Drive for a rideshare app', out: [
        { w: 8, text: 'You drive nights and weekends. It adds up, and so do the miles on your car.', fx: { money: 4500 }, time: 12 },
        { w: 2, text: 'A fender bender wipes out most of what you earned.', fx: { money: 600 }, time: 12 }
      ] },
      { label: 'Sell things online', out: [
        { w: 6, text: 'You find a niche and sell steadily. It is not much, but it is something.', fx: { money: 2600 }, time: 12 },
        { w: 4, text: 'You mostly end up storing boxes in the closet. A small profit.', fx: { money: 700 }, time: 12 }
      ] },
      { label: 'Start a small business', cost: 8000, hint: 'Risky', out: [
        { w: 4, text: 'It takes off. You work too much, but the customers keep coming.', fx: { money: 12000, flag: { business: true } }, log: 'You started a small business that worked.', kind: 'milestone', time: 12 },
        { w: 4, text: 'It limps along and barely covers itself. You learn a lot.', fx: { money: 6000 }, time: 12 },
        { w: 4, text: 'It does not work out. The money is gone and so is a year.', fx: { money: 0 }, log: 'Your business did not make it.', time: 12 }
      ] },
      { label: 'Never mind', out: [{ text: 'You decide you have enough on your plate.', time: 0 }] }
    ]
  });

  E({
    id: 'x_buyhome', pool: 'x', title: 'Buying a home', cool: 0,
    text: function (s) {
      var p = Math.round(G.AREAS[s.area].rent * 140);
      return 'You are ready to look at houses. In ' + G.AREAS[s.area].short + ', a starter home runs about ' + $(p) + '. You need ten percent down plus closing costs.';
    },
    choices: function (s) {
      var base = Math.round(G.AREAS[s.area].rent * 140);
      function opt(mult, label) {
        var price = Math.round(base * mult);
        var cost = Math.round(price * 0.13);
        var mort = Math.round(price * 0.9 * 0.0063 + price * 0.0025);
        return {
          label: label + ' (' + $(price) + ')', hint: $(mort) + ' a month', cost: cost,
          out: [{ text: 'You close on the house. The keys feel heavier than you expected.', fx: { home: 'own', mortgage: mort, flag: { homeValue: price } }, log: 'You bought a home.', kind: 'milestone', time: 2 }]
        };
      }
      return [opt(1, 'Starter home'), opt(1.5, 'Bigger house'), { label: 'Not now', out: [{ text: 'You hold off.', time: 0 }] }];
    }
  });

  E({
    id: 'x_gun', pool: 'x', title: 'A handgun', cool: 0,
    text: 'You could buy a handgun legally. You would need to take it seriously, and it comes with its own risks.',
    choices: [
      { label: 'Buy one', cost: 650, out: [{ text: 'You take the class and pass the check. You buy a handgun, and a lockbox to go with it.', fx: { flag: { armed: true } }, log: 'You bought a handgun.', time: 1 }] },
      { label: 'No', out: [{ text: 'You decide it is not for you.', time: 0 }] }
    ]
  });

  E({
    id: 'x_quit_smoke', pool: 'x', title: 'Quit smoking', cool: 0,
    text: 'You want to quit. Everybody says it is the hardest thing they ever did.',
    choices: [
      { label: 'Cold turkey', out: [
        { w: 3, text: 'You quit, and it is miserable for a month. Then it is not.', fx: { habit: { smoke: 0 } }, log: 'You quit smoking.', kind: 'milestone', time: 6 },
        { w: 7, text: 'You last nine days. The craving wins.', time: 3 }
      ] },
      { label: 'Patches and counseling', cost: 200, out: [
        { w: 5, text: 'The patches take the edge off. A few months in, you are done.', fx: { habit: { smoke: 0 } }, log: 'You quit smoking.', kind: 'milestone', time: 6 },
        { w: 5, text: 'You make it a while and then slip. You are closer than before.', fx: { habit: { smoke: 1 } }, time: 6 }
      ] },
      { label: 'Not right now', out: [{ text: 'You put it off again.', time: 0 }] }
    ]
  });
  E({
    id: 'x_quit_drink', pool: 'x', title: 'Cut back', cool: 0,
    text: 'You want to get a handle on your drinking or drugs. You have tried to and it has not stuck.',
    choices: [
      { label: 'Meetings and support', out: [
        { w: 4, text: 'You find a group that gets it. A year later, you are still going.', fx: { habit: { drink: 0, drugs: 0 }, cure: 'addiction' }, log: 'You got sober.', kind: 'milestone', time: 12 },
        { w: 6, text: 'You go for a few months and then drift away.', fx: { habit: { drink: 1 } }, time: 6 }
      ] },
      { label: 'A treatment program', cost: 6000, out: [
        { w: 6, text: 'You finish the program. It is the hardest thing you have ever done, and it works.', fx: { habit: { drink: 0, drugs: 0 }, cure: 'addiction' }, log: 'You got sober.', kind: 'milestone', time: 12 },
        { w: 4, text: 'You finish, but you slip a few months later. You are closer than before.', fx: { habit: { drink: 1, drugs: 0 } }, time: 12 }
      ] },
      { label: 'Not right now', out: [{ text: 'You are not ready yet.', time: 0 }] }
    ]
  });

  E({
    id: 'x_coast', pool: 'x', title: 'The years go by', cool: 0,
    text: 'You do not push on anything. You let the next few years go by and see where they take you.',
    choices: [{
      label: 'Let time pass',
      out: [{
        gen: function (s) {
          var years = u.ri(s, 2, 4);
          var bits = [];
          var i;
          for (i = 0; i < years; i++) {
            if (s.job && u.chance(s, s.rep >= 0 ? 0.12 : 0.05) && u.promote(s)) { bits.push('You moved up to ' + u.jobTitle(s).toLowerCase() + '.'); }
            if (s.job && u.chance(s, 0.05 + (s.rep < 0 ? 0.05 : 0))) {
              u.fx(s, { job: null, money: 2500, flag: { laidOff: true } });
              bits.push('The company let you go.');
              break;
            }
          }
          var base = years + ' years go by.';
          if (s.job && !bits.length) base += ' You keep showing up at work, and the days stack up.';
          if (!s.job) base += ' Without work, the savings thin out.';
          return { text: base + ' ' + bits.join(' '), time: years * 12, log: years + ' years went by.' };
        }
      }]
    }]
  });

  // ---------- work (pool wrk, ctx.mode = hard | coast) ----------
  E({
    id: 'wrk_normal', pool: 'wrk', title: 'A year at work', w: 2,
    text: 'The year at {job} goes by. You do the work, take the lunches, and pick up the usual gossip.',
    choices: [{ label: 'Keep going', out: [{ text: 'It is a steady year.', log: false }] }]
  });
  E({
    id: 'wrk_praise', pool: 'wrk', title: 'The boss notices', w: function (s, ctx) { return ctx.mode === 'hard' ? 7 : 1; },
    when: function (s) { return !!s.job; },
    text: 'Your manager pulls you aside. They have seen how much you have been doing, and want to talk about what is next.',
    choices: [
      { label: 'Ask for a promotion', out: [
        { w: function (s) { return s.job && s.job.yrs >= 1 ? 6 : 2; }, text: 'It works. They give you a promotion and the pay that goes with it.', fx: { promote: true, rep: 1 }, log: 'You got promoted.', kind: 'milestone' },
        { w: 4, text: 'They say you are close. They give you a small raise and tell you to ask again next year.', fx: { pay: 0.05, rep: 1 } }
      ] },
      { label: 'Ask for a raise', out: [
        { w: 6, text: 'They agree to a raise. It is not huge, but it is real.', fx: { pay: 0.08, rep: 1 } },
        { w: 4, text: 'They say there is no room in the budget. You nod and keep going.' }
      ] },
      { label: 'Just say thanks', out: [{ text: 'You say thanks. They remember you when it comes time for raises.', fx: { rep: 1, pay: 0.03 } }] }
    ]
  });
  E({
    id: 'wrk_boss', pool: 'wrk', title: 'A hard boss', w: 4,
    when: function (s) { return !!s.job; },
    text: 'Your manager has been on your case for weeks. Nothing you do is right.',
    choices: [
      { label: 'Keep quiet and work harder', out: [
        { w: 6, text: 'You work harder and they back off. It is exhausting, but it works.', fx: { rep: 1 } },
        { w: 4, text: 'You work harder and they do not care. You are worn out.' }
      ] },
      { label: 'Speak up', out: [
        { w: 5, text: 'You talk it out with them. It clears the air, and things get better.', fx: { rep: 1 } },
        { w: 5, text: 'It does not go well. They write you up, and you feel the walls closing in.', fx: { rep: -1 } }
      ] },
      { label: 'Start looking elsewhere', out: [{ text: 'You quietly update your résumé and take a few calls.', fx: { fn: function (st) { u.makeOffers(st); } }, next: 'x_offer' }] }
    ]
  });
  E({
    id: 'wrk_layoff', pool: 'wrk', title: 'Layoffs', w: function (s, ctx) { return 1.5 + (s.rep < 0 ? 4 : 0) + (ctx.mode === 'coast' ? 1.5 : 0); },
    when: function (s) { return !!s.job; },
    text: 'There is a meeting nobody wanted. The company is cutting jobs.',
    choices: [
      { label: 'Ask to stay on', out: [
        { w: function (s) { return s.rep >= 1 ? 6 : 3; }, text: 'They keep you. A lot of people did not make it, and the office is quiet.', fx: { rep: 1 } },
        { w: function (s) { return s.rep >= 1 ? 4 : 7; }, text: 'It does not work. You get a box and a final check.', fx: { job: null, money: 2500, flag: { laidOff: true } }, log: 'You got laid off.', kind: 'big' }
      ] },
      { label: 'Take the severance', out: [{ text: 'You take the severance and clear out your desk. It stings, but you have a few months to figure it out.', fx: { job: null, money: 3500, flag: { laidOff: true } }, log: 'You got laid off.', kind: 'big' }] }
    ]
  });
  E({
    id: 'wrk_injury', pool: 'wrk', title: 'Hurt on the job', w: 4,
    when: function (s) { return !!(s.job && G.JOB[s.job.id].risky); },
    text: 'Something gives way at work. A pain shoots through you, and everyone stops what they are doing.',
    choices: [
      { label: 'Report it and see a doctor', out: [
        { w: 6, text: 'You report it. Workers comp covers most of it. You are out for a few weeks.', fx: { cond: 'injury', money: -400 }, log: 'You were injured at work.' },
        { w: 4, text: 'It is a bad one. You lose months of work and your back is never the same.', fx: { cond: 'injury', money: -1500, pay: -0.05 }, log: 'You were badly hurt at work.', kind: 'big' }
      ] },
      { label: 'Tough it out', out: [
        { w: 5, text: 'It heals on its own, mostly. You do not say a word.' },
        { w: 5, text: 'It gets worse. By the time you see someone it is a lasting injury.', fx: { cond: 'injury', money: -2500 }, log: 'An untreated injury became a lasting one.' }
      ] }
    ]
  });
  E({
    id: 'wrk_scheme', pool: 'wrk', title: 'A coworker has an idea', w: 2, cool: 5,
    when: function (s) { return !!s.job && s.job.pay > 25000; },
    text: 'A coworker lays it out. A few fake invoices, a little padding, and nobody would ever notice the money missing.',
    choices: [
      { label: 'Say no', out: [{ text: 'You say no. They do not bring it up again.' }] },
      { label: 'Report it', out: [{ text: 'You tell your manager. They thank you and your coworker is gone by Friday. The office is cold toward you for a while.', fx: { rep: 1, flag: { honest: true } } }] },
      { label: 'Go along with it', out: [
        { w: 6, text: 'The money shows up and nobody blinks. It is almost too easy.', fx: { money: 4500, flag: { sticky: true } }, time: 6 },
        { w: 4, text: 'An audit catches it. Security walks you out, and the police are waiting.', fx: { job: null, case: { off: 'embezzle', evidence: 0.7 } }, next: 'lg_arrest', log: 'You were arrested for stealing from your job.', kind: 'big' }
      ] }
    ]
  });
  E({
    id: 'wrk_poach', pool: 'wrk', title: 'A recruiter calls', w: function (s, ctx) { return ctx.mode === 'hard' ? 5 : 1.5; },
    when: function (s) { return !!s.job; },
    text: 'A recruiter calls out of nowhere. Another company wants you, and they are offering more.',
    choices: [
      { label: 'Take the offer', out: [
        { w: 7, text: 'You make the jump. New place, new title, more money.', fx: { pay: 0.15, rep: 0 }, log: 'You switched companies for more money.' },
        { w: 3, text: 'The new place is not what they said. The money is better, but the culture is awful.', fx: { pay: 0.1, rep: -1 } }
      ] },
      { label: 'Use it to ask for a raise', out: [
        { w: 5, text: 'Your boss matches it, mostly. You stay, with a raise.', fx: { pay: 0.1 } },
        { w: 5, text: 'Your boss does not like being pushed. Things are awkward.', fx: { rep: -1 } }
      ] },
      { label: 'Say no thanks', out: [{ text: 'You stay put.' }] }
    ]
  });
  E({
    id: 'wrk_burnout', pool: 'wrk', title: 'Burned out', w: function (s, ctx) { return ctx.mode === 'hard' ? 4 : 1; },
    when: function (s) { return !!s.job; },
    text: 'You are doing too much for too long. You wake up dreading work.',
    choices: [
      { label: 'Push through', out: [
        { w: 6, text: 'You push through. It passes, mostly, and the work gets noticed.', fx: { rep: 1 } },
        { w: 4, text: 'You crash. A few bad weeks cost you at work and at home.', fx: { rep: -1, habit: { drink: 1 } } }
      ] },
      { label: 'Take time off', out: [{ text: 'You take a week off and spend most of it sleeping. You come back better.', fx: { money: -400 } }] },
      { label: 'Quit', out: [{ text: 'You quit. It is terrifying and wonderful.', fx: { job: null }, log: 'You quit your job.' }] }
    ]
  });
  E({
    id: 'wrk_coworkers', pool: 'wrk', title: 'After work', w: 4,
    when: function (s) { return !!s.job && adult(s); },
    text: 'The people you work with are going out after the shift. Some of them smoke on the back step. They ask you to come along.',
    choices: [
      { label: 'Go along', out: [
        { w: 5, text: 'You have a good night. These people turn into real friends.', fx: { rep: 1 } },
        { w: 3, text: 'You have a few drinks. It becomes a regular thing.', fx: { hup: { drink: 1 }, rep: 1 }, log: 'You started drinking more.' },
        { w: 2, text: 'Somebody offers you a cigarette. It is easier to take than to say no.', fx: { hup: { smoke: 1 } }, log: 'You started smoking.' }
      ] },
      { label: 'Head home', out: [{ text: 'You go home. You miss some of the inside jokes, but you sleep well.' }] }
    ]
  });

  // ---------- money ----------
  E({
    id: 'm_car', age: [18, 85], w: 3, cool: 3, title: 'The car dies',
    text: 'Your car gives out on the highway. The tow truck driver shakes his head before the hood is even up.',
    choices: [
      { label: 'Repair it', cost: 1800, out: [{ text: 'It costs a lot, but the car runs again.' }] },
      { label: 'Buy a used one', hint: 'Finance it', out: [{ text: 'You buy a used car on a loan. It runs fine, but you will be paying for it a while.', fx: { debt: 6000 }, log: 'You bought a used car.' }] },
      { label: 'Go without', out: [
        { w: 5, text: 'You take buses and rides from friends. It is slow, and getting to work is a hassle.', fx: { rep: -1 } },
        { w: 5, text: 'You manage. It takes some planning, but it works out.' }
      ] }
    ]
  });
  E({
    id: 'm_rent', age: [18, 85], w: 3, cool: 3, title: 'Rent goes up',
    when: function (s) { return s.home === 'rent'; },
    text: 'Your landlord sends a letter. The rent is going up, and it is a lot.',
    choices: [
      { label: 'Pay it', out: [{ text: 'You pay it. You do not like it, but moving costs more.', fx: { money: -1200 } }] },
      { label: 'Get a roommate', out: [{ text: 'You find a roommate and split the rent. It costs some privacy but saves real money.', fx: { rentMod: 0.65 }, log: 'You got a roommate to split rent.' }] },
      { label: 'Move somewhere cheaper', out: [{
        gen: function (s) {
          var cheaper = G.AREA_ORDER.filter(function (id) { return G.AREAS[id].rent < G.AREAS[s.area].rent - 200 && id !== 'flats'; });
          if (!cheaper.length) return { text: 'You look around. Nothing is much cheaper that you would want to live in, so you stay.', fx: { money: -600 } };
          var to = u.pick(s, cheaper);
          return { text: 'You find a cheaper place in ' + G.AREAS[to].name + '. It is a hassle, but it helps.', fx: { area: to, money: -900 }, log: 'You moved to ' + G.AREAS[to].name + '.' };
        }
      }] }
    ]
  });
  E({
    id: 'm_medical', age: [20, 85], w: 3, cool: 3, title: 'A surprise bill',
    text: 'A hospital bill arrives. It is more than you expected, and it was from a visit you barely remember.',
    choices: [
      { label: 'Pay it', out: [{ text: 'You pay it off. It hurts.', fx: { money: -2200 } }] },
      { label: 'Set up a payment plan', out: [{ text: 'They set you up on a plan. The bill follows you around for years.', fx: { debt: 3000 } }] },
      { label: 'Ignore it', out: [
        { w: 5, text: 'You ignore it. It goes to collections and your credit takes a hit.', fx: { debt: 3500 }, log: 'A medical bill went to collections.' },
        { w: 5, text: 'You ignore it, and somehow nothing happens. It is a lucky break.' }
      ] }
    ]
  });
  E({
    id: 'm_windfall', age: [18, 90], w: 2, cool: 4, title: 'A bit of luck',
    text: 'You open the mail and there is something unexpected.',
    choices: [{
      label: 'Open it',
      out: [
        { w: 5, text: 'It is a tax refund bigger than you expected.', fx: { money: 1800 } },
        { w: 3, text: 'A relative you barely know left you a little money.', fx: { money: 5000 } },
        { w: 2, text: 'You win a few thousand on a scratch-off. It is a nice day.', fx: { money: 3000 } }
      ]
    }]
  });
  E({
    id: 'm_scam', age: [20, 95], cool: 4, title: 'Too good to be true',
    w: function (s) { return u.age(s) >= 65 ? 6 : 2; },
    text: 'A text says you have won something, or that your account is locked, or that an investment is guaranteed. It sounds real.',
    choices: [
      { label: 'Send the money', out: [
        { w: 8, text: 'It was a scam. The money is gone, and so is some of your pride.', fx: { money: -3000 }, log: 'You were scammed.' },
        { w: 2, text: 'You send a little and get nothing back. At least you caught on before sending more.', fx: { money: -400 } }
      ] },
      { label: 'Ignore it', out: [{ text: 'You delete it. Something about it felt off.' }] },
      { label: 'Report it', out: [{ text: 'You report it to the bank and block the number. You hear later that it was part of a bigger scam.' }] }
    ]
  });
  E({
    id: 'm_invest', age: [24, 70], w: 2, cool: 5, title: 'A hot tip',
    when: function (s) { return s.money > 5000; },
    text: 'A coworker swears by a stock. They are so sure it will double.',
    choices: [
      { label: 'Put in $3,000', cost: 3000, out: [
        { w: 4, text: 'It pays off. You walk away with a nice gain.', fx: { money: 5500 } },
        { w: 4, text: 'It goes nowhere. You get most of your money back, eventually.', fx: { money: 2800 } },
        { w: 3, text: 'It tanks. Most of the money is gone.', fx: { money: 400 } }
      ] },
      { label: 'Put money in an index fund', out: [{ text: 'You set up automatic investing. It is boring, and it works over time.', fx: { money: 1200 }, log: 'You started investing steadily.' }] },
      { label: 'Skip it', out: [{ text: 'You pass. Your money stays where it is.' }] }
    ]
  });
  E({
    id: 'm_casino', age: [21, 80], w: 2, cool: 3, title: 'A night at the casino',
    text: 'Friends invite you to the casino. The drinks are free and the lights are bright.',
    choices: [
      { label: 'Go and bring $300', out: [
        { w: 5, text: 'You lose it all. It was a fun night anyway.', fx: { money: -300 } },
        { w: 3, text: 'You win a few hundred and leave with it. Smart.', fx: { money: 600 } },
        { w: 2, text: 'You win big early, so you stay. By the end, you are down. The next morning, you think about going back.', fx: { money: -800, hup: { gamble: 1 } } }
      ] },
      { label: 'Stay home', out: [{ text: 'You stay home. Your money does too.' }] }
    ]
  });
  E({
    id: 'm_eviction', pool: 'x', title: 'Behind on rent', cool: 0,
    text: 'You are way behind. The landlord posts a notice on your door. You have a few days.',
    choices: [
      { label: 'Move in with family', out: [{ text: 'You move back in with family. It is humbling, but it is a roof.', fx: { home: 'family', money: 0 }, log: 'You lost your place and moved back in with family.', kind: 'big' }] },
      { label: 'Borrow money to catch up', out: [
        { w: 5, text: 'A friend lends you what you need. You are on the hook now, but you keep your place.', fx: { money: 3500, debt: 3500 } },
        { w: 5, text: 'Nobody can help in time. You lose the apartment and end up on a couch.', fx: { home: 'family' }, log: 'You were evicted.', kind: 'big' }
      ] },
      { label: 'Move somewhere very cheap', out: [{ text: 'You find a bad place in The Flats. It is cheap and that is about all you can say for it.', fx: { area: 'flats', home: 'rent', rentMod: 0.7, money: -800 }, log: 'You moved to The Flats.' }] }
    ]
  });

  // ---------- relationships ----------
  E({
    id: 'r_meet', pool: 'x', title: 'Someone new', cool: 0,
    text: 'You meet someone interesting. You are not sure if they feel the same.',
    choices: [
      { label: 'Ask for their number', out: [
        { w: 6, text: 'They say yes. You text all week. You start seeing each other.', fx: { partner: true }, log: 'You started seeing someone.', kind: 'milestone' },
        { w: 4, text: 'They are nice about it, but they are not interested.' }
      ] },
      { label: 'Let it go', out: [{ text: 'You do not say anything. You wonder about it later.' }] }
    ]
  });
  E({
    id: 'r_proposal', pool: 'x', title: 'The big question', cool: 0,
    text: 'You and {partner} have been together a while. You think about it a lot.',
    choices: [
      { label: 'Propose', cost: 3000, out: [
        { w: 8, text: 'They say yes. There is a small wedding, a lot of food, and a long dance.', fx: { flag: { married: true } }, log: 'You got married.', kind: 'milestone', time: 6 },
        { w: 2, text: 'They say they are not ready. It is awkward for a long time, and then they leave.', fx: { partner: null }, log: 'Your proposal was turned down.', kind: 'big', time: 6 }
      ] },
      { label: 'Not yet', out: [{ text: 'You wait.', time: 0 }] }
    ]
  });
  E({
    id: 'r_baby_try', pool: 'x', title: 'A baby?', cool: 0,
    text: 'You and {partner} talk about starting a family. It is a big step.',
    choices: [
      { label: 'Try for a baby', out: [
        { w: 6, text: 'You get the news. A baby is on the way, and then, suddenly, a baby is here.', fx: { kid: 1, money: -2500 }, log: 'You had a child.', kind: 'milestone', time: 12 },
        { w: 4, text: 'It does not happen this year. You keep trying, and keep hoping.', time: 12 }
      ] },
      { label: 'Not yet', out: [{ text: 'You decide to wait.', time: 0 }] }
    ]
  });
  E({
    id: 'r_baby', age: [22, 42], w: 2, cool: 4, title: 'Surprise',
    when: function (s) { return !!s.partner && s.kids.length < 3; },
    text: '{partner} sits you down. You are going to have a baby, and it was not planned.',
    choices: [
      { label: 'You are thrilled', out: [{ text: 'You are scared and thrilled. The nursery goes together slowly, with a lot of help.', fx: { kid: 1, money: -2500 }, log: 'You had a child.', kind: 'milestone', time: 12 }] },
      { label: 'You are terrified', out: [{ text: 'You freak out, and then you calm down. The baby is born healthy, and you are a different person right away.', fx: { kid: 1, money: -2500 }, log: 'You had a child.', kind: 'milestone', time: 12 }] }
    ]
  });
  E({
    id: 'r_breakup', age: [20, 80], w: 3, cool: 3, title: 'Trouble at home',
    when: function (s) { return !!s.partner; },
    text: 'You and {partner} are barely talking. Small things turn into big fights.',
    choices: [
      { label: 'Try counseling', cost: 1500, out: [
        { w: 6, text: 'It helps. You both learn how to talk without yelling.', fx: {}, log: 'You and your partner got counseling.' },
        { w: 4, text: 'It does not save things. You split up.', fx: { partner: null }, log: 'You and your partner split up.', kind: 'big' }
      ] },
      { label: 'End it', out: [{
        gen: function (s) {
          if (s.flags.married) return { text: 'You end it. The divorce takes a year and costs a lot.', fx: { partner: null, money: -u.ri(s, 4000, 12000), flag: { married: false } }, log: 'You got divorced.', kind: 'big', time: 12 };
          return { text: 'You end it. It is sad and it is clean.', fx: { partner: null }, log: 'You and your partner split up.', kind: 'big' };
        }
      }] },
      { label: 'Ignore it', out: [
        { w: 5, text: 'It passes. Mostly.' },
        { w: 5, text: 'It gets worse. By the time you talk, there is not much left to talk about.', fx: { partner: null }, log: 'You and your partner split up.', kind: 'big' }
      ] }
    ]
  });
  E({
    id: 'r_cheat', age: [22, 70], w: 1.5, cool: 5, title: 'A temptation',
    when: function (s) { return !!s.partner; },
    text: 'Someone at work has been flirting with you. It is getting harder to act like you do not notice.',
    choices: [
      { label: 'Walk away', out: [{ text: 'You keep it professional. It is harder than it should be.' }] },
      { label: 'Go for it', out: [
        { w: 7, text: '{partner} finds out. It is the end of things.', fx: { partner: null, flag: { married: false } }, log: 'You cheated and it ended your relationship.', kind: 'big' },
        { w: 3, text: 'Nobody finds out. You feel awful anyway.', fx: { rep: -1 } }
      ] }
    ]
  });
  E({
    id: 'r_kid_trouble', age: [30, 60], w: 3, cool: 4, title: 'A call from school',
    when: function (s) { return s.kids.some(function (k) { var a = u.kidAge(s, k); return a >= 12 && a <= 17; }); },
    text: 'The school calls about {kid}. There has been some trouble.',
    choices: [
      { label: 'Sit down and talk', out: [
        { w: 6, text: 'You talk, and listen. It takes a few tries, but things get better.' },
        { w: 4, text: 'The talk goes nowhere. You try again later.' }
      ] },
      { label: 'Ground them', out: [{ text: 'You ground them. It is a long month, for both of you.' }] },
      { label: 'Let it go', out: [{ text: 'You let it go. It happens again.' }] }
    ]
  });
  E({
    id: 'r_parent_dies', age: [35, 72], w: 2, once: true, title: 'A phone call',
    text: 'The phone rings late at night. A parent has died.',
    choices: [{ label: 'Go to the family', out: [{ text: 'The funeral is long and heavy. There is a small amount of money left, and a lot to sort out.', fx: { money: 6000 }, log: 'A parent passed away.', kind: 'big', time: 3 }] }]
  });
  E({
    id: 'r_friend_help', age: [20, 80], w: 2, cool: 4, title: 'A friend asks for money',
    text: 'A friend from way back calls. They are in a bind and need $1,000.',
    choices: [
      { label: 'Lend it', cost: 1000, out: [
        { w: 6, text: 'They pay you back, with thanks, a few months later.', fx: { money: 1000 } },
        { w: 4, text: 'You never see the money again. The friendship gets strange.' }
      ] },
      { label: 'Say no', out: [{ text: 'You say no. They say they understand, but they do not call as much after that.' }] }
    ]
  });

  // ---------- health ----------
  function condFor(s) {
    var ws = [];
    function add(c, w) { if (s.cond.indexOf(c) < 0) ws.push({ c: c, w: w }); }
    if (s.habits.smoke) { add('lung', 2 + 2 * s.habits.smoke); add('cancer', 1 + 2 * s.habits.smoke); add('heart', 1.5); }
    else { add('heart', 2); add('cancer', 1); add('diabetes', 2); }
    if (s.habits.drink) add('liver', 2 * s.habits.drink);
    if (s.habits.drugs) { add('heart', 2 * s.habits.drugs); add('addiction', 2); }
    if (!ws.length) return 'diabetes';
    return u.wpick(s, ws, function (x) { return x.w; }).c;
  }
  var DEAD = { lung: 'lung disease', cancer: 'cancer', heart: 'a heart attack', liver: 'liver failure', diabetes: 'diabetes complications', addiction: 'addiction' };
  var FATAL_EARLY = { cancer: 0.14, lung: 0.06, heart: 0.08, liver: 0.07, diabetes: 0.01, addiction: 0.02 };
  var FATAL_LATE = { cancer: 0.38, lung: 0.2, heart: 0.25, liver: 0.2, diabetes: 0.05, addiction: 0.06 };
  function healthOutcome(s, early) {
    var c = condFor(s);
    var name = G.COND[c].name;
    var table = early ? FATAL_EARLY : FATAL_LATE;
    var p = table[c] + (u.age(s) > 65 ? 0.08 : 0);
    if (u.chance(s, p)) {
      return { text: 'The tests come back with ' + name + '. The treatment does not work.', die: { cause: 'Died of ' + DEAD[c], kind: 'health', text: 'You fought it, but it was too far along.' }, log: false, time: 12 };
    }
    var bill = u.ri(s, 3000, 12000) * (ins(s) ? 0.3 : 1) * (early ? 0.8 : 1.5);
    return { text: 'The doctor finds ' + name + '. ' + (early ? 'They caught it early and treatment starts right away.' : 'It is further along than it should be, and treatment is rough.') + ' It will be part of your life now.', fx: { cond: c, money: -Math.round(bill) }, log: 'You were diagnosed with ' + name + '.', kind: 'big', time: 12 };
  }
  E({
    id: 'h_scare', pool: 'life', title: 'Something is wrong', age: [20, 99], w: 0, cool: 0,
    when: function () { return false; },
    text: function (s) {
      var pre = s.habits.smoke ? 'You have a cough that will not go away and a tight feeling in your chest.' : s.habits.drink ? 'You have a dull pain in your side that comes and goes.' : 'You have been feeling off for weeks. Something is not right.';
      return pre + ' You have been ignoring it. It is getting harder to.';
    },
    choices: [
      { label: 'Get it checked now', cost: function (s) { return ins(s) ? 250 : 1200; }, out: [{ w: 3, text: 'The tests come back clear. It was stress and a bad habit, and a doctor telling you what to change.', time: 2, log: false }, { w: 7, gen: function (s) { return healthOutcome(s, true); } }] },
      { label: 'Wait and see', out: [{ w: 5, text: 'It goes away on its own. You say nothing and hope it stays that way.', time: 3, log: false }, { w: 5, gen: function (s) { return healthOutcome(s, false); } }] }
    ]
  });
  E({
    id: 'h_flare', pool: 'life', title: 'A flare-up', age: [20, 99], w: 0, cool: 0,
    when: function () { return false; },
    text: function (s) { return s.cond.length ? 'Your ' + G.COND[s.cond[0]].name + ' is acting up again. It has been a while since it was this bad.' : 'You are not feeling well.'; },
    choices: [
      { label: 'See a doctor', cost: function (s) { return ins(s) ? 200 : 900; }, out: [
        { w: 8, text: 'They adjust your treatment. It settles down.', time: 6, log: false },
        { w: 2, gen: function (s) { var c = s.cond[0]; return { text: 'It is worse than they hoped. The treatments do not hold.', die: { cause: 'Died of ' + (DEAD[c] || 'complications'), kind: 'health', text: 'It was a long fight.' }, time: 6 }; } }
      ] },
      { label: 'Tough it out', out: [
        { w: 6, text: 'It passes, mostly.', time: 6, log: false },
        { w: 4, gen: function (s) { var c = s.cond[0]; var p = c === 'cancer' ? 0.35 : 0.14; if (u.chance(s, p)) return { text: 'You wait too long. By the time you are at the hospital, it is too late.', die: { cause: 'Died of ' + (DEAD[c] || 'complications'), kind: 'health', text: 'It might have gone differently if you had gone sooner.' } }; return { text: 'You end up in the hospital for a week, but you pull through.', fx: { money: -4000 }, time: 6 }; } }
      ] }
    ]
  });
  E({
    id: 'h_checkup', pool: 'x', title: 'A checkup', cool: 0,
    text: 'You schedule a full checkup. It is a boring morning and a long waiting room.',
    choices: [{ label: 'Skip it', out: [{ text: 'You cancel. Maybe next year.', time: 1, log: false }] }, {
      label: 'Go to the appointment', cost: 120,
      out: [{
        gen: function (s) {
          if (u.chance(s, 0.18 + (s.habits.smoke ? 0.1 : 0))) {
            var c = condFor(s);
            return { text: 'The doctor spots something early. It is not great news, but it is a lot better than finding out later.', fx: { cond: c === 'cancer' ? 'cancer' : c, money: -Math.round(u.ri(s, 1500, 6000) * (ins(s) ? 0.3 : 1)) }, log: 'A checkup caught a health problem early.', kind: 'big', time: 6 };
          }
          return { text: 'The doctor says you are in decent shape. ' + (s.habits.smoke ? 'They tell you, again, to quit smoking.' : 'They tell you to keep it up.'), time: 3, log: false };
        }
      }]
    }]
  });
  E({
    id: 'h_addiction', pool: 'life', title: 'People are worried', age: [18, 80], w: 6, cool: 4,
    when: function (s) { return s.habits.drink >= 2 || s.habits.drugs >= 2; },
    text: function (s) { return 'The people close to you are worried about your ' + (s.habits.drugs >= 2 ? 'drug use' : 'drinking') + '. You know they are right, a little.'; },
    choices: [
      { label: 'Go to treatment', cost: 6000, out: [
        { w: 6, text: 'You finish the program. It is the hardest thing you have ever done.', fx: { habit: { drink: 0, drugs: 0 }, cure: 'addiction' }, log: 'You got sober.', kind: 'milestone', time: 12 },
        { w: 4, text: 'You finish, and you slip, and you start again. It is not a straight line.', fx: { habit: { drink: 1, drugs: 1 } }, time: 12 }
      ] },
      { label: 'Say you have it handled', out: [
        { w: 4, text: 'You cut back for a while. It does not last.' },
        { w: 6, text: 'It gets worse. A bad few months end with you losing your job.', fx: { job: null, flag: { fired: true } }, log: 'You lost your job to addiction.', kind: 'big' }
      ] },
      { label: 'Ask family for help', out: [
        { w: 4, text: 'They show up for you. It is the push you needed.', fx: { habit: { drink: 1, drugs: 0 } }, log: 'Family helped you cut back.' },
        { w: 6, text: 'They try, but you are not ready. It strains everything.', fx: { partner: null } }
      ] }
    ]
  });

  // ---------- midlife and older ----------
  E({
    id: 'a_midlife', age: [38, 55], w: 2, once: true, title: 'Is this it?',
    text: 'One morning you stare at the ceiling and wonder if this is all there is. It is not a crisis, quite. More like a question.',
    choices: [
      { label: 'Make a big change', out: [
        { w: 5, text: 'You quit what you were doing and start over. It is scary, and for the first time in years you feel awake.', fx: { job: null }, log: 'You walked away from your career for a fresh start.', kind: 'big' },
        { w: 5, text: 'You make a smaller change. A new hobby, a new routine, a few new friends.', fx: { habit: { fit: 1 } } }
      ] },
      { label: 'Spend on something fun', cost: 8000, out: [{ text: 'You buy something shiny. It is fun for a while. The bills show up on time.' }] },
      { label: 'Stay the course', out: [{ text: 'You stay the course. It is not exciting, but it is steady.' }] }
    ]
  });
  E({
    id: 'o_retire', pool: 'ms', at: 65, title: 'Retirement?',
    when: function (s) { return !!s.job && !s.pension; },
    text: 'You are 65. Some people at work are throwing a retirement party for someone else, and you are thinking about your own.',
    choices: [
      { label: 'Retire', out: [{ text: 'You hand in your badge. The first week is great. The second week, you do not know what to do with yourself.', fx: { job: null, pension: 1500 }, fn: function (s) { s.pension = Math.round(900 + 0.014 * (s.stats.topPay || 40000)); }, log: 'You retired.', kind: 'big' }] },
      { label: 'Keep working', out: [{ text: 'You keep working. You like the routine, and the money does not hurt.', time: 0 }] }
    ]
  });
  E({
    id: 'o_social', pool: 'ms', at: 67, once: true, title: 'Your benefits start',
    when: function (s) { return !s.pension; },
    text: 'You are old enough to claim Social Security. It is not a lot, but it comes every month.',
    choices: [{ label: 'Sign up', out: [{ text: 'You sign up. The check is small, but it is steady.', fn: function (s) { s.pension = Math.round(900 + 0.012 * (s.stats.topPay || 30000)); }, log: false, time: 1 }] }]
  });
  E({
    id: 'o_grandkids', age: [58, 90], w: 4, once: true, title: 'Grandchildren',
    when: function (s) { return s.kids.length > 0; },
    text: 'The phone rings. {kid} has news. There is going to be a grandchild.',
    choices: [{ label: 'Celebrate', out: [{ text: 'You are a grandparent. You show up with too many gifts and too many opinions.', log: 'You became a grandparent.', kind: 'milestone', time: 12 }] }]
  });
  E({
    id: 'o_friend', age: [62, 95], w: 3, cool: 4, title: 'Another funeral',
    text: 'A friend you have known for decades passes away. The church is full of people your age.',
    choices: [
      { label: 'Give a few words', out: [{ text: 'You say a few words about them. It helps you more than anyone.' }] },
      { label: 'Stay in the back', out: [{ text: 'You sit in the back and listen. You hold on to your own thoughts.' }] }
    ]
  });
  E({
    id: 'o_fall', age: [70, 95], w: 3, cool: 4, title: 'A bad fall',
    text: 'You lose your footing on the stairs. It happens in a second.',
    choices: [{
      label: 'Call for help',
      out: [
        { w: 6, text: 'You are bruised and sore. The doctor says you were lucky.', fx: { money: -800 }, time: 6 },
        { w: 3, text: 'You break a hip. It is a long recovery and you are never quite the same.', fx: { cond: 'injury', money: -4000 }, log: 'A fall left you with a lasting injury.', kind: 'big', time: 12 },
        { w: 1, text: 'The fall is worse than it looked. You do not recover.', die: { cause: 'Died after a fall', kind: 'accident', text: 'It was sudden.' } }
      ]
    }]
  });
  E({
    id: 'o_reflect', age: [72, 99], w: 5, once: true, title: 'Looking back',
    text: function (s) {
      return 'You sit on the porch and think about the years. ' + (s.kids.length ? 'The kids, the grandkids, the long years. ' : '') + (s.partner ? '{partner} is next to you. ' : 'It is quiet. ') + 'You think about the choices you made, and the ones you did not.';
    },
    choices: [
      { label: 'Smile and close your eyes', out: [{ text: 'You are at peace with most of it. That is more than a lot of people can say.', log: false }] },
      { label: 'Call someone you have not talked to in years', out: [{ text: 'You make the call. It is awkward for a minute, and then it is not.', log: false }] }
    ]
  });
})();
