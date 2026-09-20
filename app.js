/* OLTA — landing + onboarding behaviour. No backend yet; choices are kept in
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
  const roleNext = card.querySelector('[data-action="role-next"]');
  const finishBtn = card.querySelector('[data-action="finish"]');
  const teamField = card.querySelector('[data-participant-only]');
  const nameInput = card.querySelector('#displayName');
  const collegeInput = card.querySelector('#college');
  const doneLine = card.querySelector('[data-done-line]');

  const state = { role: null };

  /* The landing page splits the role at the button (Luma's pattern), so honour
     ?intent= and pre-select the matching card. */
  const intentToRole = { upload: 'participant', vote: 'voter', host: 'organiser' };
  const intent = new URLSearchParams(location.search).get('intent');

  function show(step) {
    panels.forEach((p) => p.classList.toggle('on', Number(p.dataset.panel) === step));
    dots.forEach((d) => d.classList.toggle('on', Number(d.dataset.dot) <= Math.min(step, 3)));
    card.scrollIntoView({ block: 'nearest' });
  }

  function selectRole(role) {
    state.role = role;
    roleButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
    if (roleNext) roleNext.disabled = false;
    if (teamField) teamField.hidden = role !== 'participant';
  }

  function checkProfile() {
    if (!finishBtn) return;
    const ok = nameInput.value.trim().length > 1 && collegeInput.value.trim().length > 1;
    finishBtn.disabled = !ok;
  }

  card.querySelector('[data-action="signin"]')?.addEventListener('click', (e) => {
    /* Real Google sign-in goes here. For now it just advances the flow. */
    e.preventDefault();
    if (intent && intentToRole[intent]) selectRole(intentToRole[intent]);
    show(2);
  });

  roleButtons.forEach((btn) => {
    btn.addEventListener('click', () => selectRole(btn.dataset.role));
  });

  roleNext?.addEventListener('click', () => show(3));

  card.querySelectorAll('.back-step').forEach((btn) => {
    btn.addEventListener('click', () => show(Number(btn.dataset.back)));
  });

  [nameInput, collegeInput].forEach((input) => {
    input?.addEventListener('input', checkProfile);
  });

  finishBtn?.addEventListener('click', () => {
    const profile = {
      role: state.role,
      name: nameInput.value.trim(),
      college: collegeInput.value.trim(),
      team: card.querySelector('#teamName')?.value.trim() || null,
    };
    try {
      localStorage.setItem('olta.profile', JSON.stringify(profile));
    } catch (err) {
      /* private mode — the flow still works, it just won't be remembered */
    }
    if (doneLine) {
      doneLine.textContent =
        profile.role === 'participant'
          ? 'Taking you to the upload screen.'
          : 'Taking you to the decks.';
    }
    show(4);
  });

  card.querySelector('[data-action="invite"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    selectRole('organiser');
    if (teamField) teamField.hidden = true;
    show(3);
  });
})();
