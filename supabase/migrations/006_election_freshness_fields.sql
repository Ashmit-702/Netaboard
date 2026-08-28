-- ============================================================
-- NETABOARD — election freshness fields (additive)
-- Fixes the actual root cause of stale-looking data: `elections` and
-- `predictions` had no way to express WHEN something was true, or how
-- confident/sourced a prediction is. Adding that structurally here rather
-- than inferring freshness from names/dates in the frontend.
-- ============================================================

alter table elections add column if not exists data_status text default 'upcoming'
  check (data_status in ('live', 'upcoming', 'results', 'archive'));
alter table elections add column if not exists result_declared_at timestamptz;
alter table elections add column if not exists last_updated_at timestamptz default now();
alter table elections add column if not exists source_url text;
alter table elections add column if not exists is_featured boolean default false;
alter table elections add column if not exists is_archived boolean default false;

-- Backfill data_status from the existing status column so nothing breaks.
update elections set data_status = case
  when status = 'live' then 'live'
  when status = 'concluded' then 'results'
  else 'upcoming'
end
where data_status is null or data_status = 'upcoming';

alter table predictions add column if not exists model_name text default 'manual-estimate';
alter table predictions add column if not exists model_version text;
alter table predictions add column if not exists methodology text;
alter table predictions add column if not exists source_snapshot_at timestamptz;
alter table predictions add column if not exists confidence numeric check (confidence between 0 and 100);

comment on column predictions.model_name is 'Defaults to manual-estimate — this app does not currently run an automated forecasting model. Change this only when a real model actually produces the row.';
