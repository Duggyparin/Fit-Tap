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
- [ ] `card_batch`: batch_id, gym_id, quantity, chip_type, design_url, price_centavos, status (requested | printing | shipped | received), ordered_at

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

- [ ] Frozen memberships: if the member's newest membership is frozen, answer `allowed: false, reason: 'frozen'` and save the check-in with result `'frozen'`. Firmware `handleResult()` then needs a "Membership frozen" message.
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
- [ ] **Scanner "online" needs a heartbeat.** `last_seen_at` is updated only when a card is tapped, so an idle scanner would show "Offline" after 2 minutes (Dashboard, Scanners, Link card warning). The firmware should ping the server about once a minute.
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

## Tooling

- [ ] `supabase/` is excluded from ESLint (it is Deno code, not browser code). Add Deno lint and type checking for it later (`deno lint`, `deno check supabase/functions/checkin/index.ts`).

## Known gaps (not fixing now)

- **Scanner cannot show "Tap card to link" while waiting.** The firmware only learns about a link request when a card is tapped, so the OLED shows "Card linked" after the tap but nothing before it. A later firmware step can poll for pending requests (or use Supabase Realtime).
