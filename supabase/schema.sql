-- ============================================================
-- NETABOARD — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor (or `supabase db push`),
-- THEN run every file in supabase/migrations/ in numeric order (001-011).
--
-- This file alone does NOT reflect the current application architecture —
-- the evidence ledger (claims/evidence/verdicts), election freshness fields
-- (data_status, is_demo, is_archived, ...), and constituency archival flags
-- are all added by migrations, not here, because they were introduced
-- after this file was first written and migrations are additive-only.
-- Tables below marked DEPRECATED/HISTORICAL are still created (for existing
-- foreign keys and migration safety) but are NOT read by any current
-- application code — see the note on each.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- PARTIES ----------
-- NOTE: `region` and `seats_current` are DEPRECATED/HISTORICAL — the app now
-- reads seat counts from `party_election_results`, joined to a specific
-- `elections` row, so seats from different elections are never mixed (see
-- lib/data.js:getParties). These two columns are kept only because
-- supabase/demo/seed.sql (local/demo only) still populates them for the
-- Coalition Builder's demo mode; production data does not need them.
create table if not exists parties (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  abbreviation text not null,
  color text default '#7b84a3',
  region text not null default 'unspecified',        -- DEPRECATED/HISTORICAL, see note above
  seats_current int not null default 0,               -- DEPRECATED/HISTORICAL, see note above
  created_at timestamptz default now()
);

-- ---------- POLITICIANS ----------
create table if not exists politicians (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  role text,                                    -- e.g. "Prime Minister", "Chief Minister, Bihar"
  party_id uuid references parties(id),
  photo_url text,
  bio text,
  created_at timestamptz default now()
);

-- ---------- PROMISE TRACKER ----------
create table if not exists promises (
  id uuid primary key default uuid_generate_v4(),
  politician_id uuid references politicians(id) on delete cascade,
  text text not null,
  status text not null check (status in ('done','partial','broken')),
  source_url text,
  created_at timestamptz default now()
);

-- ---------- POLITICAL TIMELINE ----------
create table if not exists timeline_events (
  id uuid primary key default uuid_generate_v4(),
  politician_id uuid references politicians(id) on delete cascade,
  event_date date not null,
  title text not null,
  description text,
  category text,                                -- speech | scandal | achievement | election | cabinet
  created_at timestamptz default now()
);

-- ---------- ELECTIONS + PREDICTION HISTORY ----------
create table if not exists elections (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                           -- "Bihar Assembly Election 2026"
  region text,
  election_date date,
  status text default 'upcoming',               -- upcoming | live | concluded
  description text,
  created_at timestamptz default now()
);

create table if not exists predictions (
  id uuid primary key default uuid_generate_v4(),
  election_id uuid references elections(id) on delete cascade,
  option_label text not null,                   -- "NDA", "Mahagathbandhan", ...
  probability numeric not null check (probability between 0 and 100),
  recorded_at timestamptz default now()
);

-- ---------- CROWD PREDICTION MARKET ----------
create table if not exists market_votes (
  id uuid primary key default uuid_generate_v4(),
  election_id uuid references elections(id) on delete cascade,
  option_label text not null,
  voter_fingerprint text not null,               -- hashed client id, not PII — used only to block double-voting
  created_at timestamptz default now(),
  unique (election_id, voter_fingerprint)
);

create table if not exists predictors (
  id uuid primary key default uuid_generate_v4(),
  display_name text not null,
  accuracy_pct numeric default 0,
  predictions_made int default 0,
  updated_at timestamptz default now()
);

-- ---------- CONSTITUENCY DASHBOARD — DEPRECATED / HISTORICAL ----------
-- The Constituency feature was removed from the active product (/constituencies
-- and /heatmap now redirect to /elections and /explore). This table, and
-- constituency_snapshots/constituency_election_results added in migrations
-- 004/007/011, are kept only so the two existing historical rows (Patna
-- Sahib, Raghopur — both marked is_archived) remain queryable for
-- migration safety. No current application code reads or writes these
-- tables. Do not build new features on them.
create table if not exists constituencies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  state text not null,
  current_rep text,
  party_id uuid references parties(id),
  vote_share numeric,
  margin numeric,
  turnout numeric,
  demographics jsonb default '{}',               -- { "urban_pct":40, "farmer_pct":25, ... }
  development_index jsonb default '{}',          -- { "roads":7.2, "education":6.1, ... }
  created_at timestamptz default now()
);

