-- ============================================================
-- NETABOARD — constituency dataset: choose ONE option below.
-- The database currently holds only 2 constituencies (Patna Sahib,
-- Raghopur), both historical Bihar seats. No query logic can present a
-- "broader, current" dataset from 2 historical rows — the data has to
-- change. Both options are additive and delete nothing.
-- ============================================================


-- ############################################################
-- OPTION A (recommended): keep the 2 seats, mark them archive-only.
-- The main Constituencies page then shows an honest "no current
-- constituency data" state, with the 2 historical seats available under
-- an Archive heading. Nothing is fabricated. Run this if you don't have
-- real constituency data to load yet.
-- ############################################################

alter table constituencies add column if not exists is_archived boolean default false;

update constituencies set is_archived = true
where name in ('Patna Sahib', 'Raghopur');


-- ############################################################
-- OPTION B: load real constituency data so the page has substance.
-- Below is the SHAPE to follow — I have deliberately NOT filled in vote
-- shares, winners or turnout figures, because I cannot verify them and
-- will not invent election results.
--
-- To use this: get real figures from the Election Commission
-- (results.eci.gov.in) or MyNeta, fill in the values, then run it.
-- Every row must be linked to a real election in the `elections` table.
-- ############################################################

-- Step 1: add the constituencies themselves (identity only, no results).
-- insert into constituencies (name, state) values
--   ('<Constituency name>', '<State>'),
--   ('<Constituency name>', '<State>');

-- Step 2: add the election these results belong to, if not already present.
-- insert into elections (name, region, election_date, status, data_status, result_declared_at, is_archived, description)
-- select '<Election name, e.g. Lok Sabha General Election 2024>', '<Region>', '<YYYY-MM-DD>',
--        'concluded', 'results', '<YYYY-MM-DD>', false, '<Short description>'
-- where not exists (select 1 from elections where name = '<Election name>');

-- Step 3: link each real result to that election.
-- insert into constituency_election_results
--   (constituency_id, election_id, candidate_name, vote_share, margin, turnout, result_status, source_url)
-- select
--   (select id from constituencies where name = '<Constituency name>'),
--   (select id from elections where name = '<Election name>'),
--   '<Winning candidate>', <vote_share>, <margin>, <turnout>, 'declared',
--   '<source URL, e.g. the ECI results page>';


-- ---------- VERIFY (run after either option) ----------
-- select c.name, c.state, c.is_archived, e.name as election, cer.vote_share
-- from constituencies c
-- left join constituency_election_results cer on cer.constituency_id = c.id
-- left join elections e on e.id = cer.election_id
-- order by c.is_archived, c.name;
