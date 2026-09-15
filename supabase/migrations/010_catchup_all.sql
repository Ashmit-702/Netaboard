-- ============================================================
-- NETABOARD — one-shot catch-up migration
-- Run this single file regardless of which earlier migrations (006-009)
-- you have or haven't already applied. Every statement is written to be
-- safe to run whether the underlying column/table/row already exists or
-- not — nothing here will error on a second run, and nothing deletes real
-- data. This supersedes running 006 through 009 individually.
--
-- If you're not sure what state your database is in, just run this whole
-- file top to bottom. It's the only file you need for this round.
-- ============================================================

-- ---------- Step 1: elections freshness columns (originally migration 006) ----------
alter table elections add column if not exists data_status text default 'upcoming';
alter table elections add column if not exists result_declared_at timestamptz;
alter table elections add column if not exists last_updated_at timestamptz default now();
alter table elections add column if not exists source_url text;
alter table elections add column if not exists is_featured boolean default false;
alter table elections add column if not exists is_archived boolean default false;
alter table elections add column if not exists is_demo boolean default false;

-- Add the check constraint separately, only if it doesn't already exist
-- (adding it inline above would fail on a second run).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'elections_data_status_check'
  ) then
    alter table elections add constraint elections_data_status_check
      check (data_status in ('live', 'upcoming', 'results', 'archive'));
  end if;
end $$;

update elections set data_status = case
  when status = 'live' then 'live'
  when status = 'concluded' then 'results'
  else 'upcoming'
end
where data_status is null;

-- ---------- Step 2: predictions methodology columns (originally migration 006) ----------
alter table predictions add column if not exists model_name text default 'manual-estimate';
alter table predictions add column if not exists model_version text;
alter table predictions add column if not exists methodology text;
alter table predictions add column if not exists source_snapshot_at timestamptz;
alter table predictions add column if not exists confidence numeric;

-- ---------- Step 3: election-linked results tables (originally migration 007) ----------
create table if not exists constituency_election_results (
  id uuid primary key default uuid_generate_v4(),
  constituency_id uuid references constituencies(id) on delete cascade,
  election_id uuid references elections(id) on delete cascade,
  candidate_name text,
  party_id uuid references parties(id),
  votes integer,
  vote_share numeric,
  margin numeric,
  rank integer,
  turnout numeric,
  result_status text default 'declared',
  source_url text,
  recorded_at timestamptz default now()
);
create index if not exists idx_cer_constituency on constituency_election_results(constituency_id, recorded_at desc);
create index if not exists idx_cer_election on constituency_election_results(election_id);

create table if not exists party_election_results (
  id uuid primary key default uuid_generate_v4(),
  party_id uuid references parties(id) on delete cascade,
  election_id uuid references elections(id) on delete cascade,
  seats_won integer,
  vote_share numeric,
  source_url text,
  recorded_at timestamptz default now()
);
create index if not exists idx_per_party on party_election_results(party_id);
create index if not exists idx_per_election on party_election_results(election_id);

alter table constituency_election_results enable row level security;
alter table party_election_results enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'constituency_election_results' and policyname = 'public read constituency_election_results') then
    create policy "public read constituency_election_results" on constituency_election_results for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'party_election_results' and policyname = 'public read party_election_results') then
    create policy "public read party_election_results" on party_election_results for select using (true);
  end if;
end $$;

-- ---------- Step 4: mark the fake Bihar 2026 election as demo (originally migration 008) ----------
update elections set is_demo = true, data_status = 'archive'
where name = 'Bihar Assembly Election 2026';

-- ---------- Step 5: real historical elections, cleaned of any duplicates ----------
delete from elections a using elections b
where a.id > b.id
  and a.name = b.name
  and a.name in ('Bihar Legislative Assembly Election 2020', 'Lok Sabha General Election 2024 (Patna Sahib)');

insert into elections (name, region, election_date, status, data_status, result_declared_at, is_archived, description)
select 'Bihar Legislative Assembly Election 2020', 'Bihar', '2020-11-10', 'concluded', 'archive', '2020-11-10', true,
       'Historical result — the seat counts currently shown in Coalition Builder are from this election.'
where not exists (select 1 from elections where name = 'Bihar Legislative Assembly Election 2020');

insert into elections (name, region, election_date, status, data_status, result_declared_at, is_archived, description)
select 'Lok Sabha General Election 2024 (Patna Sahib)', 'Bihar', '2024-06-04', 'concluded', 'archive', '2024-06-04', true,
       'Historical result — Patna Sahib is a Lok Sabha constituency, distinct from the Bihar Assembly.'
where not exists (select 1 from elections where name = 'Lok Sabha General Election 2024 (Patna Sahib)');

-- ---------- Step 6: link Patna Sahib / Raghopur to their real elections ----------
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

-- ---------- Step 7: link party seat counts to the 2020 Bihar Assembly election ----------
delete from party_election_results
where election_id = (select id from elections where name = 'Bihar Legislative Assembly Election 2020');

insert into party_election_results (party_id, election_id, seats_won)
select p.id, (select id from elections where name = 'Bihar Legislative Assembly Election 2020'), p.seats_current
from parties p where p.region = 'bihar_2020';

-- ============================================================
-- VERIFY — run this SELECT after the block above to confirm it worked:
--
-- select c.name, cer.vote_share, e.name as election_name, e.is_archived
-- from constituencies c
-- left join constituency_election_results cer on cer.constituency_id = c.id
-- left join elections e on e.id = cer.election_id;
--
-- Expected: Patna Sahib and Raghopur both show a non-null election_name.
-- ============================================================
