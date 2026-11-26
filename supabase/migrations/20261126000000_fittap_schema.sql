-- =====================================================================
-- FitTap: full database schema (replaces the scanner prototype schema.sql)
--
-- One clean migration for a NEW Supabase project. Apply with
--   supabase db push      (or paste into the SQL editor on an empty project)
--
-- Rules this file follows:
-- - Every gym-owned row has gym_id. The browser only READS tables, through
--   Row Level Security. Every WRITE goes through a database function that
--   checks the caller's account, role and gym in one transaction.
-- - Dates are compared in Asia/Manila. end_date is the LAST day a member may
--   enter (inclusive): end_date = start_date + duration_days - 1.
-- - Every SECURITY DEFINER function sets search_path = '' and names schemas
--   in full. EXECUTE is granted only to the roles that need it (end of file).
-- - The scanner never gets a database key: the check-in Edge Function hashes
--   the scanner token and calls scanner_tap / scanner_heartbeat, which only
--   service_role may execute.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
-- Nightly anonymizing job (scheduled at the end of this file).
create extension if not exists pg_cron;

-- Today's date in the Philippines.
create or replace function public.manila_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Manila')::date
$$;

create or replace function public.is_today_manila(p_at timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select (p_at at time zone 'Asia/Manila')::date = public.manila_today()
$$;

-- =====================================================================
-- Tables
-- =====================================================================

create table public.gym (
  gym_id                  uuid primary key default gen_random_uuid(),
  gym_name                text not null check (length(trim(gym_name)) > 0),
  slug                    text not null unique,
  logo_url                text,
  brand_color             text,
  timezone                text not null default 'Asia/Manila',
  status                  text not null default 'trial'
                          check (status in ('trial', 'active', 'suspended')),
  city                    text not null default '',
  -- Subscription to FitTap. Grace and overdue are worked out from next_due_date.
  monthly_fee_centavos    integer not null default 0 check (monthly_fee_centavos >= 0),
  next_due_date           date,                       -- null while on trial
  billing_cycle           text not null default 'monthly'
                          check (billing_cycle in ('monthly', 'annual')),
  annual_discount_percent integer not null default 10
                          check (annual_discount_percent between 0 and 50),
  setup_fee_centavos      integer not null default 0 check (setup_fee_centavos >= 0),
  setup_fee_paid_at       timestamptz,
  -- Settings
  privacy_contact_name    text,
  privacy_contact_detail  text,
  walk_in_default_centavos integer not null default 10000 check (walk_in_default_centavos > 0),
  expiring_days           integer not null default 7 check (expiring_days between 1 and 60),
  qr_gcash_path           text,  -- file path in the payment-qr bucket
  qr_maya_path            text,
  next_member_number      integer not null default 1,
  created_at              timestamptz not null default now()
);

create table public.app_user (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  gym_id       uuid references public.gym (gym_id),
  role         text not null check (role in ('owner', 'staff', 'platform_admin')),
  display_name text not null,
  email        text not null,
  is_active    boolean not null default true,
  invited_at   timestamptz,
  accepted_at  timestamptz,
  -- Only the platform admin has no gym.
  check ((role = 'platform_admin') = (gym_id is null))
);
create unique index app_user_email_unique on public.app_user (lower(email));
create index app_user_gym on public.app_user (gym_id);

create table public.plan (
  plan_id        uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references public.gym (gym_id),
  plan_name      text not null check (length(trim(plan_name)) > 0),
  duration_days  integer not null check (duration_days between 1 and 3650),
  price_centavos integer not null check (price_centavos > 0),
  is_active      boolean not null default true,  -- retired plans stay for history
  created_at     timestamptz not null default now(),
  unique (gym_id, plan_id)
);
create unique index plan_name_unique on public.plan (gym_id, lower(plan_name));

create table public.scanner (
  scanner_id       uuid primary key default gen_random_uuid(),
  gym_id           uuid references public.gym (gym_id),     -- null = spare or in repair
  scanner_name     text not null,
  -- SHA-256 of the scanner token, lowercase hex. The website can never read it.
  token_hash       text unique check (token_hash ~ '^[0-9a-f]{64}$'),
  firmware_version text,
  last_seen_at     timestamptz,
  status           text not null default 'active' check (status in ('active', 'disabled')),
  hardware_status  text not null default 'in_stock'
                   check (hardware_status in ('in_stock', 'at_gym', 'in_repair')),
  is_default       boolean not null default false,
  created_at       timestamptz not null default now(),
  check (hardware_status <> 'at_gym' or gym_id is not null),
  check (not is_default or gym_id is not null)
);
create unique index scanner_one_default on public.scanner (gym_id) where is_default;

create table public.member (
  member_id       uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gym (gym_id),
  member_number   integer not null,           -- "Former member #12" after anonymizing
  full_name       text not null check (length(trim(full_name)) >= 2),
  phone           text,
  email           text,
  photo_url       text,                       -- file path in the member-photos bucket
  consent_at      timestamptz not null,
  consent_version text not null,              -- the privacy notice version accepted
  status          text not null default 'active' check (status in ('active', 'archived')),
  anonymized_at   timestamptz,
  created_at      timestamptz not null default now(),
  unique (gym_id, member_number),
  unique (gym_id, member_id),
  -- Phone (09XX XXX XXXX) and photo are required until the member is anonymized.
  check (
    anonymized_at is not null
    or (phone ~ '^09[0-9]{2} [0-9]{3} [0-9]{4}$' and photo_url is not null)
  )
);

create table public.card_batch (
  batch_id       uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references public.gym (gym_id),
  quantity       integer not null check (quantity > 0),
  chip_type      text not null default 'NTAG215',
  design_url     text,
  price_centavos integer not null default 0 check (price_centavos >= 0),
  status         text not null default 'ordered'
                 check (status in ('ordered', 'printing', 'shipped', 'received')),
  ordered_at     timestamptz not null default now(),
  unique (gym_id, batch_id)
);

create table public.nfc_card (
  card_id     uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references public.gym (gym_id),
  member_id   uuid,
  batch_id    uuid,
  -- Factory UID, uppercase hex: 4, 7 or 10 bytes.
  card_uid    text not null unique
              check (card_uid ~ '^[0-9A-F]{8}([0-9A-F]{6}([0-9A-F]{6})?)?$'),
  card_number text,                           -- printed on branded cards
  status      text not null default 'stock'
              check (status in ('stock', 'active', 'lost', 'disabled')),
  assigned_at timestamptz,
  foreign key (gym_id, member_id) references public.member (gym_id, member_id),
  foreign key (gym_id, batch_id) references public.card_batch (gym_id, batch_id),
  unique (gym_id, card_number),
  check (status <> 'active' or member_id is not null)
);
-- A member has at most one working card.
create unique index nfc_card_one_active on public.nfc_card (member_id) where status = 'active';

create table public.membership (
  membership_id uuid primary key default gen_random_uuid(),
  gym_id        uuid not null,
  member_id     uuid not null,
  plan_id       uuid not null,
  start_date    date not null,
  end_date      date not null,                -- last day of entry (inclusive)
  -- 'expired' is never stored: it is end_date < today in Manila.
  status        text not null default 'active' check (status in ('active', 'frozen', 'cancelled')),
  frozen_on     date,
  frozen_at     timestamptz,
  frozen_reason text,
  frozen_by     uuid references public.app_user (user_id) on delete set null,
  created_by    uuid references public.app_user (user_id) on delete set null,
  created_at    timestamptz not null default now(),
  foreign key (gym_id, member_id) references public.member (gym_id, member_id),
  foreign key (gym_id, plan_id) references public.plan (gym_id, plan_id),
  unique (gym_id, membership_id),
  check (end_date >= start_date),
  check (status <> 'frozen' or frozen_on is not null)
);
create index membership_member on public.membership (member_id, end_date);

create table public.payment (
  payment_id      uuid primary key default gen_random_uuid(),
  gym_id          uuid not null,
  membership_id   uuid not null,
  amount_centavos integer not null check (amount_centavos > 0),
  method          text not null check (method in ('cash', 'gcash', 'maya', 'other')),
  reference_no    text,
  paid_at         timestamptz not null default now(),
  recorded_by     uuid references public.app_user (user_id) on delete set null,
  foreign key (gym_id, membership_id) references public.membership (gym_id, membership_id),
  check (method not in ('gcash', 'maya') or length(trim(coalesce(reference_no, ''))) > 0)
);
create index payment_gym_time on public.payment (gym_id, paid_at desc);

create table public.checkin (
  checkin_id uuid primary key default gen_random_uuid(),  -- the scanner may send it (offline mode)
  gym_id     uuid not null references public.gym (gym_id),
  member_id  uuid,                                        -- null for unknown cards
  scanner_id uuid references public.scanner (scanner_id),
  card_uid   text,
  result     text not null check (result in ('allowed', 'expired', 'frozen', 'unknown', 'disabled')),
  source     text not null check (source in ('online', 'offline', 'manual')),
  scanned_at timestamptz not null default now(),          -- device time
  synced_at  timestamptz not null default now(),          -- server time
  foreign key (gym_id, member_id) references public.member (gym_id, member_id),
  -- A manual check-in is a known member let in by staff; a tap needs a scanner and a card.
  check (
    (source = 'manual' and scanner_id is null and card_uid is null
      and member_id is not null and result = 'allowed')
    or (source <> 'manual' and scanner_id is not null and card_uid is not null)
  )
);
create index checkin_gym_time on public.checkin (gym_id, scanned_at desc);
create index checkin_scanner_time on public.checkin (scanner_id, scanned_at desc);

create table public.link_request (
  request_id   uuid primary key default gen_random_uuid(),
  gym_id       uuid not null,
  scanner_id   uuid not null references public.scanner (scanner_id),
  member_id    uuid not null,
  requested_by uuid references public.app_user (user_id) on delete set null,
  status       text not null default 'pending'
               check (status in ('pending', 'done', 'expired', 'cancelled')),
  -- What happened to the last card tapped. A refused card leaves the request
  -- pending, so another card can be tried.
  result       text check (result in ('linked', 'already_linked', 'other_gym', 'blocked')),
  card_uid     text,
  expires_at   timestamptz not null default now() + interval '60 seconds',
  created_at   timestamptz not null default now(),
  foreign key (gym_id, member_id) references public.member (gym_id, member_id),
  check (status <> 'done' or (result = 'linked' and card_uid is not null))
);
create unique index link_request_one_pending on public.link_request (scanner_id)
  where status = 'pending';

create table public.walk_in (
  walkin_id       uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gym (gym_id),
  guest_name      text,
  amount_centavos integer not null check (amount_centavos > 0),
  method          text not null check (method in ('cash', 'gcash', 'maya', 'other')),
  reference_no    text,
  visited_at      timestamptz not null default now(),
  recorded_by     uuid references public.app_user (user_id) on delete set null,
  check (method not in ('gcash', 'maya') or length(trim(coalesce(reference_no, ''))) > 0)
);
create index walk_in_gym_time on public.walk_in (gym_id, visited_at desc);

-- What gyms pay FitTap.
create table public.gym_payment (
  gym_payment_id  uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gym (gym_id),
  kind            text not null check (kind in ('subscription', 'setup')),
  amount_centavos integer not null check (amount_centavos > 0),
  method          text not null check (method in ('cash', 'gcash', 'maya', 'other')),
  reference_no    text,
  paid_at         timestamptz not null default now(),
  covers_due_date date,
  recorded_by     uuid references public.app_user (user_id) on delete set null
);

-- Platform admin actions. Append only; never contains tokens.
create table public.audit_log (
  audit_id      uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action        text not null,
  gym_id        uuid references public.gym (gym_id),
  detail        text not null default '',
  created_at    timestamptz not null default now()
);
create index audit_log_time on public.audit_log (created_at desc);

-- Owner and staff actions in a gym. Append only; never contains a removed
-- member's personal details. actor_user_id null = done by the system.
create table public.gym_audit_log (
  gym_audit_id  uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gym (gym_id),
  actor_user_id uuid,
  action        text not null,
  detail        text not null default '',
  created_at    timestamptz not null default now()
);
create index gym_audit_log_time on public.gym_audit_log (gym_id, created_at desc);

-- Logs can only grow.
create or replace function public.refuse_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'log_is_append_only' using errcode = '42501';
end
$$;

create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function public.refuse_change();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.refuse_change();
create trigger gym_audit_log_append_only before update or delete on public.gym_audit_log
  for each row execute function public.refuse_change();
create trigger gym_audit_log_no_truncate before truncate on public.gym_audit_log
  for each statement execute function public.refuse_change();

-- =====================================================================
-- Who is calling? (used by Row Level Security and the functions below)
-- =====================================================================

-- The caller's gym, if they are an active owner or staff member.
create or replace function public.my_gym_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.gym_id from public.app_user u
  where u.user_id = auth.uid() and u.is_active and u.role in ('owner', 'staff')
$$;

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.role from public.app_user u where u.user_id = auth.uid() and u.is_active
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_user u
    where u.user_id = auth.uid() and u.is_active and u.role = 'platform_admin'
  )
