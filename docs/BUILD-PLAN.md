# Plan: make it real

Nothing in this file is built yet. Read it, strike what you do not want, and I
will build what is left.

---

## Part A — Demos to remove

These are the places the site still pretends.

| # | What | Where | Replace with |
|---|---|---|---|
| A1 | Fake podium: Team Monsoon, Team Kestrel, Team Nightshift | landing page, "The part people screenshot" | Either the real last closed event, or an illustration of a podium with no names on it. If there is no closed event yet, the section shows the shape, not invented teams |
| A2 | Onboarding "sign in" that signs nobody in | `onboarding.html` | Real sign-in (Part E) |
| A3 | Role stored by clicking a card | `onboarding.html` | Role comes from the database: you are an organiser because you made the event, a team because you uploaded, a voter otherwise |
| A4 | Slide viewer that shows "Slide 3 of 15" over an empty rectangle | wall | Real rendered slides, or an honest single frame saying the deck is a PDF and a link to open it |
| A5 | Slide count fixed to the event's slide limit | wall upload | Real page count, read from the PDF on upload |
| A6 | Vote counts that only count this browser | everywhere | Real counts from the database |
| A7 | Unused mock styles: `.frame-bar`, `.card-visual`, `.deck-thumb`, `.fab-demo`, `.grid-2` | `styles.css` | Delete, they are left over from the mock cards already removed |

---

## Part B — Security and correctness

Found by reading the code as it stands. Severity is what it would be once this
is on a real server with real users.

| # | Issue | Severity | Fix |
|---|---|---|---|
| B1 | **Cross-site scripting.** Team name, college, one-line pitch and group names are written with `innerHTML` in the wall, the dashboard, the standings and the results. A team called `<img src=x onerror=alert(1)>` runs script in every viewer's browser, including the organiser's | **High** | Build those nodes with `textContent`, or escape every interpolated value. This is the one real hole in the current code and I would fix it before anything else |
| B2 | **The client decides who you are.** Role, votes, decks and the event all live in `localStorage`. Anyone can open the console and make themselves an organiser, or add votes | **High** | Server-side identity and authorisation. Nothing the browser says about a role is trusted |
| B3 | **Votes can be forged.** One vote per deck is enforced by an `if` in JavaScript | **High** | A unique constraint on `(event_id, voter_id, deck_id)` in the database, plus a policy that only lets a signed-in person insert their own vote while the event is in the voting stage |
| B4 | **Self-voting is enforced only in the interface** | Medium | Database check: the voter cannot be a member of the team that owns the deck |
| B5 | **Counts are readable before voting closes** if someone queries directly | Medium | A row-level policy that hides vote rows from everyone but the organiser until the event's stage is `closed` |
| B6 | **Event codes can be walked.** 32⁶ is large, but there is no rate limit | Medium | Rate limit the lookup per IP and per account; return the same answer for wrong code and private event |
| B7 | **Uploads are unchecked.** Type and size are checked by name and by `File.size`, both trivially faked | Medium | Check the magic bytes on the server, cap at 25 MB there, store outside the web root, never serve the original unless downloads are on |
| B8 | **Poster and banner images are base64 in `localStorage`** | Low now, breaks later | Object storage with signed URLs |
| B9 | **No audit trail.** If a result is challenged there is nothing to show | Medium | Append-only vote log with timestamp, and a results snapshot written at close |
| B10 | **Organiser invite is a link with no expiry in the plan** | Medium | Single-use, signed, expires in 7 days |

---

## Part C — Ties

Today the results page sorts by votes and breaks a tie alphabetically, then
prints a line admitting it. That is honest but useless to an organiser standing
on a stage.

**Proposed rule, in this order:**

1. **Ties share the place.** Two decks on 84 votes are both **first**. The next
   deck is **third**, not second — standard competition ranking. The podium
   shows two cards on the top step, side by side and the same height.
2. **No automatic tiebreak.** Podium never invents a winner from upload time or
   alphabet. A machine breaking a tie silently is how a fest gets an argument.
3. **The organiser decides, on the record.** When the dashboard sees a tie at a
   podium place it shows a "Break the tie" panel listing the tied teams, with
   three buttons: *Declare joint*, *Pick this one*, *Send to the judges*.
   Whatever is chosen is written to the results snapshot with who chose it and
   when, and the results page says which happened: "Joint first" or "First on
   the organiser's call."
4. **Three or more tied** works the same way.
5. **Edge case:** if every deck has zero votes the page says so and no podium is
   drawn.

Say the word if you would rather have an automatic tiebreak instead — earliest
upload is the usual one — and I will build that instead.

---

## Part D — The podium animation

What is there now: the three cards fade up with a GSAP stagger from the centre.

**Options looked at**

