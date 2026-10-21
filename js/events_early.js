/* Miami Life: childhood, teen years, school, and the big milestones. */
(function () {
  'use strict';
  var G = window.GAME, E = G.E, u = G.u;
  function byCls(s, a, b, c) { return [a, b, c][s.cls == null ? 1 : s.cls]; }
  // ---------- fallback ----------
  E({
    id: 'c_quiet', title: 'A couple of years', time: 24, once: false, cool: 0,
    text: function (s) {
      var lines = [
        'Not much happens that anyone would write down. You go to school, play outside until the streetlights come on, and grow a few inches.',
        'The years run together. Summers are hot, the rain comes every afternoon, and you get a little older each time you look up.',
        'You settle into a routine. School, home, friends, repeat. Looking back, these were good ordinary years.'
      ];
      return lines[Math.floor(s.t / 24) % lines.length];
    },
    choices: [{ label: 'Keep going', out: [{ text: 'The years go by.', log: false }] }]
  });

  // ---------- early childhood ----------
  E({
    id: 'c_first_years', title: 'Your first years', age: [0, 4], once: true, time: 36, w: 20,
    text: function (s) {
      return 'You grow up in {area}. ' + byCls(s, 'Money is tight at home and your parents work a lot.', 'Your family gets by. Nothing fancy, but there is always food on the table.', 'Your family is comfortable. You have your own room and a yard to play in.') + ' People say you were an interesting little kid. What were you like?';
    },
    choices: [
      { label: 'Loud and into everything', out: [{ text: 'You were fearless. You climbed things you should not have and talked to every stranger.', fx: { flag: { bold: true } }, log: 'You were a fearless little kid.' }] },
      { label: 'Quiet and watchful', out: [{ text: 'You hung back and watched everything. Adults said you noticed more than most kids.', fx: { flag: { shy: true } }, log: 'You were a quiet, watchful kid.' }] },
      { label: 'Curious about everything', out: [{ text: 'You took things apart, asked why about everything, and drove people a little crazy.', fx: { flag: { curious: true }, edu: { grades: 4 } }, log: 'You were endlessly curious.' }] }
    ]
  });
  E({
    id: 'c_school_start', title: 'First day of school', age: [5, 7], once: true, time: 24, w: 20,
    text: 'The first day of school is here. The hallway is loud, the backpack is bigger than you are, and your parent is waiting at the door.',
    choices: [
      { label: 'Walk in on your own', out: [{ text: 'You walk in like you own the place. By lunch you know half the class.', fx: { flag: { bold: true } } }] },
      { label: 'Hold on to your parent', out: [{ text: 'It takes a few weeks, but you settle in. You make one good friend and that is enough.', fx: { flag: { shy: true } } }] },
      { label: 'Find someone to sit next to', out: [{ text: 'You sit next to a kid with the same lunchbox as you. That is how most friendships start.', fx: { edu: { grades: 2 } } }] }
    ]
  });
  E({
    id: 'c_move', title: 'We are moving', age: [3, 12], w: 4, cool: 6, time: 12,
    text: 'Your parents sit you down. The family is moving to a different part of Miami. New school, new street, new everything.',
    choices: [{
      label: 'Pack your things',
      out: [{
        gen: function (s) {
          var opts = byCls(s, ['gardens', 'hialeah', 'flats', 'havana'], ['havana', 'hialeah', 'kendall', 'gardens', 'wynwood'], ['gables', 'grove', 'kendall', 'beach']);
          opts = opts.filter(function (a) { return a !== s.area; });
          var to = u.pick(s, opts);
          return { text: 'You move to ' + G.AREAS[to].name + '. ' + G.AREAS[to].flavor + ' It feels strange for a while, and then it feels like home.', fx: { area: to }, log: 'Your family moved to ' + G.AREAS[to].name + '.' };
        }
      }]
    }]
  });
  E({
    id: 'c_family_money', title: 'Trouble at home', age: [5, 12], once: true, time: 12, w: 3,
    text: 'Your parents talk quietly in the kitchen at night. You hear the word money a lot.',
    choices: [{
      label: 'Try to stay out of the way',
      out: [
        { w: function (s) { return s.cls > 0 ? 2 : 0.5; }, text: 'A parent lost hours at work. Things get tighter at home and you learn what a budget is.', fn: function (s) { s.cls = Math.max(0, s.cls - 1); }, log: 'Money got tight at home.' },
        { w: function (s) { return s.cls < 2 ? 2 : 0.5; }, text: 'A parent got a better job. Things loosen up, and for the first time there is money for extra things.', fn: function (s) { s.cls = Math.min(2, s.cls + 1); }, log: 'Your family had a better year.' },
        { w: 2, text: 'It blows over. The grown-ups figure it out, like they always seem to.' }
      ]
    }]
  });
  E({
    id: 'c_bully', title: 'A kid is picking on you', age: [6, 12], cool: 5, time: 12, w: 5,
    text: 'There is a kid at school who has decided you are the target. Every day it is something new.',
    choices: [
      { label: 'Tell a teacher', out: [
        { w: 6, text: 'The teacher steps in and it mostly stops. You feel a little safer at school.', fx: { edu: { grades: 2 } } },
        { w: 4, text: 'The teacher talks to the kid. It gets worse, because now you are the one who told.' }
      ] },
      { label: 'Fight back', out: [
        { w: 5, text: 'You swing first. It is not pretty, but the kid leaves you alone after that. Other kids notice.', fx: { flag: { fighter: true } } },
        { w: 3, text: 'You get suspended for three days. Your parents are not happy, but they do not ask who started it.', fx: { flag: { fighter: true }, edu: { grades: -4 } } },
        { w: 2, text: 'You lose the fight and go home with a bruise. The kid keeps going.', fx: { flag: { fighter: true } } }
      ] },
      { label: 'Ignore it', out: [
        { w: 5, text: 'You ignore it and it fades. By next year the kid has moved on to someone else.' },
        { w: 5, text: 'You keep your head down. It keeps happening, and it wears on you.', fx: { flag: { shy: true } } }
      ] }
    ]
  });
  E({
    id: 'c_candy', title: 'The corner store', age: [6, 11], once: true, time: 12, w: 3,
    text: 'You are in the corner store with a friend. The candy is right there, and the owner is watching the TV.',
    choices: [
      { label: 'Slip some in your pocket', out: [
        { w: 6, text: 'You walk out like nothing happened. It is exciting, and you remember how easy it was.', fx: { flag: { sticky: true } } },
        { w: 4, text: 'The owner catches you at the door and calls your parents. You have never been so ashamed in your life.' }
      ] },
      { label: 'Put it back', out: [{ text: 'You put it back. Your friend rolls their eyes, but nothing bad happens.' }] },
      { label: 'Pay for it with your lunch money', out: [{ text: 'You buy it. It tastes better than stolen candy would have.' }] }
    ]
  });
  E({
    id: 'c_afternoons', title: 'After school', age: [7, 12], once: true, time: 24, w: 4,
    text: 'The school bell rings at three. There are a lot of hours between then and dinner. What do you do with them?',
    choices: [
      { label: 'Read at the library', out: [{ text: 'The librarian starts saving books for you. You fall behind on nothing.', fx: { edu: { grades: 6 }, flag: { curious: true } } }] },
      { label: 'Play outside until dark', out: [{ text: 'You are always outside. You get fast, scraped up, and tan.', fx: { habit: { fit: 1 } } }] },
      { label: 'Play video games', out: [{ text: 'You get very good at video games. Homework happens right before bed.', fx: { edu: { grades: -3 } } }] }
    ]
  });
  E({
    id: 'c_talent', title: 'The teacher notices', age: [8, 12], once: true, time: 12, w: 4,
    text: 'A teacher pulls you aside. They think you are good at something and want you to try for it.',
    choices: [
      { label: 'Join the sports team', out: [{ text: 'You make the team. Practice is every day and you love it.', fx: { flag: { athlete: true }, habit: { fit: 1 } } }] },
      { label: 'Join the art or music program', out: [{ text: 'You find something that is yours. It does not make you popular, but it makes you happy.', fx: { flag: { arts: true } } }] },
      { label: 'Join the math club', out: [{ text: 'You are a little nervous but it turns out you like it. Your grades notice.', fx: { edu: { grades: 8 } } }] },
      { label: 'Thanks, but no', out: [{ text: 'You say no. The teacher shrugs and moves on to someone else.' }] }
    ]
  });
  E({
    id: 'c_pet', title: 'A stray dog', age: [5, 12], once: true, time: 12, w: 3,
    text: 'A skinny stray dog follows you all the way home. It sits at the door and looks at you like you owe it something.',
    choices: [
      { label: 'Ask to keep it', out: [
        { w: 5, text: 'Your parents say yes, to your surprise. The dog sleeps at the foot of your bed for years.', fx: { flag: { pet: true } }, log: 'You got a dog.' },
        { w: 5, text: 'Your parents say no. A neighbor takes the dog, and you can visit it.' }
      ] },
      { label: 'Hide it in the garage', out: [{ text: 'It lasts two days. Your parents find out and, grumbling, let you keep it.', fx: { flag: { pet: true } } }] },
      { label: 'Leave it alone', out: [{ text: 'You close the door. You think about the dog for a long time after that.' }] }
    ]
  });
  E({
    id: 'c_sick', title: 'A bad fever', age: [2, 11], once: true, time: 12, w: 3,
    text: 'You wake up burning hot, and your parent drives you to the emergency room at two in the morning.',
    choices: [{ label: 'Hold on', out: [{ text: 'You are okay. It is a bad virus, and the hospital sends you home with a stack of papers. The bill is a headache for your parents.', log: false }] }]
  });
  E({
    id: 'c_cheat', title: 'The spelling test', age: [8, 12], once: true, time: 12, w: 3,
    text: 'There is a big test tomorrow. You did not study, and the kid next to you always has the answers.',
    choices: [
      { label: 'Copy their answers', out: [
        { w: 6, text: 'You copy and nobody notices. The grade is great and you feel strange about it.', fx: { edu: { grades: 4 }, flag: { sticky: true } } },
        { w: 4, text: 'The teacher catches you. You get a zero and a call home.', fx: { edu: { grades: -5 } } }
      ] },
      { label: 'Study that night', out: [{ text: 'You stay up and study. You do fine, and you learn something about yourself.', fx: { edu: { grades: 4 } } }] },
      { label: 'Just take the bad grade', out: [{ text: 'You take the test. It is not great, but it is honest.', fx: { edu: { grades: -2 } } }] }
    ]
  });

  // ---------- anyone, any age ----------
  E({
    id: 'a_hurricane', title: 'Hurricane warning', age: [0, 99], w: 2, cool: 8, time: 3,
    text: 'The news says a hurricane is headed for South Florida. Gas stations are out of gas and the shelves are empty at the store.',
    choices: [
      { label: 'Evacuate north', cost: function (s) { return u.age(s) >= 18 ? 600 : 0; }, hint: 'Costs gas and a hotel', out: [{ text: 'You drive north with traffic for hours. The storm hits, and you come back to find your place mostly fine.', log: 'You evacuated for a hurricane.' }] },
      { label: 'Board up and ride it out', out: [
        { w: 6, text: 'You ride it out at home. It is loud and scary, and the power is out for a week, but you are fine.', fx: { money: -150 }, log: 'You rode out a hurricane at home.' },
        { w: 3, text: 'The storm tears off part of the roof. Repairs are expensive and the insurance fight takes months.', fx: { money: -3500 }, log: 'A hurricane damaged your home.' },
        { w: 1, text: 'You get hurt when a window gives out. It is not life threatening, but the hospital bill is.', fx: { money: -2500, cond: 'injury' }, log: 'You were hurt in a hurricane.' }
      ] },
      { label: 'Stay with friends inland', out: [{ text: 'You spend the storm at a friend\'s place. It turns into a party with nowhere to go.', fx: { money: -50 } }] }
    ]
  });

  // ---------- teen years ----------
  E({
    id: 't_crowd', title: 'A new crowd', age: [13, 15], once: true, time: 12, w: 20,
    text: 'High school is a different world. Everyone is sorting into groups, and you have to sit somewhere at lunch.',
    choices: [
      { label: 'The athletes', out: [{ text: 'You find your people on the field. Practice keeps you busy and out of trouble.', fx: { flag: { crowdGood: true, athlete: true }, habit: { fit: 1 } } }] },
      { label: 'The artsy kids', out: [{ text: 'You land with the artists and musicians. They are weird in the right way.', fx: { flag: { crowdGood: true, arts: true } } }] },
      { label: 'The kids who skip class', out: [{ text: 'They are fun and funny, and they have no plans. You start skipping with them.', fx: { flag: { crowdRough: true }, edu: { grades: -6 } } }] },
      { label: 'Keep to yourself', out: [{ text: 'You eat lunch alone, and it is not as bad as it sounds. You get a lot done.', fx: { flag: { loner: true }, edu: { grades: 4 } } }] }
    ]
  });
  E({
    id: 't_license', title: 'Learning to drive', age: [16, 17], once: true, time: 12, w: 4,
    text: 'You are old enough for a learner\'s permit. Everyone you know is getting one.',
    choices: [
      { label: 'Take the driving class', cost: 300, out: [{ text: 'You pass on the first try. Having a license makes everything easier.', fx: { flag: { driver: true } }, log: 'You got your driver\'s license.' }] },
      { label: 'Wait on it', out: [{ text: 'You put it off. Friends drive you around, and you save the money.' }] }
    ]
  });
  E({
    id: 't_first_job', title: 'Now hiring', age: [15, 17], once: true, time: 12, w: 5,
    when: function (s) { return !s.job; },
    text: 'A friend says the place down the street is hiring. It is not much money, but it is your own money.',
    choices: [
      { label: 'Apply', out: [
        { w: 6, text: 'You get the job. The work is boring and the manager yells, but payday feels amazing.', fx: { job: 'fastfood', rep: 1 }, log: 'You got your first job.' },
        { w: 4, text: 'You do not hear back. Maybe next time.' }
      ] },
      { label: 'Focus on school', out: [{ text: 'You skip the job. Your parents like that, and your grades do too.', fx: { edu: { grades: 3 } } }] }
    ]
  });
  E({
    id: 't_party', title: 'The party', age: [14, 17], cool: 2, time: 6, w: 6,
    text: 'There is a party at an older kid\'s place. Someone hands you a drink, and someone else has a vape.',
    choices: [
      { label: 'Say no and stay', out: [{ text: 'You hold a cup of soda and have a better time than you thought you would.' }] },
      { label: 'Try it', out: [
        { w: 5, text: 'You try it. It is not as great as everyone says, and you are not sure what the point was.' },
        { w: 3, text: 'You start drinking at parties. It becomes a regular thing.', fx: { hup: { drink: 1 } }, log: 'You started drinking.' },
        { w: 2, text: 'The vape is easy and everywhere. By spring you are buying your own.', fx: { hup: { smoke: 1 } }, log: 'You started vaping.' },
        { w: 1, text: 'You drink too much and get very sick. You will not forget that night.', fx: { flag: { sickParty: true } } }
      ] },
      { label: 'Leave', out: [{ text: 'You say you have to go. A few people laugh, but you sleep fine.' }] }
    ]
  });
  E({
    id: 't_cheat', title: 'The big test', age: [14, 17], cool: 2, time: 6, w: 4,
    text: 'The final is tomorrow and you are behind. A friend has a photo of the answer key.',
    choices: [
      { label: 'Look at the answers', out: [
        { w: 6, text: 'You use the photo. You pass easily and tell yourself it does not count.', fx: { edu: { grades: 3 }, flag: { sticky: true } } },
        { w: 4, text: 'The teacher figures it out. You fail the class and get a call home.', fx: { edu: { grades: -9 } } }
      ] },
      { label: 'Stay up and study', out: [{ text: 'You study until two in the morning. You do not ace it, but you pass honestly.', fx: { edu: { grades: 5 } } }] },
      { label: 'Skip the test', out: [{ text: 'You skip it. The zero hurts more than you expected.', fx: { edu: { grades: -7 } } }] }
    ]
  });
  E({
    id: 't_date', title: 'Someone likes you', age: [14, 17], once: true, time: 12, w: 4,
    text: 'Someone in your grade asks if you want to go to the movies on Friday. Your face goes hot.',
    choices: [
      { label: 'Say yes', out: [
        { w: 5, text: 'It is awkward and sweet. You date for a few months and break up friends.', log: 'You had your first relationship.' },
        { w: 3, text: 'It goes badly, and the whole school hears about it by Monday.', fx: { edu: { grades: -2 } } }
      ] },
      { label: 'Say no, politely', out: [{ text: 'You say no. They are cool about it, and you feel okay.' }] }
    ]
  });
  E({
    id: 't_sport', title: 'Tryouts', age: [13, 17], once: true, time: 12, w: 4,
    when: function (s) { return !!(s.flags.athlete || s.habits.fit > 0 || s.flags.crowdGood); },
    text: 'Tryouts are next week. The coach says you have a shot, if you put in the work.',
    choices: [
      { label: 'Go all in', out: [
        { w: 4, text: 'You train all summer and make varsity. A scout mentions your name to a college coach.', fx: { flag: { athlete: true, scout: true }, habit: { fit: 1 } }, log: 'You made varsity.' },
        { w: 4, text: 'You train hard and make the team. It is a good year.', fx: { flag: { athlete: true }, habit: { fit: 1 } } },
        { w: 2, text: 'You tear a knee in the first week of practice. It heals, but the season is gone.', fx: { cond: 'injury' } }
      ] },
      { label: 'Try out casually', out: [{ text: 'You make the second team. It is fun, with none of the pressure.', fx: { habit: { fit: 1 } } }] },
      { label: 'Skip it', out: [{ text: 'You skip it. You think about it once in a while.' }] }
    ]
  });
  E({
    id: 't_gang_offer', title: 'Easy money', age: [13, 17], once: true, time: 12,
    w: function (s) { return s.flags.crowdRough ? 8 : s.area === 'flats' ? 6 : 1.2; },
    text: 'An older guy you see around offers you two hundred dollars to carry a bag across the neighborhood. He says to not ask what is in it.',
    choices: [
      { label: 'Say no and walk away', out: [{ text: 'You say no. He shrugs like it was nothing, but you feel his eyes on your back for half a block.' }] },
      { label: 'Take the money', out: [
        { w: 6, text: 'You deliver the bag and get paid. It was easy, and now they know your name.', fx: { money: 200, flag: { crew: true } }, log: 'You started running with a crew.' },
        { w: 3, text: 'A patrol car stops you with the bag. You are taken in as a minor.', fx: { flag: { crew: true }, case: { off: 'dealing', evidence: 0.4 } }, next: 'lg_arrest', log: 'You were arrested as a teenager.' }
      ] },
      { label: 'Tell an adult', out: [{ text: 'You tell a teacher. Nothing much happens, but the guy stops coming around.', fx: { flag: { honest: true } } }] }
    ]
  });
  E({
    id: 't_drugs', title: 'Pills in the bathroom', age: [14, 17], once: true, time: 6, w: 3,
    text: 'A kid at school has pills and is selling them in the bathroom between classes. He says everyone is doing it.',
    choices: [
      { label: 'No thanks', out: [{ text: 'You keep walking. It is not hard, but it is not nothing.' }] },
      { label: 'Try one', out: [
        { w: 5, text: 'You try it. It is nothing special. You do not touch them again.' },
        { w: 3, text: 'You like it too much. It becomes a regular thing before you realize.', fx: { hup: { drugs: 1 } }, log: 'You started using drugs.' },
        { w: 1, text: 'You take too much and wake up in the hospital. Your parents cry, and you promise it will not happen again.', fx: { money: -1500 } }
      ] }
    ]
  });
  E({
    id: 't_pointless', title: 'School feels pointless', age: [16, 17], once: true, time: 12, w: 8,
    when: function (s) { return s.edu.inSchool === 'hs' && s.edu.grades < 55; },
    text: 'Your grades are bad and you are tired of being told you are not trying. A guy at work says he never needed a diploma.',
    choices: [
      { label: 'Stick with it', out: [{ text: 'You stay. A counselor helps you find a way to catch up.', fx: { edu: { grades: 8 } } }] },
      { label: 'Drop out', out: [{ text: 'You leave school. For a few weeks it feels like freedom.', fx: { edu: { setLevel: 1, inSchool: null } }, log: 'You dropped out of high school.', kind: 'milestone' }] }
    ]
  });

  // ---------- 18: graduation and what is next ----------
  E({
    id: 'ms_graduation', pool: 'ms', at: 18, title: 'Graduation day',
    when: function (s) { return s.edu.inSchool === 'hs'; },
    text: 'The last day of high school is here. There is a gown, a stage, and a lot of people in the stands. Your name is next.',
    choices: [{
      label: 'Walk across the stage',
      out: [{
        gen: function (s) {
          if (s.edu.grades >= 50) {
            return { text: 'You walk across the stage and get the diploma. Somebody in the crowd screams your name.', fx: { edu: { level: 2, inSchool: null } }, log: 'You graduated high school.', kind: 'milestone', next: 'ms_after_hs', time: 1 };
          }
          return { text: 'You do not walk. You missed too many classes and the school will not give you a diploma. Everybody else has moved on, and you are in the parking lot.', fx: { edu: { setLevel: 1, inSchool: null } }, log: 'You did not get your diploma.', kind: 'milestone', next: 'ms_after_hs', time: 1 };
        }
      }]
    }]
  });
  E({
    id: 'ms_after_hs', pool: 'x', title: 'What now?', once: true,
    text: function (s) {
      var line = s.edu.level >= 2 ? 'You have your diploma. Everyone wants to know what is next.' : 'You are done with school, but not by choice. The people who ask what is next do not get a good answer.';
      if (s.flags.scout) line += ' A college coach has been calling.';
      return line;
    },
    choices: function (s) {
      var ok = s.edu.level >= 2;
      var g = s.edu.grades;
      var list = [];
      list.push({
        label: 'Community college', hint: 'Cheap and close. Two years to a degree.', when: function () { return ok; },
        out: [{ text: 'You enroll at Miami Dade College. The classes are small and the price is right.', fx: { edu: { inSchool: 'college', need: 2 }, flag: { tuition: 4000 } }, log: 'You started community college.', next: 'ms_major', time: 1 }]
      });
      list.push({
        label: 'State university', hint: 'Four years. Moderate cost.', when: function () { return ok; },
        out: [
          { w: g >= 60 ? 9 : 3, text: 'You get in. Campus is big and the next four years are wide open.', fx: { edu: { inSchool: 'college', need: 4 }, flag: { tuition: s.cls >= 2 ? 4500 : 9000 } }, log: 'You started at a state university.', next: 'ms_major', time: 1 },
          { w: g >= 60 ? 1 : 7, text: 'The letter says no. It stings. You end up at Miami Dade College instead.', fx: { edu: { inSchool: 'college', need: 2 }, flag: { tuition: 4000 } }, log: 'You started community college.', next: 'ms_major', time: 1 }
        ]
      });
      list.push({
        label: 'University of Miami', hint: 'Private, pricey, great connections.', when: function () { return ok && g >= 75; },
        out: [
          { w: g >= 85 ? 7 : 3, text: 'You get in, with a scholarship that covers a good part of it. It is still a lot of money.', fx: { edu: { inSchool: 'college', need: 4 }, flag: { tuition: s.cls >= 2 ? 15000 : 24000 } }, log: 'You started at the University of Miami.', next: 'ms_major', time: 1 },
          { w: g >= 85 ? 3 : 7, text: 'You do not get in. You end up at a state university instead.', fx: { edu: { inSchool: 'college', need: 4 }, flag: { tuition: s.cls >= 2 ? 4500 : 9000 } }, log: 'You started at a state university.', next: 'ms_major', time: 1 }
        ]
      });
      list.push({
        label: 'Trade school', hint: 'Electrical or HVAC. Under two years.', when: function () { return ok; },
        out: [{ text: 'You sign up for a trade program. The hours are long and the work is hands-on.', fx: { edu: { inSchool: 'trade', need: 1 }, flag: { tuition: 6500 } }, log: 'You started trade school.', time: 1 }]
      });
      list.push({
        label: 'Get a job now', hint: 'Start earning.',
        out: [{ text: 'You decide to work. Rent will not pay itself.', fx: { edu: { inSchool: null } }, time: 1 }]
      });
      list.push({
        label: 'Take some time to figure it out', hint: 'No plan yet.',
        out: [{ text: 'You do not have a plan, and that is fine for now. You sleep late and hang out.', time: 6 }]
      });
      return list;
    }
  });
  E({
    id: 'ms_major', pool: 'x', title: 'What will you study?', once: false, cool: 0,
    text: 'You have to pick a major. This will point your life in a direction, so think about it.',
    choices: [
      { label: 'Business', out: [{ text: 'You go with business. It opens a lot of doors.', fx: { edu: { major: 'business' } }, time: 1 }] },
      { label: 'Nursing and health', out: [{ text: 'You go with nursing and health. People always need nurses.', fx: { edu: { major: 'health' } }, time: 1 }] },
      { label: 'Education', out: [{ text: 'You go with education. You want to teach.', fx: { edu: { major: 'education' } }, time: 1 }] },
      { label: 'Computer science', out: [{ text: 'You go with computer science. The math is rough but the jobs are good.', fx: { edu: { major: 'tech' } }, time: 1 }] },
      { label: 'Pre-law', out: [{ text: 'You go with pre-law. Law school might be in your future.', fx: { edu: { major: 'prelaw' } }, time: 1 }] },
      { label: 'Liberal arts', out: [{ text: 'You go with liberal arts. You are not sure where it leads, but you like it.', fx: { edu: { major: 'liberal' } }, time: 1 }] }
    ]
  });
  E({
    id: 'ms_home', pool: 'ms', at: 19, title: 'Your own place?',
    when: function (s) { return s.home === 'family' && !s.prison; },
    text: 'You are an adult now. Living at home is free, but it is not exactly independence.',
    choices: [
      { label: 'Stay home and save', out: [{ text: 'You stay put. It is not glamorous, but your money stays yours.', fx: { flag: { stayHome: true } } }] },
      { label: 'Move in with roommates', cost: 1200, hint: 'Cheaper rent, more chaos', out: [{ text: 'You and two friends split a small place. It is loud and messy and you love it.', fx: { home: 'rent', rentMod: 0.6 }, log: 'You moved out on your own.', kind: 'milestone' }] },
      { label: 'Get your own apartment', cost: 2500, hint: 'Full rent, full freedom', out: [{ text: 'You sign a lease for a place of your own. It is small and it is yours.', fx: { home: 'rent', rentMod: 1 }, log: 'You moved out on your own.', kind: 'milestone' }] }
    ]
  });

  // ---------- school years (study, coast, skip) ----------
  E({
    id: 'sch_exam', pool: 'sch', title: 'Exam season', w: 5,
    text: function (s, ctx) { return ctx.mode === 'study' ? 'Finals come around again. You have been working all year and it shows.' : 'Finals are here and you are not as ready as you should be.'; },
    choices: [
      { label: 'Study all night', out: [{ text: 'You study hard through finals and get through them tired but fine.', fx: { edu: { grades: 4 } } }] },
      { label: 'Wing it', out: [
        { w: 5, text: 'You wing it. It goes okay, which is lucky.' },
        { w: 5, text: 'You wing it. It goes badly, which was predictable.', fx: { edu: { grades: -5 } } }
      ] },
      { label: 'Cheat', out: [
        { w: 6, text: 'You cheat and nobody notices. You feel gross about it anyway.', fx: { edu: { grades: 4 }, flag: { sticky: true } } },
        { w: 4, text: 'You get caught and fail the class. There is a note in your file now.', fx: { edu: { grades: -12 } } }
      ] }
    ]
  });
  E({
    id: 'sch_mentor', pool: 'sch', title: 'A teacher who cares', w: 3, once: true,
    when: function (s, ctx) { return ctx.mode === 'study'; },
    text: 'A teacher takes an interest in you. They ask what you want to do with your life and tell you to aim higher.',
    choices: [
      { label: 'Take their advice', out: [{ text: 'You start asking for help and it pays off. They write you a strong recommendation when you need one.', fx: { flag: { mentor: true }, edu: { grades: 6 } }, log: 'A teacher took you under their wing.' }] },
      { label: 'Nod and move on', out: [{ text: 'You nod and move on. They stop asking after a while.' }] }
    ]
  });
  E({
    id: 'sch_scholar', pool: 'sch', title: 'A scholarship', w: 4, once: true,
    when: function (s, ctx) { return ctx.mode === 'study' && s.edu.grades >= 80 && s.edu.inSchool && s.edu.inSchool !== 'hs'; },
    text: 'Your grades got noticed. There is a scholarship, and you are one of the people who can apply.',
    choices: [
      { label: 'Apply', out: [
        { w: 6, text: 'You win it. A big piece of your tuition is covered.', fx: { debt: -6000 }, log: 'You won a scholarship.' },
        { w: 4, text: 'You do not get it, but they say you came close.' }
      ] },
      { label: 'Skip it', out: [{ text: 'You let it go by. It was a lot of paperwork.' }] }
    ]
  });
  E({
    id: 'sch_burnout', pool: 'sch', title: 'Running on empty', w: 4,
    when: function (s, ctx) { return ctx.mode === 'study'; },
    text: 'You have been going nonstop and you are exhausted. The work does not slow down.',
    choices: [
      { label: 'Push through', out: [
        { w: 6, text: 'You push through. You come out the other side with good grades and no social life.', fx: { edu: { grades: 4 } } },
        { w: 4, text: 'You crash. A bad week turns into a bad month and your grades dip.', fx: { edu: { grades: -5 } } }
      ] },
      { label: 'Take a week off', out: [{ text: 'You take a week off. You come back clear-headed and fine.', fx: { edu: { grades: 1 } } }] }
    ]
  });
  E({
    id: 'sch_caught', pool: 'sch', title: 'Truancy letter', w: 6,
    when: function (s, ctx) { return ctx.mode === 'skip'; },
    text: 'A letter shows up at home about all your absences. The school wants a meeting with a parent.',
    choices: [
      { label: 'Promise to do better', out: [{ text: 'You promise. For a little while, you actually try.', fx: { edu: { grades: 4 } } }] },
      { label: 'Throw the letter away', out: [{ text: 'You throw it away. The school figures out the rest, and your record has a mark.', fx: { edu: { grades: -3 } } }] }
    ]
  });
  E({
    id: 'sch_warning', pool: 'sch', title: 'A talk with the counselor', w: 5,
    when: function (s, ctx) { return ctx.mode !== 'study' && s.edu.grades < 60; },
    text: 'The counselor calls you in. Your grades are in the danger zone and she wants to know what is going on.',
    choices: [
      { label: 'Listen and change', out: [{ text: 'You listen. It helps to have somebody tell you the truth.', fx: { edu: { grades: 7 } } }] },
      { label: 'Say you do not care', out: [{ text: 'You say you do not care. She writes something down and lets you go.' }] }
    ]
  });
  E({
    id: 'sch_calm', pool: 'sch', title: 'A regular school year', w: 3,
    text: 'The year comes and goes. There are tests, projects, and a couple of good friends.',
    choices: [{ label: 'Keep going', out: [{ text: 'Nothing big happens. The year just goes by.', log: false }] }]
  });

  // dropping out, GED, going back
  E({
    id: 'x_dropout', pool: 'x', title: 'Leave school?', cool: 0,
    text: 'You are thinking about quitting school. It would be official, and it is hard to undo.',
    choices: [
      { label: 'Yes, I am done', out: [{ text: 'You leave. For a while it feels good, and then people start asking what the plan is.', fx: { edu: { setLevel: 1, inSchool: null } }, log: 'You dropped out of school.', kind: 'milestone', time: 3 }] },
      { label: 'Not yet', out: [{ text: 'You stay. Some days you wonder why.', time: 0 }] }
    ]
  });
  E({
    id: 'x_ged', pool: 'x', title: 'Get your GED', cool: 0,
    text: 'You can still get a high school equivalency. You will have to study on your own time and pay for the test.',
    choices: [
      { label: 'Study for the GED', cost: 150, out: [
        { w: 6, text: 'You pass. It is not the same as a diploma, but it opens doors again.', fx: { edu: { level: 2 } }, log: 'You earned your GED.', kind: 'milestone' },
        { w: 4, text: 'You fall short by a few points. You can try again later.' }
      ], time: 6 },
      { label: 'Not right now', out: [{ text: 'You put it off.', time: 0 }] }
    ]
  });
  E({
    id: 'x_school', pool: 'x', title: 'Back to school', cool: 0,
    text: 'You are thinking about going back to school. It takes time and money, but it changes what jobs are possible.',
    choices: [
      { label: 'Community college', hint: 'Part time work, two year degree', cost: 0, when: function (s) { return s.edu.level >= 2; }, out: [{ text: 'You enroll in night classes at Miami Dade College. It is a lot, with a job.', fx: { edu: { inSchool: 'college', need: 3 }, flag: { tuition: 3500 } }, log: 'You went back to school.', next: 'ms_major', time: 1 }] },
      { label: 'Trade program', hint: 'Electrical or HVAC certificate', when: function (s) { return s.edu.level >= 2; }, out: [{ text: 'You sign up for a trade certificate program. The classroom part is dull, but the shop part is great.', fx: { edu: { inSchool: 'trade', need: 1 }, flag: { tuition: 6500 } }, log: 'You went back to school for a trade.', time: 1 }] },
      { label: 'University', hint: 'Four years', when: function (s) { return s.edu.level >= 2 && u.age(s) < 45; }, out: [{ text: 'You enroll at a state university. You are older than most of the class and you do not care.', fx: { edu: { inSchool: 'college', need: 4 }, flag: { tuition: 9000 } }, log: 'You went back to school.', next: 'ms_major', time: 1 }] },
      { label: 'Not now', out: [{ text: 'You decide it is not the right time.', time: 0 }] }
    ]
  });

  // graduation and flunking out (queued)
  E({
    id: 'sch_graduate', pool: 'x', title: 'The end of school', cool: 0,
    text: 'You have reached the end of the program. The last piece is the paperwork, and your grades.',
    choices: [{
      label: 'Find out',
      out: [{
        gen: function (s) {
          var kind = s.edu.inSchool;
          if (s.edu.grades < 45) {
            return { text: 'You come up short on credits. It means one more year, and more tuition.', fx: { fn: function (st) { st.edu.need = (st.edu.need || 4) + 1; } }, log: false, time: 1 };
          }
          if (kind === 'trade') return { text: 'You finish the program and get your certificate. You can now start working in the trade.', fx: { edu: { level: 4, inSchool: null } }, log: 'You finished trade school.', kind: 'milestone', time: 1 };
          if (kind === 'law') return { text: 'You pass the bar and become a lawyer. Years of work, finally paying off.', fx: { edu: { level: 6, inSchool: null } }, log: 'You became a lawyer.', kind: 'milestone', time: 1 };
          if ((s.edu.need || 4) <= 3) return { text: 'You finish your associate degree. It is not the end, but it is a good step.', fx: { edu: { level: 4, inSchool: null } }, log: 'You earned an associate degree.', kind: 'milestone', next: 'ms_grad_next', time: 1 };
          return { text: 'You graduate college. The cap goes up in the air and your family cries in the stands.', fx: { edu: { level: 5, inSchool: null } }, log: 'You graduated from college.', kind: 'milestone', next: 'ms_grad_next', time: 1 };
        }
      }]
    }]
  });
  E({
    id: 'ms_grad_next', pool: 'x', title: 'After college', cool: 0,
    text: 'You have a degree. Now what?',
    choices: [
      { label: 'Start looking for work', out: [{ text: 'You start sending out applications. Your degree helps.', time: 1 }] },
      { label: 'Apply to law school', hint: 'Three more years, a lot of money', when: function (s) { return s.edu.level === 5 && s.edu.grades >= 70 && ['prelaw', 'liberal', 'business'].indexOf(s.edu.major) >= 0; }, out: [
        { w: function (s) { return s.edu.grades >= 85 ? 8 : 4; }, text: 'You get in. Three years of reading and debt are ahead of you.', fx: { edu: { inSchool: 'law', need: 3 }, flag: { tuition: 30000 } }, log: 'You started law school.', time: 1 },
        { w: function (s) { return s.edu.grades >= 85 ? 2 : 6; }, text: 'The letters are all no. It hurts, but you have a degree and options.', time: 1 }
      ] },
      { label: 'Take a break', out: [{ text: 'You take a few months. You earned it.', time: 4 }] }
    ]
  });
  E({
    id: 'sch_flunk', pool: 'x', title: 'The letter', cool: 0,
    text: 'You open the envelope. The school is dismissing you for academic reasons. After all that time and money, it is over.',
    choices: [{
      label: 'Read it again',
      out: [{
        gen: function (s) {
          return { text: 'You are out of school and the debt stays. You do not have the degree, and that is going to be on every application.', fx: { edu: { level: Math.max(s.edu.level, 3), inSchool: null } }, log: 'You flunked out of college.', kind: 'big', time: 3 };
        }
      }]
    }]
  });
})();
