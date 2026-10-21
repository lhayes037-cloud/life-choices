/* Miami Life: the city, reckless choices, the legal system, and prison. */
(function () {
  'use strict';
  var G = window.GAME, E = G.E, u = G.u, $ = G.fmt$;
  function A(ctx) { return G.AREAS[(ctx && ctx.area) || 'havana']; }
  function adult(s) { return u.age(s) >= 18; }
  function when(ctx) { return ctx && ctx.night ? 'night' : 'day'; }

  // ---------- going out (pool out, ctx = {area, night}) ----------
  E({
    id: 'o_nothing', pool: 'out', title: function () { return 'Out in the city'; }, w: 2, time: 1,
    text: function (s, ctx) {
      var a = A(ctx);
      return 'You spend the ' + when(ctx) + ' in ' + a.name + '. ' + a.flavor + ' You walk around, eat something, and people watch.';
    },
    choices: [{ label: 'Head back', out: [{ text: 'It is a good, quiet outing. You come home with a clearer head.', log: false }] }]
  });
  E({
    id: 'o_beach', pool: 'out', title: 'A day by the water', w: 6,
    when: function (s, ctx) { return !ctx.night && (ctx.area === 'beach' || ctx.area === 'grove'); },
    text: 'The water is warm and the sky is huge. Groups of friends, couples, and families are everywhere.',
    choices: [
      { label: 'Just relax', out: [
        { w: 6, text: 'You lie in the sun and do nothing. It is the best part of the month.', log: false },
        { w: 2, text: 'You forget the sunscreen. You spend the next week peeling.', log: false }
      ] },
      { label: 'Talk to people', out: [
        { w: 4, text: 'You end up in a volleyball game and make a few new friends.', fx: { rep: 0 }, log: false },
        { w: 3, text: 'Someone you meet knows a place that is hiring.', fx: { fn: function (st) { if (!st.job) u.makeOffers(st); } }, next: 'x_offer', log: false },
        { w: 3, text: 'You meet someone you really click with.', fx: { fn: function (st) { if (!st.partner && u.age(st) >= 17 && u.chance(st, 0.6)) st.partner = { name: u.newName(st), since: st.t, works: true }; } }, log: false }
      ] }
    ]
  });
  E({
    id: 'o_job_lead', pool: 'out', title: 'A lead', w: 4,
    when: function (s, ctx) { return !s.job && !ctx.night && u.age(s) >= 16; },
    text: 'The person at the coffee window knows a manager who is hiring. They say they can put in a word.',
    choices: [
      { label: 'Take them up on it', out: [
        { w: 6, text: 'You make the call and a place gets back to you.', fx: { fn: function (st) { u.makeOffers(st); } }, next: 'x_offer', log: false },
        { w: 4, text: 'The manager already filled the spot. Nothing yet.', log: false }
      ] },
      { label: 'Say thanks, maybe later', out: [{ text: 'You say thanks and keep walking.', log: false }] }
    ]
  });
  E({
    id: 'o_found_wallet', pool: 'out', title: 'A wallet on the ground', w: 2, cool: 5,
    text: 'There is a wallet on the sidewalk. It is stuffed with cash and an ID.',
    choices: [
      { label: 'Return it', out: [
        { w: 6, text: 'You track the owner down. They are so thankful they give you a reward.', fx: { money: 100, flag: { honest: true } }, log: 'You returned a lost wallet.' },
        { w: 4, text: 'You hand it to the front desk at a hotel. Nobody even says thanks, but it feels right.', fx: { flag: { honest: true } }, log: false }
      ] },
      { label: 'Keep the cash', out: [{ text: 'You keep the cash and toss the wallet. It is a few hundred dollars.', fx: { money: 300, flag: { sticky: true } }, log: false }] }
    ]
  });
  E({
    id: 'o_street_night', pool: 'out', title: 'Music in the street', w: 4,
    when: function (s, ctx) { return ctx.night && A(ctx).night >= 2 && adult(s); },
    text: 'Music pours out of every doorway. People are dancing on the sidewalk, and the night feels long.',
    choices: [
      { label: 'Dance and stay out late', out: [
        { w: 5, text: 'It is a great night. You come home at dawn with your shoes in your hand.', fx: { money: -120 }, log: false },
        { w: 3, text: 'You meet someone and trade numbers.', fx: { money: -120, fn: function (st) { if (!st.partner && u.chance(st, 0.4)) st.partner = { name: u.newName(st), since: st.t, works: true }; } }, log: false }
      ] },
      { label: 'Drink a lot', out: [
        { w: 5, text: 'You have a wild night. You do not remember all of it, which is probably for the best.', fx: { money: -180, hup: { drink: 1 } }, log: false },
        { w: 5, text: 'You have a wild night and decide you should drive home.', fx: { money: -180 }, next: 'o_drive_home', log: false }
      ] },
      { label: 'Head home early', out: [{ text: 'You leave while it is still fun. You get a good night of sleep.', log: false }] }
    ]
  });
  E({
    id: 'o_drive_home', pool: 'out', title: 'Keys in your hand', w: 0, when: function () { return false; },
    text: 'You have had too much to drink. Your car is parked right outside, and it would be so easy.',
    choices: [
      { label: 'Call a ride', cost: 40, out: [{ text: 'You pay for a ride home. It is the smart move, and you know it.', log: false }] },
      { label: 'Sleep it off in the car', out: [
        { w: 8, text: 'You sleep it off in the back seat. It is not comfortable, but you wake up fine.', log: false },
        { w: 2, text: 'A cop knocks on your window at 4 a.m. You get a ticket and a warning.', fx: { money: -400 }, log: false }
      ] },
      { label: 'Drive home', out: [
        { w: 58, text: 'You make it home. You are lucky, and part of you knows it.', log: false },
        { w: 22, text: 'Red and blue lights fill your mirror. You blow over the limit and get arrested.', fx: { case: { off: 'dui', evidence: 0.9 } }, next: 'lg_arrest', log: 'You were arrested for drunk driving.' },
        { w: 12, text: 'You run off the road. You walk away hurt, and there are police and a tow truck before you can figure out what happened.', fx: { money: -5000, cond: 'injury', case: { off: 'duiCrash', evidence: 0.85 } }, next: 'lg_arrest', log: 'You crashed while driving drunk.', kind: 'big' },
        { w: 5, text: 'You lose control. It happens in a second.', die: { cause: 'Died in a drunk driving crash', kind: 'accident', reckless: true, text: 'You never made it home.' } },
        { w: 3, text: 'You hit another car. Someone else is badly hurt, and it is your fault. The police do not take long to get there.', fx: { case: { off: 'duiCrash', evidence: 0.95 }, cond: 'injury' }, next: 'lg_arrest', log: 'You hurt someone while driving drunk.', kind: 'big' }
      ] }
    ]
  });
  E({
    id: 'o_robbed', pool: 'out', title: 'Someone steps out of the shadows',
    w: function (s, ctx) { var a = A(ctx); return a.risk * (ctx.night ? 3 : 1) * 1.2; },
    when: function (s, ctx) { return A(ctx).risk >= 1 && adult(s); },
    text: function (s, ctx) {
      return 'It is late in ' + A(ctx).name + '. Two people step in front of you. One of them says to hand it over, and keeps a hand in his jacket.';
    },
    choices: function (s) {
      var list = [
        { label: 'Hand it over', out: [
          { w: 8, text: 'You give them the wallet and phone. They take off. You are shaken, but okay.', fx: { money: -250 }, log: 'You were robbed.' },
          { w: 1.5, text: 'They take it and shove you down anyway. You end up at the ER with a sprained wrist.', fx: { money: -1400, cond: 'injury' }, log: 'You were robbed and hurt.' }
        ] },
        { label: 'Run', out: [
          { w: 5, text: 'You run and do not look back. You get away.', fx: { rep: 0 }, log: 'You got away from a robbery attempt.' },
          { w: 3, text: 'They catch you in the next block. It is bad. You pay for it at the hospital.', fx: { money: -900, cond: 'injury' }, log: 'You were hurt in a robbery.' },
          { w: 2, text: 'They do not chase you. You stand shaking in front of a closed pizza place.', log: false }
        ] },
        { label: 'Fight back', out: [
          { w: 3, text: 'You swing first. They did not expect it, and they run. You are bruised, and proud.', log: 'You fought off a robbery.' },
          { w: 4, text: 'It is a bad fight. They hurt you, and you pay for it at the hospital.', fx: { money: -2500, cond: 'injury' }, log: 'You were hurt in a fight with robbers.' },
          { w: 2, text: 'They take what they want and leave you hurt.', fx: { money: -3200, cond: 'injury' }, log: 'You were robbed and badly hurt.' },
          { w: 0.5, text: 'It goes bad, fast.', die: { cause: 'Killed in a robbery', kind: 'violence', text: 'You fought back, and it cost you everything.' } }
        ] }
      ];
      if (s.flags.armed) {
        list.push({
          label: 'Draw your gun', hint: 'This could change your life',
          out: [{
            gen: function (st, ctx) {
              var a = A(ctx);
              var r = u.rnd(st);
              if (r < 0.45) return { text: 'You draw, and they freeze. Then they run. Your hands shake for an hour.', log: 'You scared off two robbers with your gun.' };
              if (r < 0.8) {
                // shots fired, one of them is hit
                var seen = u.chance(st, 0.3 + 0.5 * a.police);
                var charged = u.chance(st, seen ? 0.35 : 0.5);
                if (charged) return { text: 'Shots are fired, and one of them goes down. Police come and the questions are hard. They arrest you while they sort out what happened.', fx: { case: { off: 'shooting', evidence: 0.3 } }, next: 'lg_arrest', log: 'You shot someone in self-defense and were arrested.', kind: 'big' };
                if (seen) return { text: 'Shots are fired, and one of them goes down. Witnesses back up your story, and the police clear you that night. You will not forget it.', log: 'You shot someone in self-defense. Police cleared you.', kind: 'big', time: 2 };
                return { text: 'Shots are fired and one of them goes down. Nobody else is around. You leave in a panic, and the not-knowing eats at you.', fx: { wanted: { off: 'shooting', evidence: 0.2 } }, log: 'You shot someone in self-defense and left the scene.', kind: 'big', time: 2 };
              }
              if (r < 0.95) return { text: 'They have a gun too, and they use it. You end up in surgery and in debt for years.', fx: { money: -9000, cond: 'injury' }, log: 'You were shot in a robbery.', kind: 'big' };
              return { text: 'It is over before you can think.', die: { cause: 'Killed in a shootout', kind: 'violence', text: 'You drew your gun, and so did they.' } };
            }
          }]
        });
      }
      return list;
    }
  });
  E({
    id: 'o_fight', pool: 'out', title: 'A guy is in your face', w: 4,
    when: function (s, ctx) { return ctx.night && A(ctx).night >= 2 && adult(s); },
    text: 'A stranger bumps into you, and then has something to say about it. His friends are watching.',
    choices: [
      { label: 'Walk away', out: [{ text: 'You walk away. He yells something. You keep walking, and nothing happens.', log: false }] },
      { label: 'Throw the first punch', out: [
        { w: 4, text: 'A quick scuffle, and a bouncer throws you both out. That is it.', log: false },
        { w: 3, text: 'You get hit harder than you hit. The ER bill is not fun.', fx: { money: -1200 }, log: 'You got in a fight and ended up in the ER.' },
        { w: 2, text: 'The police show up. You are arrested for assault.', fx: { case: { off: 'assault', evidence: 0.55 } }, next: 'lg_arrest', log: 'You were arrested for a bar fight.', kind: 'big' },
        { w: 0.6, text: 'You hit him wrong. He goes down hard, and he does not get up for a while. The police are there in minutes.', fx: { case: { off: 'assault', evidence: 0.85, sev: 4 } }, next: 'lg_arrest', log: 'You seriously hurt someone in a fight.', kind: 'big' }
      ] },
      { label: 'Tell security', out: [{ text: 'You flag down security. They handle it. You get a free drink for your trouble.', log: false }] }
    ]
  });
  E({
    id: 'o_car_stolen', pool: 'out', title: 'Broken glass', w: function (s, ctx) { return 1 + A(ctx).risk; },
    when: function (s) { return adult(s) && !s.flags.noCar; },
    text: 'You come back to your car and there is glass all over the seat. A bag and the stereo are gone.',
    choices: [
      { label: 'File a report', out: [{ text: 'You file a report. Nothing ever comes of it, but the insurance covers part of it.', fx: { money: -400 }, log: false }] },
      { label: 'Just fix it', out: [{ text: 'You sweep up the glass and pay to fix the window. It is a hassle.', fx: { money: -600 }, log: false }] }
    ]
  });
  E({
    id: 'o_wrong_place', pool: 'out', title: 'Shots in the distance', w: function (s, ctx) { return A(ctx).risk >= 3 ? 5 : 0; },
    when: function (s, ctx) { return ctx.night && A(ctx).risk >= 3; },
    text: 'You hear a few sharp cracks a couple of blocks away. Then a car peels out.',
    choices: [
      { label: 'Get down and wait', out: [
        { w: 9, text: 'You stay low for ten minutes. Then the street is quiet again.', log: false },
        { w: 0.6, text: 'A stray round hits near you. You wake up in a hospital bed.', fx: { money: -7000, cond: 'injury' }, log: 'You were hit by a stray bullet.', kind: 'big' }
      ] },
      { label: 'Leave the area fast', out: [{ text: 'You walk away fast, and do not look back.', log: false }] },
      { label: 'Go see what happened', out: [
        { w: 4, text: 'You see something you should not have. Police take your name as a witness.', next: 'o_witness', log: false },
        { w: 4, text: 'You see an ambulance and a lot of people standing around. You are glad you are not in the story.', log: false },
        { w: 0.6, text: 'You walk up at the wrong time.', die: { cause: 'Killed in a shooting', kind: 'violence', text: 'You were in the wrong place at the wrong time.' } }
      ] }
    ]
  });
  E({
    id: 'o_witness', pool: 'out', title: 'The detective', w: 0, when: function () { return false; },
    text: 'A detective asks what you saw. You could help them, and it could cost you.',
    choices: [
      { label: 'Tell the whole truth', out: [
        { w: 6, text: 'You tell them all of it. Things go quiet after that.', fx: { flag: { honest: true } }, log: 'You gave police a statement.' },
        { w: 4, text: 'You tell them what you saw. Weeks later, someone leaves a threat on your door.', fx: { flag: { honest: true }, money: -600 }, log: 'You were threatened after talking to police.' }
      ] },
      { label: 'Say you saw nothing', out: [{ text: 'You say you saw nothing. The detective gives you a card anyway.', log: false }] }
    ]
  });
  E({
    id: 'o_police_stop', pool: 'out', title: 'Police stop you', w: function (s) { return s.wanted ? 8 : 0.6; },
    when: function (s) { return !!(s.wanted || s.record.convictions); },
    text: 'A patrol car pulls up. The officer asks for your ID and says they have to run it.',
    choices: [
      { label: 'Cooperate', out: [{
        gen: function (s) {
          if (s.wanted && u.chance(s, 0.65)) return { text: 'The officer comes back, and the tone is different. You are placed under arrest.', fx: { case: { off: s.wanted.off, evidence: Math.min(0.95, s.wanted.evidence + 0.15) } }, next: 'lg_arrest', log: 'Police caught up with you.', kind: 'big' };
          return { text: 'The officer hands the ID back and tells you to have a good night. Your heart is pounding.', log: false };
        }
      }] }
    ]
  });
  E({
    id: 'o_crew_offer', pool: 'out', title: 'The crew has a plan', w: 8,
    when: function (s) { return !!s.flags.crew && adult(s); },
    text: 'Someone from your crew pulls you aside. They have a plan for a quick score, and they need one more person.',
    choices: [
      { label: 'Pass', out: [{ text: 'You say no. They say fine, but they look at you differently after that.', log: false }] },
      { label: 'Go along', out: [{ text: 'You say yes before you can change your mind.', next: 'rk_store', log: false, time: 0 }] }
    ]
  });

  // ---------- reckless choices (pool rk) ----------
  var BACK = { label: 'Back out', out: [{ text: 'You think it over and change your mind. You walk away.', time: 1, log: false }] };
  E({
    id: 'rk_shoplift', pool: 'rk', title: 'Shoplifting', w: 1,
    text: 'You are in a store with a lot of things you cannot afford. The cameras are not exactly new.',
    choices: [
      { label: 'Take it', out: [
        { w: 6, text: 'You walk out with it. Your heart pounds for an hour.', fx: { money: 120, flag: { sticky: true } }, log: false, time: 1 },
        { w: 4, text: 'A guard stops you at the door. Police are there in a few minutes.', fx: { case: { off: 'shoplift', evidence: 0.6 } }, next: 'lg_arrest', log: 'You were arrested for shoplifting.', time: 1 }
      ] },
      BACK
    ]
  });
  E({
    id: 'rk_store', pool: 'rk', title: 'Robbing a store', w: 1,
    text: 'You are standing outside a corner store. You tell yourself it will be quick. The worst part is that you almost believe it.',
    choices: [
      { label: 'Go in', out: [
        { w: 62, text: 'It goes wrong almost at once. Police are there within minutes, and you are on the ground with cuffs on.', fx: { case: { off: 'store', evidence: 0.85 } }, next: 'lg_arrest', log: 'You were arrested for robbing a store.', kind: 'big', time: 1 },
        { w: 22, text: 'It ends fast, and badly.', die: { cause: 'Killed during a robbery', kind: 'violence', reckless: true, text: 'You did not make it out of the store.' } },
        { w: 16, text: 'You get out with some cash. Your hands are shaking. You know the store has cameras, and that this is not over.', fx: { money: 600, wanted: { off: 'store', evidence: 0.6 } }, log: 'You robbed a store and got away, for now.', kind: 'big', time: 3 }
      ] },
      BACK
    ]
  });
  E({
    id: 'rk_bank', pool: 'rk', title: 'Robbing a bank', w: 1,
    text: 'You have thought about it too much. Banks have cameras, alarms, and police a few blocks away. You know that. You are standing outside anyway.',
    choices: [
      { label: 'Go in', out: [
        { w: 55, text: 'The alarm is silent and the police are fast. You are in handcuffs before you reach the car.', fx: { case: { off: 'bank', evidence: 0.92 } }, next: 'lg_arrest', log: 'You were arrested for robbing a bank.', kind: 'big', time: 1 },
        { w: 27, text: 'It does not end the way you planned.', die: { cause: 'Killed during a bank robbery', kind: 'violence', reckless: true, text: 'The police were there almost at once.' } },
        { w: 18, text: 'You get away with the money. For now. The news says the FBI is on it, and every car that slows down on your street makes your stomach drop.', fx: { money: 32000, wanted: { off: 'bank', evidence: 0.9 } }, log: 'You robbed a bank and got away, for now.', kind: 'big', time: 3 }
      ] },
      BACK
    ]
  });
  E({
    id: 'rk_car', pool: 'rk', title: 'Stealing a car', w: 1,
    text: 'A nice car is parked on a quiet street with the window cracked. You could be gone in a minute.',
    choices: [
      { label: 'Take it', out: [
        { w: 50, text: 'A patrol car is two blocks away. You get arrested before you reach the highway.', fx: { case: { off: 'carTheft', evidence: 0.75 } }, next: 'lg_arrest', log: 'You were arrested for stealing a car.', kind: 'big', time: 1 },
        { w: 6, text: 'You lose control on a turn. It happens so fast.', die: { cause: 'Died in a crash while fleeing', kind: 'accident', reckless: true, text: 'You were not going to make it far.' } },
        { w: 44, text: 'You get away with it and sell the car for a couple thousand. Somewhere, a person is missing their car, and the police are looking.', fx: { money: 2500, wanted: { off: 'carTheft', evidence: 0.35 } }, log: 'You stole a car and sold it.', time: 2 }
      ] },
      BACK
    ]
  });
  E({
    id: 'rk_assault', pool: 'rk', title: 'Attacking someone', w: 1,
    text: 'You are angry and there is nobody to be angry at. Somebody walks by and you think about it for one second too long.',
    choices: [
      { label: 'Do it', out: [
        { w: 85, text: 'It is over fast. The person is taken to the hospital. The police were close, and someone saw everything. You are arrested on the spot.', fx: { case: { off: 'assault', evidence: 0.92 } }, next: 'lg_arrest', log: 'You were arrested for attacking a stranger.', kind: 'big', time: 1 },
        { w: 5, text: 'It goes wrong in a way you did not expect.', die: { cause: 'Killed in a street attack', kind: 'violence', reckless: true, text: 'It ended almost as soon as it started.' } },
        { w: 10, text: 'You run before anyone can stop you. You are not sure if anyone saw your face.', fx: { wanted: { off: 'assault', evidence: 0.6 } }, log: 'You attacked someone and ran.', kind: 'big', time: 2 }
      ] },
      BACK
    ]
  });
  E({
    id: 'rk_deal', pool: 'rk', title: 'Selling drugs', w: 1,
    text: 'There is money in it, and you know where to get the product. You also know how this usually ends.',
    choices: [
      { label: 'Start dealing', out: [
        { w: 4, text: 'Money comes in fast. So does a certain kind of attention.', fx: { money: 3500, flag: { crew: true } }, log: 'You started selling drugs.', kind: 'big', time: 6 },
        { w: 4, text: 'An undercover officer is your second customer. You are arrested.', fx: { case: { off: 'dealing', evidence: 0.7 } }, next: 'lg_arrest', log: 'You were arrested for selling drugs.', kind: 'big', time: 1 },
        { w: 2, text: 'Someone robs you and takes the product and the cash. You owe now.', fx: { money: -1800, cond: 'injury' }, log: 'You were robbed while dealing.', time: 3 },
        { w: 0.6, text: 'It goes bad.', die: { cause: 'Killed in a drug deal', kind: 'violence', reckless: true, text: 'You owed the wrong people.' } }
      ] },
      BACK
    ]
  });
  E({
    id: 'rk_fraud', pool: 'rk', title: 'Card fraud', w: 1,
    text: 'You know how to get card numbers, and you know how to use them. It feels like nobody gets hurt.',
    choices: [
      { label: 'Run the scam', out: [
        { w: 6, text: 'It works for months. A lot of money, a lot of nerves.', fx: { money: 6500, wanted: { off: 'fraud', evidence: 0.45 } }, log: 'You ran a card scam.', kind: 'big', time: 6 },
        { w: 4, text: 'The bank flags the accounts fast. Police show up at your door.', fx: { case: { off: 'fraud', evidence: 0.7 } }, next: 'lg_arrest', log: 'You were arrested for fraud.', kind: 'big', time: 3 }
      ] },
      BACK
    ]
  });

  // ---------- the legal system ----------
  function verdictOut(s, mode) {
    var c = s.case;
    if (!c) return { text: 'The case is dropped.', time: 1 };
    var minor = u.age(s) < 18;
    var r = u.resolveCase(s, mode);
    var nm = c.name;
    if (r.verdict === 'cleared') {
      return { text: (mode === 'private' ? 'Your lawyer pulls the case apart piece by piece. ' : 'The case falls apart. ') + 'You walk out free. The arrest is still on your record.', fx: { clearCase: true }, log: 'Charges for ' + nm + ' were dropped.', kind: 'big', time: 4 };
    }
    if (minor) {
      if (r.verdict === 'prison' || r.verdict === 'jail') {
        var y = r.verdict === 'prison' ? Math.min(3, Math.max(1, Math.round(r.years / 4))) : 0.5;
        return { text: 'A juvenile judge sends you to a youth detention center for ' + (y < 1 ? 'about six months' : y + ' years') + '. The records are sealed, but the time is real.', fx: { clearCase: true, prison: y }, log: 'You were sent to youth detention.', kind: 'big', time: 0 };
      }
      return { text: 'The judge gives you probation. Your records are sealed because you are a minor.', fx: { clearCase: true }, log: 'You got probation as a minor.', kind: 'big', time: 6 };
    }
    if (r.verdict === 'probation') {
      return { text: 'You are convicted of ' + nm + ', and get probation and a fine. You walk out, but the conviction stays on your record.', fx: { convict: true, money: -u.ri(s, 600, 3000) }, log: 'You were convicted of ' + nm + ' and put on probation.', kind: 'big', time: 6 };
    }
    if (r.verdict === 'jail') {
      return { text: 'You are convicted of ' + nm + ' and sentenced to about ' + Math.max(1, Math.round(r.years * 12)) + ' months in jail.', fx: { convict: true, prison: r.years }, log: 'You were sentenced to jail for ' + nm + '.', kind: 'big', time: 0 };
    }
    return { text: 'You are convicted of ' + nm + '. The judge sentences you to ' + r.years + ' years in prison.' + (mode === 'plea' ? ' Pleading guilty took a little off.' : ''), fx: { convict: true, prison: r.years }, log: 'You were sentenced to ' + r.years + ' years in prison for ' + nm + '.', kind: 'big', time: 0 };
  }
  E({
    id: 'lg_arrest', pool: 'lg', title: 'In custody',
    text: function (s) {
      var c = s.case;
      if (!c) return 'The charges are dropped before they ever go anywhere.';
      var t = 'You are booked for ' + c.name + '. ';
      t += c.evidence >= 0.7 ? 'The evidence against you looks strong. ' : c.evidence <= 0.4 ? 'The evidence is thin. ' : 'It is not a clear case either way. ';
      if (u.age(s) < 18) t += 'You are a minor, so this goes through juvenile court. ';
      t += 'You can take the public defender, hire a lawyer, or plead guilty and take whatever deal they offer.';
      return t;
    },
    choices: [
      { label: 'Take the public defender', out: [{ gen: function (s) { return verdictOut(s, 'pd'); } }] },
      { label: 'Hire a private lawyer', hint: 'Better odds', cost: function (s) { return 6000 + (s.case ? s.case.sev : 2) * 3000; }, out: [{ gen: function (s) { return verdictOut(s, 'private'); } }] },
      { label: 'Plead guilty', hint: 'A shorter sentence, a sure conviction', out: [{ gen: function (s) { return verdictOut(s, 'plea'); } }] }
    ]
  });
  E({
    id: 'lg_caught', pool: 'lg', title: 'A knock at the door', w: 0, when: function () { return false; },
    text: function (s) { return 'Police are on the porch. They have been looking for you for a long time, and they are here about ' + (s.wanted ? s.wanted.name : 'an old case') + '.'; },
    choices: [
      { label: 'Surrender', out: [{ gen: function (s) { var w = s.wanted; if (!w) return { text: 'They have the wrong house. For now.', time: 1 }; return { text: 'You open the door and put your hands out. It is almost a relief.', fx: { case: { off: w.off, evidence: Math.min(0.95, w.evidence + 0.15) } }, next: 'lg_arrest', log: 'Police caught up with you.', kind: 'big', time: 1 }; } }] },
      { label: 'Run', out: [
        { w: 4, gen: function (s) { return { text: 'You go out the back and keep going. You get away, again. Every day feels shorter now.', fx: { fn: function (st) { if (st.wanted) st.wanted.until = st.t + 60; } }, log: 'You ran from police.', kind: 'big', time: 6 }; } },
        { w: 5, gen: function (s) { var w = s.wanted; if (!w) return { text: 'There is nobody there.', time: 1 }; return { text: 'They catch you in the next block.', fx: { case: { off: w.off, evidence: Math.min(0.95, w.evidence + 0.2) } }, next: 'lg_arrest', log: 'Police caught you running.', kind: 'big', time: 1 }; } },
        { w: 0.6, text: 'It ends in the street.', die: { cause: 'Killed fleeing police', kind: 'violence', reckless: true, text: 'You ran one time too many.' } }
      ] }
    ]
  });

  // ---------- prison (pool prison) ----------
  function remaining(s) { return s.prison ? Math.max(1, s.prison.until - s.t) : 1; }
  function chunk(s) { return Math.min(remaining(s), 14); }
  E({
    id: 'p_first', pool: 'prison', title: 'The first night', once: true, w: 10, time: function (s) { return Math.min(remaining(s), 6); },
    text: 'The door closes with a sound you will remember. Your cell is smaller than the bathroom you grew up with. Everyone is watching to see what you will do.',
    choices: [
      { label: 'Keep your head down', out: [{ text: 'You keep to yourself, follow the rules, and count the days. It is slow, but it keeps you safe.', fx: { rep: 0 } }] },
      { label: 'Find people to run with', out: [
        { w: 5, text: 'You find a group that looks out for its own. They keep you safe, and they expect things in return.', fx: { flag: { crew: true } }, log: 'You joined a group in prison.' },
        { w: 5, text: 'The group you join is trouble. You are in a fight by the end of the week.', fx: { flag: { crew: true }, cond: 'injury' }, log: 'You joined a group in prison and it got violent.' }
      ] },
      { label: 'Sign up for classes', out: [{ text: 'You put your name on every list for classes. It is something to do, and it might be something more.', fx: { edu: { grades: 6 }, fn: function (st) { if (st.edu.level < 2 && u.chance(st, 0.7)) st.edu.level = 2; } }, log: 'You took classes in prison.' }] }
    ]
  });
  E({
    id: 'p_visit', pool: 'prison', title: 'A visit', cool: 2, w: 5, time: function (s) { return Math.min(remaining(s), 12); },
    text: function (s) { return s.partner ? '{partner} is on the other side of the glass. The visits have been getting shorter.' : 'Someone from your family comes to see you. They look older than you remember.'; },
    choices: [{
      label: 'Sit down',
      out: [{
        gen: function (s) {
          if (s.partner) {
            if (u.chance(s, s.prison && s.prison.years > 4 ? 0.5 : 0.25)) return { text: '{partner} says it quietly. They cannot do this anymore. You watch them leave.', fx: { partner: null, flag: { married: false } }, log: 'Your partner left while you were in prison.', kind: 'big' };
            return { text: '{partner} says they will wait. You hold on to those words.', log: false };
          }
          return { text: 'You talk for the whole hour. It is the best hour of the month.', log: false };
        }
      }]
    }]
  });
  E({
    id: 'p_fight', pool: 'prison', title: 'Trouble on the yard', cool: 2, w: 4, time: function (s) { return Math.min(remaining(s), 6); },
    text: 'There is a fight brewing on the yard. People are choosing sides, and you can feel them looking at you.',
    choices: [
      { label: 'Stay out of it', out: [
        { w: 8, text: 'You stay out of it. It burns out, mostly.' },
        { w: 2, text: 'You get caught in it anyway. You wake up in the infirmary.', fx: { cond: 'injury' } }
      ] },
      { label: 'Fight', out: [
        { w: 5, text: 'You hold your own. It earns you a month in solitary and some respect.', fx: { flag: { fighter: true } } },
        { w: 3, text: 'It goes badly. The infirmary is not a good place, but you survive it.', fx: { cond: 'injury' } },
        { w: 1.5, text: 'The fight gets you extra time on your sentence.', fx: { fn: function (st) { if (st.prison) { st.prison.until += 12; st.record.prisonYears += 1; } } }, log: 'A fight in prison added a year to your sentence.' },
        { w: 0.3, text: 'It ends badly.', die: { cause: 'Killed in prison', kind: 'violence', text: 'It happened fast.' } }
      ] }
    ]
  });
  E({
    id: 'p_work', pool: 'prison', title: 'Work or class', cool: 3, w: 4, time: function (s) { return Math.min(remaining(s), 12); },
    text: 'There are openings in the kitchen and in the education program. The days are long either way.',
    choices: [
      { label: 'Work in the kitchen', out: [{ text: 'You get up early and work long hours. The pay is nothing, but you learn to cook.', fx: { money: 300 }, log: false }] },
      { label: 'Take classes', out: [{ text: 'You study for hours every day. A teacher tells you that you have more in you than you think.', fx: { edu: { grades: 6 }, fn: function (st) { if (st.edu.level < 2) st.edu.level = 2; } }, log: 'You studied in prison.' }] }
    ]
  });
  E({
    id: 'p_time', pool: 'x', title: 'Time passes', cool: 0, time: function (s) { return chunk(s); },
    text: function (s) {
      var left = Math.ceil(remaining(s) / 12);
      var lines = ['The days are all the same. Count, meals, yard, count.', 'You find a rhythm. Time moves strangely in here, slowly for each day and fast for each year.', 'Another stretch of days goes by. You mark them on the wall.'];
      return lines[Math.floor(s.t / 12) % lines.length] + ' About ' + left + (left === 1 ? ' year' : ' years') + ' left.';
    },
    choices: [{ label: 'Keep going', out: [{ text: 'You get through it.', log: false }] }]
  });
  E({
    id: 'p_release', pool: 'x', title: 'The gate opens', cool: 0,
    text: function (s) {
      var t = 'You walk out into the sun with a plastic bag of your things. The city looks different, and so does everything else. ';
      t += s.record.felony ? 'A felony is on your record now, and the world is going to keep reminding you.' : 'You have a record, and employers will ask about it.';
      return t;
    },
    choices: [
      { label: 'Stay with family', out: [{ text: 'Your family takes you in. It is not easy, and you are grateful anyway.', fx: { home: 'family', area: 'havana' }, log: 'You were released from prison.', kind: 'big', time: 1 }] },
      { label: 'Rent a room somewhere', cost: 1800, out: [{ text: 'You find a cheap room and a landlord who does not ask too many questions.', fx: { home: 'rent', rentMod: 0.7 }, log: 'You were released from prison.', kind: 'big', time: 1 }] },
      { label: 'Go back to the crew', out: [{ text: 'You know where to go, and so do they. It is easy, and that is the problem.', fx: { home: 'family', flag: { crew: true } }, log: 'You were released from prison and went back to the crew.', kind: 'big', time: 1 }] }
    ]
  });
})();