$$;

-- For storage policies: may the caller write files in this gym's folder?
create or replace function public.can_write_gym_files(p_folder text, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_user u
    join public.gym g on g.gym_id = u.gym_id
    where u.user_id = auth.uid()
      and u.is_active
      and u.role = any (p_roles)
      and g.status <> 'suspended'
      and u.gym_id::text = p_folder
  )
$$;

-- Internal: the caller as an active owner or staff member of a gym that is
-- not suspended. The platform admin has no gym, so "View as gym" can never
-- write.
create or replace function public.require_gym_writer(p_roles text[])
returns public.app_user
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
begin
  select * into v_user from public.app_user u
  where u.user_id = auth.uid() and u.is_active and u.role = any (p_roles) and u.gym_id is not null;
  if not found then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if exists (select 1 from public.gym g where g.gym_id = v_user.gym_id and g.status = 'suspended') then
    raise exception 'gym_suspended' using errcode = '42501';
  end if;
  return v_user;
end
$$;

-- Internal: like require_gym_writer, but reading is allowed while suspended.
create or replace function public.require_gym_reader(p_roles text[])
returns public.app_user
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
begin
  select * into v_user from public.app_user u
  where u.user_id = auth.uid() and u.is_active and u.role = any (p_roles) and u.gym_id is not null;
  if not found then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return v_user;
end
$$;

create or replace function public.require_admin()
returns public.app_user
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
begin
  select * into v_user from public.app_user u
  where u.user_id = auth.uid() and u.is_active and u.role = 'platform_admin';
  if not found then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return v_user;
end
$$;

create or replace function public.log_admin(p_action text, p_gym_id uuid, p_detail text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_user_id, action, gym_id, detail)
  values (auth.uid(), p_action, p_gym_id, coalesce(p_detail, ''))
$$;

