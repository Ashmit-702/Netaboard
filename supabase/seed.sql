-- ============================================================
-- NETABOARD — DEMO / LOCAL SEED DATA — OPTIONAL, NOT FOR PRODUCTION
--
-- WARNING: This script DELETES real data in these tables before inserting
-- demo rows. It is meant for a fresh local/demo database only.
--
-- DO NOT run this against a production database with real politicians,
-- promises, evidence, or elections in it — the DELETE statements below
-- will destroy that data irreversibly.
--
-- Production setup only needs schema.sql and supabase/migrations/, in
-- order. This file is entirely optional. See README.md -> "Production
-- setup" vs. "Optional demo data".
-- ============================================================

delete from promises;
delete from timeline_events;
delete from stock_prices;
delete from predictions;
delete from politicians;
delete from parties;
delete from elections;
delete from quiz_questions;
delete from debates;
delete from predictors;

-- ---------- PARTIES (Bihar Legislative Assembly, 2020 result — 243 seats, 122 to govern) ----------
insert into parties (name, abbreviation, color, region, seats_current) values
('Bharatiya Janata Party', 'BJP', '#ffb800', 'bihar_2020', 74),
('Rashtriya Janata Dal', 'RJD', '#00d9a3', 'bihar_2020', 79),
('Janata Dal (United)', 'JD(U)', '#7b84a3', 'bihar_2020', 43),
('Indian National Congress', 'Congress', '#5b8def', 'bihar_2020', 19),
('Lok Janshakti Party (Ram Vilas)', 'LJP(RV)', '#e05b8e', 'bihar_2020', 5),
('Hindustani Awam Morcha', 'HAM', '#c98bff', 'bihar_2020', 4),
('Vikassheel Insaan Party', 'VIP', '#4dd2ff', 'bihar_2020', 4),
('Independents', 'IND', '#9aa3bd', 'bihar_2020', 15);

-- ---------- POLITICIANS ----------
insert into politicians (slug, name, role, party_id, bio) values
('narendra-modi', 'Narendra Modi', 'Prime Minister of India', (select id from parties where abbreviation='BJP'), 'Prime Minister since 2014, MP from Varanasi.'),
('nitish-kumar', 'Nitish Kumar', 'Chief Minister, Bihar', (select id from parties where abbreviation='JD(U)'), 'Chief Minister of Bihar across multiple terms since 2005.'),
('tejashwi-yadav', 'Tejashwi Yadav', 'Leader of Opposition, Bihar', (select id from parties where abbreviation='RJD'), 'RJD leader and former Deputy Chief Minister of Bihar.'),
('rahul-gandhi', 'Rahul Gandhi', 'Leader of Opposition, Lok Sabha', (select id from parties where abbreviation='Congress'), 'Congress MP and party leader.');

-- ---------- PROMISE TRACKER ----------
insert into promises (politician_id, text, status, source_url) values
((select id from politicians where slug='narendra-modi'), 'Ram Mandir construction in Ayodhya', 'done', 'https://en.wikipedia.org/wiki/Ram_Mandir'),
((select id from politicians where slug='narendra-modi'), 'Revocation of Article 370 in Jammu & Kashmir', 'done', 'https://en.wikipedia.org/wiki/Article_370'),
((select id from politicians where slug='narendra-modi'), 'Uniform Civil Code nationwide', 'partial', null),
((select id from politicians where slug='narendra-modi'), 'Two crore jobs a year', 'broken', null),
((select id from politicians where slug='nitish-kumar'), 'Statewide liquor prohibition', 'done', null),
((select id from politicians where slug='nitish-kumar'), 'Bijli-Sadak-Pani infrastructure push', 'partial', null),
((select id from politicians where slug='nitish-kumar'), 'Jeevika women self-help group expansion', 'done', null),
((select id from politicians where slug='nitish-kumar'), 'Special Category Status for Bihar', 'broken', null),
((select id from politicians where slug='tejashwi-yadav'), '10 lakh government jobs pledge', 'partial', null),
((select id from politicians where slug='rahul-gandhi'), 'NYAY minimum income guarantee scheme', 'broken', null);

-- ---------- TIMELINE (sample) ----------
insert into timeline_events (politician_id, event_date, title, category) values
((select id from politicians where slug='nitish-kumar'), '2005-11-24', 'First sworn in as Bihar Chief Minister', 'cabinet'),
((select id from politicians where slug='nitish-kumar'), '2016-04-05', 'Statewide alcohol prohibition enforced', 'achievement'),
((select id from politicians where slug='tejashwi-yadav'), '2015-11-20', 'Sworn in as Deputy Chief Minister of Bihar', 'cabinet'),
((select id from politicians where slug='narendra-modi'), '2024-01-22', 'Inaugurated Ram Mandir in Ayodhya', 'achievement');

-- No demo election is seeded. A previous version of this file created a
-- fictional "Bihar Assembly Election 2026" here — even though a later
-- migration flagged it is_demo, running schema.sql + seed.sql ALONE (no
-- migrations) would have surfaced it as a real current election, which is
-- exactly what this app is built not to do. If you want a demo election to
-- exercise Election Watch, add one explicitly and mark it is_demo = true
-- from the start (see supabase/migrations/008_mark_demo_election.sql for
-- the column) — don't rely on a later migration to retroactively fix it.

-- ---------- POLITICAL ATTENTION ----------
insert into stock_prices (politician_id, price, change_pct, reason) values
((select id from politicians where slug='narendra-modi'), 187.40, 3.1, 'Positive coverage after infrastructure announcement'),
((select id from politicians where slug='nitish-kumar'), 92.10, -1.4, 'Coalition friction reported'),
((select id from politicians where slug='tejashwi-yadav'), 104.60, 4.2, 'Strong rally turnout in Bihar'),
((select id from politicians where slug='rahul-gandhi'), 78.30, -0.6, 'Mixed reception to campaign speech');

-- ---------- QUIZ ----------
insert into quiz_questions (question, options, correct_index, category) values
('How many seats are in the Bihar Legislative Assembly?', '["203","243","288","403"]', 1, 'structure'),
('How many seats are needed for a majority in a 243-seat assembly?', '["120","121","122","125"]', 2, 'structure'),
('In which year was Article 370 revoked?', '["2017","2018","2019","2020"]', 2, 'history');

-- ---------- DEBATE ARENA ----------
insert into debates (topic) values
('Should India adopt a Uniform Civil Code nationwide?');

-- ---------- LEADERBOARD ----------
insert into predictors (display_name, accuracy_pct, predictions_made) values
('Ashmit R.', 92, 41), ('Rahul K.', 90, 37), ('Ananya S.', 88, 52), ('Devansh P.', 85, 29), ('Meher I.', 83, 33);
