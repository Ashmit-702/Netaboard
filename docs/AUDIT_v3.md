# NetaBoard — Audit & Changes (this pass, v3)

Performed on the actual `netaboard_v2` tree (verified identical file-for-file
to what was delivered last pass — no new ZIP was uploaded this turn, so this
IS "the current ZIP" the brief refers to), not from memory of what was
reported before.

## CURRENT ARCHITECTURE
Confirmed working: the full Current Affairs → Trending Now → Issue Watch →
Daily Brief pipeline, Elections (LIVE/UPCOMING/RESULTS/ARCHIVE), Evidence
ledger, Political Attention, and all 18 (now 19) unit tests. Nothing here
needed rebuilding — this pass is consolidation, per the brief.

## STALE / OBSOLETE (found this pass)
- `supabase/schema.sql` still read as the *original* schema — no mention of
  `claims/evidence/verdicts`, election freshness columns, or `is_demo` (all
  migration-only), and `constituencies`/`geopolitical_risk` weren't marked
  as dead. **Fixed**: added `DEPRECATED/HISTORICAL` comments on
  `constituencies`, `geopolitical_risk`, and `parties.region`/`seats_current`
  (confirmed dead — `lib/data.js:getParties()` reads `party_election_results`
  instead), and a header note explaining schema.sql + migrations together
  are the real current shape. Nothing dropped.
- Demo seed's Nitish Kumar bio read as current ("Chief Minister of Bihar...
  since 2005") but he left that post 14 April 2026 (sourced below). **Fixed**:
  bio rewritten in the past tense, plus a header note explaining this is a
  frozen 2020-shaped example, not current politics, pointing to
  `SUPABASE_CHANGES_v3.sql` for a real roster.
- Homepage never rendered `TodayTabs` — Daily Brief/Current Affairs/Trending
  Now/Issue Watch had no secondary nav from `/`. **Fixed**: `TodayTabs`
  added directly under the masthead on `/`.
- `/politicians` used a `.grid-3` card grid (spreadsheet-like). **Fixed**:
  rewritten as compact editorial rows — Name/Role/Party, attention movement,
  accountability, evidence coverage — matching the brief's §19 spec exactly.
  Trending Netas stays the first major section.
- Issue Watch had no "Context" section. **Fixed**: `lib/issues/issue-watch.js`
  now computes a templated `context.established`/`context.unresolved`
  synthesis from *only* structural facts already computed elsewhere (outlet
  count, coverage span, number of distinct headlines, whether coverage is
  still active, whether any outlet published a fuller account than the
  headline). It never asserts a cause, motive, effect, or political
  conclusion — a new test (`tests/unit/engine.test.mjs`) asserts the output
  never contains "because/caused by/responsible/blame/likely due to".

## SUPABASE STATUS
**NO SCHEMA CHANGES REQUIRED.** Every fix above is a comment/documentation
change to the repo's `schema.sql`, or a demo-only seed fix — neither touches
a live database.

**DATA changes ARE warranted** — see `docs/SUPABASE_CHANGES_v3.sql`
(not auto-run by anything). Summary, each sourced and dated:
- The 2026 state elections (Assam, Kerala, TN, West Bengal, Puducherry) are
  real results as of 4 May 2026, but the DB (per migration 005) has them as
  bare `'concluded'` rows with zero result data. SQL provided to add
  `result_declared_at`, `source_url`, and (for West Bengal, Tamil Nadu,
  Kerala, where I could verify exact seat counts) `party_election_results`
  rows. Assam and Puducherry results are described but I explicitly did
  **not** guess their exact seat counts.
- No election due after May 2026 existed in the DB at all. The real next
  state election (Goa, term ends ~14 Feb 2027) is proposed as an `upcoming`
  row, with the description stating plainly that the ECI has not yet
  notified an exact poll date — the term-end date is not presented as a
  confirmed one.
- Bihar's Chief Minister changed on 14/15 April 2026 (Nitish Kumar → Samrat
  Choudhary) — real, dated, sourced. SQL provided to correct the existing
  `nitish-kumar` row and add `samrat-choudhary`.
- Four new/continuing state Chief Ministers from the 2026 elections
  (Himanta Biswa Sarma – Assam, Suvendu Adhikari – West Bengal, C. Joseph
  Vijay – Tamil Nadu, V. D. Satheesan – Kerala) are proposed with sourced,
  minimal, factual bios. Puducherry's N. Rangaswamy is deliberately **not**
  included — I could not fully confirm his current title wording from one
  authoritative source this pass, and the brief is explicit that unverified
  roles must not be inserted.

## UI / PRODUCT GAPS
Addressed: homepage nav discoverability, Politicians page layout, Issue
Watch Context. Everything else in the brief (Trending Netas ≠ popularity
language, no source clutter, redirects, "What Changed" honesty, freshness
states) was already correct from the prior pass and is unchanged.

## Tests actually executed
- `npm test`: **19/19 passing** (18 from before + 1 new: Issue Watch Context
  is structural-only, asserted by regex against invented-causality language).
- `npm run build`: clean, 33 pages, 0 errors (had to `npm install` first —
  `node_modules` had been removed before the previous ZIP was packaged).
- Full route sweep on the rebuilt server (demo mode, no Supabase/news keys):
  every primary page **200**, all five legacy redirects **307** to the
  correct destination, a nonexistent politician slug **200** with the honest
  "couldn't be loaded" state (not a false 404, not a stale fallback).
- Rendered-HTML term scan of every page: no "Bihar Assembly Election 2026" /
  "Patna Sahib" / "Raghopur" / "bihar_2020" / stock-market language anywhere.
  Vendor names (GNews, GDELT, Supabase) still appear only on `/about`
  (methodology/colophon page — same judgment call flagged last pass).
- **Not run** (no live Supabase project or news-provider keys available in
  this sandbox): the actual SQL in `SUPABASE_CHANGES_v3.sql` was written and
  reasoned through carefully but **not executed against any database** —
  you should review it, ideally on a staging copy, before running it on
  production.

## Files changed this pass
`app/page.js` (TodayTabs), `app/politicians/page.js` (rewritten),
`lib/issues/issue-watch.js` (+context), `components/IssueWatch.js`
(+Context section), `tests/unit/engine.test.mjs` (+1 test),
`supabase/schema.sql` (deprecation comments only), `supabase/demo/seed.sql`
(header note + Nitish Kumar bio correction), `docs/AUDIT_v3.md` (this file),
`docs/SUPABASE_CHANGES_v3.sql` (new, not auto-run).
