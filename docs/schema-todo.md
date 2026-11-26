# Schema to-do

`supabase/schema.sql` and `supabase/functions/checkin/index.ts` are still the
**scanner prototype** (build guide v1.3). The website's types (`src/types.ts`)
and mock data already follow the **full ERD** in the project plan (v1.3).
These are the changes to make in the schema-upgrade step, as a new migration
file. Do not edit `schema.sql` in place.

## New tables

- [ ] `plan`: plan_id, gym_id, plan_name, duration_days, price_centavos, is_active
- [ ] `payment`: payment_id, membership_id, amount_centavos, method, reference_no, paid_at, recorded_by
- [ ] `app_user`: user_id (= Supabase Auth user), gym_id (null only for platform admin), role (owner | staff | platform_admin), display_name, email, is_active
- [ ] `card_batch`: batch_id, gym_id, quantity, chip_type, design_url, price_centavos, status (ordered | printing | shipped | received), ordered_at

## Changes to existing tables

- [ ] `gym`: add slug (unique), logo_url, brand_color, timezone, status (trial | active | suspended), created_at
- [ ] `scanner`: add firmware_version, `is_default boolean not null default false`; at most one default per gym (partial unique index on gym_id where is_default)
- [ ] `member`: add phone, email, photo_url, consent_at, status (active | archived), created_at
- [ ] `nfc_card`: add batch_id, assigned_at; change default status from `'active'` to `'stock'`
- [ ] `membership`: add gym_id and plan_id; status becomes `active | frozen | cancelled` (see "Expired is derived" below)
- [ ] `checkin`: make `card_uid` nullable (manual check-ins have no card); add `synced_at`; add `'frozen'` to the result values
- [ ] `link_request`: add requested_by; allow only ONE pending request per scanner (partial unique index on scanner_id where status = 'pending')
- [ ] `walk_in`: add recorded_by
- [ ] Add `check` constraints for every status, result, source and method column so bad values are refused

## Expired is derived, not stored

- `membership.status` will not include `'expired'`. A membership is expired when `end_date < today` in Asia/Manila.
- `index.ts` already decides access by `end_date >= today` (Manila), so the scanner keeps working without a stored status.
- The website uses `membershipState()` in `src/lib/membership.ts` for the same rule.
- Migration: change any existing `status = 'expired'` rows to `'active'` before adding the check constraint.

## end_date is inclusive

- `end_date` is the **last day the member may enter**: `end_date = start_date + duration_days - 1`. A Daily pass bought today works today only; Monthly from Nov 26 ends Dec 25.
- `index.ts` needs no change: it already allows entry while `end_date >= today`.
- Renewal start: if the current membership is active or frozen and `end_date >= today`, the new one starts on `end_date + 1` (no lost days); otherwise it starts today in Manila.
- The website uses `endDateFor()` and `renewalStartFor()` in `src/lib/membership.ts`.
- [ ] Update the build guide's test data (Step 6.3): `current_date + 30` gives 31 days of access; use `current_date + 29` for a 30-day plan.
- [ ] If the database ever calculates end dates (a function or trigger), use the same `+ duration_days - 1` rule.

## index.ts changes

