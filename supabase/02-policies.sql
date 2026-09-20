-- Podium row-level security
-- Run after 01-schema.sql. Every table is locked by default and then opened,
-- statement by statement, only as far as it has to be.
--
-- The rule to remember: the browser is never trusted. It can send any request
-- it likes; these policies decide what actually happens.

alter table public.profiles      enable row level security;
alter table public.events        enable row level security;
alter table public.event_members enable row level security;
alter table public.decks         enable row level security;
alter table public.deck_pages    enable row level security;
alter table public.votes         enable row level security;
alter table public.results       enable row level security;

-- ---------------------------------------------------------------- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using (
    id = auth.uid()
    -- an organiser can see the people in their own event, nobody else's
    or exists (
      select 1 from public.event_members mine
      join public.event_members theirs on theirs.event_id = mine.event_id
      where mine.profile_id = auth.uid()
        and mine.role = 'organiser'
        and theirs.profile_id = public.profiles.id
    )
  );

drop policy if exists profiles_write_own on public.profiles;
create policy profiles_write_own on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------- events
-- A listed event is readable by anyone, so the wall works for a room full of
-- people who have not signed in. A private one needs the code, which the client
-- sends as an exact match, or membership.
drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select using (
    is_listed
    or public.is_organiser(id)
    or exists (
      select 1 from public.event_members m
      where m.event_id = public.events.id and m.profile_id = auth.uid()
    )
  );

drop policy if exists events_create on public.events;
create policy events_create on public.events
  for insert with check (organiser_id = auth.uid());

drop policy if exists events_update_own on public.events;
create policy events_update_own on public.events
  for update using (public.is_organiser(id)) with check (public.is_organiser(id));

-- ---------------------------------------------------------------- members
drop policy if exists members_read on public.event_members;
create policy members_read on public.event_members
  for select using (profile_id = auth.uid() or public.is_organiser(event_id));

-- Joining an event adds your own row, as a voter. Nobody can write themselves
-- in as an organiser: that role only arrives from the creation trigger or from
-- an organiser promoting someone.
drop policy if exists members_join on public.event_members;
create policy members_join on public.event_members
  for insert with check (
    (profile_id = auth.uid() and role = 'voter')
    or public.is_organiser(event_id)
  );

drop policy if exists members_manage on public.event_members;
create policy members_manage on public.event_members
  for update using (public.is_organiser(event_id)) with check (public.is_organiser(event_id));

-- ---------------------------------------------------------------- decks
-- A deck on the wall is readable by anyone who can read the event. A deck still
-- waiting is visible to its own team and the organiser. Hidden means hidden.
drop policy if exists decks_read on public.decks;
create policy decks_read on public.decks
  for select using (
    (status = 'live' and exists (select 1 from public.events e where e.id = event_id))
    or owner_id = auth.uid()
    or public.is_organiser(event_id)
  );

-- Upload: you must be signed in, own the row, be a member of the event, the
-- event must be open, and uploads must not have closed. The unique constraint
-- on (event_id, owner_id) does the "one deck per team" part.
drop policy if exists decks_insert on public.decks;
create policy decks_insert on public.decks
  for insert with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.event_members m
      where m.event_id = decks.event_id and m.profile_id = auth.uid()
    )
    and exists (
      select 1 from public.events e
      where e.id = decks.event_id
        and e.stage in ('open', 'voting')
        and (e.uploads_close_at is null or now() <= e.uploads_close_at)
    )
    and (
      group_name is null
      or group_name = any (select unnest(e2.groups) from public.events e2 where e2.id = decks.event_id)
    )
  );

-- A team edits its own deck while uploads are open. An organiser changes status
-- at any time — that is what letting a deck in or hiding it means.
drop policy if exists decks_update_own on public.decks;
create policy decks_update_own on public.decks
  for update using (
    (owner_id = auth.uid() and exists (
      select 1 from public.events e
      where e.id = event_id and (e.uploads_close_at is null or now() <= e.uploads_close_at)
    ))
    or public.is_organiser(event_id)
  ) with check (owner_id = auth.uid() or public.is_organiser(event_id));

drop policy if exists decks_delete_own on public.decks;
create policy decks_delete_own on public.decks
  for delete using (owner_id = auth.uid() or public.is_organiser(event_id));

-- ---------------------------------------------------------------- pages
drop policy if exists pages_read on public.deck_pages;
create policy pages_read on public.deck_pages
  for select using (
    exists (
      select 1 from public.decks d
      where d.id = deck_id
        and (d.status = 'live' or d.owner_id = auth.uid() or public.is_organiser(d.event_id))
    )
  );

drop policy if exists pages_write on public.deck_pages;
create policy pages_write on public.deck_pages
  for insert with check (
    exists (select 1 from public.decks d where d.id = deck_id and d.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------- votes
-- The five conditions of a vote, in the one place that cannot be skipped:
--   signed in, event in voting, deck live, not your own deck, member of the event.
-- The sixth — only once per deck — is the unique constraint in the schema.
drop policy if exists votes_insert on public.votes;
create policy votes_insert on public.votes
  for insert with check (
    voter_id = auth.uid()
    and public.event_is(event_id, 'voting')
    and exists (
      select 1 from public.decks d
      where d.id = deck_id
        and d.event_id = votes.event_id
        and d.status = 'live'
        and d.owner_id <> auth.uid()          -- nobody votes for their own deck
    )
    and exists (
      select 1 from public.event_members m
      where m.event_id = votes.event_id and m.profile_id = auth.uid()
    )
  );

-- Counts stay hidden until the organiser closes voting. Until then only the
-- organiser can read vote rows, and nobody can read who voted for what except
-- the voter themselves.
drop policy if exists votes_read on public.votes;
create policy votes_read on public.votes
  for select using (
    voter_id = auth.uid()
    or public.is_organiser(event_id)
    or public.event_is(event_id, 'closed')
  );

-- No update policy and no delete policy: a vote is final. The trigger in the
-- schema refuses it even if a policy is added by mistake later.

-- ---------------------------------------------------------------- results
drop policy if exists results_read on public.results;
create policy results_read on public.results
  for select using (true);

drop policy if exists results_write on public.results;
create policy results_write on public.results
  for insert with check (public.is_organiser(event_id));

drop policy if exists results_update on public.results;
create policy results_update on public.results
  for update using (public.is_organiser(event_id)) with check (public.is_organiser(event_id));

-- ---------------------------------------------------------------- notes
-- The `deck_counts` view inherits the policies of the tables under it, so a
-- visitor reading it before close sees zeros rather than a leak.
--
-- Nothing here needs the service_role key. That key bypasses every policy above
-- and must never appear in this repository or in the browser.
