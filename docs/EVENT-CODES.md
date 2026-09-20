# Event codes — how they work

An event code is the short string an organiser prints on the poster. Typing it
is the fastest way into one specific event: no searching, no link to copy.

Right now the front end only checks the shape of the code and carries it through
sign-in. Everything below is the design the server will implement.

---

## The code itself

- **Six characters**, upper case, from the alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — no `O`, `I`, `0` or `1`, because those four are what people get wrong when reading a poster across a hall.
- That alphabet gives 32⁶ ≈ **1.07 billion** combinations, so guessing a live code is not worth anyone's time.
- Generated when the organiser creates the event, unique across all events that are still open, and shown in the organiser dashboard next to a "copy" button and a printable poster snippet.
- A code stops working when voting closes. It can be freed and reused later.

## What happens when someone types a code

1. The browser normalises what was typed: upper case, strip anything that is not a letter or digit, cut to six characters.
2. It checks the shape locally. A wrong shape never reaches the server.
3. `POST /api/events/lookup` with `{ code }`. The endpoint is rate limited — around 10 tries per minute per IP and per account — so nobody can walk through the code space.
4. The server answers with the little it is safe to show a stranger:

```json
{
  "id": "evt_8fJ2",
  "slug": "psg-startup-summit-26",
  "title": "Startup Summit '26",
  "college": "PSG College of Technology",
  "stage": "voting"
}
```

   A bad code returns `404` with a plain message, never "that event exists but is private" — the answer is the same either way.
5. The browser sends the person to `/e/psg-startup-summit-26`.
6. If they are not signed in, the code is held (in `sessionStorage` and in the sign-in `state`), Google sign-in runs, and the join finishes on the way back. Nobody has to type the code twice.
7. Joining writes one row: `event_members (event_id, user_id, role, joined_at)` with a unique constraint on `(event_id, user_id)`. A second attempt is a no-op, not an error.
8. What they see next depends on `stage`:
   - `draft` — "This event has not opened yet."
   - `open` — the deck wall, plus Upload if they are competing.
   - `voting` — the deck wall with vote buttons live.
   - `closed` — the results page with the podium.

## Without a code

Codes are a shortcut, not a gate. Two other doors:

- **A link.** Every event has a public URL. An organiser who posts the link in a group chat has done the same job as the code.
- **The open events list.** Events marked public appear in a browsable directory: title, college, date, deck count, stage. This is how someone who wandered in finds something to vote on, and it is the "Browse open events" link under the hero field.

Private events are the only ones that truly need a code: they do not appear in the directory, and the link alone is not enough — the first visit must carry a valid code or an invite.

## Codes we do not use

- **Organiser invites** are not codes. They are single-use signed links with an expiry, because granting organiser rights is a bigger deal than joining an event.
- **Sign-ups** are not handled here at all. The poster's Google Form takes the registration, the fee and the payment proof, and the organiser verifies it there. A code only opens the room where decks and votes live.

## Tables involved

```
events         id, slug, code, organiser_id, title, college, stage,
               starts_at, voting_closes_at
event_members  event_id, user_id, role, joined_at      -- unique (event_id, user_id)
```

`events.code` carries a unique index over rows where `stage <> 'closed'`.