create or replace function public.log_gym(p_gym_id uuid, p_actor uuid, p_action text, p_detail text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.gym_audit_log (gym_id, actor_user_id, action, detail)
  values (p_gym_id, p_actor, p_action, coalesce(p_detail, ''))
$$;

-- "PHP 1,500.00" for log entries.
create or replace function public.peso_text(p_centavos integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'PHP ' || to_char(p_centavos / 100.0, 'FM999,999,990.00')
$$;

-- =====================================================================
-- Membership rules
-- =====================================================================

-- Can this member enter today?
-- - 'frozen' if a frozen membership has started (whatever its end date: the
--   end date moves forward when it is unfrozen). Frozen wins over any other
--   membership covering today.
-- - 'allowed' if an active membership covers today.
-- - otherwise 'expired'.
-- last_end is the latest end date of the active memberships still running,
-- so a member who renewed early is not counted as expiring.
create or replace function public.member_access(p_member_id uuid, p_today date)
returns table (state text, last_end date)
language sql
stable
set search_path = ''
as $$
  select
    case
      when exists (
        select 1 from public.membership m
        where m.member_id = p_member_id and m.status = 'frozen' and m.start_date <= p_today
      ) then 'frozen'
      when exists (
        select 1 from public.membership m
        where m.member_id = p_member_id and m.status = 'active'
          and m.start_date <= p_today and m.end_date >= p_today
      ) then 'allowed'
      else 'expired'
    end,
    (
      select max(m.end_date) from public.membership m
      where m.member_id = p_member_id and m.status = 'active' and m.end_date >= p_today
    )
$$;

-- Where a renewal starts: the day after the latest active or frozen membership
-- that has not ended (no lost days), otherwise today.
create or replace function public.renewal_start(p_member_id uuid, p_today date)
returns date
language sql
stable
set search_path = ''
as $$
  select coalesce(max(m.end_date) + 1, p_today)
  from public.membership m
  where m.member_id = p_member_id and m.status <> 'cancelled' and m.end_date >= p_today
$$;

-- =====================================================================
-- Website functions: owner and staff
-- =====================================================================

-- Saves the member (with consent), their first membership starting today and
-- the payment, together. The photo is uploaded first to member-photos/<gym_id>/.
create or replace function public.register_member(
  p_full_name       text,
  p_phone           text,
  p_email           text,
  p_photo_path      text,
  p_consent_version text,
  p_plan_id         uuid,
  p_method          text,
  p_reference_no    text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user       public.app_user;
  v_plan       public.plan;
  v_today      date := public.manila_today();
  v_number     integer;
  v_member_id  uuid;
  v_ms_id      uuid;
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);

  select * into v_plan from public.plan p
  where p.plan_id = p_plan_id and p.gym_id = v_user.gym_id and p.is_active;
  if not found then
    raise exception 'plan_not_found';
  end if;
  if p_photo_path is null or p_photo_path not like v_user.gym_id::text || '/%' then
    raise exception 'photo_required';
  end if;
  if length(trim(coalesce(p_consent_version, ''))) = 0 then
    raise exception 'consent_required';
  end if;

  update public.gym g set next_member_number = g.next_member_number + 1
  where g.gym_id = v_user.gym_id
  returning g.next_member_number - 1 into v_number;

  insert into public.member
    (gym_id, member_number, full_name, phone, email, photo_url, consent_at, consent_version)
  values
    (v_user.gym_id, v_number, trim(p_full_name), p_phone, nullif(trim(p_email), ''),
     p_photo_path, now(), trim(p_consent_version))
  returning member_id into v_member_id;

  insert into public.membership (gym_id, member_id, plan_id, start_date, end_date, created_by)
  values (v_user.gym_id, v_member_id, v_plan.plan_id, v_today,
          v_today + v_plan.duration_days - 1, v_user.user_id)
  returning membership_id into v_ms_id;

  insert into public.payment (gym_id, membership_id, amount_centavos, method, reference_no, recorded_by)
  values (v_user.gym_id, v_ms_id, v_plan.price_centavos, p_method,
          case when p_method in ('gcash', 'maya') then nullif(trim(p_reference_no), '') end,
          v_user.user_id);

  return v_member_id;
end
$$;

-- Saves a renewal and its payment. The start date follows the renewal rule.
create or replace function public.renew_membership(
  p_member_id       uuid,
  p_plan_id         uuid,
  p_amount_centavos integer,
  p_method          text,
  p_reference_no    text
)
returns public.membership
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  public.app_user;
  v_plan  public.plan;
  v_today date := public.manila_today();
  v_start date;
  v_ms    public.membership;
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);

  -- Locking the member stops two renewals from overlapping.
  perform 1 from public.member m
  where m.member_id = p_member_id and m.gym_id = v_user.gym_id
    and m.status = 'active' and m.anonymized_at is null
  for update;
  if not found then
    raise exception 'member_not_found';
  end if;

  select * into v_plan from public.plan p
  where p.plan_id = p_plan_id and p.gym_id = v_user.gym_id and p.is_active;
  if not found then
    raise exception 'plan_not_found';
  end if;

  v_start := public.renewal_start(p_member_id, v_today);

  insert into public.membership (gym_id, member_id, plan_id, start_date, end_date, created_by)
  values (v_user.gym_id, p_member_id, v_plan.plan_id, v_start,
          v_start + v_plan.duration_days - 1, v_user.user_id)
  returning * into v_ms;

  insert into public.payment (gym_id, membership_id, amount_centavos, method, reference_no, recorded_by)
  values (v_user.gym_id, v_ms.membership_id, p_amount_centavos, p_method,
          case when p_method in ('gcash', 'maya') then nullif(trim(p_reference_no), '') end,
          v_user.user_id);

  return v_ms;
end
$$;

-- A member let in by staff. The server checks the membership itself.
create or replace function public.manual_checkin(p_member_id uuid)
returns public.checkin
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    public.app_user;
  v_state   text;
  v_checkin public.checkin;
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);

  perform 1 from public.member m
  where m.member_id = p_member_id and m.gym_id = v_user.gym_id
    and m.status = 'active' and m.anonymized_at is null;
  if not found then
    raise exception 'member_not_found';
  end if;

  select a.state into v_state from public.member_access(p_member_id, public.manila_today()) a;
  if v_state <> 'allowed' then
    raise exception 'membership_%', v_state;  -- membership_frozen / membership_expired
  end if;

  insert into public.checkin (gym_id, member_id, result, source)
  values (v_user.gym_id, p_member_id, 'allowed', 'manual')
  returning * into v_checkin;
  return v_checkin;
end
$$;

-- Starts link mode on a scanner for 60 seconds. Only one pending request per
-- scanner: the same member's earlier one is replaced; someone else's means busy.
create or replace function public.start_link_request(p_member_id uuid, p_scanner_id uuid)
returns public.link_request
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    public.app_user;
  v_request public.link_request;
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);

  perform 1 from public.member m
  where m.member_id = p_member_id and m.gym_id = v_user.gym_id
    and m.status = 'active' and m.anonymized_at is null;
  if not found then
    raise exception 'member_not_found';
  end if;
  if exists (select 1 from public.nfc_card c where c.member_id = p_member_id and c.status = 'active') then
    raise exception 'member_has_card';  -- mark the old card lost first
  end if;

  -- Locking the scanner makes these steps one at a time per scanner.
  perform 1 from public.scanner s
  where s.scanner_id = p_scanner_id and s.gym_id = v_user.gym_id
    and s.status = 'active' and s.hardware_status = 'at_gym'
  for update;
  if not found then
    raise exception 'scanner_not_found';
  end if;

  update public.link_request l set status = 'expired'
  where l.scanner_id = p_scanner_id and l.status = 'pending' and l.expires_at <= now();

  if exists (
    select 1 from public.link_request l
    where l.scanner_id = p_scanner_id and l.status = 'pending' and l.member_id <> p_member_id
  ) then
    raise exception 'scanner_busy';
  end if;

  update public.link_request l set status = 'cancelled'
  where l.scanner_id = p_scanner_id and l.status = 'pending' and l.member_id = p_member_id;

  insert into public.link_request (gym_id, scanner_id, member_id, requested_by)
  values (v_user.gym_id, p_scanner_id, p_member_id, v_user.user_id)
  returning * into v_request;
  return v_request;
