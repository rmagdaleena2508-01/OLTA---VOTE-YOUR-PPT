# Design study — notes for the PPT competition platform

Sources studied: notchowl.com (visual system + copy), luma.com (event product structure, role framing), plus the dashboard screenshot supplied by the user (sidebar/card layout reference).

---

## 1. What makes NotchOwl feel premium

### Measured values (read from the live site)

| Token | Value |
|---|---|
| Font | Geist Sans (single family, no pairing) |
| Page background | near-black, `#070707`-ish (`lab(2.75 0 0)`) |
| Primary text | near-white (`lab(98 0 0)`) |
| Secondary text | mid grey (`lab(66 0 0)`), used for every supporting paragraph |
| Hero display | 60px / weight 700 / letter-spacing **-1.5px** / line-height 1.08 |
| Section heading | 48–52px / weight 600–700 / letter-spacing -1.2 to -1.82px |
| Body paragraph | 18px / line-height 1.62 |
| Micro / legal text | 12px, grey, never bold |
| Button | 14px, weight 600, radius 14px, solid white on black, **no shadow** |
| Card | radius 16–24px, `1px solid rgba(255,255,255,0.1)`, translucent white fill at ~10% |
| Section vertical rhythm | 80 / 96 / 112 / 144px — large and irregular by intent |

### The principles behind those numbers

1. **One family, few sizes.** Geist Sans only. The whole page runs on roughly five type sizes (60 / 48 / 18 / 14 / 12). Hierarchy comes from *size and weight*, never from decoration.
2. **Negative letter-spacing on display type.** Every heading above 36px is tracked in (-1.2px to -1.8px). This one detail is most of the "expensive" feeling — untracked large type reads as a default Bootstrap page.
3. **Three-value colour system.** White text, grey text, black background. Colour appears only inside product screenshots, never in the chrome. Nothing is coloured to "add interest".
4. **Borders instead of shadows.** Cards are 1px hairlines at 10% white over a 10% white fill. There is no drop shadow anywhere. Depth is created by contrast of surface, not by blur.
5. **Generous, uneven whitespace.** 96–144px between sections. The page is mostly empty. Emptiness is the luxury signal.
6. **One idea per screen.** Each feature section = one 52px headline, one 3-line paragraph, one screenshot, one button. Never two competing messages in a viewport.
7. **Repeated single call to action.** "Download for Mac" appears after every section. Same label, same style, every time. No "Learn more" / "See how" variation.
8. **Micro-reassurance under every CTA.** `One-time purchase · Up to 3 Macs · 14-day money-back guarantee` — 12px grey, dot-separated. This answers objections without a paragraph.
9. **Product shown, not described.** Screenshots in rounded, bordered frames with a tiny grey label ("Daily notepad", "NotchOwl for Mac") in the frame's top bar.

### The copy system (this is half of the premium feel)

Pattern observed in every headline: **two short sentences, second one completing the first.**

- "Keep your day / a notch closer."
- "Less switching. More doing."
- "One task. Your full attention."
- "Catch the thought. Keep going."
- "See the work you put in."
- "Yours for the long run."
- "Make room for what matters."
- "A few things worth knowing."

Rules extracted:

- **Verbs are plain and physical**: keep, catch, pick, jot, see, make room. Never *leverage, streamline, empower, revolutionise, seamless, robust*.
- **Second person, present tense.** "Your timer stays visible while you work."
- **Benefit first, feature second.** The feature name is demoted to a 12px grey label ("Focus timer"), while the headline states the human outcome.
- **Sentence case everywhere.** No Title Case Headings, no ALL CAPS except nothing at all.
- **Short sentences, 8–16 words.** Paragraphs never exceed 3 lines.
- **Concrete numbers instead of adjectives.** "$4.9", "up to 3 Macs", "14 days" — not "affordable", "flexible".
- **Section intros are soft, almost spoken**: "A few things worth knowing." That is a person talking, not a FAQ header.
- **Honest negative space in copy too**: "Not the right fit? Request a refund within 14 days."

---

## 2. What Luma does (structure + role framing)

- Hero is a single sentence in huge type: "Delightful events start here", with a one-line subtitle naming real, specific use cases ("run clubs, launch parties, firework shows"). Specificity beats abstraction.
- **Two CTAs, asymmetric weight**: "Create Your First Event" (primary — the host path) and "Discover Events" (secondary — the attendee path). The role split happens *at the button*, not in a modal with radio buttons.
- Discovery is organised as: featured events with date + city → communities → browse by category. Progressive narrowing.
- Sign-in is a single entry point in the top right; the product does not ask "who are you?" up front — it infers role from what you do (create vs. attend) and only asks when it must.
- Event cards carry: banner image, title, date, location, host. Five facts, nothing else.

