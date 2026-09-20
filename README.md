# Podium — show your slides, win the room

Podium is a small website for pitch competitions, hackathons and case contests —
anywhere a team builds a deck and wants it judged fairly. Teams upload their pitch
deck, the whole room reads it on their phone, and the room votes. When voting
closes, the winners go up on a results page that stays online.

The point is a fair shot. Today a panel of three judges decides in ten minutes.
Podium puts the deck in front of everyone who showed up, so the idea gets read by
the people it was made for.

**Live:** https://rmagdaleena2508-01.github.io/OLTA---VOTE-YOUR-PPT/
**Version:** v1 — the whole flow runs in the browser. See [What's in v1](#whats-in-v1).

---

## Why I am building this

Most Indian college competitions run on slide decks. The contest itself works fine.
The mess is everything around it.

Here is how a normal fest goes today:

1. Teams mail their PPT, or drop it in a WhatsApp group.
2. Half the files never arrive. Someone renames `final_v2_FINAL.pptx` and the wrong
   one gets judged.
3. Only the judges ever see the decks. The 200 people in the hall see nothing.
4. Voting happens on paper slips, or by clapping, or by a show of hands.
5. Nobody trusts the count. There is always one team that thinks it was rigged.
6. A week later, no record is left. No decks, no scores, no winners page.

So I am not building a competition platform. I am building the missing middle:
**one place where the decks live, and one honest way to vote on them.**

## What Podium does not do

This part matters as much as the feature list.

Sign-ups, entry fees and payment proof stay **off** this site. In a real fest, the
poster already carries a Google Form and a UPI QR code. People fill the form, pay,
and upload their screenshot there. The organiser checks it there. That flow already
works, costs nothing, and needs no bank account or compliance work from me.

Podium starts one step later. A team arrives with an event code, uploads a deck, and
the room votes. The only line about money on the whole site says where money is not.

## Who uses it

| Person | What they do |
|---|---|
| **Organiser** | Creates the event, gets a code to print on the poster, lets decks in, opens and closes voting, announces winners. |
| **Participant** | Types the event code, uploads one deck, watches the result. |
| **Voter** | Anyone in the hall. Signs in with Google, reads the decks, votes once. |

Organisers are not a public sign-up. They get in through an invite link, because
handing out organiser rights is a bigger deal than joining an event.

---

## How the voting works

The rules come from looking at how Product Hunt, Devpost, Devfolio and DoraHacks
handle the same problem. Sources are in [`docs/MARKET-RESEARCH.md`](docs/MARKET-RESEARCH.md).

- **You must sign in to vote.** No product in this space lets strangers decide a
  prize. One Google account is one voter.
- **Back as many decks as you like, once each.** This is Product Hunt's and
  Devpost's rule. A good idea should not cost you the chance to back another one.
- **A vote is final.** Once you back a deck, that deck is closed to you and the
  button reads "You have voted". Taking votes back turns the last hour of an
  event into lobbying — teams walk the hall asking people to switch.
- **You cannot vote for your own team.**
- **Counts stay hidden until voting closes.** This is Devpost's own advice. When
  people can see a leader, the leader snowballs and everyone else gives up.
- **No weighted or "spend 10 points" voting.** That idea is real — it is called
  quadratic voting, and Devfolio and DoraHacks both use it. It is wrong here: it
  breaks the moment someone makes fake accounts, and every platform that uses it
  has to ship a page explaining it. If a voting system needs a manual, it will
  lose a hall full of students.

## How event codes work

The organiser prints a six-character code on the poster. Someone types it on the
home page and lands in that event.

The code alphabet is `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — no `O`, `I`, `0` or `1`,
because those four are what people misread off a poster from across a hall. That
gives about 1.07 billion combinations, so guessing a live code is pointless.

Codes are a shortcut, not a gate. An event link works too, and public events show up
in a browsable list. Only private events truly need the code.

Full design, including the lookup endpoint and the database tables:
[`docs/EVENT-CODES.md`](docs/EVENT-CODES.md).

---

## Design principles

I studied [notchowl.com](https://www.notchowl.com), [Luma](https://lu.ma) and
[Clerk](https://clerk.com) and pulled out the rules that make them feel expensive.
The long version is in [`docs/DESIGN-NOTES.md`](docs/DESIGN-NOTES.md). The short
version:

1. **One idea per screen.** One headline, two lines of text, one thing to click.
2. **Space is the luxury.** Sections breathe at 96–144px. Empty room reads as
   confidence; a packed page reads as cheap.
3. **Hierarchy comes from size and weight, never decoration.** Five type sizes do
   the whole site.
4. **Tighten big type.** Every heading over 36px is tracked in by about -0.03em.
   This one detail is most of the "premium" feeling. Untracked big type looks like
   a default template.
5. **Lines, not shadows.** Cards are a 1px hairline over a flat surface. Shadows
   only appear where something really floats, like the menu.
6. **One accent colour, one job.** Orange means "vote". It never means "new" or
   "warning", because then it would mean nothing.
7. **Plain words.** Short sentences, everyday verbs, real numbers instead of
   adjectives. "25 MB" beats "generous file limits".
8. **Name the action, not the object.** The organiser's list says "Teams to let in",
   not "Registrations".

## Where the look comes from

| Source | What I took |
|---|---|
| **notchowl.com** | The whole type and spacing system: near-single font family, tight tracking, hairline cards, no shadows, huge section padding, and the two-beat headline shape ("Less switching. More doing."). |
| **Luma** | How to ask someone who they are. Luma never shows a role form; it splits at the button — "Create Your First Event" or "Discover Events". Podium does the same with "Upload a deck" and "Browse and vote". |
| **Clerk** | Proof that a light theme can look sharp: off-white page, near-black text, 64px headline at -1.6px tracking. |
| **A hero reference shot** | Full-bleed photo, small pill above the headline, one line in a serif italic, and a single capsule holding an input and its button. |
| **Product Hunt, Devpost, Devfolio, Unstop** | The voting and file rules, not the visuals. |

---

## Design decisions, and what I chose against

**Light theme, not dark.**
The first build was near-black. It looked good and said nothing about a college fest.
A warm off-white (`#f6f6f4`) with a faint dot grid feels like paper, which is what
this product is really about. Pure white was too harsh; the warm grey holds the
photo better.

**Satoshi for headings, Geist for everything else.**
Geist alone was correct but cold — it is a developer-tool typeface, and the hero
photograph is warm. Satoshi has rounder, friendlier shapes and still holds tight
tracking at 68px. Geist stays for body and interface text, where it is better at
13–18px. One line of the headline is Instrument Serif italic — one moment of
character, without adding a third family everywhere.

**A photograph behind the words, not in a card.**
The earlier version put the photo in a framed box below the headline. That reads as
a screenshot of something else. Behind the text, full bleed, the photo sets a mood in
the first half second. A radial glow sits behind the words so black text stays
readable, and only a thin gradient closes the seam at the bottom.

**Plain HTML, CSS and JavaScript — no React, no build step.**
The whole front end is three files. There is no framework, no bundler, no
`node_modules`. It loads instantly on a college Wi-Fi, deploys by pushing to GitHub
Pages, and anyone can open `index.html` and read it. React earns its keep when there
is real state to manage. The deck wall holds some now — decks, filters, votes —
and plain JavaScript still carries it without strain. The moment to reconsider is
when real accounts and a server arrive, not before.

**Slides are shown as images, not handed over as files.**
Teams worry about their idea being copied. So the original PPTX is kept private, the
deck is turned into images, and the gallery shows pictures with the team name on
them. Downloads stay off unless the organiser turns them on. This also makes the
page fast on a phone.

**The menu is a button, not a row of links.**
A three-line button keeps the header to three items: name, sign-in, menu. The panel
unfolds like a sheet of paper let go from the top edge — two panels hinged with
`transform-origin: top center`, starting at `rotateX(-92deg)` inside a parent that
holds the `perspective`. Pure CSS. Libraries like GSAP or Framer Motion would do it
too, but adding a runtime for one panel is a bad trade.

**Two onboarding steps, not three.**
It started as sign in, pick a role, fill a profile. Role and profile now share one
screen, and the fields only appear after a role is picked. The landing page already
knows what you came for, so the right card is pre-selected when you arrive.

---

## How it is built

```
index.html        the landing page
onboarding.html   sign in, pick a role, finish a profile
create-event.html the organiser screen: banner, basics, deck rules, voting
event.html        the deck wall: every deck, filters, upload, viewer, voting
dashboard.html    the organiser's screen: let decks in, open and close voting
results.html      the podium, the rest of the field, copy and CSV

The three signed-in screens share one header: wordmark, the event you are in,
Wall / Dashboard / Settings, and your name. Dashboard and Settings only appear
for whoever runs the event.
styles.css        design tokens and every component
app.js            menu, scroll reveals, event code, onboarding steps
assets/           hero-desktop.jpg (16:9), hero-mobile.jpg (4:5),
                  icon.svg and the PNG icon sizes
docs/             the research and design notes behind the decisions
```

No dependencies. Two web fonts, loaded from Fontshare and Google Fonts.

### Run it

```bash
python3 -m http.server 8793 --directory deck-comp
```

Open http://localhost:8793.

### Design tokens

All of these live at the top of `styles.css`:

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#f6f6f4` | page |
| `--surface` | `#ffffff` | cards |
| `--text` | `#131316` | headings and body |
| `--text-dim` | `#55555f` | supporting text |
| `--hairline` | `rgba(18,18,20,.09)` | every border |
| `--accent` | `#e2572c` | the vote action only |
| `--dot` | `rgba(18,18,20,.11)` | the background grid |

### The mark

The wordmark is the app icon itself: three podium blocks, the winner's block
taller and in the accent orange, on a cream squircle. It is inline SVG, so it
stays sharp at any size and needs no request. `assets/icon.svg` is the same
drawing as a file, and the PNGs beside it cover the browser tab and the iOS home
screen.

### Hero rules

- The hero image is a background. It sits behind the headline, full bleed, with a
  light veil. It never goes in a framed card below the text.
- Desktop uses the 16:9 file, phones swap to the 4:5 file at 720px.
- No invented demo events anywhere on the page. Neutral labels until real events
  exist.

---

## How a code reaches a team

Teams register on the organiser's own poster, which circulated on WhatsApp long
before the Podium event existed. So the code cannot live on that poster. The
dashboard hands the organiser a message to paste into the event's WhatsApp
group — event name, wall link, code, file rules and the voting deadline — plus a
QR of the wall they can attach. The poster itself is kept only so a team can tap
it on the wall and re-read the rules.

## What's in v1

Version 1 is everything below. It is the whole flow, front to back, running in
the browser — the screens are real, the rules are real, and the data lives in
the browser until a server is added.

**The pages**

| Page | What it does |
|---|---|
| `index.html` | The landing page: hero, live counter bar, the "Trusted by" college row, how an event runs, the three roles in tabs, a sample podium, and the questions people ask |
| `onboarding.html` | Sign in, say what you came for, add your name and college. Two steps |
| `create-event.html` | The organiser's setup screen: banner, name, date, mode, sign-up link, deck rules, voting window, who can find it — with a live preview of the event card and the code to share |
| `event.html` | The deck wall: every deck as a card, filters per group, search, sort, the round Upload button, a slide viewer, and the vote button |
| `dashboard.html` | The organiser's screen: the share kit, four counts, decks to let in or hide, standings, the checks worth running, and the button that closes voting |
| `results.html` | The podium, the rest of the field, copy the results, download the CSV |

**The rules that work today**

- One vote per deck. Back as many decks as you like, once each, and a vote can
  never be taken back — the button turns into "You have voted" and closes.
- Nobody can vote for their own deck.
- No vote count is shown to anyone until the organiser closes voting. The
  organiser sees counts on their dashboard the whole time.
- Voting only opens inside the window the organiser set, and the organiser can
  open it, extend it, or close it by hand.
- Uploads are PDF or PPTX, up to 25 MB, one deck per team, with a slide limit the
  organiser chooses.
- Event codes are six characters with no `O`, `I`, `0` or `1`, so a code read off
  a poster cannot be mistyped into a different event.
- Sign-ups and money never touch the site. They stay on the organiser's own form.

**How it looks and moves**

- Warm off-white page with a faint dot grid, Satoshi for headings, Geist for
  everything else, one line of Instrument Serif italic in the hero, and one
  accent colour reserved for the vote.
- The hero photograph sits behind the words, and the section below laps over it as
  a rounded sheet, so there is no hard seam.
- A glass card across that seam counts three numbers up from zero.
- The vote arrow flies up and away when pressed, and the winners' podium rises
  step by step with one burst of confetti behind the winner.
- Three college marks drift left to right under "Trusted by" at a steady walking
  pace.

**What is still a placeholder in v1**

- Sign-in does not sign anyone in yet. Roles are stored in the browser.
- The counter bar shows 1 event, 3 decks and 6 votes as illustration.
- The sample podium on the landing page uses made-up team names.
- Slides are not rendered yet, so the viewer shows a frame per slide rather than
  the slide itself.
- Decks and votes are kept in the browser, so counts are per device.

**Next, and why it needs a server**

1. **Real accounts** — one sign-in, and a role that comes from what you did, not
   from what the browser claims.
2. **Real decks and votes** — a database with a unique constraint on
   `(event_id, voter_id, deck_id)`, so a double vote is impossible in the data
   and not only in the interface.
3. **Slide rendering** — turn a PDF into page images on upload, and read the real
   page count while doing it.
4. **Teams and Voters lists** for the organiser, with CSV.
5. **Event page** — poster, dates, a link out to the sign-up form, and a countdown.
6. **Share card** — a 1080 x 1920 image of the winner for the stories teams post
   anyway.

The plan for all six, with the security holes to close first, is in
[`docs/BUILD-PLAN.md`](docs/BUILD-PLAN.md).

> Keeping this file honest: new work goes under **What's in v2** when I say so.
> Until then, changes belong in this v1 section.

## File rules for uploads

- PDF or PPTX. PDF is safer — fonts and layout stay exactly as the team made them.
- 25 MB per file. Unstop's own rounds cap at 20 MB and Devpost at 35 MB, so this
  sits between two real-world limits.
- 15 slides by default, which an organiser can change.
- Decks stay public for 30 days after the event, then only the team and the
  organiser can see them. The original files are deleted at 90 days. Winning decks
  stay on the results page for good.

## Notes to myself

- The hero still shows a photograph. The strongest version would show the deck wall
  itself. Swap it when that screen exists.
- Write real Terms and Privacy pages before the first live event. Student work is
  sitting in here.
- Never ship a live vote counter. It is the one change that would quietly ruin the
  contest.

## Docs

- [`docs/DESIGN-NOTES.md`](docs/DESIGN-NOTES.md) — what makes the reference sites
  feel expensive, measured value by value.
- [`docs/MARKET-RESEARCH.md`](docs/MARKET-RESEARCH.md) — how other platforms answer
  voting, files and retention, with sources.
- [`docs/EVENT-CODES.md`](docs/EVENT-CODES.md) — the full event code design.
- [`docs/BUILD-PLAN.md`](docs/BUILD-PLAN.md) — what to remove, what to secure, how
  ties are settled, and the database behind version 2.
- [`docs/STRUCTURE-PLAN.md`](docs/STRUCTURE-PLAN.md) — the page-by-page review, what
  to cut and what to add.
- [`docs/DESIGN-REVIEW.md`](docs/DESIGN-REVIEW.md) — what is good, what to cut, and
  what to add next.
