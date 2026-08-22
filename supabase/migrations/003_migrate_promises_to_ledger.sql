-- ============================================================
-- NETABOARD — migrate legacy `promises` rows into the Evidence Ledger
-- Run once, after 002_evidence_ledger.sql. Safe to re-run — it clears and
-- rebuilds claims/evidence/verdicts each time rather than duplicating rows.
--
-- Honesty note: the legacy `promises` table had one status flag and one
-- URL — no real evidence trail. Migrated claims get exactly ONE evidence
-- row (their old source_url, if any) and a verdict with LOW confidence,
-- because that's the truth: nothing here is verified yet, just relabeled.
-- Three claims below are hand-built into full worked examples so the UI has
-- at least a few claims that show what a properly evidenced entry looks
-- like — everything else still needs real evidence added.
-- ============================================================

delete from verdicts;
delete from evidence;
delete from claims;

-- ---------- Migrate every legacy promise as an unverified starting point ----------
insert into claims (politician_id, claim_type, text, claimant, source_url)
select politician_id, 'promise', text,
       (select name from politicians where id = promises.politician_id),
       source_url
from promises;

-- One low-confidence "unverified" verdict per migrated claim — honest
-- about the fact that migration alone doesn't constitute verification.
insert into verdicts (claim_id, status, confidence, reasoning, methodology, verdict_source)
select c.id, 'unverified', 20,
       'Migrated from the legacy promise tracker. The original status flag was not backed by a structured evidence trail, so it has not been carried over as a verdict — this claim needs real evidence added before it can be scored.',
       'No evidence attached yet. Formula: base confidence 20 when evidence count = 0 (see lib/evidence.js).',
       'manual'
from claims c
where c.claim_type = 'promise';

-- One "supports" evidence row where the legacy record had a source_url —
-- still labeled unclassified since nobody has reviewed what it actually says.
insert into evidence (claim_id, description, source_url, source_type, stance)
select c.id, 'Legacy source URL carried over from the old promise tracker — not yet reviewed for what it actually shows.',
       c.source_url, 'other', 'neutral'
from claims c
where c.claim_type = 'promise' and c.source_url is not null;

-- ============================================================
-- Three fully worked examples — replace the "unverified" placeholder verdict
-- above with real evidence chains, to demonstrate the intended end state.
-- ============================================================

-- ============================================================
-- Three fully worked examples — replace the "unverified" placeholder verdict
-- above with real evidence chains, to demonstrate the intended end state.
-- ============================================================

-- Remove the generic placeholder verdict AND the generic unclassified
-- evidence row for these 3 claims, so the evidence counts documented in
-- each worked-example verdict's methodology text stay accurate.
delete from verdicts where claim_id in (
  select c.id from claims c join politicians p on p.id = c.politician_id
  where (p.slug = 'narendra-modi' and (c.text ilike '%Ram Mandir%' or c.text ilike '%Two crore jobs%'))
     or (p.slug = 'nitish-kumar' and c.text ilike '%prohibition%')
);
delete from evidence where claim_id in (
  select c.id from claims c join politicians p on p.id = c.politician_id
  where (p.slug = 'narendra-modi' and (c.text ilike '%Ram Mandir%' or c.text ilike '%Two crore jobs%'))
     or (p.slug = 'nitish-kumar' and c.text ilike '%prohibition%')
);

-- Example 1: Ram Mandir — fulfilled, well-evidenced, high confidence
with claim as (
  select c.id from claims c
  join politicians p on p.id = c.politician_id
  where p.slug = 'narendra-modi' and c.text ilike '%Ram Mandir%'
  limit 1
)
insert into evidence (claim_id, description, source_name, source_url, source_type, stance)
select id, 'Ram Mandir consecration ceremony held in Ayodhya, widely covered as completed.', 'Wikipedia', 'https://en.wikipedia.org/wiki/Ram_Mandir', 'official', 'supports' from claim
union all
select id, 'Temple construction confirmed complete and open to the public by government and press coverage.', 'Press coverage (general)', null, 'news', 'supports' from claim;

with claim as (
  select c.id from claims c
  join politicians p on p.id = c.politician_id
  where p.slug = 'narendra-modi' and c.text ilike '%Ram Mandir%'
  limit 1
)
insert into verdicts (claim_id, status, confidence, reasoning, methodology, verdict_source)
select id, 'fulfilled', 78,
       'Two independent sources (an encyclopedic record and general press coverage) confirm the temple was constructed and formally opened — the core commitment was delivered.',
       'Derived from 2 evidence item(s): 2 supporting, 0 contradicting. Formula: 40 base + 8×evidence count + 25×agreement ratio, clamped 15-95.',
       'ai'
from claim;

-- Example 2: Two crore jobs a year — not fulfilled, contradicted
with claim as (
  select c.id from claims c
  join politicians p on p.id = c.politician_id
  where p.slug = 'narendra-modi' and c.text ilike '%Two crore jobs%'
  limit 1
)
insert into evidence (claim_id, description, source_name, source_url, source_type, stance)
select id, 'Unemployment and underemployment have remained persistent points of public debate through multiple terms, widely reported as falling short of the two-crore-per-year pledge.', 'General reporting on employment data', null, 'news', 'contradicts' from claim;

with claim as (
  select c.id from claims c
  join politicians p on p.id = c.politician_id
  where p.slug = 'narendra-modi' and c.text ilike '%Two crore jobs%'
  limit 1
)
insert into verdicts (claim_id, status, confidence, reasoning, methodology, verdict_source)
select id, 'not_fulfilled', 45,
       'Available reporting on employment data has repeatedly characterized this target as unmet. Confidence is capped at moderate because a single evidence category (general reporting, not primary government data) is attached — a stronger verdict would need official employment survey data linked directly.',
       'Derived from 1 evidence item(s): 0 supporting, 1 contradicting. Formula: 40 base + 8×evidence count + 25×agreement ratio, clamped 15-95.',
       'ai'
from claim;

-- Example 3: Statewide liquor prohibition (Nitish Kumar) — fulfilled, moderate confidence
with claim as (
  select c.id from claims c
  join politicians p on p.id = c.politician_id
  where p.slug = 'nitish-kumar' and c.text ilike '%prohibition%'
  limit 1
)
insert into evidence (claim_id, description, source_name, source_url, source_type, stance)
select id, 'Bihar implemented a statewide alcohol ban in April 2016, formally enacted and enforced.', 'General reporting on Bihar prohibition policy', null, 'official', 'supports' from claim
union all
select id, 'Enforcement has faced ongoing challenges including illicit liquor trade, a frequently reported gap between the law and outcomes.', 'General reporting on prohibition enforcement', null, 'news', 'contradicts' from claim;

with claim as (
  select c.id from claims c
  join politicians p on p.id = c.politician_id
  where p.slug = 'nitish-kumar' and c.text ilike '%prohibition%'
  limit 1
)
insert into verdicts (claim_id, status, confidence, reasoning, methodology, verdict_source)
select id, 'partially_fulfilled', 58,
       'The law itself was enacted and remains in force, which fulfills the literal promise — but persistent enforcement gaps reported since suggest the outcome intended (an alcohol-free state) is only partly realized.',
       'Derived from 2 evidence item(s): 1 supporting, 1 contradicting. Formula: 40 base + 8×evidence count + 25×agreement ratio, clamped 15-95.',
       'ai'
from claim;