### Role-onboarding lesson for our product

Do **not** open with a three-way "Admin / Participant / Voter" wall. That is a database schema shown to a human. Two better options:

1. **Action-first (Luma model, recommended).** After Google sign-in, show one screen with two big choices phrased as actions: *"Submit a deck"* and *"Browse & vote"*. Admin is not a public choice — it is granted, reached by an invite link or by whoever created the competition.
2. **Role-card (Meetup/Notion model).** A single centred card with three selectable rows, each with icon + label + one-line description, and a disabled-until-selected Continue button. Use this only if admins genuinely self-register.

Either way: Google is the only sign-in button; role is asked **once**, stored, and never asked again; role is switchable later from the profile menu if a person is both participant and voter.

---

## 3. Dashboard reference (from the supplied screenshot)

- Left sidebar grouped under quiet grey section labels: *Essentials / Work / Measure / Account*. Grouping by intent, not by feature name.
- Active nav row = filled light pill; inactive = plain text. Counts shown as small pills on the right of a row.
- Top row of the content area: filter chips (`Last 30 days`, `All campaigns`, `Active`, `Needs action ●`) — a red dot marks the only row that needs attention.
- Stat cards: small square icon tile, a label in regular weight, a very large number, and a delta line in green/red underneath. Same anatomy repeated for every metric.
- "Campaigns that need you" — a table titled by **what the user must do**, not by the entity name. Copy this: our admin dashboard section should be "Decks waiting on you", not "Submissions".
- Bottom-left setup card with progress ("2 of 4") and Skip / Next. Onboarding lives quietly in the shell, not as a blocking modal.

---

## 4. Applying all of this to the PPT competition site

### Tone and vocabulary to adopt

| Avoid | Use |
|---|---|
| Submit your submission | Upload your deck |
| User registration portal | Sign in with Google |
| Vote casting module | Cast your vote / Back a deck |
| Leaderboard rankings display | See who's ahead |
| Event management dashboard | Decks waiting on you |
| Participants must ensure that… | Upload the file. We'll handle the rest. |

Headline drafts in the NotchOwl two-beat pattern:

- "Every deck. One place."
- "Upload once. Let the room decide."
- "Your slides, in front of the people who matter."
- "Pick a side. Cast your vote."
- "A few things worth knowing." (for the FAQ — borrow it directly)

### Visual system to use

- Single font family (Geist Sans, or Inter as a free stand-in).
- Type scale: 60 / 48 / 32 / 18 / 14 / 12. Display sizes tracked at -0.02em to -0.03em.
- Colour: near-black canvas, white primary text, grey secondary, one single accent used *only* for the vote action and live states.
- Cards: 16–20px radius, 1px hairline border, translucent fill, no shadows.
- Section padding 96–144px on desktop, 56–72px on mobile.
- Sentence case throughout; micro-text under each CTA (`Google sign-in · One deck per team · Voting closes 9 PM`).

### Screens implied by the handwritten sketch

1. **Landing** — hero, two CTAs (Submit a deck / Browse & vote), how it works in three steps, FAQ, footer.
2. **Sign in** — Google only, one sentence of reassurance.
3. **Role choice** — two action cards (admin granted separately).
4. **Organiser: create event** — banner upload with default banner options, event name, date, mode (online / offline), fee with the payment QR uploaded by the organiser, plus other details. Keep it as one column of large, labelled fields with generous spacing.
5. **Participant: deck gallery** — grid of deck cards (team name, title, thumbnail, vote count). Floating circular Upload button, bottom-right, with the word "Upload" beneath it, per the sketch.
6. **Upload deck** — file drop zone, team name, members, category, one Submit button.
7. **Deck detail** — slide preview, team details, single vote button with state change after voting.
8. **Admin dashboard** — sidebar shell as in the screenshot; sections named by action ("Decks waiting on you", "Payments to verify", "Live voting").

### Open questions worth settling before build

- Voting rules: one vote per person overall, or one per category? Public results or hidden until close?
- Who can vote — anyone signed in with Google, or only registered attendees?
- Fee handling is QR-based (organiser uploads the QR; participant pays outside the app and presumably uploads proof). Confirm whether admin verifies payment manually.
- File types and size cap for decks (PPTX only, or PDF too?).
