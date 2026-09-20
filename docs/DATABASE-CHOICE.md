# Which free database, and why

What this product actually needs, then what the free tiers give in 2026, then a
recommendation. Figures checked in September 2026 — free tiers move, so re-check
before signing up.

---

## What Podium needs from a backend

1. **Real constraints.** The whole voting rule is one line of SQL:
   `unique (event_id, voter_id, deck_id)`. Without it, "one vote per deck" is a
   promise; with it, a second vote is impossible.
2. **Rules the browser cannot skip.** Counts hidden until close, a team unable
   to vote for itself, a deck writable only by its owner. These belong in
   row-level policies.
3. **Sign-in** for a few hundred students per event.
4. **File storage** for decks, posters and banners.
5. **Near-zero maintenance.** This runs a fest once a term, not a business.

Both 1 and 2 rule out a document store as the main database. Firestore has no
unique constraints — you emulate them with a document id and hope.

---

## The free tiers, September 2026

| Service | Database | File storage | Sign-in | Sleeps? | Shape |
|---|---|---|---|---|---|
| **Supabase** | 500 MB Postgres | 1 GB | 50,000 monthly users | **Yes** — paused after 7 quiet days, restorable for a year, data kept | Postgres + RLS + auth + storage in one project |
| **Appwrite Cloud** | 1 database | 2 GB | 75,000 monthly users | Yes, after about a week | Document store with its own permission model |
| **Firebase (Spark)** | 1 GB Firestore, 20,000 writes a day | **None** — Cloud Storage left the free plan in February 2026 and now needs a card | 50,000 monthly users | No | Document store, no unique constraints |
| **Cloudflare D1 + R2** | 5 GB SQLite, 100,000 row writes a day | **10 GB R2, free egress** | Not included | No | Assemble it yourself; auth from elsewhere |
| **Neon** | 0.5 GB Postgres, up to 100 projects | None | Not included | Scales to zero, wakes on request | Postgres only |
| **Turso** | 5 GB SQLite, 500M row reads a month | None | Not included | No | SQLite only |
| **CockroachDB Serverless** | 10 GB | None | Not included | No | Postgres-compatible, heavier to operate |

Sources are listed at the bottom.

---

## The storage sum that decides it

A deck is capped at 25 MB. Rendered to page images it is far smaller — about 15
pages at roughly 120 KB each, so **under 2 MB per deck**.

| What we keep | Space per deck | Decks in 1 GB | Decks in 10 GB |
|---|---|---|---|
| Original file only | up to 25 MB | ~40 | ~400 |
| Rendered pages only | ~2 MB | ~500 | ~5,000 |
| Both, for 90 days | ~27 MB | ~37 | ~370 |

A single fest with 40 teams fills Supabase's 1 GB if originals are kept. That is
the real constraint — not the database, which holds only rows.

Two ways out, and we should do both:

1. **Serve rendered pages, keep originals only while they are needed.** The wall
   never shows the original anyway.
2. **Put files somewhere with room.** R2's free tier is 10 GB with no charge for
   egress, which is the part that usually costs money elsewhere.

---

## Recommendation

**Supabase for data, sign-in and policies. Cloudflare R2 for files.**

Why this pair:

- Supabase is the only free tier that gives Postgres, sign-in and row-level
  security in one project, and those three are exactly where the voting rules
  have to live. 500 MB of rows is enormous for this: an event is one row, a deck
  is one row, a vote is one row. A fest with 300 voters and 40 decks is a few
  thousand rows.
- R2 takes the pressure off storage — 10 GB instead of 1 GB, and free egress, so
  300 people opening decks on the venue wifi costs nothing.
- Both are managed. Nothing to patch, back up or restart.

**The one catch, and the fix.** Supabase pauses a free project after seven quiet
days. A fest runs once a term, so this will happen. Data is not lost — the
project restores from the dashboard and the disk is intact — but an organiser
opening the site mid-pause sees errors. Fix it with a scheduled GitHub Action
that queries one row every few days. Ten lines of YAML, free, and the project
never sleeps.

**If you would rather not manage two services:** take Appwrite Cloud. One
project, 2 GB of storage, 75,000 users, and its own permission rules. The cost
is that the data model is documents, so "one vote per deck" becomes a composite
document id and a rule, rather than a constraint the database enforces for you.

**Do not take Firebase for this.** Cloud Storage left the free plan in February
2026, so decks and posters would need a card on file from the first upload, and
Firestore cannot express the one rule this product is built around.

---

## What gets built either way

```
profiles       id, name, college, created_at
events         id, slug, code, organiser_id, name, host, stage, dates, rules
event_members  event_id, profile_id, role         -- unique (event_id, profile_id)
decks          id, event_id, owner_id, team, college, group_name, one_liner,
                 file_path, page_count, status     -- unique (event_id, owner_id)
votes          id, event_id, deck_id, voter_id     -- unique (event_id, voter_id, deck_id)
results        event_id, snapshot, decided_by, decided_at
```

The policies that matter:

- A vote inserts only if the person is signed in, the event stage is `voting`,
  the deck is `live`, and the voter does not own that deck.
- Vote rows are readable by the organiser always, by everyone once the stage is
  `closed`.
- A deck is writable by its owner while uploads are open, and by the organiser
  for status changes.
- Files are private; the wall reads rendered pages, and an original is signed out
  only when the organiser has allowed downloads.

## First steps, in order

1. Create the Supabase project, run the schema, write the policies.
2. Add the keep-alive Action so it never pauses.
3. Sign-in and profiles; role from `event_members`.
4. Decks and votes against the database.
5. `pdf.js` in the uploader's browser for page images and a real page count.
6. R2 bucket, upload through a signed URL, originals expiring on a lifecycle
   rule.

## Sources

- Supabase free tier and project pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Supabase pricing: https://supabase.com/pricing
- Appwrite Cloud pricing: https://appwrite.io/pricing
- Firebase pricing, including Cloud Storage leaving Spark: https://firebase.google.com/pricing
- Firestore quotas: https://firebase.google.com/docs/firestore/quotas
- Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Neon pricing: https://neon.tech/pricing
- Turso pricing: https://turso.tech/pricing
- Serverless SQL free-tier comparison: https://github.com/hbmartin/comparison-serverless-cloud-sql-databases
