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

## Part 3: Link card
- A pending request for the SAME member on that scanner is cancelled and replaced; another member's pending request shows "scanner is busy".
- Leaving the page cancels a waiting request.
- With one scanner that is online, waiting starts at once; with several scanners (or an offline one) a confirm screen with the picker comes first.
- An offline scanner shows the warning and still allows "Start anyway".
- "Replace card" asks for confirmation as soon as the page opens; "Keep the old card" returns to the profile.
- Success returns to the profile after 2.5 seconds, with a "Back to profile" button.
- A simulated "linked" tap uses the first stock card, so the profile shows a card number.
- Recent taps show one row per card, with the last 4 characters of its UID; stock cards still count as unknown.
- Card numbers are matched ignoring upper/lower case.
- Mock only: scanners that start online keep a pretend heartbeat.

## Part 4: Renew
- The chosen member is kept in the address (`/renew?member=:id`).
- The member's current plan is preselected if still active, else a 30-day plan.
- A renewal continues from the latest-ending running membership, so renewing twice stacks correctly.
- The amount can be edited; picking another plan resets it to that plan's price.
- Renewing a frozen member is allowed, with a note that they stay frozen until unfrozen.
- Date ranges show the first year only when it differs from the last day's year.

## Part 5: Walk-in
- After saving, the form resets for the next guest and shows a confirmation line.
- The shown time updates live; the saved time is taken at the moment of saving.
- The default price is a gym setting held in memory (starts at ₱100).

## Part 6: Dashboard
- Income (dashboard and reports) is shown to owners only, as the plan says staff see limited reports.
- "Check-ins by hour" counts allowed taps, 5 AM to 10 PM (wider if needed).
- Charts use one navy color, a readout on hover or tap, and a "Show as table" view.
- "This month's income" is from the 1st to today, by payment date plus walk-ins.
- Mock only: 30 days of generated past check-ins and walk-ins.

## Part 7: Reports
- "This week" starts on Monday; week and month end today. The default range is "This month".
- "Members checked in per day" counts unique members; "Peak hours" counts allowed taps.
- The payments CSV includes walk-ins, with a Type column; amounts are plain pesos with two decimals.
- CSV cells starting with = + - @ get a leading apostrophe so spreadsheets do not run them as formulas.
- The expiring list always shows the next 7 days, whatever range is picked.

## Part 8: Plans, Scanners, Staff, Settings, Card orders, More, Login
- Only the owner can change plans, settings and the default scanner; staff see them read-only.
- Plans are retired, never deleted; the last active plan cannot be retired.
- Plan names must be unique; editing a plan does not change existing memberships.
- Settings: gym name and walk-in price are editable (in memory); "expiring soon" days are read-only.
- The Scanners page keeps a fixed row order; elsewhere the default scanner is listed first.
- Card batch counts come from card rows ("Register batch" moved to the admin area in Part 10b).
- "Log out" is at the bottom of the sidebar and of the More screen.
- Login only checks that an email and password are filled in; nothing is stored and pages are not protected yet.
- A second mock batch (printing) shows another order status.

## Part 9: Final pass
- The top-bar search opens Members with the search filled in; the search is kept in the address.
- Member search matches name, phone or card number everywhere (one rule for Members, Renew and manual check-in).
- Moving to another page scrolls back to the top.
- The browser tab title is "FitTap".

## Card batches (decided by the user, built in Part 10b)
- "Register batch" and card batch management are for the platform admin only. Gym owners see their orders' status and counts.

## Part 10a: Platform admin (overview, gyms, owners, subscription)
- A dev-only "Testing as" bar switches between gym owner and platform admin; it is remembered for the browser tab. Production builds have no switch.
- Non-admins get "Page not found" on /admin; admins are sent to /admin from gym screens. These guards only hide screens.
- Admin data lives in `src/lib/adminData.ts`; the shared in-memory store moved to `src/lib/store.ts`.
- Gym screens only see one gym's rows (the owner's, or the one being viewed).
- Subscription state comes from the due date: paid, grace (1-7 days late), overdue (more than 7).
- "Suspend" is offered only after the grace period. Paying does not lift a suspension; "Reactivate" does.
- A payment moves the due date one month on; a trial gym's first payment starts its subscription that day and makes it active.
- "Stuck in onboarding" = on trial for 7 days or more with checklist steps left.
- Offline-scanner counts and scanner/quiet alerts ignore suspended gyms. "Overdue gyms" includes suspended ones that still owe.
- Card batch status "requested" is renamed "ordered".
- An email can belong to only one account.

