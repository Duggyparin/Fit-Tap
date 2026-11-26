# Testing the database rules

Checks for `supabase/migrations/20261126000000_fittap_schema.sql`. Run them on a
**new test project** after applying the migration, never on a project with real
members.

## 1. Rules check (SQL editor)

Paste the whole script into **SQL Editor** and press **Run**.

- It creates test gyms, accounts and members, acts as each role, and records
  whether each rule held.
- It **always ends with an error message on purpose**. The message is the
  report (`PASS` / `FAIL` per line), and raising it undoes every change, so
  nothing is left behind.
- If the editor warns "This query creates tables without enabling Row Level
  Security", choose **Run without RLS**. The warning is about the two scratch
  tables in `fittap_test`, which are undone at the end; turning RLS on for them
  would make the checks fail for the wrong reason.
- If the editor then says a transaction is still open, run `rollback;`.
- If the first `insert into auth.users` is refused, create five users in
  **Authentication > Users** (any emails), and replace the five `b0000000-...`
  ids in the script with theirs.

What it checks:

| Rule | Check |
|---|---|
| Same hash as the check-in function | `abc` and a 48-character token hash to the same values as `hash_test.ts` |
| An owner cannot see another gym | Owner A sees 0 members of gym B |
| Staff cannot see old payments | Staff sees no payment from before today; the latest one only through `member_latest_payment` |
| The browser cannot write tables | A direct `insert into walk_in` is refused |
| A suspended gym cannot write | Owner C's walk-in is refused with `gym_suspended`, but reading still works |
| "View as gym" is read-only | The platform admin cannot record a walk-in |
| The website cannot call the scanner functions | `scanner_tap` / `scanner_heartbeat` refused for signed-in users and logged-out visitors |
| Token hash is never readable | Selecting `scanner.token_hash` is refused |
| A stock card tap is unknown (#11) | `scanner_tap` with a stock card returns `unknown` |
| Inclusive end date | A Daily pass ends the day it starts; days left counted to the last day |
| Freeze rule (#15) | A frozen membership is denied with `frozen` |
| Token round trip | A token from `admin_register_scanner` is accepted by `scanner_heartbeat` |
| Link results saved | Tapping another member's card in link mode saves `already_linked` on the request, which stays pending |
| Heartbeat reply (#28, #12) | `pending_link` is true while a link request waits |

The script is in [supabase/tests/rules_check.sql](../supabase/tests/rules_check.sql): open it, press **Ctrl+A** and **Ctrl+C**, and paste it into a new SQL Editor snippet.

## 2. Hash test (Deno)

If Deno is installed: `deno test supabase/functions/checkin/hash_test.ts`. It
uses the same two inputs as the first two SQL checks, so both sides agree.

## 3. End to end, after deploying the check-in function

1. In the SQL editor, make a test gym and scanner and copy the token it
   prints (the hash is stored, the token is shown once):

   ```sql
   with g as (
     insert into public.gym (gym_name, slug) values ('Curl Test Gym', 'curl-test-gym')
     returning gym_id
   ), t as (select * from public.new_scanner_token())
   insert into public.scanner (gym_id, scanner_name, token_hash, hardware_status)
   select g.gym_id, 'Curl test', t.token_hash, 'at_gym' from g, t
   returning scanner_id, (select token from t) as token_shown_once;
   ```

2. Send a heartbeat (replace the two placeholders; never paste a real token
   into a chat or commit).

   PowerShell:

   ```powershell
   Invoke-RestMethod -Method Post -Uri "https://<project-ref>.supabase.co/functions/v1/checkin" -Headers @{ "x-scanner-token" = "<token>" } -ContentType "application/json" -Body '{"type":"heartbeat","firmware":"test"}'
   ```

   Git Bash:

   ```bash
   curl -s -X POST "https://<project-ref>.supabase.co/functions/v1/checkin" \
     -H "Content-Type: application/json" -H "x-scanner-token: <token>" \
     -d '{"type":"heartbeat","firmware":"test"}'
   ```

   Expected: `ok = true, pending_link = false, name = ""`. A wrong token gives
   HTTP 401 `{"error":"unauthorized"}`.

3. Remove the test scanner and gym afterwards:

   ```sql
   delete from public.scanner where scanner_name = 'Curl test';
   delete from public.gym where slug = 'curl-test-gym';
   ```
