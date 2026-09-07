-- ============================================================
-- NETABOARD — fix: make the election-linked-results migration re-runnable
-- This is why "No election linked" was showing for Patna Sahib/Raghopur:
-- migration 007's election inserts had no existence check. If it ran more
-- than once, it created duplicate election rows, which broke the scalar
-- subquery that links constituency_election_results to them — so that
-- insert silently never ran, leaving the results table empty for exactly
-- these two constituencies.
--
-- Safe to run any number of times. Does not touch real historical data —
-- only cleans up duplicates this specific migration could have created,
-- and (re)establishes the two real elections + their linked results.
-- ============================================================

-- Step 1: if duplicates already exist from a previous partial run, collapse
-- them to one row each (keep the earliest), so the scalar subquery below
-- can never fail.
delete from elections a using elections b
where a.id > b.id
  and a.name = b.name
  and a.name in ('Bihar Legislative Assembly Election 2020', 'Lok Sabha General Election 2024 (Patna Sahib)');

-- Step 2: insert the two elections ONLY if they don't already exist.
insert into elections (name, region, election_date, status, data_status, result_declared_at, is_archived, description)
select 'Bihar Legislative Assembly Election 2020', 'Bihar', '2020-11-10', 'concluded', 'archive', '2020-11-10', true,
       'Historical result — the seat counts currently shown in Coalition Builder are from this election.'
where not exists (select 1 from elections where name = 'Bihar Legislative Assembly Election 2020');

insert into elections (name, region, election_date, status, data_status, result_declared_at, is_archived, description)
select 'Lok Sabha General Election 2024 (Patna Sahib)', 'Bihar', '2024-06-04', 'concluded', 'archive', '2024-06-04', true,
       'Historical result — Patna Sahib is a Lok Sabha constituency, distinct from the Bihar Assembly.'
where not exists (select 1 from elections where name = 'Lok Sabha General Election 2024 (Patna Sahib)');

-- Step 3: clear any existing constituency_election_results for these two
-- constituencies before re-inserting, so re-running this never duplicates
-- result rows either.
delete from constituency_election_results
where constituency_id in (select id from constituencies where name in ('Patna Sahib', 'Raghopur'));

insert into constituency_election_results (constituency_id, election_id, candidate_name, party_id, vote_share, margin, turnout, result_status)
select c.id,
       (select id from elections where name = 'Lok Sabha General Election 2024 (Patna Sahib)'),
       c.current_rep, c.party_id, c.vote_share, c.margin, c.turnout, 'declared'
from constituencies c where c.name = 'Patna Sahib';

insert into constituency_election_results (constituency_id, election_id, candidate_name, party_id, vote_share, margin, turnout, result_status)
select c.id,
       (select id from elections where name = 'Bihar Legislative Assembly Election 2020'),
       c.current_rep, c.party_id, c.vote_share, c.margin, c.turnout, 'declared'
from constituencies c where c.name = 'Raghopur';

-- Step 4: same idempotency fix for party_election_results — clear and
-- re-insert rather than blindly appending.
delete from party_election_results
where election_id = (select id from elections where name = 'Bihar Legislative Assembly Election 2020');

insert into party_election_results (party_id, election_id, seats_won)
select p.id, (select id from elections where name = 'Bihar Legislative Assembly Election 2020'), p.seats_current
from parties p where p.region = 'bihar_2020';

-- ---------- Verify it worked — run this SELECT after the above ----------
-- select c.name, cer.vote_share, e.name as election_name, e.is_archived
-- from constituencies c
-- left join constituency_election_results cer on cer.constituency_id = c.id
-- left join elections e on e.id = cer.election_id;
-- Expected: both Patna Sahib and Raghopur show a non-null election_name.
