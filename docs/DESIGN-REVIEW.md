# Design review — Podium landing page and onboarding

Written after the light-theme rebuild. Items marked **Done** shipped in commit
`7fa6ad8`; the rest are the queue, roughly in order of payoff.

---

## 1. Type: what to use and why

The hero photograph is warm, filmic and a little nostalgic. Geist alone read
correct but cold against it — it is a developer-tool face.

**Shipped pairing**

| Role | Face | Source | Why |
|---|---|---|---|
| Headings, wordmark, podium names | **Satoshi** 700 | Fontshare (free, commercial use) | Geometric bones with warmer, rounder terminals. Holds -0.032em tracking at 68px without the letters fusing. |
| Body, interface, labels, numbers | **Geist** 300–600 | Google Fonts | Neutral, excellent at 13–18px, good tabular numbers for vote counts later. |

Others considered: **General Sans** (Fontshare) — close second, slightly more
neutral; **Switzer** (Fontshare) — good but plainer than Satoshi; **Neue
Montreal** (Pangram Pangram) — the most characterful, but paid; **Inter** — safe
and everywhere, which is the problem; **Suisse** — what Clerk uses, paid.

Rules to hold: never more than two families, headings always tracked in
(-0.02em to -0.032em), body never tracked, no italics anywhere, no third face
for "accent" text.

---

## 2. Hero section

**Fixed rules from the owner:** the product is called **Podium**. The hero
photograph must not fade out at the bottom — the picture ends on a clean edge,
and a hairline closes the join with the page.

 the hero photograph sits **behind** the hero text
as a full-bleed background, never in a framed card below it. No invented demo
events ("Startup Summit '26") anywhere on the page — use neutral labels until
real events exist.

**Done
- Photograph moved behind the headline, with a light veil over it so the black
  text stays readable and the bottom edge melts into the page colour.
- Join-by-code field under the buttons. Someone holding a poster with a code has
  a direct door in, and the code is carried through sign-in.
- Proof strip: Case competitions · B-plan finals · Tech fests · Club selections.
  Names the occasion instead of describing the software.
- Full-resolution art, one crop per breakpoint.

**Still worth doing**
- Replace the static photo with the actual product: a short looping clip or a
  real deck wall with three or four cards and a vote button. A pretty stock
  photo is decoration; a screenshot is proof. This is the single biggest
  remaining win on the page.
- Trim the hero to one micro-line. Right now the buttons, the code field, the
  micro-line and the proof strip stack up to four pieces of small text.
- Show the winner podium inside the hero frame on the results-day variant.

---

## 3. Words and vocabulary

Working rules, taken from the copy study and kept through the rewrite:

- Two-beat headlines. "Every deck. One place." "Read them. Then pick one."
- Plain verbs only: send, pick, read, vote, pay, open, close. Not *leverage,
  streamline, empower, seamless, unlock, revolutionise*.
- Numbers instead of adjectives: 25 MB, 15 slides, 30 days, one vote.
- Sentence case everywhere. No Title Case, no ALL CAPS.
- Say the fest word, not the software word: deck, room, poster, fest, team.

**Still worth doing**
- Name the pain in the hero subhead. The current line explains the flow; a
  sharper version names the mess it replaces: "Decks arrive on WhatsApp, votes
  arrive on paper, and nobody trusts the result."
- Write error and empty states in the same voice before they get written in
  default developer English. "No decks yet. Be the first." beats "0 results".

---

## 4. Buttons

**Done**
- Focus rings on every interactive element (a 2px outline with 3px offset),
  which the dark build was missing entirely.
- A 1px lift on hover for both button styles.
- Sticky phone bar with the same two actions once the hero scrolls away.

**Rules to keep**
- Exactly one solid black button per screen. Everything else is the outlined
  style. The moment two solid buttons sit side by side, neither reads as the
  next step.
- Same label for the same action everywhere: "Upload your deck", never "Get
  started" in one place and "Submit" in another.
- 44px minimum height, 14px text, 600 weight, 14px radius. Small buttons at
  36px only inside the header.

**Still worth doing**
- Loading and done states: a button that has been pressed should say
  "Uploading…" and then "Uploaded", not stay unchanged.
- Destructive actions (delete my deck) get the outline style in red, never a
  solid red block.

---

## 5. Page structure

Current order works: hero → how it works → participant → voter → organiser →
podium → FAQ → closing CTA → footer.

