-- ============================================================
-- NETABOARD — SUPABASE CHANGES REQUIRED (this pass)
--
-- NOT a migration. Not run automatically by anything. Review each
-- statement against your actual live rows (the SELECTs at the top of each
-- section) before running any UPDATE/INSERT below — this file assumes
-- migrations 001-011 have already been applied (data_status, is_demo,
-- source_url, party_election_results all need those columns/tables).
--
-- Every fact below is sourced from a real, dated, verifiable event and
-- linked to its source. Where I could not verify an exact number, I say so
-- explicitly instead of guessing — do not fill blanks in with an estimate.
-- ============================================================


-- ------------------------------------------------------------
-- 1. THE 2026 STATE ELECTIONS ARE NOW RESULTS, NOT BARE "CONCLUDED" ROWS
-- ------------------------------------------------------------
-- Migration 005 inserted these 5 elections as data_status left at the
-- column default ('upcoming' until 006's backfill set it to 'results' from
-- status='concluded' — check which your DB actually has). None of them
-- carry result data. Verify first:

select name, status, data_status, result_declared_at, source_url
from elections
where name in (
  'Assam Assembly Election 2026', 'Kerala Assembly Election 2026',
  'Tamil Nadu Assembly Election 2026', 'West Bengal Assembly Election 2026',
  'Puducherry Assembly Election 2026'
);

-- If result_declared_at/source_url are null, run these (safe to re-run —
-- each is scoped to one election by exact name):

update elections set
  data_status = 'results', result_declared_at = '2026-05-04', last_updated_at = now(),
  source_url = 'https://en.wikipedia.org/wiki/2026_West_Bengal_Legislative_Assembly_election',
  description = 'BJP won 208 of 294 seats; Suvendu Adhikari (BJP) became Chief Minister, ending the AITC''s (Mamata Banerjee) 15-year tenure.'
where name = 'West Bengal Assembly Election 2026';

update elections set
  data_status = 'results', result_declared_at = '2026-05-04', last_updated_at = now(),
  source_url = 'https://en.wikipedia.org/wiki/2026_Tamil_Nadu_Legislative_Assembly_election',
  description = 'Tamilaga Vettri Kazhagam (TVK), in its first election, won 108 of 234 seats; its founder C. Joseph Vijay (actor "Vijay") became Chief Minister.'
where name = 'Tamil Nadu Assembly Election 2026';

update elections set
  data_status = 'results', result_declared_at = '2026-05-04', last_updated_at = now(),
  source_url = 'https://en.wikipedia.org/wiki/2026_Kerala_Legislative_Assembly_election',
  description = 'INC-led UDF won 102 of 140 seats; V. D. Satheesan (INC) was sworn in as Chief Minister on 18 May 2026, succeeding Pinarayi Vijayan (CPI(M)).'
where name = 'Kerala Assembly Election 2026';

-- Assam and Puducherry: BJP-led NDA (Assam, 3rd term, CM Himanta Biswa
-- Sarma continuing) and AINRC (Puducherry, CM N. Rangaswamy continuing) both
-- won, per multiple sources — but I could not verify their EXACT seat
-- counts, so I have left seats out rather than estimate them. Verify the
-- number at results.eci.gov.in before adding it.
update elections set
  data_status = 'results', result_declared_at = '2026-05-04', last_updated_at = now(),
  source_url = 'https://en.wikipedia.org/wiki/2026_Assam_Legislative_Assembly_election',
  description = 'BJP-led NDA won a third consecutive term; Himanta Biswa Sarma continues as Chief Minister. Exact seat count not verified — confirm at results.eci.gov.in before displaying it.'
where name = 'Assam Assembly Election 2026';

update elections set
  data_status = 'results', result_declared_at = '2026-05-04', last_updated_at = now(),
  source_url = 'https://en.wikipedia.org/wiki/2026_Puducherry_Legislative_Assembly_election',
  description = 'AINRC won with an increased majority; N. Rangaswamy continues as Chief Minister. Exact seat count not verified — confirm at results.eci.gov.in before displaying it.'
where name = 'Puducherry Assembly Election 2026';

-- Party-level seat rows for the three results I could fully verify
-- (skip Assam/Puducherry until you have exact numbers). This is what
-- powers each election's "Seats won" table on /elections/[id]:

insert into party_election_results (election_id, party_id, seats_won, vote_share, source_url)
select e.id, p.id, v.seats, v.share, e.source_url
from elections e, (values
  ('West Bengal Assembly Election 2026', 'BJP', 208, 45.92),
  ('West Bengal Assembly Election 2026', 'AITC', 80, 40.68),
  ('Tamil Nadu Assembly Election 2026', 'TVK', 108, 35.02),
  ('Tamil Nadu Assembly Election 2026', 'DMK', 59, 31.40),
  ('Tamil Nadu Assembly Election 2026', 'AIADMK', 47, 27.21),
  ('Kerala Assembly Election 2026', 'INC', 63, 28.79),
  ('Kerala Assembly Election 2026', 'CPI(M)', 26, 21.77)
) as v(election_name, party_abbr, seats, share)
join parties p on p.abbreviation = v.party_abbr
where e.name = v.election_name
  and not exists (select 1 from party_election_results x where x.election_id = e.id and x.party_id = p.id);
