# Testing the database rules

Checks for `supabase/migrations/20261126000000_fittap_schema.sql`. Run them on a
**new test project** after applying the migration, never on a project with real
members.

## 1. Rules check (SQL editor)

Paste the whole script below into **SQL Editor** and press **Run**.

- It creates test gyms, accounts and members, acts as each role, and records
  whether each rule held.
- It **always ends with an error message on purpose**. The message is the
  report (`PASS` / `FAIL` per line), and raising it undoes every change, so
  nothing is left behind.
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

```sql
begin;

-- ---------- Test data (all undone at the end) ----------
create schema fittap_test;
create table fittap_test.results (
  name   text,
  passed boolean,
  detail text,
  at     timestamptz default clock_timestamp()
);
create table fittap_test.vars (k text primary key, v text);
grant usage on schema fittap_test to authenticated, anon, service_role;
grant all on all tables in schema fittap_test to authenticated, anon, service_role;

insert into auth.users (id, email, aud, role) values
  ('b0000000-0000-4000-8000-000000000001', 'fittap-test-owner-a@example.com', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-000000000002', 'fittap-test-staff-a@example.com', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-000000000003', 'fittap-test-owner-b@example.com', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-000000000004', 'fittap-test-owner-c@example.com', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-000000000005', 'fittap-test-admin@example.com',   'authenticated', 'authenticated');

insert into public.gym (gym_id, gym_name, slug, status, next_member_number) values
  ('a0000000-0000-4000-8000-000000000001', 'Test Gym A', 'fittap-test-a', 'active', 4),
  ('a0000000-0000-4000-8000-000000000002', 'Test Gym B', 'fittap-test-b', 'active', 2),
  ('a0000000-0000-4000-8000-000000000003', 'Test Gym C', 'fittap-test-c', 'suspended', 1);

insert into public.app_user (user_id, gym_id, role, display_name, email) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'owner', 'Owner A', 'fittap-test-owner-a@example.com'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'staff', 'Staff A', 'fittap-test-staff-a@example.com'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'owner', 'Owner B', 'fittap-test-owner-b@example.com'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'owner', 'Owner C', 'fittap-test-owner-c@example.com'),
  ('b0000000-0000-4000-8000-000000000005', null, 'platform_admin', 'Admin', 'fittap-test-admin@example.com');

insert into public.plan (plan_id, gym_id, plan_name, duration_days, price_centavos) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Monthly', 30, 100000),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Daily', 1, 10000),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'Monthly', 30, 90000);

insert into public.member (member_id, gym_id, member_number, full_name, phone, photo_url, consent_at, consent_version) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 1, 'Alma Test',  '0917 000 0001', 'a0000000-0000-4000-8000-000000000001/1.jpg', now(), 'test'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 2, 'Ben Test',   '0917 000 0002', 'a0000000-0000-4000-8000-000000000001/2.jpg', now(), 'test'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 3, 'Cora Test',  '0917 000 0003', 'a0000000-0000-4000-8000-000000000001/3.jpg', now(), 'test'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 1, 'Dino Other', '0917 000 0004', 'a0000000-0000-4000-8000-000000000002/1.jpg', now(), 'test');

-- Alma: active, 19 days left. Ben: frozen since yesterday. Cora: ended a month ago.
insert into public.membership (membership_id, gym_id, member_id, plan_id, start_date, end_date, status, frozen_on) values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', public.manila_today() - 10, public.manila_today() + 19, 'active', null),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', public.manila_today() - 5,  public.manila_today() + 20, 'frozen', public.manila_today() - 1),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', public.manila_today() - 60, public.manila_today() - 31, 'active', null),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000003', public.manila_today(), public.manila_today() + 29, 'active', null);

insert into public.payment (gym_id, membership_id, amount_centavos, method, paid_at) values
  ('a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 100000, 'cash', now()),
  ('a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003', 100000, 'cash', now() - interval '60 days'),
  ('a0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000004', 90000, 'cash', now());

insert into public.scanner (scanner_id, gym_id, scanner_name, token_hash, hardware_status, is_default) values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Test door',
   encode(extensions.digest('test-token-gym-a', 'sha256'), 'hex'), 'at_gym', true);

insert into public.nfc_card (gym_id, member_id, card_uid, card_number, status) values
  ('a0000000-0000-4000-8000-000000000001', null, '04AAAAAAAAAAAA', 'T-0001', 'stock'),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', '04BBBBBBBBBBBB', 'T-0002', 'active'),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '04CCCCCCCCCCCC', 'T-0003', 'active');

insert into fittap_test.vars values
  ('hash_a', encode(extensions.digest('test-token-gym-a', 'sha256'), 'hex')),
  ('hash_wrong', encode(extensions.digest('wrong-token', 'sha256'), 'hex'));

-- ---------- Hash format (same vectors as supabase/functions/checkin/hash_test.ts) ----------
insert into fittap_test.results (name, passed, detail)
select 'Database hash of "abc" matches the check-in function',
       encode(extensions.digest('abc', 'sha256'), 'hex')
         = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', null;
insert into fittap_test.results (name, passed, detail)
select 'Database hash of a 48-character token matches the check-in function',
       encode(extensions.digest('0123456789abcdef0123456789abcdef0123456789abcdef', 'sha256'), 'hex')
         = '34c26e154bab5ff544f29f8747a691d0fedd3b8a51655f27d0f585b1b2753970', null;

-- ---------- Owner A ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

insert into fittap_test.results (name, passed, detail)
select 'Owner A cannot see gym B members', count(*) = 0, count(*) || ' visible'
from public.member where gym_id = 'a0000000-0000-4000-8000-000000000002';
insert into fittap_test.results (name, passed, detail)
select 'Owner A sees their own members', count(*) = 3, count(*) || ' visible' from public.member;
insert into fittap_test.results (name, passed, detail)
select 'Owner A sees all their payments, old ones too', count(*) = 2, count(*) || ' visible' from public.payment;

do $$
begin
  insert into public.walk_in (gym_id, amount_centavos, method)
  values ('a0000000-0000-4000-8000-000000000001', 10000, 'cash');
  insert into fittap_test.results values ('The browser cannot write tables directly', false, 'the insert was accepted');
exception when others then
  insert into fittap_test.results values ('The browser cannot write tables directly', sqlstate = '42501', sqlerrm);
end $$;

do $$
declare
  v_member uuid;
  v_ms     public.membership;
begin
  v_member := public.register_member('Daily Tester', '0917 000 0009', null,
    'a0000000-0000-4000-8000-000000000001/daily.jpg', 'test',
    'c0000000-0000-4000-8000-000000000002', 'cash', null);
  select * into v_ms from public.membership where member_id = v_member;
  insert into fittap_test.results values ('A Daily pass ends the day it starts (end_date inclusive)',
    v_ms.end_date = v_ms.start_date, v_ms.start_date || ' to ' || v_ms.end_date);
end $$;

-- ---------- Staff A ----------
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

insert into fittap_test.results (name, passed, detail)
select 'Staff cannot see payments from before today', count(*) = 0, count(*) || ' old payments visible'
from public.payment where not public.is_today_manila(paid_at);
insert into fittap_test.results (name, passed, detail)
select 'Staff can see today''s payments', count(*) >= 1, count(*) || ' visible' from public.payment;

do $$
declare
  v_pay public.payment;
begin
  v_pay := public.member_latest_payment('d0000000-0000-4000-8000-000000000003');
  insert into fittap_test.results values ('Staff can see a member''s latest payment through the function',
    v_pay.payment_id is not null, coalesce(v_pay.paid_at::text, 'none'));
end $$;

do $$
begin
  perform public.anonymize_member('d0000000-0000-4000-8000-000000000003');
  insert into fittap_test.results values ('Staff cannot anonymize (owner only)', false, 'it was allowed');
exception when others then
  insert into fittap_test.results values ('Staff cannot anonymize (owner only)', sqlerrm = 'not_allowed', sqlerrm);
end $$;

-- ---------- Owner C (suspended gym) ----------
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000004","role":"authenticated"}', true);

insert into fittap_test.results (name, passed, detail)
select 'A suspended gym can still read', count(*) = 1, count(*) || ' gym rows' from public.gym;

do $$
begin
  perform public.record_walk_in(null, 10000, 'cash', null);
  insert into fittap_test.results values ('A suspended gym cannot write', false, 'the walk-in was saved');
exception when others then
  insert into fittap_test.results values ('A suspended gym cannot write', sqlerrm = 'gym_suspended', sqlerrm);
end $$;

-- ---------- Platform admin ----------
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000005","role":"authenticated"}', true);

insert into fittap_test.results (name, passed, detail)
select 'The admin can read every gym', count(*) >= 3, count(*) || ' gyms' from public.gym;

do $$
begin
  perform public.record_walk_in(null, 10000, 'cash', null);
  insert into fittap_test.results values ('The admin cannot write gym data ("View as gym" is read-only)', false, 'the walk-in was saved');
exception when others then
  insert into fittap_test.results values ('The admin cannot write gym data ("View as gym" is read-only)', sqlerrm = 'not_allowed', sqlerrm);
end $$;

do $$
begin
  perform s.token_hash from public.scanner s limit 1;
  insert into fittap_test.results values ('Scanner token hashes cannot be read from the browser', false, 'token_hash was readable');
exception when others then
  insert into fittap_test.results values ('Scanner token hashes cannot be read from the browser', sqlstate = '42501', sqlerrm);
end $$;

do $$
declare
  v_reply jsonb;
begin
  v_reply := public.admin_register_scanner('a0000000-0000-4000-8000-000000000001', 'Second box');
  insert into fittap_test.vars values ('token', v_reply ->> 'token'), ('scanner', v_reply ->> 'scanner_id');
  insert into fittap_test.results values ('The admin registers a scanner and gets a 48-character token',
    length(v_reply ->> 'token') = 48, null);
end $$;

-- ---------- The website cannot call the scanner functions ----------
do $$
begin
  perform public.scanner_tap('x', '04AAAAAAAAAAAA');
  insert into fittap_test.results values ('A signed-in user cannot call scanner_tap', false, 'it ran');
exception when others then
  insert into fittap_test.results values ('A signed-in user cannot call scanner_tap', sqlstate = '42501', sqlerrm);
end $$;

do $$
begin
  perform public.scanner_heartbeat('x', '1.4.0');
  insert into fittap_test.results values ('A signed-in user cannot call scanner_heartbeat', false, 'it ran');
exception when others then
  insert into fittap_test.results values ('A signed-in user cannot call scanner_heartbeat', sqlstate = '42501', sqlerrm);
end $$;

reset role;
set local role anon;

do $$
begin
  perform public.scanner_tap('x', '04AAAAAAAAAAAA');
  insert into fittap_test.results values ('A logged-out visitor cannot call scanner_tap', false, 'it ran');
exception when others then
  insert into fittap_test.results values ('A logged-out visitor cannot call scanner_tap', sqlstate = '42501', sqlerrm);
end $$;

do $$
begin
  perform 1 from public.member limit 1;
  insert into fittap_test.results values ('A logged-out visitor cannot read members', false, 'it was readable');
exception when others then
  insert into fittap_test.results values ('A logged-out visitor cannot read members', sqlstate = '42501', sqlerrm);
end $$;

-- ---------- The token from admin_register_scanner is stored as its hash ----------
reset role;
insert into fittap_test.vars
select 'token_hash', encode(extensions.digest(v, 'sha256'), 'hex') from fittap_test.vars where k = 'token';

insert into fittap_test.results (name, passed, detail)
select 'The stored hash is SHA-256 of the token, lowercase hex',
       s.token_hash = (select v from fittap_test.vars where k = 'token_hash'), null
from public.scanner s where s.scanner_id = (select v::uuid from fittap_test.vars where k = 'scanner');

-- ---------- Scanner taps (what the check-in function does) ----------
set local role service_role;

do $$
declare
  v_hash  text := (select v from fittap_test.vars where k = 'hash_a');
  v_reply jsonb;
begin
  v_reply := public.scanner_tap(v_hash, '04AAAAAAAAAAAA');
  insert into fittap_test.results values ('A stock card tap returns unknown (#11)',
    v_reply ->> 'mode' = 'checkin' and v_reply ->> 'reason' = 'unknown', v_reply::text);

  v_reply := public.scanner_tap(v_hash, '04CCCCCCCCCCCC');
  insert into fittap_test.results values ('An active member is allowed, with days left to the last day',
    (v_reply ->> 'allowed')::boolean and (v_reply ->> 'days_left')::int = 19, v_reply::text);

  v_reply := public.scanner_tap(v_hash, '04BBBBBBBBBBBB');
  insert into fittap_test.results values ('A frozen membership is denied with reason frozen (#15)',
    v_reply ->> 'reason' = 'frozen', v_reply::text);

  v_reply := public.scanner_tap((select v from fittap_test.vars where k = 'hash_wrong'), '04CCCCCCCCCCCC');
  insert into fittap_test.results values ('A wrong token is refused',
    v_reply ->> 'error' = 'unauthorized', v_reply::text);

  v_reply := public.scanner_heartbeat((select v from fittap_test.vars where k = 'token_hash'), '1.4.0');
  insert into fittap_test.results values ('A token from admin_register_scanner is accepted',
    (v_reply ->> 'ok')::boolean and not (v_reply ->> 'pending_link')::boolean, v_reply::text);
end $$;

-- ---------- Link mode: results are saved for the website ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare
  v_request public.link_request;
begin
  v_request := public.start_link_request('d0000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001');
  insert into fittap_test.vars values ('request', v_request.request_id::text);
end $$;

reset role;
set local role service_role;

do $$
declare
  v_hash  text := (select v from fittap_test.vars where k = 'hash_a');
  v_reply jsonb;
begin
  v_reply := public.scanner_heartbeat(v_hash, '1.4.0');
  insert into fittap_test.results values ('The heartbeat says a link request is waiting (#28, #12)',
    (v_reply ->> 'pending_link')::boolean, v_reply::text);

  v_reply := public.scanner_tap(v_hash, '04CCCCCCCCCCCC');  -- Alma's card, for Cora
  insert into fittap_test.results values ('Link mode refuses another member''s card',
    v_reply ->> 'mode' = 'link' and v_reply ->> 'reason' = 'already_linked', v_reply::text);
end $$;

reset role;
insert into fittap_test.results (name, passed, detail)
select 'The link result is saved on the request, which stays open',
       l.result = 'already_linked' and l.status = 'pending', l.status || ' / ' || coalesce(l.result, 'no result')
from public.link_request l where l.request_id = (select v::uuid from fittap_test.vars where k = 'request');

-- ---------- Report (raising it undoes everything above) ----------
do $$
declare
  v_report text;
  v_failed integer;
  v_total  integer;
begin
  select count(*) filter (where passed is not true),
         count(*),
         string_agg(case when passed is true then 'PASS  ' else 'FAIL  ' end || name
                    || case when passed is true then '' else coalesce('  [' || detail || ']', '') end,
                    E'\n' order by at)
  into v_failed, v_total, v_report
  from fittap_test.results;
  raise exception E'FitTap schema checks: % of % failed\n\n%\n\n(This error is on purpose: it undoes all test data.)',
    v_failed, v_total, v_report;
end $$;
```