- [ ] Frozen memberships (roadmap #15 rule): if the membership **covering today** is frozen, answer `allowed: false, reason: 'frozen'` and save the check-in with result `'frozen'`. Firmware `handleResult()` then needs a "Membership frozen" message.
- [ ] Use `membership.gym_id` once it exists (today it trusts that the member belongs to the scanner's gym).
- [ ] Linking a card from stock: also set `assigned_at`.
- [ ] **Stock cards must count as unknown.** Today any card whose status is not `active` answers `disabled`. Once new cards start as `stock`, tapping an unlinked card would say "Card disabled" and would be missing from "recent unknown taps". Treat `stock` like an unknown card (result `'unknown'`).

## Row Level Security

- [ ] Policies for website staff logins: each user reads and writes only rows where `gym_id` matches their `app_user.gym_id`.
- [ ] `payment` has no gym_id: either add one, or write its policy through `membership`.
- [ ] Test: log in as Gym A and try to read Gym B's members.

## Needed by the website screens

### Blocking: these screens cannot work for real without them

- [ ] **Link results never reach the website.** For `already_linked` and `other_gym`, `index.ts` answers only the scanner and leaves the request `pending`, so the website would just time out. Add `link_request.result` (linked | already_linked | other_gym) plus the tapped `card_uid`, and write them in `index.ts`. `src/types.ts` and the mock data already include `result`.
- [ ] **Scanner heartbeat (roadmap #28).** `last_seen_at` is updated only when a card is tapped, so an idle scanner would show "Offline" after 2 minutes (Dashboard, Scanners, Link card warning, admin alerts). The firmware pings the server every 60 s; the server updates `last_seen_at` and replies whether a link request is pending, so the same ping powers #12 "Tap card to link".
- [ ] **Other gym's cards are invisible to the website under RLS.** Linking by card number or recent tap needs a database function (RPC) that checks all gyms and answers "belongs to another gym" without exposing the row. Inserting a UID that another gym owns must fail with that message.

### Data integrity

- [ ] One card per member at a time: partial unique index on `nfc_card (member_id)` where status = 'active'.
- [ ] Link, replace, register (member + membership + payment) and renew (membership + payment) should each be one transaction (RPC), so a dropped connection cannot save half.
- [ ] Manual check-in: staff may insert only `source = 'manual'` rows, and the server should confirm the membership allows entry.
- [ ] `nfc_card.card_number`: unique per gym.
- [ ] `plan`: unique name per gym; keep at least one active plan.
- [ ] `member.phone`: check the format `09XX XXX XXXX` (or store digits only).

### Settings, photos, roles and reports

- [ ] `gym`: add `walk_in_default_centavos` and `expiring_days` (today: constants and in-memory settings).
- [ ] Member photos: private storage bucket; store the path in `photo_url` and show it with short-lived signed links.
- [ ] Income is owner-only in the website; enforce it with RLS on `payment` (and decide what staff may read in `walk_in`, since they record walk-ins and see today's total).
- [ ] Refuse writes from users with `app_user.is_active = false`.
- [ ] Indexes for reports: `payment (paid_at)`, `walk_in (gym_id, visited_at)`.

## Platform admin (Part 10)

- [ ] `app_user`: role `platform_admin` (gym_id null); add `invited_at`, `accepted_at`; email unique.
- [ ] `gym`: add `city`, `monthly_fee_centavos`, `next_due_date`; status stays trial | active | suspended (grace and overdue are derived from the due date).
- [ ] New table `gym_payment`: gym_payment_id, gym_id, amount_centavos, method, reference_no, paid_at, covers_due_date, recorded_by.
- [ ] New table `audit_log`: audit_id, actor_user_id, action, gym_id, detail, created_at. Insert only (no update or delete), written by the server in the same transaction as the action. Never store tokens in it.
- [ ] `scanner`: gym_id nullable (stock and repair); add `hardware_status` (in_stock | at_gym | in_repair); rotation replaces `token_hash`; revoking sets status disabled and the check-in function refuses it.
- [ ] Scanner token creation and rotation must run in a **server-side function**, never in the browser. It returns the token once and stores only its SHA-256 hash. (The website only mocks this.)
- [ ] `card_batch.status`: use the values above. Only admins insert or update batches and register cards; owners read their own.
- [ ] RLS: platform admins see all gyms; owners and staff only their gym. "View as gym" must be read-only in the database too (for example admins have no write policy on gym tables), because disabled buttons are not security.
- [ ] Invites need a server-side function (Supabase Auth admin API uses the service key).
- [ ] Decide what suspension does to a gym: block staff logins, the scanner check-in, or neither.

## Roadmap Part 11 (privacy, QR codes, pricing)

- [ ] `member`: add `consent_version`, `anonymized_at` and a per-gym `member_number`; allow empty phone and photo only for anonymized rows.
- [ ] Anonymizing (RPC, owner only) in one transaction: clear name, phone, email and photo, delete the photo file from storage, disable cards, cancel link requests, write the gym audit log. Also decide what to do with payment reference numbers.
- [ ] Scheduled server job: anonymize members 1 year after their last membership ends.
- [ ] New table `gym_audit_log`: gym_audit_id, gym_id, actor_user_id (null = system), action, detail, created_at. Insert only, written by the server.
- [ ] Payment QR codes: private storage bucket, paths on `gym`; only the owner may write; log every change on the server.
- [ ] `gym`: `privacy_contact_name`, `privacy_contact_detail`.
- [ ] `gym`: `billing_cycle` (monthly | annual), `annual_discount_percent`, `setup_fee_centavos`, `setup_fee_paid_at`. `gym_payment`: `kind` (subscription | setup).

## Freeze rule (roadmap #15, Wave 2)

- [ ] Deny entry only if the membership covering today is frozen; store the freeze reason, who and when; on unfreeze move `end_date` forward by the days frozen (and any queued renewals after it). The website's `memberAccess()` still denies when *any* running membership is frozen: change it with this work.

## Tooling

- [ ] `supabase/` is excluded from ESLint (it is Deno code, not browser code). Add Deno lint and type checking for it later (`deno lint`, `deno check supabase/functions/checkin/index.ts`).

## Planned with the heartbeat

- **Scanner "Tap card to link" (roadmap #12).** Today the firmware only learns about a link request when a card is tapped. The #28 heartbeat reply will tell it a request is pending.