**Still worth doing**
- Add a live event strip directly under the hero: two or three real events with
  date, college, deck count, and a Join button. It turns a marketing page into
  something with a pulse, and it is the Luma move — the home page is a
  directory, not a brochure.
- Collapse the three role sections into one section with three tabs. Three
  near-identical alternating rows is a lot of scrolling for one idea.
- Add a short "After the event" block explaining retention in one sentence, so
  the FAQ is not the only place it lives.

---

## 6. Onboarding

**Done** — three steps became two. Role and profile share one screen, the
profile fields only appear after a role is chosen, and the intent from the
landing page pre-selects the role, so a person who clicked "Upload your deck"
lands with the card already picked and the cursor in the name field.

**Still worth doing**
- Prefill name from the Google account and hide the field unless they want to
  change it. Asking for a name the provider already gave you is a wasted step.
- Make college a search field with the common colleges listed, not a blank box.
- Let people browse decks without signing in at all, and ask for sign-in at the
  moment they press Vote. Gate the action, not the door.
- Remember the event code across the whole flow and show it as a chip: "Joining
  Startup Summit '26" — so the person knows they are in the right event.

---

## 7. Positioning

Today the page sells a feature list. It should sell a job.

- One-line position: **"The fastest way to run a deck competition at a college
  fest."** Not a "platform", not a "portal".
- Speak to the organiser first. They bring 40 teams and 300 voters with them;
  the participants arrive because the organiser chose the tool.
- Lead with what goes wrong today: attachments lost in WhatsApp, votes on paper
  slips, results nobody trusts, no record afterwards.
- The permanent winners' page is the quiet hook — every past event leaves a page
  the college keeps. Say it out loud.

---

## 8. Footer

**Done** — rebuilt as four columns (brand blurb, Take part, Learn, Small print)
with a bottom line carrying the payment disclaimer: money stays in UPI, never
in Podium. A footer is where trust questions go to be answered.

**Still worth doing**
- Real Terms and Privacy pages. Linking both to the FAQ is a placeholder, and
  for a product handling student work it needs the real thing.
- Add a past-winners link once the archive exists — it is the best proof the
  product has.

---

## 9. Mistakes to avoid

- **Do not** show live vote counts during voting. Devpost's own guidance is to
  hide them; early leaders snowball and losers stop trying.
- **Do not** let anonymous visitors vote. Account required, one vote per deck,
  and no self-voting.
- **Do not** take payments or sign-ups in-app. The poster's Google Form already
  does both, and handling money would drag in compliance work nobody wants.
  Every mention of money on the site should point away from the product.
- **Do not** serve the original PPTX for download by default. Teams fear idea
  theft, and it is the first objection an organiser will hear.
- **Do not** add credit or weighted voting. It is quadratic voting, it needs a
  manual, and it breaks under fake accounts.
- **Do not** use more than one accent colour. The orange means "vote". If it
  also means "new" and "warning", it stops meaning anything.
- **Do not** build a dashboard before the deck wall. The gallery is the product.

---

## 10. What to cut

- The hero micro-line duplicates the proof strip. Keep one.
- The organiser mock card lists three items where one would land harder.
- The FAQ has seven questions; three of them (downloads, retention, storage) are
  one answer split into three. Merge them.
- "Free for college events" appears twice on the page. Once is enough.

---

## 11. What to add next, in order

1. **Deck wall** — grid of deck cards, category filter chips, the circular
   Upload button bottom-right. This is the screen the product lives or dies on.
2. **Deck page** — slide viewer with keyboard arrows, team details, one vote
   button that changes state and never shows a count.
3. **Event page** — poster, date, mode, a link out to the organiser's sign-up
   form, and a countdown to the voting deadline.
4. **Organiser dashboard** — payments to verify, decks to approve, open/close
   voting, and a fraud panel showing vote timing and duplicate accounts.
5. **Results page** — the podium, a share card sized for Instagram stories, and
   a permanent link.
6. **Real Google sign-in and a database.** Supabase or Firebase; decks in
   object storage, slides rendered to images, votes in a table with a unique
   constraint on `(voter_id, deck_id)` so double-voting is impossible in the
   data, not only in the interface.

---

## 12. Interaction and polish

