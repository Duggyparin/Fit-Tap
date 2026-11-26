# Schema to-do

The full database is now one migration:
`supabase/migrations/20261126000000_fittap_schema.sql`, with the check-in
function in `supabase/functions/checkin/index.ts`. It is **written but not yet
applied** to any Supabase project. `supabase/schema.sql` is the old scanner
prototype (build guide v1.3) and is no longer used.

Status words: **written** = in the migration, not yet run; **open** = not done.

## Next steps

- [ ] Create a new test project, apply the migration (`supabase db push`), and run the checks in [testing-schema.md](testing-schema.md).
- [ ] Deploy the check-in function (`supabase functions deploy checkin --no-verify-jwt`) and run the curl test in testing-schema.md.
- [x] pg_cron 1.6.4 is available on the project. The migration enables it (`create extension if not exists pg_cron`) and schedules the nightly anonymizing job `fittap-anonymize-expired` (2:30 AM Manila).
- [ ] After applying, check the job exists: `select jobname, schedule from cron.job;`
- [ ] Run `deno test supabase/functions/checkin/hash_test.ts` (Deno is not installed on this PC yet).
- [ ] Decide whether to delete `supabase/schema.sql` or keep it only as a reference for the build guide.

## Written in the migration

### Tables
- [x] New: `app_user`, `plan`, `payment` (with gym_id, so RLS is simple), `card_batch`, `gym_payment`, `audit_log`, `gym_audit_log`.
- [x] `gym`: slug, branding, timezone, status (trial | active | suspended), city, billing (monthly fee, next due date, billing cycle, annual discount, setup fee and when it was paid), privacy contact, walk-in default price, expiring days, payment QR file paths, member number counter.
- [x] `scanner`: gym optional (spares and repairs), firmware version, hardware status, one default per gym, token hash optional and never readable from the browser.
- [x] `member`: phone (09XX XXX XXXX), email, photo path, consent time and **consent version**, member number per gym, archived status, anonymized time. Phone and photo required until anonymized.
- [x] `nfc_card`: batch, assigned time, new cards start as **stock**, printed number unique per gym, one active card per member.
- [x] `membership`: gym and plan, freeze fields (when, why, who). Status active | frozen | cancelled; **expired is derived** from end_date. end_date must not be before start_date.
- [x] `checkin`: card optional for manual check-ins, synced time, `frozen` result; manual check-ins have no scanner or card.
- [x] `link_request`: who asked, **result** (linked | already_linked | other_gym | blocked) and tapped card saved for the website; one pending request per scanner.
- [x] `walk_in`: who recorded it. GCash and Maya payments need a reference number.
- [x] Audit logs are append only (no update, delete or truncate).
- [x] Composite foreign keys keep each member, membership, payment, card and link request inside one gym.
- [x] Indexes for check-in feeds, reports and audit logs.

