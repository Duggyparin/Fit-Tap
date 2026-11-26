-- =====================================================================
-- Gym NFC Membership System: prototype schema (v1.3)
-- A subset of the ERD in the project plan, enough for the scanner prototype.
-- Run in the Supabase SQL Editor on a new project.
-- WARNING: running this on a project that already has these tables fails;
-- back up and drop the old tables first.
-- =====================================================================

create table gym (
  gym_id   uuid primary key default gen_random_uuid(),
  gym_name text not null
);

create table scanner (
  scanner_id   uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references gym,
  scanner_name text,
  token_hash   text unique not null,            -- SHA-256 of the scanner token
  status       text not null default 'active',  -- active | disabled
  last_seen_at timestamptz
);

create table member (
  member_id uuid primary key default gen_random_uuid(),
  gym_id    uuid not null references gym,
  full_name text not null
);

create table nfc_card (
  card_id     uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references gym,
  member_id   uuid references member,           -- empty = in stock, not linked
  card_uid    text unique not null,             -- factory ID read by the scanner
  card_number text,                             -- printed number on branded cards
  status      text not null default 'active'    -- stock | active | lost | disabled
);

create table membership (
  membership_id uuid primary key default gen_random_uuid(),
  member_id     uuid not null references member,
  start_date    date not null,
  end_date      date not null,
  status        text not null default 'active'  -- active | expired | frozen | cancelled
);

create table checkin (
  checkin_id uuid primary key default gen_random_uuid(),
  gym_id     uuid not null references gym,
  member_id  uuid references member,            -- empty for unknown cards
  scanner_id uuid references scanner,
  card_uid   text not null,
  result     text not null,                     -- allowed | expired | unknown | disabled
  source     text not null,                     -- online | offline | manual
  scanned_at timestamptz not null default now()
);
create index checkin_gym_time on checkin (gym_id, scanned_at desc);

-- Link mode: the next tap on this scanner within 60 s links the card
create table link_request (
  request_id uuid primary key default gen_random_uuid(),
  gym_id     uuid not null references gym,
  scanner_id uuid not null references scanner,
  member_id  uuid not null references member,
  status     text not null default 'pending',   -- pending | done | expired | cancelled
  card_uid   text,
  expires_at timestamptz not null default now() + interval '60 seconds'
);

-- Walk-ins: pay per visit, no card. Recorded by the website, not the scanner.
create table walk_in (
  walkin_id       uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references gym,
  guest_name      text,
  amount_centavos int not null,
  method          text not null default 'cash', -- cash | gcash | maya | other
  reference_no    text,
  visited_at      timestamptz not null default now()
);

-- No public access: only the Edge Function (service role) can read these.
-- Add policies for staff accounts when you build the website.
alter table gym          enable row level security;
alter table scanner      enable row level security;
alter table member       enable row level security;
alter table nfc_card     enable row level security;
alter table membership   enable row level security;
alter table checkin      enable row level security;
alter table link_request enable row level security;
alter table walk_in      enable row level security;
