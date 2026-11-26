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

## Part 2: Register member
- Photos are cropped to a centered square (up to 400x400 JPEG, quality lowered until under 80 KB).
- The back camera opens first; "Switch camera" changes it. The file input with `capture` appears only if the live camera is unavailable or refused.
- A phone number already used by someone shows a warning but does not block saving.
- "+63 9..." typed in the phone field is turned into "09...".
- The default plan is the first active 30-day plan; the amount is always the plan price.
- Consent wording covers name, contact details, photo and check-in history, and deletion on request.
- Pressing Enter in the form means "Save and link card".
- Errors appear after the first save attempt, and the screen jumps to the first one.