-- ---------- POLITICAL ATTENTION ----------
-- NOT deprecated — this is the live table behind /attention. Only the
-- PRODUCT LANGUAGE changed (Political Attention, not "Political Stock
-- Market" — see lib/attention.js and app/attention/page.js); renaming the
-- table itself was judged unnecessary migration risk for a purely cosmetic
-- change, so `stock_prices`/`price` remain the column names.
create table if not exists stock_prices (
  id uuid primary key default uuid_generate_v4(),
  politician_id uuid references politicians(id) on delete cascade,
  price numeric not null,
  change_pct numeric default 0,
  reason text,                                   -- what news/event moved the price
  recorded_at timestamptz default now()
);

-- ---------- GEOPOLITICAL RISK METER — DEPRECATED / UNUSED ----------
-- Never part of the active product's navigation, UI, or data layer. Table
-- kept, empty, rather than dropped, since dropping a live table is a
-- decision this project leaves to a manual, explicit migration. No
-- application code references this table.
create table if not exists geopolitical_risk (
  id uuid primary key default uuid_generate_v4(),
  country text not null,
  war_risk numeric,
  economic_risk numeric,
  political_stability numeric,
  relations jsonb default '{}',                  -- { "USA": "up", "China": "down" }
  updated_at timestamptz default now()
);

-- ---------- DAILY AI BRIEF ----------
create table if not exists daily_briefs (
  id uuid primary key default uuid_generate_v4(),
  brief_date date unique not null default current_date,
  content jsonb not null,                        -- { headline, stories:[...], watch_today }
  created_at timestamptz default now()
);

-- ---------- DEBATE ARENA ----------
create table if not exists debates (
  id uuid primary key default uuid_generate_v4(),
  topic text not null,
  created_at timestamptz default now()
);

create table if not exists debate_arguments (
  id uuid primary key default uuid_generate_v4(),
  debate_id uuid references debates(id) on delete cascade,
  side text not null,                            -- "for" | "against"
  content text not null,
  votes int default 0,
  created_at timestamptz default now()
);

-- ---------- POLITICAL IQ QUIZ ----------
create table if not exists quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  options jsonb not null,                        -- ["A","B","C","D"]
  correct_index int not null,
  category text,
  created_at timestamptz default now()
);

-- ---------- AI FACT CHECK LOG ----------
create table if not exists fact_checks (
  id uuid primary key default uuid_generate_v4(),
  input_text text not null,
  verdict text,                                  -- True | Misleading | Needs Context | False
  explanation text,
  sources jsonb default '[]',
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Public read on everything; writes are locked down except the
-- two crowd-sourced actions (market votes, debate arguments),
-- which use the anon key with tight constraints.
-- ============================================================
alter table parties enable row level security;
alter table politicians enable row level security;
alter table promises enable row level security;
alter table timeline_events enable row level security;
alter table elections enable row level security;
alter table predictions enable row level security;
alter table market_votes enable row level security;
alter table predictors enable row level security;
alter table constituencies enable row level security;
alter table stock_prices enable row level security;
alter table geopolitical_risk enable row level security;
alter table daily_briefs enable row level security;
alter table debates enable row level security;
alter table debate_arguments enable row level security;
alter table quiz_questions enable row level security;
alter table fact_checks enable row level security;

-- Public read policies
create policy "public read parties" on parties for select using (true);
create policy "public read politicians" on politicians for select using (true);
create policy "public read promises" on promises for select using (true);
create policy "public read timeline" on timeline_events for select using (true);
create policy "public read elections" on elections for select using (true);
create policy "public read predictions" on predictions for select using (true);
create policy "public read market_votes" on market_votes for select using (true);
create policy "public read predictors" on predictors for select using (true);
create policy "public read constituencies" on constituencies for select using (true);
create policy "public read stock_prices" on stock_prices for select using (true);
create policy "public read geopolitical_risk" on geopolitical_risk for select using (true);
create policy "public read daily_briefs" on daily_briefs for select using (true);
create policy "public read debates" on debates for select using (true);
create policy "public read debate_arguments" on debate_arguments for select using (true);
create policy "public read quiz_questions" on quiz_questions for select using (true);

-- Crowd-sourced writes (anon key), rest stays service-role-only by default
create policy "anon can vote once" on market_votes for insert with check (true);
create policy "anon can post arguments" on debate_arguments for insert with check (length(content) < 1000);

-- fact_checks is written only by the server (service role) after calling the AI — no public policy needed.
