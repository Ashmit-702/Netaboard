-- ============================================================
-- NETABOARD — SUPABASE CHANGES REQUIRED (v4). Not a migration; run by hand.
-- Also run docs/SUPABASE_CHANGES_v3.sql if you have not (2026 state-election
-- results, Goa 2027, current Chief Ministers).
-- ============================================================

-- ------------------------------------------------------------
-- A. READ-ONLY DIAGNOSTICS — run these first, change nothing
-- ------------------------------------------------------------
-- A1. Your live site shows "Politician records couldn't be loaded" while
--     attention data loads. The politicians query embeds claims/verdicts
--     (migration 002). Do those tables exist?
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('claims', 'evidence', 'verdicts', 'party_election_results');
-- Expect 4 rows. If claims/evidence/verdicts are missing, run
-- supabase/migrations/002_evidence_ledger.sql. (The app now degrades to an
-- unscored roster and logs the exact error in Vercel -> Logs, prefixed
-- "[getPoliticians]".)

-- A2. Elections currently on record:
select id, name, region, election_date, status, data_status, is_demo, is_archived
from elections order by election_date desc;

-- A3. Any demo/Bihar rows that could look current?
select name, is_demo, is_archived, data_status from elections where name ilike '%bihar%';

-- ------------------------------------------------------------
-- B. UPCOMING ELECTION THAT EXISTS TODAY (sourced)
-- ------------------------------------------------------------
-- The Election Commission of India announced bye-elections: polling
-- 6 October 2026, counting 9 October 2026, for five Assembly seats
-- (Madurantakam SC and Dharapuram SC in Tamil Nadu; Thattanchavady in
-- Puducherry; Rejinagar and Nandigram in West Bengal) and one Lok Sabha seat
-- (Nagaon, Assam — vacated by Congress's Pradyut Bordoloi's resignation).
-- Source: https://ddindia.co.in/2026/09/eci-announces-october-6-bye-elections-for-five-assembly-seats-and-one-lok-sabha-seat/
-- Please confirm against the ECI press note at https://www.eci.gov.in before
-- running — I could read the schedule from a news report, not the ECI page.

insert into elections (name, region, election_date, status, data_status, source_url, description)
select 'Bye-elections October 2026 (5 Assembly seats, Nagaon Lok Sabha)',
       'Tamil Nadu, Puducherry, West Bengal, Assam', '2026-10-06', 'upcoming', 'upcoming',
       'https://ddindia.co.in/2026/09/eci-announces-october-6-bye-elections-for-five-assembly-seats-and-one-lok-sabha-seat/',
       'Polling 6 October 2026, counting 9 October 2026. Assembly seats: Madurantakam (SC) and Dharapuram (SC) in Tamil Nadu, Thattanchavady in Puducherry, Rejinagar and Nandigram in West Bengal. Lok Sabha seat: Nagaon, Assam.'
where not exists (select 1 from elections where name like 'Bye-elections October 2026%');
-- This is 8 days away, so it will appear in Election Watch on the homepage
-- and under UPCOMING on /elections. After 9 October, update it with:
--   update elections set status='concluded', data_status='results',
--          result_declared_at='2026-10-09', last_updated_at=now()
--   where name like 'Bye-elections October 2026%';
-- and add the winners only once you have them from results.eci.gov.in.

-- ------------------------------------------------------------
-- C. KEEP DEMO BIHAR CONTENT OUT OF ACTIVE QUERIES (only if A3 shows rows)
-- ------------------------------------------------------------
-- The app already ignores is_demo = true rows. If A3 returned a Bihar 2026
-- row with is_demo = false, mark it (this changes 1 row, deletes nothing):
update elections set is_demo = true, is_archived = true, data_status = 'archive'
where name = 'Bihar Assembly Election 2026' and is_demo = false;