## 2. Hash test (Deno)

If Deno is installed: `deno test supabase/functions/checkin/hash_test.ts`. It
uses the same two inputs as the first two SQL checks, so both sides agree.

## 3. End to end, after deploying the check-in function

1. In the SQL editor, make a test scanner for a test gym and copy the token it
   prints (the hash is stored, the token is shown once):

   ```sql
   with t as (select * from public.new_scanner_token())
   insert into public.scanner (gym_id, scanner_name, token_hash, hardware_status)
   select '<test gym_id>', 'Curl test', t.token_hash, 'at_gym' from t
   returning scanner_id, (select token from t) as token_shown_once;
   ```

2. From Git Bash (replace the two placeholders; never paste a real token into
   a chat or commit):

   ```bash
   curl -s -X POST "https://<project-ref>.supabase.co/functions/v1/checkin" \
     -H "Content-Type: application/json" -H "x-scanner-token: <token>" \
     -d '{"type":"heartbeat","firmware":"test"}'
   ```

   Expected: `{"ok":true,"pending_link":false,"name":""}`. A wrong token gives
   HTTP 401 `{"error":"unauthorized"}`.

3. Revoke the test scanner afterwards:
   `update public.scanner set status = 'disabled', token_hash = null where scanner_name = 'Curl test';`