## Part 10b: Scanners, card orders, audit log, view as
- Tokens are mock (`mock_...`), shown once with a copy button; only a mock hash is kept, never in the audit log or browser storage.
- "Register scanner" creates a new scanner at a gym; the first usable one becomes the default.
- Revoking the default scanner moves the default to another working scanner of that gym, if any.
- Hardware status is displayed only; moving scanners between stock, gym and repair is not built.
- A batch can fill an open order or become a new batch (marked received, no price). Registering does not change an existing order's status.
- UIDs must be new across all gyms; printed numbers must be new within the gym.
- Owners see their orders' status, counts and price, with no admin controls.
- "View as gym" disables every button and field on the gym screens, including filters, tabs and CSV export; links and menus still work. It shows what the owner sees, including income.
- The view ends on "Exit" or on returning to any admin page; a reload also ends it.
- Opening "View as gym" is written to the audit log.

## Later (platform admin ideas, not built and not on the roadmap)
- Announcements to gym owners.
- Usage stats per gym (photo storage).
- Per-gym data export and deletion for the Data Privacy Act is roadmap #23.

## Other
- Dates are converted with one reused formatter, because building one per check-in made Reports slow.

## Part 11: QR codes, privacy, feedback, anonymize, pricing
- Each QR upload, replacement or removal asks for confirmation with a preview; only the real owner can change it (not staff, not "View as gym").
- QR pictures are kept up to 900 px (PNG, or JPEG if large) so they stay scannable.
- The gym activity log records QR changes and anonymizations, never a removed person's details. It is shown to the owner on Settings.
- The privacy contact defaults to the owner's name and email until changed in Settings.
- The consent tick says the notice was read; the notice opens from a link under it.
- "Former member #N" uses the last digits of the record ID until members have real numbers.
- Anonymizing also disables the member's card and cancels pending link requests; it is allowed on a running membership, with a warning.
- Anonymized members leave the list and search; their profile still shows history, with no actions.
- Payment reference numbers, card UIDs and dates are kept.
- Automatic anonymizing runs when the app loads (mock only); the clock starts at the last membership's end date, or at registration if there is none.
- "Send feedback" is in the sidebar and on More, for gym users only.
- Placeholder prices: setup fee ₱1,500, annual discount 10% (0 to 50 allowed). Changing the billing cycle keeps the due date; the setup fee changes neither due date nor trial status.

## Schema upgrade (migration 20261126000000, written, not applied)
- One clean migration replaces `supabase/schema.sql` (now deleted); no baseline, since nothing ran on a real project yet.
- Stay on Free with a 2-minute heartbeat; move to Pro before about 19 scanners. On Free, back up by hand with `supabase db dump` (no automatic backups).
- The browser only reads (RLS); every write is one database function per action, run in one transaction.
- Suspended gym: the scanner keeps working; owner and staff can only read; the website shows a banner.
- Staff see only today's payments and walk-ins, plus a member's latest payment through `member_latest_payment`. The owner sees everything.
- Link mode adds the result `blocked` ("Card is lost or disabled"); it never re-enables a card.
- Freeze: a frozen membership that has started denies entry whatever its end date; unfreezing moves the end date (and queued renewals) forward by the days frozen.
- Scanner tokens are made on the server: 24 random bytes as hex, stored only as SHA-256 lowercase hex (same as `index.ts`).
- Heartbeat every 2 minutes; offline after 5 minutes; the pending-link hint (#12) is best effort.
- Owner invites and photo cleanup come later (see schema-todo.md).
