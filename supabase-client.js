/* Podium — the database client.
 *
 * Loaded before app.js. If config.js is missing or the project is unreachable,
 * `window.podiumDb` stays null and every screen keeps working from browser
 * storage exactly as it does today. Nothing breaks while this is being wired
 * up, screen by screen.
 *
 * The key in config.js is the publishable key. It is meant to be public: the
 * row-level policies are what protect the data, not the key. The service_role
 * key must never appear here.
 */

(function podiumDatabase() {
  const config = window.PODIUM_CONFIG;

  if (!config?.supabaseUrl || !config?.supabaseKey || !window.supabase) {
    window.podiumDb = null;
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  /* Every call returns { data, error } and never throws, so a screen can show a
     message instead of a blank panel. */
  const ok = (data) => ({ data, error: null });
  const bad = (error) => ({ data: null, error: error?.message || String(error) });

  const db = {
    client,

    /* ---------------- who you are ---------------- */

    async signIn(redirectTo) {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectTo || window.location.href },
      });
      return error ? bad(error) : ok(true);
    },

    async signOut() {
      await client.auth.signOut();
      return ok(true);
    },

    async session() {
      const { data } = await client.auth.getSession();
      return data?.session || null;
    },

    /* The profile row is the account's name and college. It is created on first
       sign-in and is what every deck and vote points at. */
    async me() {
      const session = await db.session();
      if (!session) return null;

      const { data, error } = await client
        .from('profiles')
        .select('id, name, college')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) return null;
      if (data) return data;

      /* First time in: fall back to what Google gave us, and let the profile
         screen correct it. */
      const meta = session.user.user_metadata || {};
      return { id: session.user.id, name: meta.full_name || meta.name || '', college: '', isNew: true };
    },

    async saveProfile({ name, college }) {
      const session = await db.session();
      if (!session) return bad('not signed in');

      const { data, error } = await client
        .from('profiles')
        .upsert({ id: session.user.id, name, college })
        .select()
        .single();

      return error ? bad(error) : ok(data);
    },

    /* ---------------- events ---------------- */

    /* An exact match on the code. A wrong code returns nothing — the policies
       decide what a stranger may see, so this cannot be used to enumerate
       private events. */
    async eventByCode(code) {
      const { data, error } = await client
        .from('events')
        .select('*')
        .eq('code', String(code).toUpperCase())
        .maybeSingle();

      return error ? bad(error) : ok(data);
    },

    async listedEvents() {
      const { data, error } = await client
        .from('events')
        .select('id, code, name, host, college, stage, starts_at, voting_closes_at')
        .eq('is_listed', true)
        .neq('stage', 'draft')
        .order('starts_at', { ascending: true });

      return error ? bad(error) : ok(data || []);
    },

    async createEvent(event) {
      const session = await db.session();
      if (!session) return bad('not signed in');

      const { data, error } = await client
        .from('events')
        .insert({ ...event, organiser_id: session.user.id })
        .select()
        .single();

      /* The organiser membership row is written by a trigger, so the rules have
         something to read from the very first request after this. */
      return error ? bad(error) : ok(data);
    },

    async updateEvent(id, changes) {
      const { data, error } = await client.from('events').update(changes).eq('id', id).select().single();
      return error ? bad(error) : ok(data);
    },

    /* Joining is one row. The policy only allows the 'voter' role here, so
       nobody can write themselves in as an organiser. */
    async joinEvent(eventId) {
      const session = await db.session();
      if (!session) return bad('not signed in');

      const { error } = await client
        .from('event_members')
        .upsert({ event_id: eventId, profile_id: session.user.id, role: 'voter' }, { onConflict: 'event_id,profile_id', ignoreDuplicates: true });

      return error ? bad(error) : ok(true);
    },

    async membersOf(eventId) {
      const { data, error } = await client
        .from('event_members')
        .select('role, joined_at, profiles(id, name, college)')
        .eq('event_id', eventId);

      return error ? bad(error) : ok(data || []);
    },

    /* ---------------- decks ---------------- */

    async decksOf(eventId) {
      const { data, error } = await client
        .from('decks')
        .select('id, event_id, owner_id, team, college, group_name, one_liner, page_count, status, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      return error ? bad(error) : ok(data || []);
    },

    async myDeck(eventId) {
      const session = await db.session();
      if (!session) return ok(null);

      const { data, error } = await client
        .from('decks')
        .select('*')
        .eq('event_id', eventId)
        .eq('owner_id', session.user.id)
        .maybeSingle();

      return error ? bad(error) : ok(data);
    },

    /* One deck per team per event is `unique (event_id, owner_id)` in the
       database, so a second insert fails here rather than being prevented by a
       check in the interface. */
    async addDeck(deck) {
      const session = await db.session();
      if (!session) return bad('not signed in');

      const { data, error } = await client
        .from('decks')
        .insert({ ...deck, owner_id: session.user.id })
        .select()
        .single();

      if (error?.code === '23505') return bad('You have already uploaded a deck for this event.');
      return error ? bad(error) : ok(data);
    },

    async setDeckStatus(deckId, status) {
      const { data, error } = await client.from('decks').update({ status }).eq('id', deckId).select().single();
      return error ? bad(error) : ok(data);
    },

    async pagesOf(deckId) {
      const { data, error } = await client
        .from('deck_pages')
        .select('page, image_key, width, height')
        .eq('deck_id', deckId)
        .order('page');

      return error ? bad(error) : ok(data || []);
    },

    /* ---------------- votes ---------------- */

    /* Five of the six rules are in the insert policy; the sixth is the unique
       constraint. All this does is send the row and translate the refusal into
       something a person can read. */
    async vote(eventId, deckId) {
      const session = await db.session();
      if (!session) return bad('not signed in');

      const { error } = await client
        .from('votes')
        .insert({ event_id: eventId, deck_id: deckId, voter_id: session.user.id });

      if (!error) return ok(true);
      if (error.code === '23505') return bad('You have already voted for this deck.');
      if (error.code === '42501') return bad('Voting is not open, or that deck is your own.');
      return bad(error);
    },

    async myVotes(eventId) {
      const session = await db.session();
      if (!session) return ok([]);

      const { data, error } = await client
        .from('votes')
        .select('deck_id')
        .eq('event_id', eventId)
        .eq('voter_id', session.user.id);

      return error ? bad(error) : ok((data || []).map((row) => row.deck_id));
    },

    /* Counts come from a view that runs as the caller, so a visitor asking for
       them before the event closes gets nothing back. The organiser always
       sees them. */
    async counts(eventId) {
      const { data, error } = await client
        .from('deck_counts')
        .select('deck_id, votes')
        .eq('event_id', eventId);

      return error ? bad(error) : ok(data || []);
    },

    /* ---------------- results ---------------- */

    async closeVoting(eventId, snapshot, tieNote) {
      const session = await db.session();
      if (!session) return bad('not signed in');

      const closed = await db.updateEvent(eventId, {
        stage: 'closed',
        voting_closes_at: new Date().toISOString(),
      });
      if (closed.error) return closed;

      const { error } = await client.from('results').upsert({
        event_id: eventId,
        snapshot,
        tie_note: tieNote || null,
        decided_by: session.user.id,
        decided_at: new Date().toISOString(),
      });

      return error ? bad(error) : ok(true);
    },

    async resultsOf(eventId) {
      const { data, error } = await client.from('results').select('*').eq('event_id', eventId).maybeSingle();
      return error ? bad(error) : ok(data);
    },

    /* ---------------- files ---------------- */

    fileUrl(key) {
      if (!key || !config.filesBaseUrl) return null;
      return `${config.filesBaseUrl.replace(/\/$/, '')}/${key}`;
    },
  };

  window.podiumDb = db;
})();