| Tool | Size | What it gives | Verdict |
|---|---|---|---|
| **GSAP timeline** (already loaded) | 0 extra | Blocks rise from below to their step heights, staggered 3rd, 2nd, 1st; the winner overshoots and settles; vote counts count up | **Use this.** It is already a dependency and it does everything below on its own |
| **canvas-confetti** | 2.5 KB | One burst behind the winner when the page opens | **Add it.** Tiny, no dependencies, and this is the one moment in the product that deserves it |
| **Lottie** (`lottie-web`) | 250 KB | Illustrated trophy or medal animations from LottieFiles | Skip. Quarter of a megabyte for decoration, and it would not match the type-led design |
| **Rive** | 100 KB+ | Interactive state-machine animation | Skip. Overkill, and needs a separate editor |
| **Motion One** | 18 KB | Same job as GSAP | Skip. Second animation library |
| **AutoAnimate** | 3 KB | Automatic list transitions | Maybe later for the wall, not the podium |

**What I would build:** steps rise in order 3, 2, 1 with the winner landing last
and overshooting slightly; vote numbers count up from zero as each lands; a
single confetti burst behind the winner, once, skipped under reduced motion; the
winner's card gets a slow shimmer on its border. Around 40 lines, one 2.5 KB
dependency.

---

## Part E — Sign-in, teams and voters

**Sign-in copy.** Every "Sign in with Google" becomes **"Sign in"**. The provider
stays Google underneath — it is the one account every student already has — but
the button, the FAQ and the page titles stop naming it.

**Who is what, decided by the server:**

- You are an **organiser** of an event because you created it, or because
  someone who runs it gave you an invite.
- You are a **team** in an event because you uploaded a deck to it.
- You are a **voter** in an event because you opened it and signed in.

No role picker. The onboarding becomes: sign in, tell us your name and college
once, done.

**The two new dashboard sections**, visible to the organiser only:

*Teams* — one row per deck: team name, college, who signed in for it, when they
uploaded, file, slide count, status (on the wall / waiting / hidden), votes after
close. Search, and CSV export.

*Voters* — one row per person who signed in to this event: name, college, when
they joined, how many decks they backed, and whether they are also on a team.
Search, and CSV export. Two counters at the top: signed in, and how many of them
actually voted.

**What the organiser must not see:** which deck a given voter backed. Showing
that turns a vote into a public act in a room full of friends. The dashboard
shows counts per deck and counts per voter, never the pairing. The database keeps
the pairing so double-voting is impossible; the policy refuses to read it back.

---

## Part F — The stack, and why

Supabase, because it gives all four of the things this product needs in one
place: Postgres with real constraints, Google sign-in, object storage for decks
and posters, and row-level security so the rules above are enforced in the
database rather than in the browser. The front end stays exactly as it is —
plain HTML, CSS and JavaScript — and talks to it with one script tag. No build
step, and GitHub Pages keeps working.

**Tables**

```
profiles     id (= auth user), name, college, created_at
events       id, slug, code, organiser_id, name, host, starts_at,
             mode, venue, link, signup_form_url, poster_path, banner_path,
             max_slides, uploads_close_at, downloads_allowed,
             voting_opens_at, voting_closes_at, stage, privacy, created_at
event_members  event_id, profile_id, role, joined_at      -- unique (event_id, profile_id)
decks        id, event_id, owner_id, team, college, group_name, one_liner,
             file_path, slide_count, status, created_at   -- unique (event_id, owner_id)
votes        id, event_id, deck_id, voter_id, created_at  -- unique (event_id, voter_id, deck_id)
results      event_id, snapshot jsonb, decided_by, decided_at
```

**The rules that live in the database, not the browser**

- A vote inserts only if: the person is signed in, the event stage is `voting`,
  the deck is `live`, and the voter does not own that deck.
- Vote rows are readable by the organiser at any time, and by everyone once the
  stage is `closed`.
- A deck is writable only by its owner, and only while uploads are open.
- An event is writable only by its organiser.
- Storage: deck files are private; the wall reads rendered slide images, and the
  original is only signed out when downloads are allowed.

**Slide rendering.** A PDF is turned into page images on upload. The cheap
version is `pdf.js` in the uploader's own browser, which also gives the real page
count and needs no server. PPTX cannot be rendered in a browser, so a PPTX is
either converted server-side with LibreOffice in a worker, or — simpler for now —
asked to be exported as PDF, which is already what the upload screen recommends.

---

## Part G — Order of work

1. **B1, the XSS fix.** One pass, no new dependencies, and it should not wait.
2. **Part A demo removal**, so what is on screen is only what works.
3. **Part C ties**, front end first, since the rule is independent of the backend.
4. **Part D podium animation.**
5. **Supabase project, schema, policies** — the real work.
6. **Sign-in and profiles**, "Sign in" copy, role by membership.
7. **Decks and votes against the database**, wall and results reading real
   counts.
8. **Teams and Voters sections** on the dashboard, with CSV.
9. **pdf.js** slide rendering and real page counts.
10. **Storage** for posters, banners and deck files.

Steps 1 to 4 are front-end only and can ship today. Steps 5 onwards need a
Supabase account — free tier is enough for a college fest — and that is the point
where this stops being a demo.
