# OLTA

A place for college competition decks: teams upload slides, the room votes, winners go on the podium.

## Run it

```bash
python3 -m http.server 8793 --directory deck-comp
```

Then open http://localhost:8793

## Files

| File | What it is |
|---|---|
| `index.html` | Landing page |
| `onboarding.html` | Google sign-in → role choice → profile |
| `styles.css` | Design tokens and every component |
| `app.js` | Scroll reveals, demo vote buttons, onboarding steps |
| `docs/DESIGN-NOTES.md` | Study of notchowl.com / Luma, with the measured type and colour system |
| `docs/MARKET-RESEARCH.md` | How Devpost, Devfolio, Product Hunt, Unstop and Luma answer voting, payment, file and retention questions |

## Hero image

Save your image as `assets/hero.jpg`. The landing page picks it up automatically;
until then it shows a placeholder frame. Best results at 16:9, at least 1600px wide.

## What is built, and what is not

Built: landing page, onboarding flow (sign-in step, role choice, profile), podium
layout, FAQ.

Not built yet: real Google auth, event pages, deck gallery, upload screen,
organiser dashboard, vote storage. The onboarding stores the chosen role in
`localStorage` under `olta.profile` so the flow can be walked end to end.

## Decisions already settled

- Voting needs a signed-in account. One vote per deck; one vote per category when
  the organiser creates categories, otherwise one vote for the event.
- Vote counts stay hidden until the organiser closes voting.
- Entry fees are paid outside the app: the poster carries the organiser's UPI QR,
  the participant submits the transaction reference, the organiser verifies it.
- Uploads are PDF or PPTX, 25 MB, 15 slides by default.
- Decks are shown as rendered images, not downloadable files, unless the organiser
  allows downloads.
- Decks go private 30 days after the event; originals are deleted at 90 days;
  winners stay on the results page.

See `docs/MARKET-RESEARCH.md` for the sources behind each of these.
