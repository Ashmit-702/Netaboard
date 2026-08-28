-- ============================================================
-- NETABOARD — decouple "entity identity" from "election-specific results"
-- Additive. This is the actual fix for the Patna Sahib / Raghopur problem:
-- a constituency's vote share and a party's seat count were stored as bare
-- fields on the entity itself, with no election attached — meaning they
-- always LOOKED current no matter how old they were. Both now live in
-- proper election-linked results tables instead.
-- ============================================================

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
  result_status text default 'declared' check (result_status in ('declared', 'projected', 'disputed')),
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
create policy "public read constituency_election_results" on constituency_election_results for select using (true);
create policy "public read party_election_results" on party_election_results for select using (true);

-- ---------- Add the two real historical elections these results actually belong to ----------
insert into elections (name, region, election_date, status, data_status, result_declared_at, is_archived, description)
values
  ('Bihar Legislative Assembly Election 2020', 'Bihar', '2020-11-10', 'concluded', 'archive', '2020-11-10', true, 'Historical result — the seat counts currently shown in Coalition Builder are from this election.'),
  ('Lok Sabha General Election 2024 (Patna Sahib)', 'Bihar', '2024-06-04', 'concluded', 'archive', '2024-06-04', true, 'Historical result — Patna Sahib is a Lok Sabha constituency, distinct from the Bihar Assembly.');

-- ---------- Migrate constituencies' bare vote_share into properly dated results ----------
-- Patna Sahib -> 2024 Lok Sabha (a Lok Sabha seat, correctly separated from the Assembly election below)
insert into constituency_election_results (constituency_id, election_id, candidate_name, party_id, vote_share, margin, turnout, result_status)
select c.id,
       (select id from elections where name = 'Lok Sabha General Election 2024 (Patna Sahib)'),
       c.current_rep, c.party_id, c.vote_share, c.margin, c.turnout, 'declared'
from constituencies c where c.name = 'Patna Sahib';

-- Raghopur -> 2020 Bihar Assembly (a Vidhan Sabha seat)
insert into constituency_election_results (constituency_id, election_id, candidate_name, party_id, vote_share, margin, turnout, result_status)
select c.id,
       (select id from elections where name = 'Bihar Legislative Assembly Election 2020'),
       c.current_rep, c.party_id, c.vote_share, c.margin, c.turnout, 'declared'
from constituencies c where c.name = 'Raghopur';

-- ---------- Migrate parties.seats_current into the 2020 Bihar Assembly result ----------
insert into party_election_results (party_id, election_id, seats_won)
select p.id, (select id from elections where name = 'Bihar Legislative Assembly Election 2020'), p.seats_current
from parties p where p.region = 'bihar_2020';

-- parties.seats_current / parties.region are kept for backward compatibility
-- with Coalition Builder, which still reads them directly — see the README
-- for the documented follow-up to rewire it onto party_election_results.
comment on column parties.seats_current is 'DEPRECATED for new code — this is the 2020 Bihar Assembly seat count only. Use party_election_results for anything election-specific. Kept for Coalition Builder backward compatibility.';