- Let people flip through a real deck in the hero frame with arrow keys.
- Live deck counter on the event strip that ticks as teams upload.
- A share card generated for every winning team.
- Keyboard shortcuts on the deck wall: arrows to move, V to vote.
- Empty states with a drawing and one sentence, never a blank panel.
- Respect `prefers-reduced-motion` for the pulse dot as well as the scroll
  reveals (currently only the reveals are covered).


---

## 13. The organiser setup screen

Shipped. "Run an event" no longer drops an organiser on the participant's role
screen — it goes straight to `create-event.html`, because someone who came to
run an event has already told you who they are.

What the screen asks for, and why each field earns its place:

| Field | Why it is there |
|---|---|
| Banner, uploaded or one of four defaults | Sits on the event page and behind every deck card. Defaults mean nobody is blocked on a designer. |
| Event name, run by | The two lines every deck card shows. |
| Date and start time | What the event card leads with. |
| Mode: in person, online, both | Reveals either a venue field or a meeting link, never both. |
| Sign-up form link | Podium does not take sign-ups. The link sends teams to the organiser's own form. |
| Entry fee as free text | Shown, never charged. |
| Poster upload | The poster already carries the form and the payment QR. Teams tap it to sign up. |
| Slide limit and upload deadline | The two rules organisers always set themselves. File type and size are fixed at PDF or PPTX and 25 MB. |
| Downloads toggle, off by default | Teams fear their idea being lifted. The safe answer is the default. |
| Groups, comma separated | Drives the voting rule: one vote per group, or one for the whole event when blank. |
| Who can vote | Anyone signed in, or only the competing teams. |
| Voting opens and closes | The window. Counts stay hidden until it closes. |
| Listed or code-only | Whether the event appears in the open events list. |

The right column holds a live preview of the event card teams will see, plus the
generated six-character code and the exact line to print on the poster, with a
copy button. The code is generated in the browser from the same alphabet the
rest of the product uses.

Left for the server: saving the event, checking the code is unique, storing the
banner and poster, and the organiser dashboard that follows.


---

## 14. The vote button

Green, and green is used for nothing else. The arrow is Lucide's `arrow-big-up`
— a solid pennant shape rather than a thin line arrow, because at 17px a stroke
arrow reads as "scroll up" while this one reads as "back this".

Icon sets weighed: Lucide `arrow-big-up` (chosen — MIT, one path, animates
cleanly), Lucide `chevron-up` (too close to a dropdown), Phosphor `caret-up`
(good, but the library is heavier than one inlined path), and a plain triangle
(what Product Hunt uses, but it loses meaning without their context).

The press is a GSAP timeline, about 0.6s in total:

1. A copy of the arrow is cloned into a fixed-position ghost.
2. The ghost lifts 14px and grows, then flies 74px up, shrinks and fades.
3. The real arrow rises from 16px below with `back.out(2.2)`, so it lands with a
   small overshoot.
4. The label fades up behind it, and the button itself settles with
   `elastic.out(1, 0.55)`.

The button is painted before the wall re-renders, so the animation runs on the
element the person actually pressed. Under `prefers-reduced-motion` the state
changes with no movement at all.


---

## 15. The organiser dashboard

Shipped as `dashboard.html`. It is a list of decisions, not a wall of charts.

**Top line:** the event name, who runs it, the code with a copy button, the
current stage, and what happens next in one sentence.

**Stage buttons change with the stage.** Before voting: open voting now, or push
uploads back an hour. During: give it another hour. After: see the podium, or
reopen. An organiser at a fest is holding a microphone in one hand — the button
they need has to be the one on screen.

**Four numbers:** decks in, votes cast, decks with at least one vote, decks
waiting on you. The organiser is the only person who ever sees a count before
voting closes.

**Decks** lists every upload with its state — on the wall, waiting on you, or
hidden — with one action each. A toggle turns on checking decks before they
appear; new uploads then arrive as "waiting on you" and only the team that sent
one can see it on the wall.

**Standings** ranks the decks by votes with a bar each. Same data the public
sees later, shown early to one person.

**Anything odd?** is the honest version of a fraud panel. It reports what this
build can actually check — spread of votes across decks, the size of the gap at
the top, that votes are final and self-votes blocked — and says plainly that
repeat accounts, IP clustering and brand-new accounts need real sign-in and a
server. A flag is a reason to look, not proof.

**Closing** needs a ticked box before the button turns on, because it is the one
step that cannot be undone from the fest floor. It sets the stage to closed, and
the wall reads that flag rather than only the clock.