end
$$;

create or replace function public.cancel_link_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);
  update public.link_request l set status = 'cancelled'
  where l.request_id = p_request_id and l.gym_id = v_user.gym_id and l.status = 'pending';
end
$$;

-- Links a card by its UID (from "recent unknown taps") or by its printed
-- number. Returns: linked, already_linked, other_gym, blocked, not_found.
-- Another gym's card is reported without showing its details.
create or replace function public.link_card(
  p_member_id   uuid,
  p_card_uid    text default null,
  p_card_number text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  public.app_user;
  v_card  public.nfc_card;
  v_found boolean;
  v_uid   text := upper(regexp_replace(coalesce(p_card_uid, ''), '[[:space:]:]', '', 'g'));
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);

  perform 1 from public.member m
  where m.member_id = p_member_id and m.gym_id = v_user.gym_id
    and m.status = 'active' and m.anonymized_at is null
  for update;
  if not found then
    raise exception 'member_not_found';
  end if;
  if exists (select 1 from public.nfc_card c where c.member_id = p_member_id and c.status = 'active') then
    raise exception 'member_has_card';
  end if;

  if v_uid <> '' then
    select * into v_card from public.nfc_card c where c.card_uid = v_uid for update;
    v_found := found;
  elsif length(trim(coalesce(p_card_number, ''))) > 0 then
    -- Printed numbers are only unique within a gym.
    select * into v_card from public.nfc_card c
    where c.gym_id = v_user.gym_id and upper(c.card_number) = upper(trim(p_card_number))
    for update;
    v_found := found;
    if not v_found then
      return 'not_found';
    end if;
  else
    raise exception 'card_required';
  end if;

  if v_found then
    if v_card.gym_id <> v_user.gym_id then
      return 'other_gym';
    elsif v_card.status in ('lost', 'disabled') then
      return 'blocked';
    elsif v_card.status = 'active' then
      return 'already_linked';
    end if;
    update public.nfc_card c
    set member_id = p_member_id, status = 'active', assigned_at = now()
    where c.card_id = v_card.card_id;
  else
    -- A plain card bought by the gym, first seen in "recent unknown taps".
    insert into public.nfc_card (gym_id, member_id, card_uid, status, assigned_at)
    values (v_user.gym_id, p_member_id, v_uid, 'active', now());
  end if;
  return 'linked';
end
$$;

-- "Replace card": the old card stops working at once.
create or replace function public.mark_card_lost(p_member_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  public.app_user;
  v_count integer;
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);
  update public.nfc_card c set status = 'lost'
  where c.member_id = p_member_id and c.gym_id = v_user.gym_id and c.status = 'active';
  get diagnostics v_count = row_count;
  return v_count;
end
$$;

-- The time is always filled in by the server.
create or replace function public.record_walk_in(
  p_guest_name      text,
  p_amount_centavos integer,
  p_method          text,
  p_reference_no    text
)
returns public.walk_in
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
  v_row  public.walk_in;
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);
  insert into public.walk_in (gym_id, guest_name, amount_centavos, method, reference_no, recorded_by)
  values (v_user.gym_id, nullif(trim(p_guest_name), ''), p_amount_centavos, p_method,
          case when p_method in ('gcash', 'maya') then nullif(trim(p_reference_no), '') end,
          v_user.user_id)
  returning * into v_row;
  return v_row;
end
$$;

