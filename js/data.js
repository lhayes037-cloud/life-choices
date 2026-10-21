/* Miami Life: static data (areas, jobs, offenses, presets). Add to these lists in patches. */
(function () {
  'use strict';
  var G = (window.GAME = window.GAME || {});

  G.cfg = {
    v: 1,
    startYear: 2026,
    cooldownDays: 0, // set to 7 for the shared version
    lifeExp: 79
  };

  // Education levels
  G.EDU = ['Child', 'No diploma', 'High school', 'Some college', 'Trade or associate degree', "Bachelor's degree", 'Graduate degree'];
  G.MAJORS = {
    business: 'Business',
    health: 'Nursing and health',
    education: 'Education',
    tech: 'Computer science',
    prelaw: 'Pre-law',
    liberal: 'Liberal arts'
  };

  // Areas of Miami. risk: 0 calm, 1 normal, 3 rough. night: nightlife. police: how fast help shows up (0..1).
  G.AREAS = {
    gardens: { id: 'gardens', name: 'Miami Gardens', short: 'Gardens', flavor: 'Stadium parking lots, big family blocks, and a lot of people working two jobs.', rent: 1300, risk: 1, night: 1, police: 0.6, x: 120, y: 36, lx: 1 },
    hialeah: { id: 'hialeah', name: 'Hialeah', short: 'Hialeah', flavor: 'Warehouses, bakeries, and neighbors who all know each other.', rent: 1400, risk: 1, night: 1, police: 0.7, x: 80, y: 102, lx: 1 },
    wynwood: { id: 'wynwood', name: 'Wynwood', short: 'Wynwood', flavor: 'Murals by day, loud crowds at night.', rent: 2100, risk: 1, night: 3, police: 0.7, x: 180, y: 124, lx: 1 },
    flats: { id: 'flats', name: 'The Flats', short: 'The Flats', flavor: 'Closed shops, cheap motels, and streets that empty out after dark.', rent: 800, risk: 3, night: 1, police: 0.3, x: 126, y: 152, lx: -1 },
    downtown: { id: 'downtown', name: 'Downtown and Brickell', short: 'Downtown', flavor: 'Glass towers, courthouses, and the busiest streets in the city.', rent: 2600, risk: 1, night: 3, police: 0.9, x: 190, y: 192, lx: 1 },
    havana: { id: 'havana', name: 'Little Havana', short: 'Little Havana', flavor: 'Domino tables, coffee windows, and music all night on weekends.', rent: 1500, risk: 1, night: 2, police: 0.6, x: 130, y: 210, lx: -1 },
    beach: { id: 'beach', name: 'Miami Beach', short: 'Miami Beach', flavor: 'Tourists, beach days, and nonstop nightlife.', rent: 2800, risk: 1, night: 3, police: 0.8, x: 302, y: 170, lx: 0 },
    gables: { id: 'gables', name: 'Coral Gables', short: 'Coral Gables', flavor: 'Quiet streets, big trees, and a lot of money.', rent: 2700, risk: 0, night: 1, police: 0.9, x: 112, y: 272, lx: -1 },
    grove: { id: 'grove', name: 'Coconut Grove', short: 'The Grove', flavor: 'Boats, parks, and cafes along the bay.', rent: 2400, risk: 0, night: 2, police: 0.8, x: 172, y: 280, lx: 1 },
    kendall: { id: 'kendall', name: 'Kendall', short: 'Kendall', flavor: 'Suburbs, strip malls, and long drives to everything.', rent: 1900, risk: 0, night: 1, police: 0.8, x: 92, y: 346, lx: 1 },
    homestead: { id: 'homestead', name: 'Homestead', short: 'Homestead', flavor: 'Farmland, new houses, and a long way from the city.', rent: 1500, risk: 0, night: 0, police: 0.5, x: 92, y: 410, lx: 1 }
  };
  G.AREA_ORDER = ['gardens', 'hialeah', 'wynwood', 'flats', 'downtown', 'havana', 'beach', 'gables', 'grove', 'kendall', 'homestead'];

  // Jobs. min = education level needed. pay = yearly gross at each level of the ladder.
  G.JOBS = [
    { id: 'fastfood', title: 'Fast food crew', min: 0, minAge: 14, pay: [22000, 27000, 36000], ladder: ['Crew member', 'Shift lead', 'Store manager'] },
    { id: 'retail', title: 'Retail', min: 0, minAge: 15, pay: [27000, 32000, 44000], ladder: ['Retail associate', 'Shift lead', 'Store manager'] },
    { id: 'server', title: 'Restaurant front of house', min: 0, minAge: 16, pay: [29000, 37000, 56000], ladder: ['Server', 'Bartender', 'Restaurant manager'] },
    { id: 'linecook', title: 'Kitchen', min: 0, minAge: 16, pay: [31000, 40000, 58000], ladder: ['Line cook', 'Sous chef', 'Head chef'] },
    { id: 'warehouse', title: 'Warehouse', min: 0, minAge: 18, risky: true, pay: [34000, 43000, 56000], ladder: ['Warehouse worker', 'Team lead', 'Supervisor'] },
    { id: 'construction', title: 'Construction', min: 0, minAge: 18, risky: true, pay: [36000, 48000, 64000], ladder: ['Laborer', 'Foreman', 'Site manager'] },
    { id: 'driver', title: 'Driving', min: 0, minAge: 18, pay: [32000, 39000, 50000], ladder: ['Delivery driver', 'Senior driver', 'Dispatcher'] },
    { id: 'guard', title: 'Security', min: 0, minAge: 18, noFelony: true, pay: [32000, 40000, 54000], ladder: ['Security guard', 'Security supervisor', 'Security manager'] },
    { id: 'callcenter', title: 'Call center', min: 2, minAge: 18, pay: [35000, 43000, 60000], ladder: ['Call center rep', 'Team lead', 'Center manager'] },
    { id: 'admin', title: 'Office work', min: 2, minAge: 18, pay: [41000, 50000, 62000], ladder: ['Office assistant', 'Coordinator', 'Office manager'] },
    { id: 'teller', title: 'Banking', min: 2, minAge: 18, noFelony: true, pay: [37000, 52000, 82000], ladder: ['Bank teller', 'Banker', 'Branch manager'] },
    { id: 'realtor', title: 'Real estate', min: 2, minAge: 19, pay: [38000, 80000, 150000], ladder: ['Real estate agent', 'Top agent', 'Broker'] },
    { id: 'electrician', title: 'Electrical trade', min: 4, minAge: 18, pay: [52000, 68000, 95000], ladder: ['Apprentice electrician', 'Licensed electrician', 'Contractor'] },
    { id: 'hvac', title: 'HVAC trade', min: 4, minAge: 18, pay: [50000, 66000, 92000], ladder: ['HVAC tech', 'Senior tech', 'Shop owner'] },
    { id: 'emt', title: 'Emergency medical', min: 4, minAge: 18, noFelony: true, pay: [40000, 55000, 72000], ladder: ['EMT', 'Paramedic', 'EMS supervisor'] },
    { id: 'analyst', title: 'Business analyst', min: 5, major: ['business', 'tech', 'liberal', 'prelaw'], pay: [58000, 78000, 120000], ladder: ['Analyst', 'Senior analyst', 'Director'] },
    { id: 'accountant', title: 'Accounting', min: 5, major: ['business'], noFelony: true, pay: [62000, 82000, 140000], ladder: ['Accountant', 'Senior accountant', 'Controller'] },
    { id: 'developer', title: 'Software', min: 5, major: ['tech'], pay: [85000, 120000, 165000], ladder: ['Developer', 'Senior developer', 'Engineering lead'] },
    { id: 'nurse', title: 'Nursing', min: 5, major: ['health'], noFelony: true, pay: [70000, 88000, 112000], ladder: ['Registered nurse', 'Charge nurse', 'Nurse manager'] },
    { id: 'teacher', title: 'Teaching', min: 5, major: ['education', 'liberal'], noFelony: true, pay: [46000, 58000, 105000], ladder: ['Teacher', 'Lead teacher', 'Principal'] },
    { id: 'paralegal', title: 'Law office support', min: 5, major: ['prelaw', 'liberal', 'business'], noFelony: true, pay: [48000, 62000, 78000], ladder: ['Paralegal', 'Senior paralegal', 'Head paralegal'] },
    { id: 'lawyer', title: 'Law firm', min: 6, noFelony: true, pay: [95000, 145000, 260000], ladder: ['Associate attorney', 'Senior associate', 'Partner'] }
  ];
  G.JOB = {};
  G.JOBS.forEach(function (j) { G.JOB[j.id] = j; });

  // Offenses. sev 1 minor .. 5 severe.
  G.OFF = {
    shoplift: { name: 'shoplifting', sev: 1 },
    dui: { name: 'drunk driving', sev: 2 },
    fraud: { name: 'fraud', sev: 3 },
    carTheft: { name: 'auto theft', sev: 3 },
    store: { name: 'armed robbery of a store', sev: 3, violent: true },
    bank: { name: 'bank robbery', sev: 4, violent: true },
    assault: { name: 'assault', sev: 3, violent: true },
    dealing: { name: 'drug dealing', sev: 3 },
    shooting: { name: 'a shooting', sev: 4, violent: true },
    duiCrash: { name: 'a drunk driving crash', sev: 4 },
    embezzle: { name: 'theft from your job', sev: 3 }
  };
  G.SENT = { 1: [0, 0.4], 2: [0.2, 1.2], 3: [2, 7], 4: [8, 20], 5: [25, 45] };

  // Health conditions. mult raises the yearly chance of dying. cost is monthly.
  G.COND = {
    lung: { name: 'lung disease', mult: 1.9, cost: 250 },
    cancer: { name: 'cancer', mult: 2.6, cost: 600 },
    heart: { name: 'heart trouble', mult: 2.0, cost: 300 },
    liver: { name: 'liver disease', mult: 2.0, cost: 250 },
    addiction: { name: 'addiction', mult: 1.5, cost: 200 },
    diabetes: { name: 'diabetes', mult: 1.4, cost: 200 },
    injury: { name: 'a lasting injury', mult: 1.05, cost: 150 }
  };

  G.NAMES = ['Ana', 'Marcus', 'Sofia', 'Dante', 'Lucia', 'Jamal', 'Camila', 'Terrence', 'Isabel', 'Andre', 'Valentina', 'Malik', 'Rosa', 'Xavier', 'Gabriela', 'Omar', 'Daniela', 'Elijah', 'Carmen', 'Marco', 'Nia', 'Mateo', 'Layla', 'Devin', 'Yara', 'Luis', 'Tasha', 'Rafael', 'Imani', 'Diego', 'Alex', 'Jordan', 'Sam', 'Kai', 'Noel'];

  // Preset lives. Anything here can be renamed on the start screen.
  G.PRESETS = [
    { id: 'newborn', title: 'Day one', blurb: 'Born into a working family in Little Havana. You get all of it.', spec: { name: 'Daniel Reyes', age: 0, area: 'havana', cls: 1 } },
    { id: 'middle', title: 'Middle school', blurb: 'Age 12 in Hialeah. Money is tight at home and the next few years set the tone.', spec: { name: 'Maya Brooks', age: 12, area: 'hialeah', cls: 0 } },
    { id: 'senior', title: 'Senior year', blurb: 'Age 17 in Kendall. Graduation is close and everyone has an opinion about what you do next.', spec: { name: 'Chris Alvarez', age: 17, area: 'kendall', cls: 1, grades: 72 } },
    { id: 'fresh', title: 'Fresh start', blurb: 'Age 19, high school done, a retail job, a room with roommates, and a little savings.', spec: { name: 'Jada Monroe', age: 19, area: 'gardens', cls: 0, edu: 2, job: 'retail', money: 1800, home: 'rent', roommates: true } },
    { id: 'onway', title: 'On your way', blurb: 'Age 27. A business degree, an office job, student loans, and a partner.', spec: { name: 'Nate Sullivan', age: 27, area: 'downtown', cls: 1, edu: 5, major: 'business', job: 'analyst', money: 6500, debt: 22000, home: 'rent', partner: true } },
    { id: 'reset', title: 'Midlife reset', blurb: 'Age 42. Laid off last month, a mortgage, a partner, and a kid in school.', spec: { name: 'Marisol Vega', age: 42, area: 'kendall', cls: 1, edu: 3, money: 4200, debt: 8000, home: 'own', partner: true, kids: 1 } }
  ];

  G.BACKGROUNDS = ['Struggling', 'Getting by', 'Comfortable'];

  G.CUSTOM_JOBS = [
    { id: '', label: 'No job' },
    { id: 'retail', label: 'Retail associate' },
    { id: 'server', label: 'Server' },
    { id: 'linecook', label: 'Line cook' },
    { id: 'warehouse', label: 'Warehouse worker' },
    { id: 'construction', label: 'Construction laborer' },
    { id: 'callcenter', label: 'Call center rep' },
    { id: 'admin', label: 'Office assistant' },
    { id: 'electrician', label: 'Apprentice electrician' },
    { id: 'hvac', label: 'HVAC tech' },
    { id: 'nurse', label: 'Registered nurse' },
    { id: 'teacher', label: 'Teacher' },
    { id: 'accountant', label: 'Accountant' },
    { id: 'developer', label: 'Developer' }
  ];
})();
