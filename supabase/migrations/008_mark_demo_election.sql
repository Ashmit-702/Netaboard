-- ============================================================
-- NETABOARD — explicit demo/illustrative flag for elections
-- Additive. Distinguishes "real historical event" (is_archived) from
-- "fabricated example data that should never be presented as real,
-- regardless of its date" (is_demo). "Bihar Assembly Election 2026" was
-- created as a working example early in this project, with fabricated
-- prediction numbers — it is not a real tracked election and must never
-- surface as current. Flagged here rather than deleted, since deleting it
-- would cascade-orphan the example predictions/politician links seeded
-- alongside it, and this is meant to be inspectable, not silently erased.
-- ============================================================

alter table elections add column if not exists is_demo boolean default false;

update elections set is_demo = true, data_status = 'archive'
where name = 'Bihar Assembly Election 2026';

comment on column elections.is_demo is 'true = fabricated example data, never real. The election selector (lib/electionSelector.js) excludes these from every tier, including the archive fallback — they should never be presented as current or historical-real.';
