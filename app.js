/* Podium — landing + onboarding behaviour. No backend yet; choices are kept in
   localStorage so the flow can be walked end to end. */

(function reveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.1 }
  );

  items.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 3, 2) * 70}ms`;
    io.observe(el);
  });
})();

/* Demo vote buttons on the landing page: one vote per category, so picking a
   second deck moves the vote rather than adding one. */
(function demoVote() {
  const buttons = document.querySelectorAll('[data-vote]');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const alreadyMine = btn.classList.contains('voted');
      buttons.forEach((b) => {
        b.classList.remove('voted');
        b.textContent = 'Vote';
      });
      if (alreadyMine) return;
      btn.classList.add('voted');
      btn.textContent = 'Voted';
    });
  });
})();

/* ---------------- onboarding ---------------- */

(function onboarding() {
  const card = document.querySelector('.onb-card');
  if (!card) return;

  const panels = card.querySelectorAll('.step-panel');
  const dots = card.querySelectorAll('.dot');
  const roleButtons = card.querySelectorAll('.role');
  const finishBtn = card.querySelector('[data-action="finish"]');
  const profile = card.querySelector('[data-profile]');
  const teamField = card.querySelector('[data-participant-only]');
  const nameInput = card.querySelector('#displayName');
  const collegeInput = card.querySelector('#college');
  const doneLine = card.querySelector('[data-done-line]');

  const state = { role: null };

  /* The landing page splits the role at the button (Luma's pattern), so honour
     ?intent= and pre-select the matching card. */
  const intentToRole = { upload: 'participant', vote: 'voter', host: 'organiser' };
  const params = new URLSearchParams(location.search);
  const intent = params.get('intent');
  const eventCode = params.get('code');

  function show(step) {
    panels.forEach((p) => p.classList.toggle('on', Number(p.dataset.panel) === step));
    dots.forEach((d) => d.classList.toggle('on', Number(d.dataset.dot) <= Math.min(step, 2)));
  }

  function checkProfile() {
    if (!finishBtn) return;
    const named = nameInput.value.trim().length > 1 && collegeInput.value.trim().length > 1;
    finishBtn.disabled = !(state.role && named);
  }

  function selectRole(role) {
    state.role = role;
    roleButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
    if (profile) profile.hidden = false;
    if (teamField) teamField.hidden = role !== 'participant';
    checkProfile();
    nameInput?.focus({ preventScroll: true });
  }

  card.querySelector('[data-action="signin"]')?.addEventListener('click', (e) => {
    /* Real Google sign-in goes here. For now it just advances the flow. */
    e.preventDefault();

    /* An organiser did not come here to pick a role — send them to the setup
       screen, carrying any event code along. */
    if (intent === 'host') {
      let existing = null;
      try {
        existing = JSON.parse(localStorage.getItem('podium.event'));
      } catch (err) {
        existing = null;
      }
      if (existing?.name && !existing.draft) {
        location.href = 'dashboard.html';
      } else {
        location.href = eventCode
          ? `create-event.html?code=${encodeURIComponent(eventCode)}`
          : 'create-event.html';
      }
      return;
    }

    show(2);
    if (intent && intentToRole[intent]) selectRole(intentToRole[intent]);
  });

  roleButtons.forEach((btn) => {
    btn.addEventListener('click', () => selectRole(btn.dataset.role));
  });

  card.querySelectorAll('.back-step').forEach((btn) => {
    btn.addEventListener('click', () => show(Number(btn.dataset.back)));
  });

  [nameInput, collegeInput].forEach((input) => {
    input?.addEventListener('input', checkProfile);
  });

  finishBtn?.addEventListener('click', () => {
    const saved = {
      role: state.role,
      name: nameInput.value.trim(),
      college: collegeInput.value.trim(),
      team: card.querySelector('#teamName')?.value.trim() || null,
      eventCode: eventCode || null,
    };
    try {
      localStorage.setItem('podium.profile', JSON.stringify(saved));
    } catch (err) {
      /* private mode — the flow still works, it just won't be remembered */
    }
    if (doneLine) {
      doneLine.textContent =
        saved.role === 'participant'
          ? 'Next stop: the upload screen.'
          : 'Next stop: the deck wall.';
    }
    show(3);
  });

  card.querySelector('[data-action="invite"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    location.href = 'create-event.html';
  });
})();

/* Header menu. The panel is always in the DOM so it can fold; `data-open`
   drives the animation and `inert` keeps the links out of the tab order while
   it is folded away. */
(function headerMenu() {
  const btn = document.querySelector('[data-menu-btn]');
  const menu = document.querySelector('[data-menu]');
  if (!btn || !menu) return;

  let open = false;

  function setOpen(next) {
    open = next;
    menu.dataset.open = String(next);
    btn.setAttribute('aria-expanded', String(next));
    btn.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');
    if (next) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
  }

  setOpen(false);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!open);
  });

  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      btn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!open) return;
    if (!menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
})();

/* Join by event code, straight from the hero. */
(function joinByCode() {
  const form = document.querySelector('[data-join]');
  if (!form) return;
  const input = form.querySelector('input');
  const note = document.querySelector('[data-join-note]');
  const defaultNote = note?.innerHTML;

  /* Codes are six characters from an alphabet with no 0/O/1/I, so a code read
     off a poster can't be mistyped into a different event. The real lookup is
     a server call; until that exists we only check the shape and carry the
     code into sign-in. See docs/EVENT-CODES.md. */
  const CODE = /^[A-HJ-NP-Z2-9]{6}$/;

  function say(message, bad) {
    if (!note) return;
    note.innerHTML = message;
    if (bad) note.dataset.state = 'bad';
    else delete note.dataset.state;
  }

  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = input.value.trim();

    if (!code) {
      say('Type the six-character code from the poster, or browse open events.', true);
      input.focus();
      return;
    }

    if (!CODE.test(code)) {
      say('That code looks wrong. Six letters and numbers, no O, I, zero or one.', true);
      input.focus();
      return;
    }

    say(defaultNote, false);
    location.href = `onboarding.html?intent=vote&code=${encodeURIComponent(code)}`;
  });
})();

/* Sticky action bar on phones, once the hero buttons scroll away. */
(function mobileBar() {
  const bar = document.querySelector('[data-mobile-bar]');
  const hero = document.querySelector('.hero .capsule');
  if (!bar || !hero || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    ([entry]) => bar.classList.toggle('show', !entry.isIntersecting),
    { threshold: 0 }
  );
  io.observe(hero);
})();

/* ---------------- organiser: set up your event ---------------- */

(function eventSetup() {
  const form = document.querySelector('[data-event-form]');
  if (!form) return;

  /* Same alphabet as the rest of the product: no O, I, zero or one, because
     those are what people misread off a poster. See docs/EVENT-CODES.md. */
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function makeCode() {
    const bytes = new Uint32Array(6);
    crypto.getRandomValues(bytes);
    return [...bytes].map((n) => ALPHABET[n % ALPHABET.length]).join('');
  }

  const state = {
    code: makeCode(),
    mode: 'offline',
    voters: 'anyone',
    privacy: 'public',
    banner: 1,
  };

  const el = (sel) => form.querySelector(sel) || document.querySelector(sel);
  const bind = (name) => form.querySelector(`[data-bind="${name}"]`);

  const preview = {
    banner: el('[data-preview-banner]'),
    name: el('[data-preview-name]'),
    host: el('[data-preview-host]'),
    date: el('[data-preview-date]'),
    mode: el('[data-preview-mode]'),
    fee: el('[data-preview-fee]'),
    code: el('[data-preview-code]'),
    poster: el('[data-poster-line]'),
  };

  const MODE_WORDS = { offline: 'In person', online: 'Online', hybrid: 'In person and online' };

  function prettyDate(value, time) {
    if (!value) return 'Date not set';
    const d = new Date(`${value}T${time || '00:00'}`);
    if (Number.isNaN(d.getTime())) return 'Date not set';
    const day = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    if (!time) return day;
    return `${day}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
  }

  function draw() {
    const name = bind('name').value.trim();
    const host = bind('host').value.trim();
    const fee = bind('fee').value.trim();
    const venue = bind('venue').value.trim();

    preview.name.textContent = name || 'Your event name';
    preview.host.textContent = host ? `Run by ${host}` : 'Run by you';
    preview.date.textContent = prettyDate(bind('date').value, bind('time').value);
    preview.mode.textContent = venue && state.mode !== 'online'
      ? `${MODE_WORDS[state.mode]} · ${venue}`
      : MODE_WORDS[state.mode];
    preview.fee.textContent = fee || 'Free to enter';
    preview.code.textContent = state.code;
    preview.poster.textContent = `Vote on Podium · code ${state.code}`;
  }

  /* banner: uploaded file wins, otherwise one of the four defaults */
  form.querySelectorAll('[data-swatch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.banner = btn.dataset.swatch;
      form.querySelectorAll('[data-swatch]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b === btn))
      );
      preview.banner.style.backgroundImage = '';
      preview.banner.className = `preview-banner sw-${state.banner}`;
    });
  });

  function showImage(input, target, label) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      note('That image is over 5 MB. Try a smaller one.', true);
      input.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    if (target) {
      target.className = 'preview-banner';
      target.style.backgroundImage = `url("${url}")`;
    }
    const drop = input.closest('.drop');
    if (drop) {
      drop.classList.add('filled');
      drop.querySelector('.drop-title').textContent = `${label}: ${file.name}`;
    }
  }

  form.querySelector('[data-banner-file]')?.addEventListener('change', (e) =>
    showImage(e.target, preview.banner, 'Banner')
  );
  form.querySelector('[data-poster-file]')?.addEventListener('change', (e) =>
    showImage(e.target, null, 'Poster')
  );

  /* segmented controls */
  function segment(attr, key, after) {
    form.querySelectorAll(`[data-${attr}]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        state[key] = btn.dataset[attr];
        form.querySelectorAll(`[data-${attr}]`).forEach((b) =>
          b.setAttribute('aria-checked', String(b === btn))
        );
        if (after) after();
        draw();
      });
    });
  }

  segment('mode', 'mode', () => {
    const offline = form.querySelector('[data-when="offline"]');
    const online = form.querySelector('[data-when="online"]');
    offline.hidden = state.mode === 'online';
    online.hidden = state.mode === 'offline';
  });

  segment('voters', 'voters');

  segment('privacy', 'privacy', () => {
    const noteEl = form.querySelector('[data-privacy-note]');
    noteEl.textContent =
      state.privacy === 'public'
        ? 'Listed events show up in the open events list, so people can wander in and vote.'
        : 'Only people who type the code can open this event. It stays off the list.';
  });

  form.querySelectorAll('[data-bind]').forEach((input) => {
    input.addEventListener('input', draw);
  });

  function note(message, bad) {
    const n = form.querySelector('[data-form-note]');
    if (!n) return;
    n.textContent = message;
    n.style.color = bad ? 'var(--accent)' : '';
  }

  form.querySelector('[data-copy]')?.addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(preview.poster.textContent);
      e.target.textContent = 'Copied';
      setTimeout(() => (e.target.textContent = 'Copy'), 1600);
    } catch (err) {
      note('Could not copy. Select the line and copy it by hand.', true);
    }
  });

  function collect() {
    const groups = bind('groups').value
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    return {
      code: state.code,
      name: bind('name').value.trim(),
      host: bind('host').value.trim(),
      date: bind('date').value,
      time: bind('time').value,
      mode: state.mode,
      venue: bind('venue').value.trim(),
      link: bind('link').value.trim(),
      signupForm: bind('form').value.trim(),
      fee: bind('fee').value.trim(),
      maxSlides: Number(bind('slides').value) || 15,
      uploadsClose: bind('deadline').value,
      downloads: bind('downloads').checked,
      groups,
      voters: state.voters,
      voteOpen: bind('voteOpen').value,
      voteClose: bind('voteClose').value,
      privacy: state.privacy,
      banner: state.banner,
    };
  }

  function save(draft) {
    try {
      localStorage.setItem('podium.event', JSON.stringify({ ...collect(), draft }));
      return true;
    } catch (err) {
      return false;
    }
  }

  form.querySelector('[data-save]')?.addEventListener('click', () => {
    const ok = save(true);
    note(ok ? 'Draft saved on this device.' : 'Could not save on this device.', !ok);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = collect();

    if (!data.name || !data.host || !data.date) {
      note('Fill in the event name, who runs it, and the date.', true);
      return;
    }
    if (data.voteOpen && data.voteClose && data.voteClose <= data.voteOpen) {
      note('Voting has to close after it opens.', true);
      return;
    }

    save(false);
    note(`Event created. Your code is ${data.code}. Taking you to your dashboard…`, false);
    setTimeout(() => (location.href = 'dashboard.html'), 900);
  });

  /* sensible starting dates: event tomorrow, voting that evening */
  const tomorrow = new Date(Date.now() + 864e5);
  const iso = tomorrow.toISOString().slice(0, 10);
  bind('date').value = iso;
  bind('deadline').value = `${iso}T09:00`;
  bind('voteOpen').value = `${iso}T14:00`;
  bind('voteClose').value = `${iso}T21:00`;
  form.querySelector('[data-swatch="1"]').setAttribute('aria-pressed', 'true');
  draw();
})();

/* ---------------- smooth scrolling ---------------- */

/* Lenis carries the page between sections instead of letting the wheel jump it.
   It is 3.6 KB, keeps the normal DOM (no wrapper element), and turns itself off
   when the reader asks for reduced motion. Its frame loop is handed to GSAP's
   ticker so scroll-linked animation and the scroll itself never disagree. */
(function smoothScroll() {
  if (!window.Lenis) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => 1 - Math.pow(1 - t, 3),   /* fast start, long settle */
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  window.podiumLenis = lenis;

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* in-page links keep the same easing instead of snapping */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -90, duration: 1.1 });
  });
})();

/* ---------------- hero hand-off ---------------- */

/* The photograph drifts slower than the page and settles back as the next
   section rises over it, so the seam is a movement rather than a cut. */
(function heroHandoff() {
  const hero = document.querySelector('.hero');
  const media = document.querySelector('.hero-media');
  if (!hero || !media) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.to(media, {
    yPercent: 14,
    scale: 1.06,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });

  gsap.to('.hero-content', {
    y: -40,
    opacity: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 40%', scrub: 0.6 },
  });

  const next = hero.nextElementSibling;
  if (next) {
    gsap.from(next, {
      y: 40,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 62%', scrub: 0.6 },
    });
  }
})();

/* ---------------- the deck wall ---------------- */

(function deckWall() {
  const grid = document.querySelector('[data-grid]');
  if (!grid) return;

  const MAX_BYTES = 25 * 1024 * 1024;
  const COVERS = [
    'linear-gradient(140deg, #47564a, #6f8472)',
    'linear-gradient(140deg, #c9541f, #e59264)',
    'linear-gradient(140deg, #1b1a16, #4a463c)',
    'linear-gradient(140deg, #4b5d6b, #7d95a5)',
    'linear-gradient(140deg, #7a5230, #b98a5d)',
  ];

  const store = {
    read(key, fallback) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch (err) {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        /* private mode — the wall still works for this visit */
      }
    },
  };

  const event = store.read('podium.event', null);
  const profile = store.read('podium.profile', null);
  let decks = store.read('podium.decks', []);
  /* Votes used to be one per group, stored as an object. Anything left over
     from that shape is folded into the list this version expects. */
  const savedVotes = store.read('podium.votes', []);
  let votes = Array.isArray(savedVotes)
    ? savedVotes
    : Object.values(savedVotes || {}).filter(Boolean);

  let filter = 'all';
  let query = '';
  let sort = 'new';

  /* ---- event header ---- */

  const els = {
    banner: document.querySelector('[data-event-banner]'),
    name: document.querySelector('[data-event-name]'),
    meta: document.querySelector('[data-event-meta]'),
    pill: document.querySelector('[data-state-pill]'),
    left: document.querySelector('[data-vote-left]'),
    chips: document.querySelector('[data-chips]'),
    empty: document.querySelector('[data-empty]'),
    countAll: document.querySelector('[data-count-all]'),
  };

  const groups = event?.groups?.length ? event.groups : [];

  function stage() {
    if (!event) return 'open';
    if (event.stage === 'closed') return 'closed';   /* the organiser closed it by hand */
    const now = Date.now();
    const opens = event.voteOpen ? new Date(event.voteOpen).getTime() : null;
    const closes = event.voteClose ? new Date(event.voteClose).getTime() : null;
    if (closes && now > closes) return 'closed';
    if (opens && now >= opens) return 'voting';
    return 'open';
  }

  function clockWord(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function drawHead() {
    if (!event) return;
    els.name.textContent = event.name || 'The deck wall';
    const bits = [event.host, event.venue || (event.mode === 'online' ? 'Online' : '')].filter(Boolean);
    els.meta.textContent = bits.join(' · ') || 'Your event';
    if (event.banner) els.banner.className = `event-banner sw-${event.banner}`;

    const now = stage();
    els.pill.dataset.stage = now;
    els.pill.textContent =
      now === 'closed' ? 'Voting closed' : now === 'voting' ? 'Voting open' : 'Uploads open';

    if (now === 'closed') {
      els.left.textContent = 'Results are in';
    } else if (now === 'voting') {
      els.left.textContent = event.voteClose
        ? `Voting closes ${clockWord(event.voteClose)}`
        : 'Counts stay hidden until voting closes';
    } else {
      els.left.textContent = event.voteOpen
        ? `Voting opens ${clockWord(event.voteOpen)}`
        : 'Voting has not opened yet';
    }
  }

  function drawChips() {
    if (!groups.length) return;
    groups.forEach((g) => {
      const btn = document.createElement('button');
      btn.className = 'chip-btn';
      btn.dataset.group = g;
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = `${g} <span data-count="${g}">0</span>`;
      els.chips.appendChild(btn);
    });
  }

  /* ---- the wall ---- */

  function initials(team) {
    return team
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  const hasVoted = (deck) => votes.includes(deck.id);

  function isMine(deck) {
    return profile?.name && deck.owner === profile.name;
  }

  function visible() {
    let list = decks.filter((d) => {
      if (d.status === 'hidden') return false;
      if (d.status === 'pending') return isMine(d);
      return true;
    });
    if (filter !== 'all') list = list.filter((d) => d.group === filter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.team.toLowerCase().includes(q) ||
          (d.college || '').toLowerCase().includes(q) ||
          (d.line || '').toLowerCase().includes(q)
      );
    }
    if (sort === 'team') list.sort((a, b) => a.team.localeCompare(b.team));
    else if (sort === 'old') list.sort((a, b) => a.at - b.at);
    else list.sort((a, b) => b.at - a.at);
    return list;
  }

  function counts() {
    const shown = decks.filter((d) => d.status !== 'hidden');
    els.countAll.textContent = shown.length;
    groups.forEach((g) => {
      const el = document.querySelector(`[data-count="${g}"]`);
      if (el) el.textContent = shown.filter((d) => d.group === g).length;
    });
  }

  /* A vote is final. You may back as many decks as you like, once each, and a
     deck you have backed is closed to you from then on. */
  function voteLabel(deck) {
    const now = stage();
    if (hasVoted(deck)) return { text: 'You have voted', disabled: true, voted: true };
    if (deck.status === 'pending') return { text: 'Not on the wall yet', disabled: true, voted: false };
    if (now === 'closed') return { text: 'Voting closed', disabled: true, voted: false };
    if (now !== 'voting') return { text: 'Voting soon', disabled: true, voted: false };
    if (isMine(deck)) return { text: 'Your deck', disabled: true, voted: false };
    return { text: 'Vote now', disabled: false, voted: false };
  }

  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18v-6H5l7-7 7 7h-4v6z"/></svg>';

  const canMove = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.gsap;

  /* The arrow leaves the button, flies up and fades; a fresh one rises into its
     place as the button settles into its voted state. */
  function flyArrow(btn) {
    if (!canMove) return;

    const arrow = btn.querySelector('.vote-arrow');
    const text = btn.querySelector('.vote-text');
    const box = arrow.getBoundingClientRect();

    const ghost = document.createElement('span');
    ghost.className = 'vote-ghost';
    ghost.innerHTML = ARROW;
    ghost.style.left = `${box.left + box.width / 2 - 11}px`;
    ghost.style.top = `${box.top + box.height / 2 - 11}px`;
    ghost.style.position = 'fixed';
    document.body.appendChild(ghost);

    gsap.timeline({ onComplete: () => ghost.remove() })
      .to(ghost, { y: -14, scale: 1.25, duration: 0.18, ease: 'power2.out' })
      .to(ghost, { y: -74, scale: 0.55, opacity: 0, duration: 0.5, ease: 'power2.in' });

    gsap.fromTo(
      arrow,
      { y: 16, opacity: 0, scale: 0.7 },
      { y: 0, opacity: 1, scale: 1, duration: 0.42, delay: 0.14, ease: 'back.out(2.2)' }
    );

    gsap.fromTo(
      text,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.34, delay: 0.2, ease: 'power2.out' }
    );

    gsap.fromTo(
      btn,
      { scale: 0.94 },
      { scale: 1, duration: 0.5, delay: 0.12, ease: 'elastic.out(1, 0.55)' }
    );
  }

  function render() {
    const list = visible();
    grid.innerHTML = '';
    els.empty.hidden = decks.length > 0;

    list.forEach((deck, i) => {
      const card = document.createElement('article');
      card.className = `deck${isMine(deck) ? ' mine' : ''}`;
      card.style.animationDelay = `${Math.min(i, 8) * 35}ms`;

      const state = voteLabel(deck);

      card.innerHTML = `
        <button class="deck-cover" style="background:${deck.cover}" data-open="${deck.id}"
                data-slides="${deck.slides} slides" aria-label="Open ${deck.team}'s deck">
          ${initials(deck.team)}
        </button>
        <div class="deck-info">
          <h3>${deck.team}</h3>
          <p>${deck.college || ''}</p>
          ${deck.line ? `<p class="deck-line">${deck.line}</p>` : ''}
        </div>
        <div class="deck-foot">
          <span class="deck-tag">${
            deck.status === 'pending' ? 'Waiting on the organiser' : deck.group || 'All decks'
          }</span>
          <button class="vote-btn${state.voted ? ' voted' : ''}" data-vote="${deck.id}"
                  ${state.disabled ? 'disabled' : ''}>
            <span class="vote-arrow" aria-hidden="true">${ARROW}</span>
            <span class="vote-text">${state.text}</span>
          </button>
        </div>`;

      grid.appendChild(card);
    });

    counts();
  }

  /* ---- voting: one per group, never your own, counts stay hidden ---- */

  function castVote(id, btn) {
    const deck = decks.find((d) => d.id === id);
    if (!deck || stage() !== 'voting' || isMine(deck) || hasVoted(deck)) return;

    votes.push(id);
    store.write('podium.votes', votes);

    /* Paint this one button straight away so the animation runs on the element
       the person actually pressed, then redraw the rest of the wall. */
    if (btn) {
      btn.classList.add('voted');
      btn.disabled = true;
      btn.querySelector('.vote-text').textContent = 'You have voted';
      flyArrow(btn);
      setTimeout(render, 620);
    } else {
      render();
    }
  }

  grid.addEventListener('click', (e) => {
    const voteBtn = e.target.closest('[data-vote]');
    if (voteBtn) {
      castVote(voteBtn.dataset.vote, voteBtn);
      return;
    }
    const cover = e.target.closest('[data-open]');
    if (cover) openViewer(cover.dataset.open);
  });

  els.chips.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    filter = btn.dataset.group;
    els.chips.querySelectorAll('.chip-btn').forEach((b) =>
      b.setAttribute('aria-pressed', String(b === btn))
    );
    render();
  });

  document.querySelector('[data-search]')?.addEventListener('input', (e) => {
    query = e.target.value.trim();
    render();
  });

  document.querySelector('[data-sort]')?.addEventListener('change', (e) => {
    sort = e.target.value;
    render();
  });

  /* ---- upload ---- */

  const sheet = document.querySelector('[data-upload-sheet]');
  const uploadForm = document.querySelector('[data-upload-form]');
  const fileInput = document.querySelector('[data-deck-file]');
  const groupField = document.querySelector('[data-group-field]');
  const groupSelect = document.querySelector('#deckGroup');
  const uploadNote = document.querySelector('[data-upload-note]');
  const defaultNote = uploadNote.textContent;
  let picked = null;

  if (groups.length) {
    groupField.hidden = false;
    groups.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      groupSelect.appendChild(opt);
    });
  }

  if (event?.maxSlides) {
    document.querySelector('[data-slide-rule]').textContent = `${event.maxSlides} slides`;
  }

  document.querySelectorAll('[data-open-upload]').forEach((btn) => {
    btn.addEventListener('click', () => sheet.showModal());
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const okType = /\.(pdf|pptx)$/i.test(file.name);
    if (!okType) {
      uploadNote.textContent = 'That file is not a PDF or a PPTX. Export it again and try once more.';
      uploadNote.style.color = 'var(--accent)';
      fileInput.value = '';
      return;
    }
    if (file.size > MAX_BYTES) {
      const mb = Math.round(file.size / 1048576);
      uploadNote.textContent = `That file is ${mb} MB. Export it as a PDF and it usually drops under 25 MB.`;
      uploadNote.style.color = 'var(--accent)';
      fileInput.value = '';
      return;
    }

    picked = { name: file.name, size: file.size };
    uploadNote.textContent = defaultNote;
    uploadNote.style.color = '';
    const drop = document.querySelector('[data-deck-drop]');
    drop.classList.add('filled');
    drop.querySelector('.drop-title').textContent = file.name;
  });

  uploadForm.addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'save') return;

    const team = uploadForm.querySelector('#teamName').value.trim();
    const college = uploadForm.querySelector('#teamCollege').value.trim();

    if (!picked || !team || !college) {
      e.preventDefault();
      uploadNote.textContent = 'Pick a file, then fill in your team name and college.';
      uploadNote.style.color = 'var(--accent)';
      return;
    }

    decks.push({
      id: `d${Date.now().toString(36)}`,
      team,
      college,
      group: groups.length ? groupSelect.value : '',
      line: uploadForm.querySelector('#oneLiner').value.trim(),
      file: picked.name,
      /* real slide counts come from the server once the file is rendered */
      slides: event?.maxSlides || 15,
      cover: COVERS[decks.length % COVERS.length],
      status: event?.reviewDecks ? 'pending' : 'live',
      owner: profile?.name || team,
      at: Date.now(),
    });

    store.write('podium.decks', decks);
    uploadForm.reset();
    picked = null;
    const drop = document.querySelector('[data-deck-drop]');
    drop.classList.remove('filled');
    drop.querySelector('.drop-title').textContent = 'Pick your file';
    uploadNote.textContent = defaultNote;
    render();
  });

  /* ---- viewer ---- */

  const viewer = document.querySelector('[data-viewer]');
  const vTeam = document.querySelector('[data-viewer-team]');
  const vSub = document.querySelector('[data-viewer-sub]');
  const vCount = document.querySelector('[data-viewer-count]');
  const vNum = document.querySelector('[data-slide-n]');
  const vNote = document.querySelector('[data-slide-note]');
  const vVote = document.querySelector('[data-viewer-vote]');
  const prev = document.querySelector('[data-prev]');
  const next = document.querySelector('[data-next]');

  let open = null;
  let page = 1;

  function drawViewer() {
    if (!open) return;
    vTeam.textContent = open.team;
    vSub.textContent = [open.college, open.group].filter(Boolean).join(' · ');
    vNum.textContent = `Slide ${page}`;
    vCount.textContent = `${page} of ${open.slides}`;
    vNote.textContent = `From ${open.file}. Slides appear here once the file has been turned into pictures.`;
    prev.disabled = page === 1;
    next.disabled = page === open.slides;

    const state = voteLabel(open);
    vVote.querySelector('.vote-text').textContent = state.text;
    vVote.disabled = state.disabled;
    vVote.classList.toggle('voted', state.voted);
  }

  function openViewer(id) {
    open = decks.find((d) => d.id === id);
    if (!open) return;
    page = 1;
    drawViewer();
    viewer.showModal();
  }

  prev.addEventListener('click', () => {
    if (page > 1) { page -= 1; drawViewer(); }
  });
  next.addEventListener('click', () => {
    if (open && page < open.slides) { page += 1; drawViewer(); }
  });

  vVote.addEventListener('click', () => {
    if (!open) return;
    castVote(open.id, vVote);
  });

  document.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());

  document.addEventListener('keydown', (e) => {
    if (!viewer.open) return;
    if (e.key === 'ArrowLeft') prev.click();
    if (e.key === 'ArrowRight') next.click();
    if (e.key.toLowerCase() === 'v' && !vVote.disabled) vVote.click();
  });

  drawHead();
  drawChips();
  render();
})();

/* ---------------- organiser dashboard ---------------- */

(function dashboard() {
  const main = document.querySelector('.dash-page');
  if (!main) return;

  const store = {
    read(key, fallback) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch (err) {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        /* private mode */
      }
    },
  };

  let event = store.read('podium.event', null);
  let decks = store.read('podium.decks', []);

  /* Votes live per voter in the browser today. On a server this is one table,
     and these counts come from a group-by. */
  const raw = store.read('podium.votes', []);
  const myVotes = Array.isArray(raw) ? raw : Object.values(raw || {}).filter(Boolean);

  const $ = (sel) => document.querySelector(sel);

  function stage() {
    if (!event) return 'open';
    if (event.stage === 'closed') return 'closed';
    const now = Date.now();
    const opens = event.voteOpen ? new Date(event.voteOpen).getTime() : null;
    const closes = event.voteClose ? new Date(event.voteClose).getTime() : null;
    if (closes && now > closes) return 'closed';
    if (opens && now >= opens) return 'voting';
    return 'open';
  }

  function when(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  function countFor(deckId) {
    return myVotes.filter((id) => id === deckId).length;
  }

  function save() {
    store.write('podium.event', event);
    store.write('podium.decks', decks);
  }

  /* ---- head and numbers ---- */

  function drawHead() {
    if (!event) return;
    $('[data-dash-name]').textContent = event.name || 'Your event';
    $('[data-dash-meta]').textContent =
      [event.host, event.venue || (event.mode === 'online' ? 'Online' : '')].filter(Boolean).join(' · ') ||
      'Your event';
    $('[data-dash-code]').textContent = event.code || '——————';

    const now = stage();
    const pill = $('[data-dash-pill]');
    pill.dataset.stage = now;
    pill.textContent = now === 'closed' ? 'Voting closed' : now === 'voting' ? 'Voting open' : 'Uploads open';

    $('[data-dash-next]').textContent =
      now === 'closed'
        ? 'Results are public. The wall now shows the podium.'
        : now === 'voting'
        ? `Voting closes ${when(event.voteClose) || 'when you close it'}.`
        : `Voting opens ${when(event.voteOpen) || 'when you open it'}.`;

    drawStageActions(now);
  }

  function drawStageActions(now) {
    const box = $('[data-stage-actions]');
    box.innerHTML = '';

    const add = (label, ghost, fn) => {
      const b = document.createElement('button');
      b.className = `btn ${ghost ? 'btn-ghost' : 'btn-primary'}`;
      b.textContent = label;
      b.addEventListener('click', fn);
      box.appendChild(b);
    };

    if (now === 'open') {
      add('Open voting now', false, () => {
        event.voteOpen = localStamp(0);
        if (!event.voteClose) event.voteClose = localStamp(4 * 3600e3);
        save();
        drawAll();
      });
      add('Push uploads by an hour', true, () => {
        event.uploadsClose = localStamp(3600e3);
        save();
        drawAll();
      });
    }

    if (now === 'voting') {
      add('Give it another hour', true, () => {
        event.voteClose = localStamp(3600e3);
        save();
        drawAll();
      });
    }

    if (now === 'closed') {
      add('See the podium', false, () => (location.href = 'results.html'));
      add('Reopen voting', true, () => {
        event.stage = 'open';
        event.voteClose = localStamp(3600e3);
        save();
        drawAll();
      });
    }
  }

  function localStamp(offset) {
    const d = new Date(Date.now() + offset);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function drawStats() {
    const live = decks.filter((d) => d.status !== 'hidden');
    const pending = decks.filter((d) => d.status === 'pending');
    const backed = live.filter((d) => countFor(d.id) > 0);

    $('[data-stat-decks]').textContent = live.length;
    $('[data-stat-decks-sub]').textContent = live.length
      ? `Newest ${when(new Date(Math.max(...live.map((d) => d.at))).toISOString())}`
      : 'Nothing uploaded yet';
    $('[data-stat-votes]').textContent = myVotes.length;
    $('[data-stat-backed]').textContent = backed.length;
    $('[data-stat-backed-sub]').textContent = `of ${live.length}`;
    $('[data-stat-pending]').textContent = pending.length;
  }

  /* ---- decks ---- */

  function drawDecks() {
    const rows = $('[data-deck-rows]');
    rows.innerHTML = '';
    $('[data-decks-empty]').hidden = decks.length > 0;

    decks
      .slice()
      .sort((a, b) => b.at - a.at)
      .forEach((deck) => {
        const state = deck.status || 'live';
        const row = document.createElement('div');
        row.className = 'deck-row';
        row.innerHTML = `
          <div class="row-main">
            <h3>${deck.team}</h3>
            <p>${[deck.college, deck.group, deck.file].filter(Boolean).join(' · ')}</p>
          </div>
          <span class="row-state" data-state="${state}">${
            state === 'live' ? 'On the wall' : state === 'pending' ? 'Waiting on you' : 'Hidden'
          }</span>
          <div class="row-actions">
            ${state !== 'live' ? `<button class="btn btn-ghost btn-sm" data-let-in="${deck.id}">Let it in</button>` : ''}
            ${state === 'live' ? `<button class="btn btn-ghost btn-sm" data-hide="${deck.id}">Hide</button>` : ''}
          </div>`;
        rows.appendChild(row);
      });
  }

  $('[data-deck-rows]').addEventListener('click', (e) => {
    const letIn = e.target.closest('[data-let-in]');
    const hide = e.target.closest('[data-hide]');
    const id = letIn?.dataset.letIn || hide?.dataset.hide;
    if (!id) return;

    const deck = decks.find((d) => d.id === id);
    if (!deck) return;
    deck.status = letIn ? 'live' : 'hidden';
    save();
    drawAll();
  });

  const reviewToggle = $('[data-review-toggle]');
  reviewToggle.checked = Boolean(event?.reviewDecks);
  reviewToggle.addEventListener('change', () => {
    if (!event) return;
    event.reviewDecks = reviewToggle.checked;
    save();
  });

  /* ---- standings ---- */

  function drawStandings() {
    const list = $('[data-standings]');
    list.innerHTML = '';

    const ranked = decks
      .filter((d) => d.status !== 'hidden')
      .map((d) => ({ ...d, n: countFor(d.id) }))
      .filter((d) => d.n > 0)
      .sort((a, b) => b.n - a.n);

    $('[data-standings-empty]').hidden = ranked.length > 0;
    const top = ranked[0]?.n || 1;

    ranked.forEach((deck, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="rank">${i + 1}</span>
        <span>
          <span class="row-top"><span class="team">${deck.team}</span><span class="n">${deck.n}</span></span>
          <span class="bar"><span style="width:${Math.round((deck.n / top) * 100)}%"></span></span>
        </span>
        <span class="micro">${deck.group || ''}</span>`;
      list.appendChild(li);
    });
  }

  /* ---- the checks worth running before announcing ---- */

  function drawChecks() {
    const list = $('[data-checks]');
    list.innerHTML = '';

    const live = decks.filter((d) => d.status !== 'hidden');
    const backed = live.filter((d) => countFor(d.id) > 0);
    const ranked = live.map((d) => countFor(d.id)).sort((a, b) => b - a);
    const gap = ranked.length > 1 ? ranked[0] - ranked[1] : ranked[0] || 0;

    const rows = [
      {
        flag: myVotes.length ? 'ok' : 'idle',
        title: 'Votes are one per deck, and final',
        body: myVotes.length
          ? `${myVotes.length} vote${myVotes.length === 1 ? '' : 's'} recorded on this device. Nobody can take a vote back, so the count only ever grows.`
          : 'No votes yet. Nothing to check.',
      },
      {
        flag: backed.length < live.length / 2 && live.length > 3 ? 'warn' : 'ok',
        title: 'Spread across the decks',
        body: `${backed.length} of ${live.length} decks have at least one vote. A room voting for only a handful usually means people saw only a handful — check the wall loads for everyone.`,
      },
      {
        flag: gap > 0 && ranked[0] > 3 && gap === ranked[0] ? 'warn' : 'ok',
        title: 'The gap at the top',
        body: ranked.length
          ? `The leader is ${gap} ahead of second. A jump that appears in one burst is worth a second look at the timing.`
          : 'No leader yet.',
      },
      {
        flag: 'idle',
        title: 'Self-votes are blocked',
        body: 'A team cannot back its own deck. This is enforced in the wall and will be enforced again in the database.',
      },
      {
        flag: 'idle',
        title: 'Waiting on the server',
        body: 'Repeat accounts, votes from one IP range, and accounts made in the last hour are the checks that need real sign-in. They land with the database.',
      },
    ];

    rows.forEach((row) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="check-dot" data-flag="${row.flag}"></span>
        <span><b>${row.title}</b><span>${row.body}</span></span>`;
      list.appendChild(li);
    });
  }

  /* ---- closing ---- */

  const confirmBox = $('[data-confirm-close]');
  const closeBtn = $('[data-close-voting]');

  confirmBox.addEventListener('change', () => {
    closeBtn.disabled = !confirmBox.checked;
  });

  closeBtn.addEventListener('click', () => {
    if (!event || !confirmBox.checked) return;
    event.stage = 'closed';
    event.voteClose = localStamp(0);
    save();
    confirmBox.checked = false;
    closeBtn.disabled = true;
    $('[data-close-note]').textContent = 'Voting is closed. The wall shows the podium now.';
    drawAll();
  });

  $('[data-copy-code]')?.addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(event?.code || '');
      e.target.textContent = 'Copied';
      setTimeout(() => (e.target.textContent = 'Copy'), 1500);
    } catch (err) {
      e.target.textContent = 'Copy by hand';
    }
  });

  function drawAll() {
    drawHead();
    drawStats();
    drawDecks();
    drawStandings();
    drawChecks();
  }

  drawAll();
})();


/* ---------------- landing page role tabs ---------------- */

(function roleTabs() {
  const list = document.querySelector('.tabs');
  if (!list) return;

  const tabs = [...list.querySelectorAll('[role="tab"]')];

  function select(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }

  list.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) select(tab);
  });

  /* left and right arrows move between tabs, which is what a screen reader
     user expects from a tablist */
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      select(next);
    }
  });
})();

/* ---------------- header: who is signed in ---------------- */

(function signedInHeader() {
  const who = document.querySelector('[data-who]');
  const signIn = document.querySelector('[data-signin-btn]');
  if (!who && !signIn) return;

  const read = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (err) {
      return null;
    }
  };

  const profile = read('podium.profile');
  const event = read('podium.event');

  /* Once someone is in, "Sign in with Google" is noise. Show them instead. */
  if (profile?.name && who && signIn) {
    who.querySelector('[data-who-name]').textContent = profile.name;
    who.hidden = false;
    signIn.remove();
  }

  /* The header says which event you are in, so three screens stop feeling like
     three websites. */
  const chip = document.querySelector('[data-event-chip]');
  if (chip && event?.name) {
    chip.textContent = event.code ? `${event.name} · ${event.code}` : event.name;
    chip.hidden = false;
  }

  /* Dashboard and Settings belong to whoever runs the event. Everyone else
     sees the wall and nothing they cannot use. */
  const organiser = profile?.role === 'organiser' || Boolean(event);
  if (organiser) {
    document.querySelectorAll('[data-organiser-only]').forEach((el) => {
      el.hidden = false;
    });
  }
})();


/* ---------------- the hero bridge ---------------- */

(function heroBridge() {
  const bridge = document.querySelector('[data-bridge]');
  if (!bridge) return;

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch (err) {
      return fallback;
    }
  };

  const event = read('podium.event', null);
  const decks = read('podium.decks', []);
  const rawVotes = read('podium.votes', []);
  const votes = Array.isArray(rawVotes) ? rawVotes : Object.values(rawVotes || {}).filter(Boolean);

  /* With nothing to count, the strip states the three rules instead. Zeros on a
     landing page say "nobody is here". */
  if (!event && !decks.length) return;

  const set = (key, big, small) => {
    document.querySelector(`[data-bridge-${key}]`).textContent = big;
    document.querySelector(`[data-bridge-${key}-sub]`).textContent = small;
  };

  const live = decks.filter((d) => d.status !== 'hidden');

  const cells = [
    { key: 'a', to: event ? 1 : 0, label: event ? 'Event running' : 'Events running' },
    { key: 'b', to: live.length, label: live.length === 1 ? 'Deck on the wall' : 'Decks on the wall' },
    { key: 'c', to: votes.length, label: votes.length === 1 ? 'Vote cast' : 'Votes cast' },
  ];

  cells.forEach(({ key, to, label }) => set(key, '0', label));

  const move = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.gsap;

  /* Count only once the card is actually on screen, otherwise the numbers have
     already finished by the time anyone looks at them. */
  function run() {
    cells.forEach(({ key, to }, i) => {
      const el = document.querySelector(`[data-bridge-${key}]`);
      if (!move) {
        el.textContent = String(to);
        return;
      }
      const counter = { n: 0 };
      gsap.to(counter, {
        n: to,
        duration: 0.9 + i * 0.12,
        delay: 0.1 + i * 0.09,
        ease: 'power2.out',
        snap: { n: 1 },
        onUpdate: () => {
          el.textContent = String(Math.round(counter.n));
        },
      });
    });

    if (move) {
      gsap.from(bridge, { y: 14, opacity: 0, duration: 0.6, ease: 'power3.out' });
    }
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          run();
        });
      },
      { threshold: 0.4 }
    );
    io.observe(bridge);
  } else {
    run();
  }
})();

/* ---------------- results ---------------- */

(function results() {
  const page = document.querySelector('.results-page');
  if (!page) return;

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch (err) {
      return fallback;
    }
  };

  const event = read('podium.event', null);
  const decks = read('podium.decks', []).filter((d) => d.status !== 'hidden');
  const rawVotes = read('podium.votes', []);
  const votes = Array.isArray(rawVotes) ? rawVotes : Object.values(rawVotes || {}).filter(Boolean);

  const BANNERS = {
    1: 'linear-gradient(120deg, #f7efe2, #e8d9c2)',
    2: 'linear-gradient(120deg, #47564a, #6f8472)',
    3: 'linear-gradient(120deg, #c9541f, #e59264)',
    4: 'linear-gradient(120deg, #1b1a16, #4a463c)',
  };

  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18v-6H5l7-7 7 7h-4v6z"/></svg>';

  function closed() {
    if (!event) return false;
    if (event.stage === 'closed') return true;
    return Boolean(event.voteClose) && Date.now() > new Date(event.voteClose).getTime();
  }

  function when(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  /* Voting is still open, so the page says so and nothing else. Showing a
     leaderboard early is the one change that would quietly ruin a contest. */
  if (!closed()) {
    document.querySelector('[data-wait]').hidden = false;
    const note = document.querySelector('[data-wait-note]');
    note.textContent = event?.voteClose
      ? `Voting closes ${when(event.voteClose)}.`
      : 'The organiser has not opened voting yet.';
    return;
  }

  document.querySelector('[data-results]').hidden = false;

  const ranked = decks
    .map((d) => ({ ...d, n: votes.filter((id) => id === d.id).length }))
    .sort((a, b) => b.n - a.n || a.team.localeCompare(b.team));

  const top = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  document.querySelector('[data-results-event]').textContent = event?.name || 'Your event';
  document.querySelector('[data-results-sub]').textContent = `${decks.length} deck${
    decks.length === 1 ? '' : 's'
  }, ${votes.length} vote${votes.length === 1 ? '' : 's'}, one winner.`;

  /* The podium reads 2, 1, 3 across the screen, so the winner stands in the
     middle. On a phone the grid stacks and the winner is pulled to the top. */
  const order = [top[1], top[0], top[2]];
  const RANK_WORD = ['Second', 'Winner', 'Third'];
  const CLASS = ['second', 'first', 'third'];

  const podium = document.querySelector('[data-podium]');

  order.forEach((deck, i) => {
    if (!deck) return;
    const el = document.createElement('article');
    el.className = `place ${CLASS[i]}`;
    el.innerHTML = `
      <div class="place-banner" style="background:${BANNERS[event?.banner || 1]}"></div>
      <p class="place-rank">${RANK_WORD[i]}</p>
      <p class="place-team">${deck.team}</p>
      <p class="place-detail">${[deck.college, deck.group].filter(Boolean).join(' · ')}</p>
      ${deck.line ? `<p class="place-detail" style="margin-top:6px">${deck.line}</p>` : ''}
      <span class="place-votes">${ARROW}${deck.n} vote${deck.n === 1 ? '' : 's'}</span>`;
    podium.appendChild(el);
  });

  /* A tie on the top step is the one result the page must not paper over. */
  const tied = top.length > 1 && top[0].n === top[1].n && top[0].n > 0;

  document.querySelector('[data-podium-note]').textContent = !ranked.length
    ? 'No decks were uploaded for this event.'
    : tied
    ? `Two decks finished level on ${top[0].n} vote${top[0].n === 1 ? '' : 's'}. The organiser decides how to break it.`
    : `Closed ${when(event?.voteClose) || 'by the organiser'}. Counts were hidden until then.`;

  const list = document.querySelector('[data-rest]');
  (rest.length ? rest : []).forEach((deck, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank">${i + 4}</span>
      <span>
        <span class="team">${deck.team}</span><br />
        <span class="sub">${[deck.college, deck.group].filter(Boolean).join(' · ')}</span>
      </span>
      <span class="count">${deck.n} vote${deck.n === 1 ? '' : 's'}</span>`;
    list.appendChild(li);
  });

  if (!rest.length) {
    const li = document.createElement('li');
    li.innerHTML = '<span class="sub">Every deck is on the podium.</span>';
    list.appendChild(li);
  }

  /* the winners rise into place */
  if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.from('.place', {
      y: 26,
      opacity: 0,
      duration: 0.62,
      ease: 'power3.out',
      stagger: { each: 0.12, from: 'center' },
    });
  }

  /* one line an organiser can paste into a group chat */
  function resultLines() {
    return ranked
      .map((d, i) => `${i + 1}. ${d.team}${d.college ? ` (${d.college})` : ''} — ${d.n} vote${d.n === 1 ? '' : 's'}`)
      .join('\n');
  }

  const note = document.querySelector('[data-results-note]');

  document.querySelector('[data-copy-results]').addEventListener('click', async () => {
    const text = `${event?.name || 'Results'}\n\n${resultLines()}`;
    try {
      await navigator.clipboard.writeText(text);
      note.textContent = 'Results copied. Paste them wherever your teams are.';
    } catch (err) {
      note.textContent = 'Could not copy here. Select the list and copy it by hand.';
    }
  });

  /* the organiser also gets the file they will ask for the next morning */
  const csvBtn = document.querySelector('[data-csv]');
  if (event) {
    csvBtn.hidden = false;
    csvBtn.addEventListener('click', () => {
      const rows = [
        ['rank', 'team', 'college', 'group', 'votes'],
        ...ranked.map((d, i) => [i + 1, d.team, d.college || '', d.group || '', d.n]),
      ];
      const csv = rows
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(event.name || 'podium').toLowerCase().replace(/\s+/g, '-')}-results.csv`;
      a.click();
      URL.revokeObjectURL(url);
      note.textContent = 'CSV downloaded.';
    });
  }
})();
