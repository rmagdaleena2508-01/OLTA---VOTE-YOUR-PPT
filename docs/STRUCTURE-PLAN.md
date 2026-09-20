# Structure review — what to cut, what to add

Written after looking at how comparable products are built: Rostrum, Jury,
JunctionApp and HackHQ on the judging side; Luma, Devpost and Clerk on the
product side. Every item below is a decision to take one at a time. Nothing here
is built yet.

Each item carries a recommendation: **Keep**, **Cut**, **Add** or **Change**,
plus the reason and a rough size (S = under an hour, M = a few hours, L = a day).

---

## Part 1 — The two problems you named

### 1.1 The hero stops dead

Right now the photograph ends on a hairline and the next section starts cold.
There is no sentence carrying you across, and nothing on screen says "there is
more below".

**Change (S).** Three small things, in order of value:

1. **A bridge strip that overlaps the photo.** A single white card that sits
   half on the picture and half on the page, carrying three live numbers —
   events running, decks uploaded, votes cast. It ties the two areas together
   physically and gives proof at the same time.
2. **A scroll cue.** A small down arrow with one word under it: "How it works".
   Restraint matters; a big animated mouse icon would cheapen the page.
3. **A handover line.** The first section should answer the hero, not restart.
   Hero says "Show your slides. Win the room." The next line should be "Here is
   how a night runs.", not "Three steps. That's the whole event."

### 1.2 An organiser cannot find anything

Today the organiser path is: landing, menu, "Run an event", sign in, setup
screen. The dashboard is only reachable from the wall or by typing the URL.
Each page has a different set of header buttons.

**Change (M).** Four fixes:

1. **One header for signed-in people**, the same on every screen: wordmark,
   event name, and three links — Wall, Dashboard, Settings. Which links show
   depends on the role.
2. **"Run an event" belongs in the hero**, next to the code field, not buried in
   the menu. Two doors, side by side: type a code to join, or start an event.
3. **The dashboard is the organiser's home.** After setup, land there. After
   sign-in as an organiser, land there. Never on the role picker.
4. **A "what next" line at the top of the dashboard**, already shipped, should
   also appear on the setup screen: "Saved. Print the code, then open voting
   when the room is seated."

---

## Part 2 — The landing page, section by section

| # | Section | Now | Recommendation |
|---|---|---|---|
| 2.1 | Hero | Photo, badge, headline, subtext, code capsule | **Keep**, plus the bridge strip and scroll cue above |
| 2.2 | Proof numbers | none | **Add (S)** — three counts inside the bridge strip |
| 2.3 | Open events | none | **Add (M)** — two or three live events with date, college, deck count and a Join button. This is Luma's whole trick: the home page is a directory, not a brochure |
| 2.4 | Three steps | "Sign up on the poster / Send your slides / Let the room pick" | **Keep**, retitle to "Here is how a night runs" |
| 2.5 | Participant section | Alternating row | **Change (M)** — collapse 2.5, 2.6 and 2.7 into one section with three tabs: Teams / Voters / Organisers. Three near-identical alternating rows is a lot of scrolling for one idea |
| 2.6 | Voter section | Alternating row | folded into 2.5 |
| 2.7 | Organiser section | Alternating row | folded into 2.5 |
| 2.8 | Podium preview | Static three cards | **Keep (S)** — but feed it the real last event once one exists |
| 2.9 | FAQ | Seven questions | **Change (S)** — merge the three storage questions into one. Five is the ceiling |
| 2.10 | Closing CTA | Two buttons | **Keep** |
| 2.11 | Footer | Four columns | **Keep** |

---

## Part 3 — Features worth adding

Ordered by what a fest would feel first.

| # | Feature | Why | Size |
|---|---|---|---|
| 3.1 | **Results page with the podium** | The event has no ending today. Voting closes and nothing happens. This is the missing last screen | M |
| 3.2 | **Printable poster** | Generate an A4 sheet with the event name, the code in large type and a QR to the wall. Organisers currently copy a line of text by hand. This is the single most useful thing we could hand them | M |
| 3.3 | **Share card for winners** | A 1080 × 1920 image with the team name and the event. Every winner posts it; every post is a poster for the product | M |
| 3.4 | **Live count on the wall for the organiser only** | They already see counts on the dashboard. Seeing them on the wall while walking the hall saves a tab | S |
| 3.5 | **Countdown to voting close** | On the wall, in the corner. Turns browsing into urgency at the right moment | S |
| 3.6 | **Keyboard shortcuts on the wall** | Arrows to move, V to vote, Escape to close. Already true in the viewer; make it true on the grid | S |
| 3.7 | **A real empty state for the organiser** | The dashboard before any deck arrives should tell them what to do next, not show four zeros | S |
| 3.8 | **Judge role, scoring a rubric** | Devfolio and Jury both separate the crowd vote from a judged score. A fest usually wants both: the audience prize and the jury prize | L |
| 3.9 | **Export results as CSV** | Every organiser asks for this the morning after | S |
| 3.10 | **Deck page with a real URL** | Right now a deck opens in a dialog. A link teams can share is worth more | M |

---

## Part 4 — Features to leave out, and why

| # | Feature | Seen in | Why not |
|---|---|---|---|
| 4.1 | Pairwise judging, two decks at a time with a slider | Rostrum, Jury | Excellent for tired judges at 2am. Wrong for a hall of 300 people who will each look at two decks and leave |
| 4.2 | Elo or normalised scores | Rostrum | Nobody in the room will believe a number they cannot compute. "Team Kestrel got 84 votes" ends an argument; "Elo 1620" starts one |
| 4.3 | Quadratic or credit voting | Devfolio, DoraHacks | Already ruled out: fragile against fake accounts, needs a manual |
| 4.4 | Mentor matching, team formation, check-in | JunctionApp | A different product. We run the deck round, not the whole hackathon |
| 4.5 | In-app payments and registration | Devpost, Luma | Already ruled out. The poster's Google Form does it |
| 4.6 | Comments on decks | Devpost | At a fest this becomes a place for teams to argue. A vote is the whole opinion we want |
| 4.7 | Live vote counts for everyone | — | The one change that would quietly ruin a contest |
| 4.8 | Awards slideshow mode | Rostrum | Tempting, and the results page nearly covers it. Revisit only after 3.1 and 3.3 |

---

## Part 5 — Things to cut from what exists

| # | Thing | Why |
|---|---|---|
| 5.1 | "Free for every college fest" badge | The product is for pitch nights and hackathons too. Either widen the words or drop the badge |
| 5.2 | The mock cards inside the three role sections | They go away when 2.5 becomes tabs |
| 5.3 | Three FAQ answers about storage | One answer, not three |
| 5.4 | "Sign in with Google" as the header's main button on signed-in screens | Once someone is in, that button is noise. It becomes their name |
| 5.5 | Duplicate "Free to use" lines | Appears twice on the landing page |

---

## Part 6 — Suggested order of work

1. Hero bridge, scroll cue, handover line (1.1)
2. One signed-in header and organiser routing (1.2)
3. Results page (3.1)
4. Printable poster with QR (3.2)
5. Open events strip on the landing page (2.3)
6. Role tabs replacing the three rows (2.5)
7. Share card (3.3)
8. Small wins: countdown, organiser-only counts, CSV, shortcuts (3.4–3.9)
9. Judge role, only if a real fest asks for it (3.8)
