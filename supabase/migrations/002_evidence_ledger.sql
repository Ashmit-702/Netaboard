-- ============================================================
-- NETABOARD — Evidence Ledger migration
-- Additive only: nothing existing is dropped or altered. Run this after
-- schema.sql + seed.sql on an existing database, or as part of a fresh setup.
-- ============================================================

-- ---------- CLAIMS ----------
-- The central unit. A promise, a public statement, or a fact-checked
-- assertion are all "claims" — same shape, different claim_type. This is
-- what makes the ledger reusable across Promise Tracker and Fact Check
-- instead of each page inventing its own structure.
create table if not exists claims (
  id uuid primary key default uuid_generate_v4(),
  politician_id uuid references politicians(id) on delete cascade,  -- nullable: a fact-check may not be tied to a politician
  claim_type text not null check (claim_type in ('promise', 'statement', 'fact_check')),
  text text not null,                -- the claim itself, in the claimant's own words where possible
  claimant text,                     -- who said it — defaults to the politician's name if tied to one
  claim_date date,                   -- when it was said/made (not when it was entered into the system)
  source_url text,                   -- where they said it: manifesto, speech transcript, interview
  created_at timestamptz default now()
);

-- ---------- EVIDENCE ----------
-- Multiple, independent pieces of evidence per claim. This is what
-- "traceable" means in practice — every verdict has to point back to
-- specific evidence rows, not just an assertion.
create table if not exists evidence (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid references claims(id) on delete cascade,
  description text not null,         -- what this specific piece of evidence shows
  source_name text,                  -- publisher / agency name
  source_url text,
  source_type text check (source_type in ('news', 'official', 'fact_check', 'government_data', 'social', 'other')),
  stance text not null check (stance in ('supports', 'contradicts', 'neutral')),
  added_at timestamptz default now()
);

-- ---------- VERDICTS ----------
-- Append-only history, not a single mutable field. The latest row per
-- claim_id is the "current" verdict — older rows stay as an audit trail
-- showing how the verdict changed as evidence accumulated.
--
-- confidence is NOT an AI-invented number: it's computed by
-- lib/evidence.js from the evidence rows attached to the claim at the time
-- the verdict was written (see computeConfidence's documented formula).
-- methodology records exactly how that number was derived, in plain text,
-- so it's inspectable rather than a black box.
create table if not exists verdicts (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid references claims(id) on delete cascade,
  status text not null check (status in (
    'fulfilled', 'partially_fulfilled', 'not_fulfilled', 'disputed', 'unverified',
    'true', 'false', 'misleading', 'needs_context'
  )),
  confidence numeric check (confidence between 0 and 100),
  reasoning text,                    -- plain-prose explanation, written by AI or a human reviewer
  methodology text,                  -- exactly how the confidence number above was derived
  verdict_source text not null default 'ai' check (verdict_source in ('ai', 'manual', 'published_source')),
  created_at timestamptz default now()
);

create index if not exists idx_claims_politician on claims(politician_id);
create index if not exists idx_evidence_claim on evidence(claim_id);
create index if not exists idx_verdicts_claim on verdicts(claim_id, created_at desc);

alter table claims enable row level security;
alter table evidence enable row level security;
alter table verdicts enable row level security;

create policy "public read claims" on claims for select using (true);
create policy "public read evidence" on evidence for select using (true);
create policy "public read verdicts" on verdicts for select using (true);
-- Writes go through the server (service role) only — via /api/fact-check and
-- any future admin/ingest tooling — same pattern as stock_prices, daily_briefs.
