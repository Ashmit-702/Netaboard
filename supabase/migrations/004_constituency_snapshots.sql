-- ============================================================
-- NETABOARD — constituency history tracking
-- Additive. Needed so Constituency Watch can show real movement (71% -> 67%)
-- instead of a single static number. Until at least 2 snapshots exist for a
-- constituency, the "What Changed" layer correctly shows nothing for it —
-- that's honest behavior, not a bug, per the no-fabricated-data rule.
-- ============================================================
create table if not exists constituency_snapshots (
  id uuid primary key default uuid_generate_v4(),
  constituency_id uuid references constituencies(id) on delete cascade,
  probability_estimate numeric,     -- current leading party's estimated win probability, if modeled
  vote_share_estimate numeric,      -- or, more simply, an updated vote-share estimate
  reason text,                      -- what changed it: "regional swing", "new polling", etc — filled in by whoever takes the snapshot, never invented downstream
  recorded_at timestamptz default now()
);

create index if not exists idx_constituency_snapshots on constituency_snapshots(constituency_id, recorded_at desc);

alter table constituency_snapshots enable row level security;
create policy "public read constituency_snapshots" on constituency_snapshots for select using (true);

-- Seed exactly one snapshot per existing constituency, mirroring its current
-- vote_share — a single point, not movement. This deliberately does NOT
-- fabricate a second historical point, so Constituency Watch starts honest:
-- empty until real snapshots accumulate.
insert into constituency_snapshots (constituency_id, vote_share_estimate, reason)
select id, vote_share, 'Initial snapshot at launch — no prior data to compare against.'
from constituencies;