-- NOTE: this INSERT will silently do nothing for any party abbreviation
-- (TVK, AITC, AIADMK, CPI(M)) that does not already exist in your `parties`
-- table — insert those parties first if they're missing:
insert into parties (name, abbreviation) values
  ('Tamilaga Vettri Kazhagam', 'TVK'),
  ('All India Trinamool Congress', 'AITC'),
  ('All India Anna Dravida Munnetra Kazhagam', 'AIADMK'),
  ('Communist Party of India (Marxist)', 'CPI(M)')
on conflict do nothing;   -- requires a unique constraint on abbreviation to be a true no-op; check first if you don't have one


-- ------------------------------------------------------------
-- 2. UPCOMING ELECTIONS — the calendar cannot stop at May 2026
-- ------------------------------------------------------------
-- Per the ECI's standard 5-year term rule, the next state assembly election
-- due is Goa (current assembly's term runs to ~14 Feb 2027). As of this
-- writing, the ECI has NOT yet notified an official poll schedule for it —
-- only the term-end date is a matter of public record. I'm inserting it as
-- 'upcoming' with that caveat stated plainly in the description, per the
-- no-fabrication rule (do not do this for a date you can't source).

insert into elections (name, region, election_date, status, data_status, source_url, description)
select 'Goa Assembly Election 2027', 'Goa', '2027-02-14', 'upcoming', 'upcoming',
  'https://en.wikipedia.org/wiki/Goa_Legislative_Assembly',
  'The current Goa Legislative Assembly''s term ends around 14 February 2027 (5 years from its first sitting). The Election Commission of India has not yet notified an official polling schedule — this date is the constitutional term-end, not a confirmed poll date. Update election_date and source_url once the ECI announces the schedule.'
where not exists (select 1 from elections where name = 'Goa Assembly Election 2027');

-- Six more states (Uttarakhand, Punjab, Manipur, Uttar Pradesh, Himachal
-- Pradesh, Gujarat) are due in 2027 by the same term-end logic. I have not
-- inserted them because none is within the next few months and their exact
-- term-end dates need one-by-one verification I did not do for all six —
-- ask again closer to when any of them is actually notified, so the record
-- stays exact rather than a batch of unverified guesses.


-- ------------------------------------------------------------
-- 3. CURRENT POLITICIAN ROSTER — real, sourced, current roles only
-- ------------------------------------------------------------
-- Every change below is a real office change that happened after this
-- project's earlier data was written. Nothing here is invented; where I
-- was not confident of a detail (e.g. a full bio), I left it minimal
-- rather than embellish it.

-- 3a. Bihar: Nitish Kumar left the Chief Minister post on 14 April 2026;
-- BJP's Samrat Choudhary became CM the next day. Tejashwi Yadav's role
-- (Leader of Opposition, Bihar) is unchanged.
update politicians set role = 'JD(U) President (Chief Minister, Bihar, until 14 April 2026)'
where slug = 'nitish-kumar';

insert into parties (name, abbreviation) values ('Bharatiya Janata Party', 'BJP')
on conflict do nothing;

insert into politicians (slug, name, role, party_id, bio)
select 'samrat-choudhary', 'Samrat Choudhary', 'Chief Minister, Bihar',
  (select id from parties where abbreviation = 'BJP' limit 1),
  'Became Chief Minister of Bihar on 15 April 2026, succeeding Nitish Kumar.'
where not exists (select 1 from politicians where slug = 'samrat-choudhary');

-- 3b. The 4 new/continuing Chief Ministers from the 2026 state elections
-- (parties inserted above in section 1 if missing):
insert into politicians (slug, name, role, party_id, bio)
select v.slug, v.name, v.role, p.id, v.bio
from (values
  ('himanta-biswa-sarma', 'Himanta Biswa Sarma', 'Chief Minister, Assam', 'BJP', 'Continuing as Chief Minister of Assam after the BJP-led NDA''s third consecutive term win in 2026.'),
  ('suvendu-adhikari', 'Suvendu Adhikari', 'Chief Minister, West Bengal', 'BJP', 'Became Chief Minister of West Bengal on 4 May 2026 after the BJP''s first-ever state win there, defeating incumbent Mamata Banerjee in her own Bhabanipur seat.'),
  ('c-joseph-vijay', 'C. Joseph Vijay', 'Chief Minister, Tamil Nadu', 'TVK', 'Founder of Tamilaga Vettri Kazhagam (TVK); became Chief Minister of Tamil Nadu on 4 May 2026 in the party''s first election.'),
  ('vd-satheesan', 'V. D. Satheesan', 'Chief Minister, Kerala', 'INC', 'Sworn in as Chief Minister of Kerala on 18 May 2026, succeeding Pinarayi Vijayan, after the INC-led UDF''s 2026 win.')
) as v(slug, name, role, party_abbr, bio)
join parties p on p.abbreviation = v.party_abbr
where not exists (select 1 from politicians x where x.slug = v.slug);

-- 3c. NOT changed, but re-verify before assuming: Narendra Modi remains
-- Prime Minister (confirmed current in 2026 election coverage) and Rahul
-- Gandhi's role as Leader of Opposition, Lok Sabha, has no reported change
-- — but I did not independently re-verify the latter this pass. If your
-- roster already has both, leave them as-is; otherwise source that role
-- fresh before inserting rather than trusting this comment alone.

-- 3d. N. Rangaswamy (Puducherry CM, continuing) is NOT included above
-- because I could not fully confirm his current full role/title wording
-- from a single authoritative source this pass — verify at
-- https://en.wikipedia.org/wiki/N._Rangaswamy before adding him.
