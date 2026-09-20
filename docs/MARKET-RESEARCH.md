# Market research — how comparable products answer our open questions

Products studied: Devpost, Devfolio, DoraHacks, Product Hunt, Unstop, SlideShare, Luma.

---

## 1. Who is allowed to vote?

| Product | Rule |
|---|---|
| **Devpost** (public / community voting) | A Devpost account is required. A voter may vote for as many submissions as they like, but **only once per submission**. There is also an optional ranked mode where voters order projects 1st, 2nd, 3rd and the platform computes the result. **Vote counts are hidden from the public** — only hackathon managers see results during the voting period. |
| **Product Hunt** | Account required. **One upvote per user per launch.** Vote counts are public. Heavy anti-manipulation: coordinated voting, same IP ranges, bursts of brand-new accounts and zero-history profiles get flagged and discounted. |
| **Devfolio** | Judges score against a fixed rubric (Technicality, Originality, Practicality, Aesthetics, Wow-factor) with scores auto-normalised. Community side uses **Quadratic Voting** for a matching pool. |
| **DoraHacks** | Quadratic voting with voice credits: the Nth vote on the *same* project costs n × base, so influence grows as √n. Explicit anti-Sybil checks after the round. |
| **Unstop** (closest to Indian college reality) | Only **registered participants / team leaders** can submit. Public engagement is ratings + comments, not prize-deciding votes. |

### What this means for us

Consensus across the market: **voting requires a signed-in account, and one vote per submission per person.** Nobody lets anonymous visitors decide prizes.

Devpost's two extra decisions are worth copying directly:
- **Hide live vote counts** during the voting window. Devpost's own guidance is to not show results live, to reduce cheating and uncomfortable competition.
- **Keep the community prize small** relative to the jury prize, so the incentive to cheat stays low.

Anti-fraud floor for a college event (cheap to build, catches most abuse):
- Google sign-in only, one account = one voter identity.
- One vote per deck per account; votes are rows keyed `(voter_id, deck_id)` with a unique constraint — makes double-voting impossible at the DB level rather than in UI.
- Rate-limit and log IP + account age; flag bursts.
- Self-voting blocked (a team member cannot vote for their own deck).
- Organiser sees a fraud panel with vote timing and duplicate-IP clusters before declaring.

---

## 2. Vote rules — the confirmed model, and the verdict on the credit idea

