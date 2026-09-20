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
      location.href = eventCode
        ? `create-event.html?code=${encodeURIComponent(eventCode)}`
        : 'create-event.html';
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
    note(`Event created. Your code is ${data.code} — print it on the poster.`, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
