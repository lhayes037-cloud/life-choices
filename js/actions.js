/* Miami Life: the free menu. Things you can choose to do when nothing is happening to you.
   Each action: { id, group, label, hint, show(s), run(s, u, arg) -> { out | ev | pool, ctx, time } } */
(function () {
  'use strict';
  var G = window.GAME, A = G.A;
  function age(s) { return G.age(s); }
  function inCollege(s) { return s.edu.inSchool && s.edu.inSchool !== 'hs'; }

  // ----- the year -----
  A({
    id: 'coast', group: 'life', label: 'Let a year go by', hint: 'See what comes',
    show: function (s) { return true; },
    run: function (s, u) { return { ev: 'x_quietyear' }; }
  });
  A({
    id: 'coast_years', group: 'life', label: 'Let several years go by', hint: 'Stay the course',
    show: function (s) { return age(s) >= 20 && !s.prison; },
    run: function (s, u) { return { ev: 'x_coast' }; }
  });

  // ----- school -----
  A({
    id: 'study', group: 'school', label: 'Study hard', hint: 'Grades up',
    show: function (s) { return !!s.edu.inSchool; },
    run: function (s, u) { s.edu.grades = u.clamp(s.edu.grades + u.ri(s, 3, 7), 0, 100); return { pool: 'sch', ctx: { mode: 'study' }, fallback: 'sch_calm' }; }
  });
  A({
    id: 'coast_school', group: 'school', label: 'Coast through school', hint: 'Easy now, a price later',
    show: function (s) { return !!s.edu.inSchool; },
    run: function (s, u) { s.edu.grades = u.clamp(s.edu.grades - u.ri(s, 1, 4), 0, 100); return { pool: 'sch', ctx: { mode: 'coast' }, fallback: 'sch_calm' }; }
  });
  A({
    id: 'skip_class', group: 'school', label: 'Skip class', hint: 'Grades down, a risk of trouble',
    show: function (s) { return !!s.edu.inSchool; },
    run: function (s, u) { s.edu.grades = u.clamp(s.edu.grades - u.ri(s, 5, 9), 0, 100); return { pool: 'sch', ctx: { mode: 'skip' }, fallback: 'sch_calm' }; }
  });
  A({
    id: 'dropout', group: 'school', label: 'Drop out', hint: 'Leave school for good',
    show: function (s) { return !!s.edu.inSchool && age(s) >= 16; },
    run: function () { return { ev: 'x_dropout' }; }
  });
  A({
    id: 'ged', group: 'school', label: 'Get your GED', hint: 'Finish what you started',
    show: function (s) { return !s.edu.inSchool && s.edu.level <= 1 && age(s) >= 17; },
    run: function () { return { ev: 'x_ged' }; }
  });
  A({
    id: 'school_again', group: 'school', label: 'Go back to school', hint: 'College or trade school',
    show: function (s) { return !s.edu.inSchool && s.edu.level >= 2 && s.edu.level < 6 && age(s) >= 18 && !s.prison; },
    run: function () { return { ev: 'x_school' }; }
  });

  // ----- work -----
  A({
    id: 'job_search', group: 'work', label: function (s) { return s.job ? 'Look for a better job' : 'Look for a job'; }, hint: 'See who calls back',
    show: function (s) { return age(s) >= 14 && !s.prison && !(inCollege(s) && false); },
    run: function (s, u) {
      var offers = u.makeOffers(s);
      if (offers.length) return { ev: 'x_offer' };
      var why;
      if (s.record.felony) why = 'Every application asks about your record. The answer ends most of them right there.';
      else if (s.edu.level <= 1 && age(s) >= 18) why = 'Most places want at least a diploma. You get a lot of polite no\'s.';
      else if (s.flags.fired) why = 'Your last job ends your story with some of them. Nobody calls back.';
      else why = 'You apply all over town. Nobody calls back this time.';
      return { out: { text: why, log: false }, time: 3 };
    }
  });
  A({
    id: 'work_hard', group: 'work', label: 'Work extra hard', hint: 'A shot at a promotion',
    show: function (s) { return !!s.job && !s.prison; },
    run: function () { return { pool: 'wrk', ctx: { mode: 'hard' }, fallback: 'wrk_normal' }; }
  });
  A({
    id: 'work_coast', group: 'work', label: 'Do the minimum', hint: 'Safe, but nothing moves',
    show: function (s) { return !!s.job && !s.prison; },
    run: function () { return { pool: 'wrk', ctx: { mode: 'coast' }, fallback: 'wrk_normal' }; }
  });
  A({
    id: 'quit', group: 'work', label: 'Quit your job', hint: 'Walk out',
    show: function (s) { return !!s.job && !s.prison; },
    run: function () { return { ev: 'x_quit' }; }
  });
  A({
    id: 'side_hustle', group: 'work', label: 'Start a side hustle', hint: 'Extra money, some risk',
    show: function (s) { return age(s) >= 16 && !s.prison; },
    run: function () { return { ev: 'x_side' }; }
  });

  // ----- money and home -----
  A({
    id: 'save', group: 'money', label: 'Live cheap and save', hint: 'A tight year',
    show: function (s) { return age(s) >= 18 && !s.prison; },
    run: function (s, u) {
      var gain = u.ri(s, 1200, 3200);
      return { out: { text: 'You skip the nights out and cook at home. It is not exciting, but the account grows.', fx: { money: gain }, log: false }, time: 12 };
    }
  });
  A({
    id: 'buy_home', group: 'money', label: 'Buy a home', hint: 'Needs a down payment',
    show: function (s) { return age(s) >= 21 && s.home !== 'own' && !s.prison; },
    run: function () { return { ev: 'x_buyhome' }; }
  });
  A({
    id: 'buy_gun', group: 'money', label: 'Buy a handgun', hint: 'For protection',
    show: function (s) { return age(s) >= 21 && !s.flags.armed && !s.record.felony && !s.prison; },
    run: function () { return { ev: 'x_gun' }; }
  });
  A({
    id: 'gamble', group: 'money', label: 'Go to the casino', hint: 'Anything can happen',
    show: function (s) { return age(s) >= 21 && !s.prison; },
    run: function () { return { ev: 'm_casino' }; }
  });

  // ----- people -----
  A({
    id: 'date', group: 'people', label: 'Meet someone', hint: 'Go on a date',
    show: function (s) { return age(s) >= 17 && !s.partner && !s.prison; },
    run: function () { return { ev: 'r_meet' }; }
  });
  A({
    id: 'propose', group: 'people', label: 'Take the next step together', hint: 'Marriage',
    show: function (s) { return !!s.partner && !s.flags.married && age(s) >= 20 && !s.prison; },
    run: function () { return { ev: 'r_proposal' }; }
  });
  A({
    id: 'baby', group: 'people', label: 'Try for a baby', hint: 'Life changes',
    show: function (s) { return !!s.partner && age(s) >= 20 && age(s) <= 45 && !s.prison; },
    run: function () { return { ev: 'r_baby_try' }; }
  });

  // ----- body -----
  A({
    id: 'get_fit', group: 'body', label: 'Get in shape', hint: 'A hard year that pays off',
    show: function (s) { return age(s) >= 14 && s.habits.fit < 1 && !s.prison; },
    run: function (s, u) {
      var ok = u.chance(s, 0.75);
      return { out: ok
        ? { text: 'You make it a routine, and it sticks. You have more energy, and you carry yourself differently.', fx: { habit: { fit: 1 } }, log: 'You got in shape.' }
        : { text: 'You start strong and fade by spring. Next time, maybe.', log: false }, time: 12 };
    }
  });
  A({
    id: 'quit_smoking', group: 'body', label: 'Quit smoking', hint: 'Hard, but worth it',
    show: function (s) { return s.habits.smoke > 0 && !s.prison; },
    run: function () { return { ev: 'x_quit_smoke' }; }
  });
  A({
    id: 'cut_drinking', group: 'body', label: 'Cut back on drinking', hint: 'Take it easy',
    show: function (s) { return s.habits.drink > 0 && !s.prison; },
    run: function () { return { ev: 'x_quit_drink' }; }
  });
  A({
    id: 'checkup', group: 'body', label: 'See a doctor', hint: 'Catch things early',
    show: function (s) { return age(s) >= 25 && !s.prison; },
    run: function () { return { ev: 'h_checkup' }; }
  });

  // ----- the rest of the city -----
  A({
    id: 'crew', group: 'risk', label: 'Hang with the wrong crowd', hint: 'Doors open, and close',
    show: function (s) { return age(s) >= 16 && !s.flags.crew && !s.prison; },
    run: function (s, u) {
      return { out: { text: 'You start spending time with people who always seem to have money and no job. They are fun, and they notice you.', fx: { flag: { crew: true } }, log: 'You fell in with a rough crowd.' }, time: 6 };
    }
  });
  A({
    id: 'leave_crew', group: 'risk', label: 'Walk away from the crew', hint: 'It might not be easy',
    show: function (s) { return !!s.flags.crew && !s.prison; },
    run: function (s, u) {
      if (u.chance(s, 0.2)) return { out: { text: 'They do not take it well. You take a beating for the way you left, but you are out.', fx: { flag: { crew: false }, cond: 'injury', money: -800 }, log: 'You left the crew.', kind: 'big' }, time: 6 };
      return { out: { text: 'You stop answering the phone. They let you go, mostly.', fx: { flag: { crew: false } }, log: 'You left the crew.' }, time: 6 };
    }
  });

  // reckless group: each one leads to its own event, which always has a way out
  [
    ['rk_shoplift', 'Shoplift', 16], ['rk_car', 'Steal a car', 16], ['rk_assault', 'Attack someone', 16],
    ['rk_fraud', 'Run a card scam', 18], ['rk_deal', 'Sell drugs', 16], ['rk_store', 'Rob a store', 18], ['rk_bank', 'Rob a bank', 18]
  ].forEach(function (r) {
    A({
      id: r[0], group: 'reckless', label: r[1], hint: 'This can end your life as you know it',
      show: function (s) { return age(s) >= r[2] && !s.prison; },
      run: function () { return { ev: r[0] }; }
    });
  });
})();
