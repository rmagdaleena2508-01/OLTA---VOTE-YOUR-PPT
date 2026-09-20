-- Podium schema, v2 backend
-- Run this in the Supabase SQL editor first, then 02-policies.sql.
-- Safe to re-run: every statement is guarded.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles
-- One row per signed-in person. The id is the auth user's id, so a profile
-- cannot exist without an account behind it.
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null check (char_length(name) between 2 and 60),
  college     text check (char_length(college) <= 80),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- events
-- stage is the single source of truth for what the wall allows. The clock is a
-- convenience; this column is what the policies read.
do $$ begin
  create type event_stage as enum ('draft', 'open', 'voting', 'closed');
exception when duplicate_object then null; end $$;

create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  slug              text unique,
  organiser_id      uuid not null references public.profiles on delete restrict,
  name              text not null check (char_length(name) between 2 and 80),
  host              text not null check (char_length(host) <= 80),
  college           text check (char_length(college) <= 80),
  mode              text not null default 'offline' check (mode in ('offline', 'online', 'hybrid')),
  venue             text check (char_length(venue) <= 120),
  meeting_url       text check (meeting_url ~* '^https?://'),
  signup_form_url   text check (signup_form_url ~* '^https?://'),
  fee_text          text check (char_length(fee_text) <= 40),
  poster_key        text,          -- object key in R2, not a public URL
  banner_key        text,
  banner_preset     smallint check (banner_preset between 1 and 4),
  groups            text[] not null default '{}' check (array_length(groups, 1) is null or array_length(groups, 1) <= 8),
  max_slides        smallint not null default 15 check (max_slides between 3 and 60),
  downloads_allowed boolean not null default false,
  is_listed         boolean not null default true,
  starts_at         timestamptz,
  uploads_close_at  timestamptz,
  voting_opens_at   timestamptz,
  voting_closes_at  timestamptz,
  stage             event_stage not null default 'draft',
  created_at        timestamptz not null default now(),

  -- voting cannot close before it opens, and cannot open before uploads shut
  constraint voting_window_sane check (
    voting_closes_at is null or voting_opens_at is null or voting_closes_at > voting_opens_at
  ),
  constraint uploads_before_voting check (
    uploads_close_at is null or voting_opens_at is null or voting_opens_at >= uploads_close_at
  )
);

create index if not exists events_stage_idx on public.events (stage) where is_listed;

-- ---------------------------------------------------------------- members
-- Why you are what you are. Role comes from this table, never from the browser.
do $$ begin
  create type member_role as enum ('organiser', 'team', 'voter');
exception when duplicate_object then null; end $$;

create table if not exists public.event_members (
  event_id   uuid not null references public.events on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  role       member_role not null default 'voter',
  joined_at  timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create index if not exists event_members_profile_idx on public.event_members (profile_id);

-- ---------------------------------------------------------------- decks
-- unique (event_id, owner_id) is "one deck per team per event", enforced by the
-- database rather than by a check in the interface.
do $$ begin
  create type deck_status as enum ('pending', 'live', 'hidden');
exception when duplicate_object then null; end $$;

create table if not exists public.decks (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events on delete cascade,
  owner_id     uuid not null references public.profiles on delete cascade,
  team         text not null check (char_length(team) between 2 and 60),
  college      text check (char_length(college) <= 80),
  group_name   text check (char_length(group_name) <= 24),
  one_liner    text check (char_length(one_liner) <= 90),
  file_key     text,          -- the original, private, in R2
  page_count   smallint check (page_count between 1 and 200),
  status       deck_status not null default 'live',
  created_at   timestamptz not null default now(),
  unique (event_id, owner_id)
);

create index if not exists decks_event_idx on public.decks (event_id, status);

-- ---------------------------------------------------------------- pages
-- One row per rendered page image. The wall reads these, never the original.
create table if not exists public.deck_pages (
  deck_id     uuid not null references public.decks on delete cascade,
  page        smallint not null check (page between 1 and 200),
  image_key   text not null,
  width       smallint,
  height      smallint,
  primary key (deck_id, page)
);

-- ---------------------------------------------------------------- votes
-- The line the whole product rests on. A second vote for the same deck by the
-- same person cannot be inserted, whatever the client sends.
create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events on delete cascade,
  deck_id    uuid not null references public.decks on delete cascade,
  voter_id   uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, voter_id, deck_id)
);

create index if not exists votes_deck_idx on public.votes (deck_id);
create index if not exists votes_event_idx on public.votes (event_id);

-- A vote is never deleted or edited. There is no update or delete policy, and
-- this trigger refuses it even from a mistaken server-side call.
create or replace function app.votes_are_final() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'a vote cannot be changed or taken back';
end $$;

drop trigger if exists votes_no_change on public.votes;
create trigger votes_no_change
  before update or delete on public.votes
  for each row execute function app.votes_are_final();

-- ---------------------------------------------------------------- results
-- What was announced, and who announced it. Written once when voting closes, so
-- a challenged result has something to show.
create table if not exists public.results (
  event_id    uuid primary key references public.events on delete cascade,
  snapshot    jsonb not null,
  tie_note    text,
  decided_by  uuid references public.profiles,
  decided_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- counts
-- Counts without exposing who voted for what. Used by the wall after close and
-- by the organiser's dashboard at any time.
-- security_invoker makes the view run as the caller, so it obeys the vote
-- policies. Without it the view reads with its owner's rights and leaks counts
-- before the organiser closes voting.
create or replace view public.deck_counts with (security_invoker = on) as
  select d.id as deck_id, d.event_id, count(v.id)::int as votes
  from public.decks d
  left join public.votes v on v.deck_id = d.id
  group by d.id, d.event_id;

-- ---------------------------------------------------------------- helpers
-- Helpers live in a private schema: PostgREST exposes `public`, so a helper
-- there would be callable at /rest/v1/rpc/ by anyone.
create schema if not exists app;
grant usage on schema app to anon, authenticated;

create or replace function app.is_organiser(target_event uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.event_members m
    where m.event_id = target_event
      and m.profile_id = auth.uid()
      and m.role = 'organiser'
  );
$$;

create or replace function app.event_is(target_event uuid, want event_stage) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.events e where e.id = target_event and e.stage = want
  );
$$;

-- The organiser of a new event is its creator, added as a member automatically
-- so the rules have something to read from the first request.
create or replace function app.claim_new_event() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.event_members (event_id, profile_id, role)
  values (new.id, new.organiser_id, 'organiser')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists events_claim on public.events;
create trigger events_claim
  after insert on public.events
  for each row execute function app.claim_new_event();
