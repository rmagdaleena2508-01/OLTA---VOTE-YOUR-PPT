-- One row, read by the scheduled GitHub Action every few days, so the free
-- project never sits idle for seven days and gets paused.
create table if not exists public.heartbeat (
  id        smallint primary key default 1 check (id = 1),
  last_seen timestamptz not null default now()
);

insert into public.heartbeat (id) values (1) on conflict do nothing;

alter table public.heartbeat enable row level security;

drop policy if exists heartbeat_read on public.heartbeat;
create policy heartbeat_read on public.heartbeat for select using (true);