### Rules
- [x] **#11** A stock card, or any card not linked to a member, is **unknown** at the scanner, so it appears in "recent unknown taps".
- [x] **#28** `scanner_heartbeat` updates `last_seen_at` and the firmware version, and replies whether a link request is pending (**#12**, best effort).
- [x] **#15** Entry is denied only if the membership covering today is frozen. A frozen membership counts from its start date whatever its end date, because unfreezing moves the end date forward by the days frozen (and any queued renewals with it). Freezing needs a reason; the reason is not written to the log (it may be about health).
- [x] **end_date inclusive**: register and renew use `start + duration_days - 1`; renewals start the day after the latest active or frozen membership that has not ended.
- [x] Link mode never turns a lost or disabled card back on (`blocked`), and a membership bought in advance no longer lets someone in before its start date.
- [x] Every write is a database function in one transaction: register (member + membership + payment), renew, manual check-in (the server checks the membership), link card (by UID or printed number, "other gym" without showing that gym's card), mark card lost, walk-in, freeze and unfreeze, plans, settings, default scanner, payment QR codes, anonymize.
- [x] Admin functions write the audit log in the same transaction: add gym, record gym payment (subscription or setup fee), billing cycle, suspend (only after the 7-day grace) and reactivate, register scanner, rotate token, revoke scanner, default scanner, card batch status, register batch.
- [x] Scanner tokens are created and rotated **on the server** (`new_scanner_token`): 24 random bytes as 48 hex characters, stored only as SHA-256 lowercase hex, the same format `index.ts` computes.
- [x] Anonymizing (owner only): name becomes "Former member #N", phone, email and photo path cleared, cards disabled, link requests cancelled, gym audit log written. Payment reference numbers are kept.
- [x] `anonymize_expired()` for the nightly job: 1 year after the last membership ends (or registration if there was none).

### Security
- [x] RLS: the browser can only **read**, and only its own gym; the platform admin reads everything. All writes go through the functions above.
- [x] Money: the owner reads all payments and walk-ins; **staff only today's** (Manila), plus `member_latest_payment` for the member they open. Gym bills and the gym activity log: owner and admin. Admin audit log: admin only.
- [x] Suspended gym: owner and staff can read but every write function refuses (`gym_suspended`); the scanner keeps working.
- [x] "View as gym" is read-only in the database: the admin has no gym, so every gym write function refuses (`not_allowed`).
- [x] Inactive accounts (`is_active = false`) get nothing.
- [x] Every SECURITY DEFINER function sets `search_path = ''` and checks the caller itself. EXECUTE is revoked from everyone, then granted only where needed: website functions to `authenticated`; `scanner_tap` and `scanner_heartbeat` **only** to `service_role`; internal helpers to no one.
- [x] Logged-out visitors (`anon`) have no table access.
- [x] Storage: private buckets `member-photos` (200 KB, JPEG/PNG) and `payment-qr` (1 MB), one folder per gym. Owner and staff upload photos; only the owner uploads or deletes QR codes or deletes photos. No update policies: each upload gets a new file name, and `set_qr_code` logs each change.

## Open: server side

- [ ] **Owner invites**: an Edge Function using the Supabase Auth admin API (service key on the server only) that the admin calls to invite an owner, creating the `app_user` row. Also resend invite and set `accepted_at`.
- [ ] **Photo cleanup**: a small scheduled Edge Function that deletes files in `member-photos` with no matching `member.photo_url` (orphans left by automatic anonymizing or abandoned registrations).
- [ ] Moving scanners between stock, gym and repair (`hardware_status`, `gym_id`) has no function yet.
- [ ] Offline check-ins (Wave 3, #10): a `scanner_sync` function that accepts queued check-ins with their own `checkin_id` and ignores ones already saved.
- [ ] Supabase grants new tables to `anon` and `authenticated` by default: every later migration must repeat the revoke/grant pattern at the end of this one.
- [ ] Update the build guide's test data (Step 6.3): use `current_date + 29` for a 30-day plan.

## Open: website (when it switches from mock data to Supabase)

- [ ] Replace `src/lib/data.ts` and `src/lib/adminData.ts` writes with calls to the database functions, and map their error words (`not_allowed`, `gym_suspended`, `scanner_busy`, `member_has_card`, `membership_frozen`, `membership_expired`, `not_overdue`, ...) to messages.
- [ ] Show a banner on every gym screen while the gym is suspended, and disable the save buttons.
- [ ] Staff screens: hide income and reports, and load a member's latest payment with `member_latest_payment` instead of the full payment history.
- [ ] Match the freeze rule in `memberAccess()` (`src/lib/membership.ts`): today it denies when *any* running membership is frozen; the server uses "a frozen membership that has started". Add freeze and unfreeze buttons (Wave 2).
- [ ] Link card: show the new `blocked` result ("Card is lost or disabled"); link by card number now returns `not_found` for another gym's number (numbers are only unique within a gym).
- [ ] Uploads: give every photo and QR picture a new file name (`<gym_id>/<random>.jpg`); delete the old photo file before calling `anonymize_member`.
- [ ] Gym audit log: add the new actions `membership_frozen` and `membership_unfrozen`.

## Open: firmware (not changed yet)

- [ ] Send a heartbeat every **2 minutes**: `POST {"type":"heartbeat","firmware":"1.4.0"}` with the `x-scanner-token` header, outside the card-reading path so taps are never delayed.
- [ ] When the heartbeat reply has `"pending_link": true`, show "Tap card to link" (and the member's first name) until the next heartbeat or tap. Best effort: with a 2-minute heartbeat the message may appear late or not at all; linking still works by tapping within the 60 seconds.
- [ ] Show "Membership frozen" for `reason: "frozen"`.
- [ ] Show "Card is lost or disabled" for link-mode `reason: "blocked"`.
- [ ] Never fall back to "Other gym's card" for an unexpected reason: show "See front desk" instead.
- [ ] On HTTP 401 show "Scanner revoked / See front desk" (token wrong, rotated or revoked).
- [ ] Raise the firmware version to 1.4.0.
- [ ] Before a pilot: replace `setInsecure()` with `setCACert()`.

## Heartbeat cost

Assumptions: every Edge Function call counts as one invocation; a heartbeat
every 2 minutes is 720 calls a day; a busy small gym's scanner adds about 150
taps a day (check-ins, denied and unknown taps). That is about **870 calls a
day, or 26,100 a month, per scanner**.

| Scanners | Calls a month (2-min heartbeat) | Calls a month (1-min heartbeat) |
|---|---|---|
| 10 | about 261,000 | about 477,000 |
| 30 | about 783,000 | about 1,431,000 |
| 50 | about 1,305,000 | about 2,385,000 |

- **Verify:** these limits are from memory and change: Supabase Free has about **500,000** Edge Function invocations a month, and Pro includes about **2 million**, then charges per extra million. Check the pricing page.
- With a 2-minute heartbeat, Free covers about **19 scanners**; 30 or 50 scanners need Pro. A 1-minute heartbeat would nearly use up Free at 10 scanners.
- Decision: heartbeat every **2 minutes**; the website shows a scanner as offline after **5 minutes** (`SCANNER_ONLINE_MINUTES`); the admin "scanner offline" alert stays at 30 minutes.
- If costs grow: send heartbeats only during opening hours, or count a tap as a heartbeat (skip the next one after a tap).

## Tooling

- [ ] `supabase/` is excluded from ESLint (Deno code). Add `deno lint` and `deno check supabase/functions/checkin/index.ts`.
- [x] The migration and the test SQL were checked for syntax with the PostgreSQL parser (libpg-query 17), including every function body. Names and types are only checked when the migration runs on a real database.
