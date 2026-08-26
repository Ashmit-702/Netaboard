-- ============================================================
-- NETABOARD — real 2026 state elections, added honestly
-- Additive. These 5 states held assembly elections in April 2026, with
-- results declared 4 May 2026 (Election Commission of India). NetaBoard
-- has NOT loaded detailed constituency-level results for them — that's
-- stated plainly rather than fabricated. This gives the Election Watch
-- selector (lib/electionWatch.js) real, multiple elections to choose
-- between instead of a single permanently-featured state.
-- ============================================================

insert into elections (name, region, election_date, status, description) values
('Assam Assembly Election 2026', 'Assam', '2026-05-04', 'concluded', 'Results declared 4 May 2026. Detailed constituency-level results not yet loaded into NetaBoard.'),
('Kerala Assembly Election 2026', 'Kerala', '2026-05-04', 'concluded', 'Results declared 4 May 2026. Detailed constituency-level results not yet loaded into NetaBoard.'),
('Tamil Nadu Assembly Election 2026', 'Tamil Nadu', '2026-05-04', 'concluded', 'Results declared 4 May 2026. Detailed constituency-level results not yet loaded into NetaBoard.'),
('West Bengal Assembly Election 2026', 'West Bengal', '2026-05-04', 'concluded', 'Results declared 4 May 2026. Detailed constituency-level results not yet loaded into NetaBoard.'),
('Puducherry Assembly Election 2026', 'Puducherry', '2026-05-04', 'concluded', 'Results declared 4 May 2026. Detailed constituency-level results not yet loaded into NetaBoard.');
-- No ON CONFLICT clause: `elections` has no unique constraint on name/date
-- (by design, to allow re-runs of an election). This migration is meant to
-- run once — re-running it will insert duplicate rows.

-- No prediction rows are added for these five deliberately — the Election
-- Watch selector requires a concluded election to have a real post-result
-- data point before it can be chosen over an upcoming election with active
-- data. Add real result data later (e.g. via a `predictions` row dated on
-- or after election_date) to make one of these selectable.