-- Freezing pauses a running membership (roadmap #15).
create or replace function public.freeze_membership(p_membership_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  public.app_user;
  v_ms    public.membership;
  v_today date := public.manila_today();
  v_num   integer;
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'reason_required';
  end if;

  select * into v_ms from public.membership m
  where m.membership_id = p_membership_id and m.gym_id = v_user.gym_id
  for update;
  if not found or v_ms.status <> 'active' or v_ms.start_date > v_today or v_ms.end_date < v_today then
    raise exception 'cannot_freeze';  -- only a membership covering today
  end if;

  update public.membership m
  set status = 'frozen', frozen_on = v_today, frozen_at = now(),
      frozen_reason = trim(p_reason), frozen_by = v_user.user_id
  where m.membership_id = p_membership_id;

  -- The reason may be about health, so it stays out of the log.
  select mb.member_number into v_num from public.member mb where mb.member_id = v_ms.member_id;
  perform public.log_gym(v_user.gym_id, v_user.user_id, 'membership_frozen', 'Member #' || v_num);
end
$$;

-- Unfreezing moves the end date forward by the days frozen, and moves any
-- renewals queued after it by the same number of days.
create or replace function public.unfreeze_membership(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
  v_ms   public.membership;
  v_days integer;
  v_num  integer;
begin
  v_user := public.require_gym_writer(array['owner', 'staff']);

  select * into v_ms from public.membership m
  where m.membership_id = p_membership_id and m.gym_id = v_user.gym_id and m.status = 'frozen'
  for update;
  if not found then
    raise exception 'not_frozen';
  end if;

  v_days := greatest(public.manila_today() - v_ms.frozen_on, 0);

  update public.membership m
  set start_date = m.start_date + v_days, end_date = m.end_date + v_days
  where m.member_id = v_ms.member_id and m.status <> 'cancelled'
    and m.start_date > v_ms.end_date;

  update public.membership m
  set status = 'active', end_date = m.end_date + v_days,
      frozen_on = null, frozen_at = null, frozen_reason = null, frozen_by = null
  where m.membership_id = p_membership_id;

  select mb.member_number into v_num from public.member mb where mb.member_id = v_ms.member_id;
  perform public.log_gym(v_user.gym_id, v_user.user_id, 'membership_unfrozen',
                         'Member #' || v_num || ': ' || v_days || ' days added');
end
$$;

-- Staff cannot read old payments, but may see a member's latest one.
create or replace function public.member_latest_payment(p_member_id uuid)
returns public.payment
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
  v_row  public.payment;
begin
  v_user := public.require_gym_reader(array['owner', 'staff']);
  select p.* into v_row
  from public.payment p
  join public.membership m on m.membership_id = p.membership_id
  where m.member_id = p_member_id and p.gym_id = v_user.gym_id
  order by p.paid_at desc
  limit 1;
  return v_row;
end
$$;

-- =====================================================================
-- Website functions: owner only
-- =====================================================================

-- Adds a plan (p_plan_id null) or edits one. Existing memberships keep their dates.
create or replace function public.save_plan(
  p_plan_id        uuid,
  p_name           text,
  p_duration_days  integer,
  p_price_centavos integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
  v_id   uuid;
begin
  v_user := public.require_gym_writer(array['owner']);
  if p_plan_id is null then
    insert into public.plan (gym_id, plan_name, duration_days, price_centavos)
    values (v_user.gym_id, trim(p_name), p_duration_days, p_price_centavos)
    returning plan_id into v_id;
  else
    update public.plan p
    set plan_name = trim(p_name), duration_days = p_duration_days, price_centavos = p_price_centavos
    where p.plan_id = p_plan_id and p.gym_id = v_user.gym_id
    returning p.plan_id into v_id;
    if v_id is null then
      raise exception 'plan_not_found';
    end if;
  end if;
  return v_id;
end
$$;

-- Plans are retired, never deleted. One plan must stay on sale.
create or replace function public.set_plan_active(p_plan_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
begin
  v_user := public.require_gym_writer(array['owner']);
  -- Lock the gym's plans so two retirements cannot both pass the check.
  perform 1 from public.plan p where p.gym_id = v_user.gym_id for update;
  if not p_active and not exists (
    select 1 from public.plan p
    where p.gym_id = v_user.gym_id and p.is_active and p.plan_id <> p_plan_id
  ) then
    raise exception 'last_active_plan';
  end if;
  update public.plan p set is_active = p_active
  where p.plan_id = p_plan_id and p.gym_id = v_user.gym_id;
  if not found then
    raise exception 'plan_not_found';
  end if;
end
$$;

create or replace function public.save_settings(
  p_gym_name          text,
  p_walk_in_centavos  integer,
  p_contact_name      text,
  p_contact_detail    text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
begin
  v_user := public.require_gym_writer(array['owner']);
  update public.gym g
  set gym_name = trim(p_gym_name),
      walk_in_default_centavos = p_walk_in_centavos,
      privacy_contact_name = nullif(trim(p_contact_name), ''),
      privacy_contact_detail = nullif(trim(p_contact_detail), '')
  where g.gym_id = v_user.gym_id;
end
$$;

-- Sets the scanner used for linking cards.
create or replace function public.set_default_scanner(p_scanner_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
begin
  v_user := public.require_gym_writer(array['owner']);
  perform 1 from public.scanner s
  where s.scanner_id = p_scanner_id and s.gym_id = v_user.gym_id
    and s.status = 'active' and s.hardware_status = 'at_gym';
  if not found then
    raise exception 'scanner_not_found';
  end if;
  -- Two steps, so the one-default index is never broken halfway.
  update public.scanner s set is_default = false where s.gym_id = v_user.gym_id and s.is_default;
  update public.scanner s set is_default = true where s.scanner_id = p_scanner_id;
end
$$;

-- Points the gym at a newly uploaded QR picture (null = remove). Every change
-- is logged: a swapped QR code would send members' money to someone else.
create or replace function public.set_qr_code(p_method text, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user   public.app_user;
  v_gym    public.gym;
  v_before text;
  v_label  text;
begin
  v_user := public.require_gym_writer(array['owner']);
  if p_method not in ('gcash', 'maya') then
    raise exception 'bad_method';
  end if;
  if p_path is not null and p_path not like v_user.gym_id::text || '/%' then
    raise exception 'bad_path';
  end if;

  select * into v_gym from public.gym g where g.gym_id = v_user.gym_id for update;
  v_before := case p_method when 'gcash' then v_gym.qr_gcash_path else v_gym.qr_maya_path end;
  if v_before is not distinct from p_path then
    return;
  end if;

  update public.gym g
  set qr_gcash_path = case when p_method = 'gcash' then p_path else g.qr_gcash_path end,
      qr_maya_path  = case when p_method = 'maya'  then p_path else g.qr_maya_path end
  where g.gym_id = v_user.gym_id;

  v_label := case p_method when 'gcash' then 'GCash' else 'Maya' end || ' QR code';
  perform public.log_gym(
    v_user.gym_id, v_user.user_id,
    case when p_path is null then 'qr_removed' when v_before is null then 'qr_added' else 'qr_changed' end,
    v_label
  );
end
$$;

-- Internal: removes one member's personal details. Payments, memberships and
-- check-ins stay for the gym's totals. The website deletes the photo file
-- itself before calling anonymize_member.
create or replace function public.anonymize_member_row(p_member_id uuid, p_actor uuid, p_note text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gym uuid;
  v_num integer;
begin
  update public.member m
  set full_name = 'Former member #' || m.member_number,
      phone = null, email = null, photo_url = null,
      status = 'archived', anonymized_at = now()
  where m.member_id = p_member_id and m.anonymized_at is null
  returning m.gym_id, m.member_number into v_gym, v_num;
  if not found then
    return false;
  end if;

  update public.nfc_card c set status = 'disabled'
  where c.member_id = p_member_id and c.status = 'active';
  update public.link_request l set status = 'cancelled'
  where l.member_id = p_member_id and l.status = 'pending';

  perform public.log_gym(v_gym, p_actor, 'member_anonymized', 'Member #' || v_num || coalesce(p_note, ''));
  return true;
end
$$;

create or replace function public.anonymize_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_user;
begin
  v_user := public.require_gym_writer(array['owner']);
  perform 1 from public.member m where m.member_id = p_member_id and m.gym_id = v_user.gym_id;
  if not found then
    raise exception 'member_not_found';
  end if;
  perform public.anonymize_member_row(p_member_id, v_user.user_id, null);
end
$$;

-- Scheduled (pg_cron): personal details are removed 1 year after the last
-- membership ends (or after registration, if there was no membership).
create or replace function public.anonymize_expired()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member record;
  v_count  integer := 0;
begin
  for v_member in
    select m.member_id
    from public.member m
    where m.anonymized_at is null
      and coalesce(
            (select max(ms.end_date) from public.membership ms where ms.member_id = m.member_id),
            (m.created_at at time zone 'Asia/Manila')::date
          ) + interval '1 year' < public.manila_today()
  loop
    if public.anonymize_member_row(v_member.member_id, null, ': 1 year after the membership ended') then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end
$$;

-- =====================================================================
-- Platform admin functions (each writes the audit log)
-- =====================================================================

create or replace function public.admin_add_gym(
  p_name             text,
  p_city             text,
  p_monthly_centavos integer,
  p_setup_centavos   integer,
  p_billing_cycle    text,
  p_discount_percent integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
  v_id   uuid;
begin
  perform public.require_admin();
  v_slug := trim(both '-' from lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g')));
  if v_slug = '' or exists (select 1 from public.gym g where g.slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;
  insert into public.gym
    (gym_name, slug, city, monthly_fee_centavos, setup_fee_centavos, billing_cycle, annual_discount_percent)
  values
    (trim(p_name), v_slug, trim(p_city), p_monthly_centavos, p_setup_centavos,
     p_billing_cycle, p_discount_percent)
  returning gym_id into v_id;
  perform public.log_admin('gym_added', v_id, 'Added ' || trim(p_name));
  return v_id;
end
$$;

-- A subscription payment moves the due date one billing cycle on; a trial
-- gym's first one starts its subscription today. The setup fee changes
-- neither. Paying never lifts a suspension.
create or replace function public.admin_record_gym_payment(
  p_gym_id          uuid,
  p_kind            text,
  p_amount_centavos integer,
  p_method          text,
  p_reference_no    text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gym public.gym;
begin
  perform public.require_admin();
  select * into v_gym from public.gym g where g.gym_id = p_gym_id for update;
  if not found then
    raise exception 'gym_not_found';
  end if;
  if p_method in ('gcash', 'maya') and length(trim(coalesce(p_reference_no, ''))) = 0 then
    raise exception 'reference_required';
  end if;

  insert into public.gym_payment
    (gym_id, kind, amount_centavos, method, reference_no, covers_due_date, recorded_by)
  values
    (p_gym_id, p_kind, p_amount_centavos, p_method,
     case when p_method in ('gcash', 'maya') then trim(p_reference_no) end,
     case when p_kind = 'subscription' then v_gym.next_due_date end, auth.uid());

  if p_kind = 'setup' then
    update public.gym g set setup_fee_paid_at = now() where g.gym_id = p_gym_id;
  else
    update public.gym g
    set next_due_date = (coalesce(g.next_due_date, public.manila_today())
                         + case g.billing_cycle when 'annual' then interval '12 months'
                                                else interval '1 month' end)::date,
        status = case when g.status = 'trial' then 'active' else g.status end
    where g.gym_id = p_gym_id;
  end if;

  perform public.log_admin('payment_recorded', p_gym_id,
    case p_kind when 'setup' then 'Setup fee: ' else 'Subscription: ' end
    || public.peso_text(p_amount_centavos) || ' by ' || p_method);
end
$$;

-- The new cycle and discount apply to the next payment; the due date stays.
create or replace function public.admin_set_billing(p_gym_id uuid, p_cycle text, p_discount_percent integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  update public.gym g
  set billing_cycle = p_cycle, annual_discount_percent = p_discount_percent
  where g.gym_id = p_gym_id;
  if not found then
    raise exception 'gym_not_found';
  end if;
  perform public.log_admin('billing_changed', p_gym_id,
    case p_cycle when 'annual' then 'Annual prepay, ' || p_discount_percent || '% discount'
                 else 'Monthly billing' end);
end
$$;

-- Only after the 7-day grace period. The scanner keeps working; owner and
-- staff can read but not write.
create or replace function public.admin_suspend_gym(p_gym_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  update public.gym g set status = 'suspended'
  where g.gym_id = p_gym_id and g.status <> 'suspended'
    and g.next_due_date < public.manila_today() - 7;
  if not found then
    raise exception 'not_overdue';
  end if;
  perform public.log_admin('gym_suspended', p_gym_id, 'Suspended');
end
$$;

create or replace function public.admin_reactivate_gym(p_gym_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  update public.gym g
  set status = case when g.next_due_date is null then 'trial' else 'active' end
  where g.gym_id = p_gym_id and g.status = 'suspended';
  if not found then
    raise exception 'not_suspended';
  end if;
  perform public.log_admin('gym_reactivated', p_gym_id, 'Reactivated');
end
$$;

-- Internal: a new random token and its hash. The hash is exactly what the
-- check-in function computes: SHA-256 of the token text, lowercase hex.
create or replace function public.new_scanner_token()
returns table (token text, token_hash text)
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');  -- 48 characters
begin
  return query select v_token, encode(extensions.digest(v_token, 'sha256'), 'hex');
end
$$;

-- Returns {"scanner_id", "token"}. The token is shown once and never stored.
create or replace function public.admin_register_scanner(p_gym_id uuid, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_hash  text;
  v_id    uuid;
begin
  perform public.require_admin();
  perform 1 from public.gym g where g.gym_id = p_gym_id;
  if not found then
    raise exception 'gym_not_found';
  end if;
  if length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'name_required';
  end if;
  select t.token, t.token_hash into v_token, v_hash from public.new_scanner_token() t;

  insert into public.scanner (gym_id, scanner_name, token_hash, hardware_status, is_default)
  values (p_gym_id, trim(p_name), v_hash, 'at_gym',
          not exists (select 1 from public.scanner s where s.gym_id = p_gym_id and s.is_default))
  returning scanner_id into v_id;

  perform public.log_admin('scanner_registered', p_gym_id, 'Registered scanner "' || trim(p_name) || '"');
  return jsonb_build_object('scanner_id', v_id, 'token', v_token);
end
$$;

-- The old token stops working at once. Returns the new token, shown once.
create or replace function public.admin_rotate_token(p_scanner_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token   text;
  v_hash    text;
  v_scanner public.scanner;
begin
  perform public.require_admin();
  select t.token, t.token_hash into v_token, v_hash from public.new_scanner_token() t;
  update public.scanner s set token_hash = v_hash
  where s.scanner_id = p_scanner_id and s.status = 'active'
  returning * into v_scanner;
  if not found then
    raise exception 'scanner_not_found';
  end if;
  perform public.log_admin('token_rotated', v_scanner.gym_id,
                           'New token for "' || v_scanner.scanner_name || '"');
  return v_token;
end
$$;

-- Disables a scanner and drops its token. If it was the default, another
-- working scanner of the gym takes over.
create or replace function public.admin_revoke_scanner(p_scanner_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scanner public.scanner;
  v_next    uuid;
begin
  perform public.require_admin();
  update public.scanner s set status = 'disabled', token_hash = null, is_default = false
  where s.scanner_id = p_scanner_id and s.status = 'active'
  returning * into v_scanner;
  if not found then
    raise exception 'scanner_not_found';
  end if;

  if v_scanner.gym_id is not null
     and not exists (select 1 from public.scanner s where s.gym_id = v_scanner.gym_id and s.is_default) then
    select s.scanner_id into v_next from public.scanner s
    where s.gym_id = v_scanner.gym_id and s.status = 'active' and s.hardware_status = 'at_gym'
    order by s.created_at
    limit 1;
    if v_next is not null then
      update public.scanner s set is_default = true where s.scanner_id = v_next;
    end if;
  end if;

  perform public.log_admin('scanner_revoked', v_scanner.gym_id,
                           'Revoked "' || v_scanner.scanner_name || '"');
end
$$;

create or replace function public.admin_set_default_scanner(p_scanner_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scanner public.scanner;
begin
  perform public.require_admin();
  select * into v_scanner from public.scanner s
  where s.scanner_id = p_scanner_id and s.status = 'active' and s.hardware_status = 'at_gym';
  if not found then
    raise exception 'scanner_not_found';
  end if;
  update public.scanner s set is_default = false where s.gym_id = v_scanner.gym_id and s.is_default;
  update public.scanner s set is_default = true where s.scanner_id = p_scanner_id;
  perform public.log_admin('default_scanner_set', v_scanner.gym_id,
                           '"' || v_scanner.scanner_name || '" is the default');
end
$$;

create or replace function public.admin_set_batch_status(p_batch_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.card_batch;
begin
  perform public.require_admin();
  select * into v_batch from public.card_batch b where b.batch_id = p_batch_id for update;
  if not found then
    raise exception 'batch_not_found';
  end if;
  if v_batch.status = p_status then
    return;
  end if;
  update public.card_batch b set status = p_status where b.batch_id = p_batch_id;
  perform public.log_admin('batch_status_changed', v_batch.gym_id,
    'Order of ' || v_batch.quantity || ' cards: ' || v_batch.status || ' -> ' || p_status);
end
$$;

-- Saves cards as stock for a gym, into an existing order (p_batch_id) or a
-- new one. p_cards: [{"uid": "04A1B2C3D4E5F6", "number": "IR-0101"}, ...].
-- All or nothing: one bad or duplicate card stops the whole batch.
create or replace function public.admin_register_batch(p_gym_id uuid, p_batch_id uuid, p_cards jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch uuid := p_batch_id;
  v_count integer;
begin
  perform public.require_admin();
  if jsonb_typeof(p_cards) <> 'array' or jsonb_array_length(p_cards) = 0 then
    raise exception 'cards_required';
  end if;
  perform 1 from public.gym g where g.gym_id = p_gym_id;
  if not found then
    raise exception 'gym_not_found';
  end if;

  if v_batch is null then
    insert into public.card_batch (gym_id, quantity, status)
    values (p_gym_id, jsonb_array_length(p_cards), 'received')
    returning batch_id into v_batch;
  else
    perform 1 from public.card_batch b where b.batch_id = v_batch and b.gym_id = p_gym_id;
    if not found then
      raise exception 'batch_not_found';
    end if;
  end if;

  insert into public.nfc_card (gym_id, batch_id, card_uid, card_number, status)
  select p_gym_id, v_batch,
         upper(regexp_replace(e ->> 'uid', '[[:space:]:]', '', 'g')),
         upper(trim(e ->> 'number')),
         'stock'
  from jsonb_array_elements(p_cards) e;
  get diagnostics v_count = row_count;

  perform public.log_admin('batch_registered', p_gym_id, v_count || ' cards saved as stock');
  return v_count;
end
$$;

-- =====================================================================
-- Scanner functions (service_role only, called by the check-in function)
-- =====================================================================

-- One card tap, in one transaction. Returns the reply for the scanner:
--   link mode: {"mode":"link","linked":bool,"reason":"ok|already_linked|other_gym|blocked","name"}
--   check-in:  {"mode":"checkin","allowed":bool,"reason":"ok|expired|frozen|unknown|disabled",
--               "name","days_left"}
--   problems:  {"error":"unauthorized"} or {"error":"bad_uid"}
-- A gym's suspension does not stop the scanner (members are not punished).
create or replace function public.scanner_tap(p_token_hash text, p_uid text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scanner    public.scanner;
  v_link       public.link_request;
  v_card       public.nfc_card;
  v_card_found boolean;
  v_uid        text := upper(regexp_replace(coalesce(p_uid, ''), '[^0-9A-Fa-f]', '', 'g'));
  v_today      date := public.manila_today();
  v_name       text;
  v_result     text;
  v_state      text;
  v_last_end   date;
  v_member     uuid;
begin
  select * into v_scanner from public.scanner s
  where s.token_hash = p_token_hash and s.status = 'active' and s.gym_id is not null;
  if not found then
    return jsonb_build_object('error', 'unauthorized');
  end if;
  if v_uid !~ '^[0-9A-F]{8}([0-9A-F]{6}([0-9A-F]{6})?)?$' then
    return jsonb_build_object('error', 'bad_uid');
  end if;

  update public.scanner s set last_seen_at = now() where s.scanner_id = v_scanner.scanner_id;

  -- ---- Link mode: the website asked to link a card on this scanner ----
  select * into v_link from public.link_request l
  where l.scanner_id = v_scanner.scanner_id and l.status = 'pending' and l.expires_at > now()
  order by l.created_at desc
  limit 1
  for update;

  if found then
    select split_part(m.full_name, ' ', 1) into v_name
    from public.member m where m.member_id = v_link.member_id;

    select * into v_card from public.nfc_card c where c.card_uid = v_uid for update;
    v_card_found := found;

    if v_card_found and v_card.gym_id <> v_scanner.gym_id then
      v_result := 'other_gym';
    elsif v_card_found and v_card.status in ('lost', 'disabled') then
      v_result := 'blocked';                     -- never turn a lost card back on
    elsif v_card_found and v_card.status = 'active' and v_card.member_id = v_link.member_id then
      v_result := 'linked';                      -- already this member's card
    elsif v_card_found and v_card.status = 'active' then
      v_result := 'already_linked';
    elsif exists (
      select 1 from public.nfc_card c where c.member_id = v_link.member_id and c.status = 'active'
    ) then
      v_result := 'already_linked';              -- the member got a card meanwhile
    else
      v_result := 'linked';
      if v_card_found then
        update public.nfc_card c
        set member_id = v_link.member_id, status = 'active', assigned_at = now()
        where c.card_id = v_card.card_id;
      else
        insert into public.nfc_card (gym_id, member_id, card_uid, status, assigned_at)
        values (v_scanner.gym_id, v_link.member_id, v_uid, 'active', now());
      end if;
    end if;

    if v_result = 'linked' then
      update public.link_request l set status = 'done', result = 'linked', card_uid = v_uid
      where l.request_id = v_link.request_id;
    else
      -- The website shows the result; the request stays open for another card.
      update public.link_request l set result = v_result, card_uid = v_uid
      where l.request_id = v_link.request_id;
    end if;

    return jsonb_build_object(
      'mode', 'link',
      'linked', v_result = 'linked',
      'reason', case when v_result = 'linked' then 'ok' else v_result end,
      'name', coalesce(v_name, '')
    );
  end if;

  -- ---- Check-in ----
  select * into v_card from public.nfc_card c
  where c.card_uid = v_uid and c.gym_id = v_scanner.gym_id;
  v_card_found := found;

  if not v_card_found or v_card.status = 'stock' or v_card.member_id is null then
    v_result := 'unknown';                       -- roadmap #11: stock cards are unknown
  elsif v_card.status in ('lost', 'disabled') then
    v_result := 'disabled';
    v_member := v_card.member_id;
  else
    v_member := v_card.member_id;
    select split_part(m.full_name, ' ', 1) into v_name
    from public.member m where m.member_id = v_member;
    select a.state, a.last_end into v_state, v_last_end
    from public.member_access(v_member, v_today) a;
    v_result := case v_state when 'allowed' then 'allowed' when 'frozen' then 'frozen' else 'expired' end;
  end if;

  insert into public.checkin (gym_id, member_id, scanner_id, card_uid, result, source)
  values (v_scanner.gym_id, v_member, v_scanner.scanner_id, v_uid, v_result, 'online');

  return jsonb_build_object(
    'mode', 'checkin',
    'allowed', v_result = 'allowed',
    'reason', case when v_result = 'allowed' then 'ok' else v_result end,
    'name', case when v_result in ('allowed', 'expired', 'frozen') then coalesce(v_name, '') else '' end,
    'days_left', case when v_result = 'allowed' then greatest(v_last_end - v_today, 0) else 0 end
  );
end
$$;

-- Roadmap #28: the scanner says "I'm alive" every 2 minutes. The reply also
-- says whether a link request is waiting (roadmap #12, best effort).
create or replace function public.scanner_heartbeat(p_token_hash text, p_firmware text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scanner public.scanner;
  v_name    text;
begin
  update public.scanner s
  set last_seen_at = now(),
      firmware_version = coalesce(nullif(left(trim(coalesce(p_firmware, '')), 20), ''), s.firmware_version)
  where s.token_hash = p_token_hash and s.status = 'active' and s.gym_id is not null
  returning * into v_scanner;
  if not found then
    return jsonb_build_object('error', 'unauthorized');
  end if;

  select split_part(m.full_name, ' ', 1) into v_name
  from public.link_request l
  join public.member m on m.member_id = l.member_id
  where l.scanner_id = v_scanner.scanner_id and l.status = 'pending' and l.expires_at > now()
  order by l.created_at desc
  limit 1;

  return jsonb_build_object('ok', true, 'pending_link', v_name is not null, 'name', coalesce(v_name, ''));
end
$$;

-- =====================================================================
-- Row Level Security: the browser can only READ, and only its own gym.
-- (Owner/staff of a gym, or the platform admin for everything.)
-- =====================================================================

alter table public.gym           enable row level security;
alter table public.app_user      enable row level security;
alter table public.plan          enable row level security;
alter table public.scanner       enable row level security;
alter table public.member        enable row level security;
alter table public.card_batch    enable row level security;
alter table public.nfc_card      enable row level security;
alter table public.membership    enable row level security;
alter table public.payment       enable row level security;
alter table public.checkin       enable row level security;
alter table public.link_request  enable row level security;
alter table public.walk_in       enable row level security;
alter table public.gym_payment   enable row level security;
alter table public.audit_log     enable row level security;
alter table public.gym_audit_log enable row level security;

create policy gym_read on public.gym for select to authenticated
  using (gym_id = (select public.my_gym_id()) or (select public.is_platform_admin()));

create policy app_user_read on public.app_user for select to authenticated
  using (user_id = (select auth.uid())
         or gym_id = (select public.my_gym_id())
         or (select public.is_platform_admin()));

create policy plan_read on public.plan for select to authenticated
  using (gym_id = (select public.my_gym_id()) or (select public.is_platform_admin()));
create policy scanner_read on public.scanner for select to authenticated
  using (gym_id = (select public.my_gym_id()) or (select public.is_platform_admin()));
create policy member_read on public.member for select to authenticated
  using (gym_id = (select public.my_gym_id()) or (select public.is_platform_admin()));
create policy card_batch_read on public.card_batch for select to authenticated
  using (gym_id = (select public.my_gym_id()) or (select public.is_platform_admin()));
create policy nfc_card_read on public.nfc_card for select to authenticated
  using (gym_id = (select public.my_gym_id()) or (select public.is_platform_admin()));
create policy membership_read on public.membership for select to authenticated
  using (gym_id = (select public.my_gym_id()) or (select public.is_platform_admin()));
create policy checkin_read on public.checkin for select to authenticated
  using (gym_id = (select public.my_gym_id()) or (select public.is_platform_admin()));
create policy link_request_read on public.link_request for select to authenticated
  using (gym_id = (select public.my_gym_id()) or (select public.is_platform_admin()));

-- Money: the owner sees everything; staff only today's (Manila).
create policy payment_read on public.payment for select to authenticated
  using ((select public.is_platform_admin())
         or (gym_id = (select public.my_gym_id())
             and ((select public.my_role()) = 'owner' or public.is_today_manila(paid_at))));
create policy walk_in_read on public.walk_in for select to authenticated
  using ((select public.is_platform_admin())
         or (gym_id = (select public.my_gym_id())
             and ((select public.my_role()) = 'owner' or public.is_today_manila(visited_at))));

-- The gym's own bill: owner and admin.
create policy gym_payment_read on public.gym_payment for select to authenticated
  using ((select public.is_platform_admin())
         or (gym_id = (select public.my_gym_id()) and (select public.my_role()) = 'owner'));

create policy audit_log_read on public.audit_log for select to authenticated
  using ((select public.is_platform_admin()));
create policy gym_audit_log_read on public.gym_audit_log for select to authenticated
  using ((select public.is_platform_admin())
         or (gym_id = (select public.my_gym_id()) and (select public.my_role()) = 'owner'));

-- =====================================================================
-- Table and function privileges
-- =====================================================================

-- Logged-out visitors get nothing. Signed-in users may only SELECT (RLS
-- decides which rows); all writes go through the functions above.
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;

-- The token hash is never readable from the browser.
revoke select on public.scanner from authenticated;
grant select (scanner_id, gym_id, scanner_name, firmware_version, last_seen_at,
              status, hardware_status, is_default, created_at)
  on public.scanner to authenticated;

-- No function runs unless granted below.
revoke all on all functions in schema public from public, anon, authenticated, service_role;

-- Used by Row Level Security and storage policies.
grant execute on function
  public.manila_today(),
  public.is_today_manila(timestamptz),
  public.my_gym_id(),
  public.my_role(),
  public.is_platform_admin(),
  public.can_write_gym_files(text, text[])
to authenticated;

-- Website: owner and staff (each function checks the role itself).
grant execute on function
  public.register_member(text, text, text, text, text, uuid, text, text),
  public.renew_membership(uuid, uuid, integer, text, text),
  public.manual_checkin(uuid),
  public.start_link_request(uuid, uuid),
  public.cancel_link_request(uuid),
  public.link_card(uuid, text, text),
  public.mark_card_lost(uuid),
  public.record_walk_in(text, integer, text, text),
  public.freeze_membership(uuid, text),
  public.unfreeze_membership(uuid),
  public.member_latest_payment(uuid),
  public.save_plan(uuid, text, integer, integer),
  public.set_plan_active(uuid, boolean),
  public.save_settings(text, integer, text, text),
  public.set_default_scanner(uuid),
  public.set_qr_code(text, text),
  public.anonymize_member(uuid)
to authenticated;

-- Website: platform admin (each function checks the role itself).
grant execute on function
  public.admin_add_gym(text, text, integer, integer, text, integer),
  public.admin_record_gym_payment(uuid, text, integer, text, text),
  public.admin_set_billing(uuid, text, integer),
  public.admin_suspend_gym(uuid),
  public.admin_reactivate_gym(uuid),
  public.admin_register_scanner(uuid, text),
  public.admin_rotate_token(uuid),
  public.admin_revoke_scanner(uuid),
  public.admin_set_default_scanner(uuid),
  public.admin_set_batch_status(uuid, text),
  public.admin_register_batch(uuid, uuid, jsonb)
to authenticated;

-- Scanner: only the check-in Edge Function (service role).
grant execute on function
  public.scanner_tap(text, text),
  public.scanner_heartbeat(text, text)
to service_role;

-- Internal helpers (require_*, log_*, member_access, renewal_start,
-- new_scanner_token, anonymize_member_row, anonymize_expired, peso_text,
-- refuse_change) are granted to no one: they run inside the functions above
-- as the table owner, and anonymize_expired runs from pg_cron.

-- =====================================================================
-- Storage: private buckets, one folder per gym: <bucket>/<gym_id>/<file>
-- Files are shown with short-lived signed links. There are no UPDATE
-- policies: every upload gets a new file name, so a QR code cannot be
-- swapped silently (set_qr_code logs each change).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('member-photos', 'member-photos', false, 204800, array['image/jpeg', 'image/png']),
  ('payment-qr', 'payment-qr', false, 1048576, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "FitTap files: read own gym" on storage.objects for select to authenticated
  using (
    bucket_id in ('member-photos', 'payment-qr')
    and ((storage.foldername(name))[1] = (select public.my_gym_id())::text
         or (select public.is_platform_admin()))
  );

create policy "Member photos: owner and staff upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'member-photos'
    and public.can_write_gym_files((storage.foldername(name))[1], array['owner', 'staff'])
  );

create policy "Member photos: owner deletes" on storage.objects for delete to authenticated
  using (
    bucket_id = 'member-photos'
    and public.can_write_gym_files((storage.foldername(name))[1], array['owner'])
  );

create policy "Payment QR: owner uploads" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'payment-qr'
    and public.can_write_gym_files((storage.foldername(name))[1], array['owner'])
  );

create policy "Payment QR: owner deletes" on storage.objects for delete to authenticated
  using (
    bucket_id = 'payment-qr'
    and public.can_write_gym_files((storage.foldername(name))[1], array['owner'])
  );

-- =====================================================================
-- Nightly anonymizing (pg_cron, enabled at the top of this file).
-- 18:30 UTC = 2:30 AM in Manila. A job with the same name is replaced, so
-- running this file again does not add a second job.
-- =====================================================================
select cron.schedule('fittap-anonymize-expired', '30 18 * * *',
                     $$select public.anonymize_expired()$$);
