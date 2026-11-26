# FitTap Roadmap: Service Improvements

Source: Ken's "FitTap Service Improvement Tracker" sheet (Nov 26, 2026) plus
decisions made in chat. This file is the agreed plan for improving the service.
AI assistants: treat "Decided" items as fixed. Ask before changing them.

## Who uses FitTap

- Platform admin (Ken): onboards gyms, scanners, card orders, billing.
- Gym owner and staff: everything in the gym website.
- Members: tap a card at the door. NO member logins or member portal (dropped).

## Wave 1: before the first real gym

| # | Improvement | Area | Notes | Status |
|---|---|---|---|---|
| 11 | Treat stock cards as unknown, not disabled | Scanner | Part of the schema upgrade; fixes recent-taps linking | done (schema written, not applied) |
| 22 | Privacy notice at registration | Privacy | Data Privacy Act; shown with the consent checkbox | done (mock), text is a draft |
| 9 | Daily backups and a tested restore | Reliability | Free has no automatic backups: back up by hand with `npx supabase db dump` (see "Backups" in schema-todo.md). Daily backups come with Pro. Free projects also pause after 1 week without activity |  |
| 27 | GCash/Maya QR code shown at payment | Payments | See "Payment QR codes" below | done (mock) |
| 3 | Onboarding checklist per gym | Onboarding | Admin area. "Scanner checked in at least once" stays ticked | done (mock) |
| 7 | Health alerts: scanner offline, gym inactive 3+ days, overdue | Reliability | Admin area. Real alerts need the #28 heartbeat | done (mock) |
| 1 | Hybrid pricing: setup fee + monthly subscription + annual prepay | Pricing | Validate prices with gym owners first | done (mock), prices not validated |
| 2 | On-site setup and 1-hour staff training | Onboarding | Not software |  |
| 5 | Support via Messenger with a promised reply time | Support | Not software |  |
| 24 | Owner feedback: quarterly call and a feedback button | Feedback | Feedback button in the website | done (mock), link is a placeholder |
| 28 | Scanner heartbeat | Scanner | The scanner pings the server every 2 minutes to update last_seen_at (offline after 5 minutes). The reply also says whether a link request is pending (used by #12). Schema and firmware step | server side done (schema written, not applied); firmware open |
| 23 (minimal) | Anonymize member | Privacy | Owner only, with confirmation. Removes name, phone, email and photo; the name becomes "Former member #123". Payments, memberships and check-ins are kept | done (mock) |

## Wave 2: once one gym is using it

| # | Improvement | Area | Notes | Status |
|---|---|---|---|---|
| 15 | Freeze membership (injury, travel) | Members | See "Freeze membership" below | server side done (schema written, not applied); website buttons open |
| 14 | Renewal reminders by SMS | Members | See "Renewal reminders" below |  |
| 23 | Full data export per member and per gym, and per-gym deletion | Privacy | Data Privacy Act. "Anonymize member" is done in Wave 1 | |
| 21 | Monthly summary for the owner (income, check-ins, expiring) | Reports |  |  |
| 12 | Scanner shows "Tap card to link" while a link request waits | Scanner | Uses the #28 heartbeat reply, which says whether a link request is pending | server side done (schema written, not applied); firmware open, best effort |
| 6 | Read-only "View as gym" for support | Support | Admin area | done (mock) |
| 13 | Rotate or revoke a scanner token | Scanner | Admin area | done (mock) |
| 4 | Owner guide in Filipino and Bisaya with short videos | Onboarding | Write after the website is final |  |
| 8 | Spare scanner swap within 24 to 48 hours | Reliability | Keep 1 spare per 5 gyms. Not software |  |

## Wave 3: later

| # | Improvement | Area | Notes | Status |
|---|---|---|---|---|
| 10 | Offline mode on the scanner (cached list, queued check-ins) | Reliability | Build guide Step 8 |  |
| 20 | Online payments through a GCash/Maya provider | Payments | Blocked: needs ID and business verification. QR codes (#27) cover payments until then |  |

## Ideas (not planned yet)

- 17: Bulk card registration from the supplier's list of chip UIDs, by CSV file upload. (Pasting "UID, number" lines in Register batch is **done (mock)**.) Not a card generator: every chip already has a factory UID. Ask the supplier if they can send the list.
- 18: Photo-printed cards as a premium option.
- 19: Printable payment receipt (not an official BIR receipt).
- 25: Multiple branches per owner.
- 26: Door lock or turnstile control, only after the scanner is proven reliable.

## Dropped

- 16: Member portal and member logins. Too much work for little benefit; members ask the front desk or see days left on the scanner screen.

## Details for decided features

### Payment QR codes (#27)
- In Settings, the owner uploads a picture of their GCash and/or Maya QR code.
- On Register member, Renew and Walk-in, choosing GCash or Maya shows that QR code large on screen with the amount to pay. Never on the admin payment form.
- The member scans it with their phone and pays. The money goes straight to the gym owner's own account; FitTap never handles money.
- Staff confirm the payment on the owner's phone and type the reference number (required for GCash/Maya, as now).
- Only the owner can change the QR code, and every change is written to the gym's activity log, a gym-level audit log for owner and staff actions (a swapped QR code is a fraud risk).
- Phase 1 works with mock data (image kept in memory). Real storage comes with Supabase (private storage bucket).

### Privacy notice and retention (#22, #23)
- Data requests go to the gym (owner name and contact from Settings), with FitTap support as backup: support@fittap.example (placeholder).
- Personal details are kept until 1 year after the membership ends, then anonymized automatically.
- The notice text is in one file (`src/lib/privacy.ts`) with a version number, marked "DRAFT - to be reviewed". Each member's accepted version is saved.

### Feedback (#24)
- "Send feedback" opens FEEDBACK_URL (`src/lib/config.ts`, a placeholder for the Messenger page); if empty, it emails the support address. An in-app form comes later.

### Pricing (#1)
- A one-time setup fee, plus a monthly subscription or annual prepay with a discount. Default amounts are placeholders until validated with gym owners.

### Freeze membership (#15, Wave 2)
- Owner or staff can freeze and unfreeze, with a reason.
- Entry is denied only if the membership covering today is frozen.
- On unfreeze, end_date moves forward by the number of days frozen.

### Renewal reminders (#14)
- Phase 1 (free, no provider): each member on the "Expiring soon" list gets a "Send reminder" button. On a phone it opens the Messages app (sms: link) with the member's number and a ready-made text, for example: "Hi Juan, your Iron Republic Gym membership ends on Dec 3. Renew at the front desk. Salamat!" The owner taps Send and it uses their own load.
- Record that a reminder was sent (date and who), so staff don't send it twice.
- "Send reminder" appears on the Members "Expiring" filter, the member profile and the Dashboard, not only Reports.
- Phase 2 (later): automatic SMS through a provider, once registered; the cost goes into the subscription price.