**Confirmed model (user's decision, and it matches Product Hunt/Devpost):**
- If the organiser created categories → **one vote per person per category**.
- If there are no categories → **one vote per person for the whole event**, for their favourite deck.

**The "spend 10 votes here, 3 there" idea:** this is not a bad idea — it already exists in the market under the name **quadratic voting** (Devfolio's QV rounds, DoraHacks grant rounds, Gitcoin). So the instinct is sound and proven. But it is the wrong fit here, for reasons the same platforms document:

1. It only works when identity is strong. QV's entire weakness is Sybil attacks — one person, many accounts. DoraHacks runs post-round anti-Sybil audits to deal with it. A college event with open Google sign-up cannot.
2. It needs explaining. Every QV platform ships a "voting guide" page. If a voting system needs a manual, it loses casual voters at a fest.
3. Vote-splitting confuses the leaderboard. "Team A has 47" means something different from "Team A has 47 credits from 6 people".

**Decision: drop credit-weighted voting. Ship one-vote-per-category.** If a deeper signal is ever wanted, the market's answer is not credits — it is Devfolio's approach: a **separate judge role scoring a rubric**, kept apart from the public vote. That is the natural v2, not QV.

---

## 3. Sign-ups and money — out of scope

- **Luma** processes payments through Stripe, supports UPI in India up to ₹1,00,000 per payment, and issues every guest a QR ticket for check-in.
- **Unstop** keeps most college competitions free; paid ones are handled by the college, off-platform.

**Our scope is narrower than either, on purpose.** In a college fest the poster already carries a Google Form and a payment QR. People fill the form, pay, and upload the proof there, and the organiser verifies it there. That flow works, costs nothing and needs no compliance work.

So Podium does not register anyone, does not take a fee and never sees a payment. It starts one step later: a team arrives with the event code, uploads a deck, and the room votes. The only words about money anywhere on the site say where money is *not*.

What this removes from the build: payment verification queues, UPI reference fields, Paid/Pending/Rejected states, refunds, and any need to store a transaction identifier.

## 4. File types and size limits

| Platform | Accepted | Size cap |
|---|---|---|
| **Devpost** | zip, PDF, Word, APK | **35 MB** per file (gallery thumbnail ≤ 5 MB) |
| **Unstop** (real Indian college competition, IIM Udaipur) | .pptx and .pdf (competitions commonly say "7–10 slide PPT in .pptx or .pdf") | *"please ensure that the file size is less than **20 MB**"* |
| **SlideShare** | PPT/PPTX/PDF, best results as PDF or PPTX | 300 MB, max 300 slides (a hosting product, not a competition one) |

### Our decision

- **Accept:** `.pdf` and `.pptx`. Recommend PDF in the UI ("PDF keeps your fonts and layout exactly as you designed them").
- **Reject:** `.ppt` (legacy binary), Keynote, Google Slides links.
- **Cap: 25 MB.** Sits between Unstop's 20 MB and Devpost's 35 MB, and comfortably holds a 10–20 slide deck exported as PDF.
- **Slide cap:** optional per-event setting, default 15 slides, since competitions almost always specify a slide count.
- Show the limit *before* the person picks a file, in 12px grey under the drop zone: `PDF or PPTX · up to 25 MB · max 15 slides`.
- On rejection, never show a raw error. Show: *"That file is 41 MB. Export as PDF and it will usually drop under 25 MB."*

---

## 5. Storage and retention — what to do with the decks

Devpost's model: galleries are opened by the organiser after the deadline, projects are moderated, and once published they stay **permanently** public. That works for open-source hackathon projects. It is the wrong default for student business-plan and case-study decks, where teams actively worry about their idea being lifted.

### Recommended model

**Render, don't serve the original.**

1. On upload, store the original file privately (never publicly linkable).
2. Convert to PDF, then rasterise each slide to a web image (WebP, ~1600px wide).
3. The gallery and deck pages show **images in a slide viewer**. No download button by default; the organiser may enable downloads per event.
4. Every rendered slide carries a light watermark: team name + event name.

This gives fast page loads, removes the "someone stole my PPTX" objection, and keeps voters looking at slides rather than downloading files.

**Retention schedule**

| Stage | What happens |
|---|---|
| During the event | Full deck viewable to signed-in users; voting open. |
| Event ends | Voting closes. Gallery becomes read-only. |
| +30 days | Non-winning decks are hidden from public view (owners keep access to their own). |
| +90 days | Original uploaded files are **deleted** from storage. Rendered thumbnails of winners are kept. |
| Forever | The **winners' podium** stays live — see below. |

Teams get a clear line at upload time: *"Your deck stays visible for 30 days after the event, then only you can see it. Winners stay on the results page."* Also give every team a delete-my-deck control; it is their work.

**Why delete:** storage cost grows with every event, most decks are never opened again after the result, and holding students' unpublished ideas indefinitely is a liability nobody asked for.

### Winners' podium (the permanent artefact)

After results are declared the event page becomes a results page showing **only**: the team's chosen banner, the team name, and the details they submitted.

Layout, per the brief:
- **Winner centre**, largest card, slightly raised.
- **2nd place left**, **3rd place right**, both smaller.
- On mobile the three stack vertically in rank order: 1, 2, 3.
- Nothing else on the screen except the event name, date and a quiet "View all entries" link.

---

## 6. Summary of settled decisions

| Question | Answer |
|---|---|
| Who votes | Any user signed in with Google who has completed a profile. One vote per deck. Team members cannot vote for their own deck. |
| Vote rule | Categories exist → one vote per category. No categories → one vote overall. |
| Credit / weighted votes | Dropped. It is quadratic voting; real, but Sybil-fragile and too complex for a fest. |
| Live vote counts | Hidden until voting closes (Devpost's explicit recommendation). |
| Sign-ups and money | Not handled here. The poster's Google Form takes registration, fee and proof; the organiser verifies there. Podium holds decks and votes only. |
| File types | PDF and PPTX only. PDF recommended. |
| Size cap | 25 MB, optional 15-slide cap. |
| Storage | Originals private; slides rendered to watermarked images; no download unless the organiser allows. |
| Retention | Public 30 days after the event, originals deleted at 90 days, winners kept permanently. |

## Sources

- Devpost — community & public voting: https://help.devpost.com/article/70-community-and-public-voting-for-prizes
- Devpost — voting for a submission: https://help.devpost.com/article/82-voting-for-a-submission
- Devpost — submission setup / 35 MB limit: https://help.devpost.com/article/145-how-do-i-set-up-the-submission-period
- Devpost — project gallery: https://help.devpost.com/article/80-what-is-the-project-gallery
- Product Hunt — community guidelines: https://help.producthunt.com/en/articles/3615694-community-guidelines
- Devfolio — organizer judging: https://guide.devfolio.co/docs/guide/organizer-judging
- DoraHacks — what is quadratic voting/funding: https://dorahacks.io/blog/guides/what-is-quadratic-voting-funding-how-did-we-improve-it/
- Unstop — PPT submission round (20 MB rule): https://unstop.com/submissions-round/ppt-submission-4951
- SlideShare — file formats and size limits: https://www.linkedin.com/help/slideshare/answer/53682/file-formats-and-size-limits-supported-on-slideshare
- Luma — payment methods (UPI, ₹1,00,000 cap): https://help.luma.com/p/payment-methods
