# Decisions made while building the frontend

One line per decision, grouped by part.

## Part 1: Members, profile, manual check-in
- "Active" filter = can enter today (includes expiring); "Expiring" is a subset.
- Cancelled members show a "Cancelled" badge, appear under "Expired" and are refused at manual check-in.
- Early renewal: show the plan covering today, but the latest end date for end date and days left.
- Days-left wording: "23 days left", "1 day left", "Last day today", "Expired 6 days ago", "Frozen", "Cancelled".
- Only an `active` card counts as a linked card; a card with no printed number shows "Plain card".
- A second manual check-in the same day is allowed (with a note) and counted once.
- Refused manual check-ins are not saved; the reason and a "Renew" button are shown.
- Manual check-in ends on a success step with "Done" and "Check in another".
- Profile history uses the same three tabs on phone and desktop.
- From 1024 to 1279 px, phone and plan sit under the name in the member table.
- Offline: members can still be looked up; only the "Check in" button is disabled.
- A cancelled member keeps showing the cancelled membership's end date.
