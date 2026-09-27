# NetaBoard — Changes in this pass

Everything below was verified against the actual files in this ZIP, not
assumed from a prior report — see `docs/AUDIT.md` for the starting point and
"Tests actually executed" below for how it was verified.

## New: Current Affairs system (`docs 1 & 2` in the brief)

- **`lib/news/`** — `ingest.js` (per-provider fetch: GNews, NewsData,
  Currents, Guardian, GDELT — each independent, one query per provider per
  refresh; GDELT needs no key), `normalize.js` (HTML/entity stripping,
  URL+title de-dup, future-date rejection, outlet = registrable domain so a
  publisher group is one independence unit), `cluster.js` (headline-overlap
  + acronym/name-entity linking with a burstiness test so a standing entity
  like a party name can't merge unrelated stories; bridge articles join the
  cluster they share the most links with), `rank.js` (freshness/breadth/
  depth/momentum score, BREAKING/DEVELOPING labelling, the 48–72h currency
  window).
- **`lib/current-affairs/`** — `categorize.js` (rule-based topic/region
  classification — no per-topic API calls), `politicians.js` (literal
  full-name match only, ≥2 mentions or in the lead headline — never
  inferred), `feed.js` (turns clusters into Current Affairs items,
  deterministic lead-picking, extractive summaries only — never invented),
  `search.js` (search/sort over clusters), `get.js` (the one network entry
  point, cached via `unstable_cache` so the homepage/`/current-affairs`/
  `/brief`/`/issue-watch` share one ingest per revalidation window; throws
  rather than caches a total failure, so it retries instead of freezing an
  error state for 15 minutes).
- **`lib/issues/trending.js`** — Trending Now: recent-outlet momentum vs.
  the prior window, distinct from importance.
- **`lib/issues/issue-watch.js`** — 1–2 deep dives per the brief's exact
  shape (what happened / what changed / timeline / related / named
  politicians). Deliberately **excludes** "why it matters" and "who is
  affected" — generating those would require interpretation this layer is
  built not to add (see "Known gaps" below).
- **`lib/brief/generate.js`** (pure) + **`get.js`** — Today's Brief is
  built from the *same* engine; `/api/daily-brief` now calls
  `getCurrentAffairs()` + `generateBrief()` and stores only an *optional*
  AI-written one-sentence-per-story overlay, strictly keyed to story ids the
  engine already picked (an id the engine didn't emit is dropped, so the AI
  can restate but never add/remove/reorder stories). No "Demo brief…" row is
  ever stored.
- **New pages**: `/current-affairs` (filters, search, Latest/Most-important
  sort — data-driven filter chips), `/issue-watch` (full timelines),
  `/brief`. `TodayTabs` ties them together under "Today" in the nav.
- **`lib/time.js`** — single source of truth for relative ("8 min ago" /
  "Yesterday" as a real IST calendar day) and absolute (IST) time,
  self-updating client-side via `RelTime`.

## Feature removal / renames

- **Constituencies**: no page/component existed already; `/constituencies`
  and `/heatmap` now redirect to `/elections` and `/explore` respectively
  (307, real HTTP redirects, verified with `curl`).
- **Geopolitical Risk**: confirmed absent from nav/routes/data layer; the
  unused `geopolitical_risk` table is left in `schema.sql` as inert,
  documented dead schema (dropping a live table is a Supabase action this
  pass does not take unasked).
- **Political Stock Market → Political Attention**: `/stock-market` →
  `/attention` (redirect kept), `/api/stock-refresh` → `/api/attention-refresh`
  (old path now re-exports the same handler so an existing Vercel Cron
  entry keeps authenticating). `lib/attention.js` is new: trending
  selection (fresh + ≥1% movement), neutral-labelled factor breakdown. No
  "stock/buy/sell/market cap" language anywhere in the UI (verified by
  scanning every rendered page).
- **`lib/social.js`**: Hacker News now queries the last 24h
  (`search_by_date` + a time filter) instead of all-time hits.

## Elections

- **`lib/elections/classify.js`** (pure) — LIVE / UPCOMING / RESULTS /
  ARCHIVE / NOT_ENOUGH_DATA from real status/date/flags only, `is_demo`
  excluded outright, years never mixed, a stale "live" flag surfaced rather
  than trusted blindly.
- **`lib/elections/get.js`** — Supabase reads, no fallback of any kind.
- **New `/elections` and `/elections/[id]`** pages; `/calendar` now reuses
  the same module (its hardcoded "Bihar Legislative Assembly Election 2020"
  / "Tamil Nadu Assembly Election 2026" fallback rows are **removed** — an
  empty database now shows a genuinely empty calendar, not fabricated
  elections); `/predictions` and `/market` rewired off the same module
  (the deleted `lib/electionWatch.js`'s single function is now
  `selectElectionWatch()`).
- `/coalition`'s fabricated 243-seat default is removed; a database with no
  election-linked seat data now says so, instead of assuming a Bihar-sized
  assembly.

## Evidence

- **`lib/evidenceFeed.js`** (new) — recent claims + `pickFeaturedClaim()`,
  which only promotes a claim to the homepage if it has a published-source
  verdict or real attached evidence and is recent — an anonymous, unbacked
  AI-only fact-check is never front-paged.
- **New `/evidence` hub** (claims → evidence → verdicts, plus the existing
  fact-check form, moved here from `/fact-check`, which now redirects).
- `lib/evidence.js` gained `recentClaimChanges()` for the homepage's "What
  Changed" section; `EvidenceLedgerItem`'s `"null% confidence"` bug is
  fixed.
- `/api/fact-check` gained a per-IP rate limit (10 / 10 min), an 800-char
  cap, and a 15-char floor before writing to the ledger.

## What Changed / homepage

- **`lib/changes.js`** rewritten: election-prediction deltas, promise
  status changes, new evidence, new fact-check verdicts (only ones with
  real backing), and attention movement — every item real, dated, and
  window-limited to the last 14 days. Nothing is sampled or invented.
- **`app/page.js`** rebuilt end-to-end on the target architecture and
  section order from the brief (Today's Brief → Current Affairs → Trending
  Now → Issue Watch → Trending Netas → What Changed → The Evidence →
  Election Watch → Accountability → Ask NetaBoard), each section rendering
  its own honest empty/failed state independently.

## Data layer — no fallback data anywhere

`lib/fallback.js`, `lib/news.js` (old), `lib/trending.js`, and
`lib/electionWatch.js` are **deleted**. `lib/data.js` is rewritten so every
function returns either real data or an explicit unavailable/empty result
(`{ ok, ... }` or `{ status, ... }`); a database failure never displays as
content and a real 404 is never confused with a transient outage (fixes the
Rahul Gandhi 404-vs-fallback class of bug directly — his page, like every
politician's, now reads only from the database and shows an honest
"couldn't be loaded" state if Supabase is unset or errors, rather than
either a stale fallback map or a false 404).

## SQL safety

- **`supabase/demo/seed.sql`** (moved out of `supabase/` top level, which
  previously sat next to `schema.sql`/`migrations/` where a future agent
  could mistake it for part of production setup). Its `region='bihar_2020'`
  tag is changed to `'demo-2020'`. Its destructive `DELETE FROM …`
  statements are unchanged (they are documented, demo-only, and this file is
  never invoked by the app or by any migration).
- **`supabase/migrations/003_migrate_promises_to_ledger.sql`**: the
  unscoped `delete from verdicts; delete from evidence; delete from claims;`
  is now scoped to `claim_type = 'promise'` only — re-running this migration
  can no longer wipe a real `fact_check`/`statement` claim or its evidence
  added since. **This is a repo-file fix only; it changes nothing in your
  live database** (this environment has no access to it). See "Optional
  diagnostics" below for what to check before assuming your live DB is
  clean.

## Known remaining gaps

- **Issue Watch has no "why it matters" or "who is affected" text.**
  Generating either would require interpreting the story rather than
  reporting it, which this pass deliberately avoids; the UI only ever shows
  what happened, what changed, the timeline, and named politicians.
- **Live provider connectivity was not exercised end-to-end in this
  environment** — this sandbox's network egress allow-list does not include
  gnews.io / newsdata.io / currentsapi.services / theguardian.com /
  gdeltproject.org, so `getCurrentAffairs()` correctly returned `"failed"`
  and every dependent section rendered its honest failure state (verified:
  see "Tests actually executed"). The clustering/ranking/categorization
  logic itself is unit-tested against realistic multi-outlet fixtures
  (`tests/unit/`), but a real deployment should be checked once against
  live keys before relying on it.
- **`geopolitical_risk` table** is left in `schema.sql`, unused by any
  application code — dropping it is a live-database change this pass does
  not make unasked (see "Optional diagnostics").
- Migrations `005`, `009`, and `010` (not mentioned in the brief) were
  noted during the audit as re-run-fragile (duplicate-insert / delete-and-
  reinsert patterns) but were **not** modified — only `seed.sql` and `003`
  were in scope for the SQL-safety requirement, and touching migrations
  likely already applied to a live database without being asked is
  riskier than leaving them. Flagging this so it's a known, not hidden, gap.
- `/history` remains a static, hand-written factual timeline (real Lok
  Sabha results, not fabricated) — wiring it to Supabase was out of scope.

## Optional diagnostics (read-only — I will not run these without asking)

If you want to double check your **live** Supabase project rather than just
this repo, these are read-only and safe to run yourself in the SQL editor:

```sql
-- Has migration 003 already run, and does it need the new scoping?
select claim_type, count(*) from claims group by claim_type;

-- Any leftover demo/current-looking rows from before?
select id, name, region, election_date, is_demo, is_archived, data_status
from elections order by election_date desc;

select region, count(*) from parties group by region;
```

## Tests actually executed

- `npm run build` (Next.js production build): **passes**, 33 pages, zero
  errors, after fixing two real bugs the audit surfaced (`app/politicians/
  page.js` and `app/politicians/[slug]/page.js` destructured the data
  functions in a shape those functions don't return — both are corrected).
- `npm test` (`node --test tests/unit/*.test.mjs`): **18/18 passing** —
  normalization/de-dup, UPI-style multi-outlet clustering discovered with no
  hardcoded topic, negative controls (a shared politician name or two
  different regulators do NOT merge), publisher-spam resistance, freshness
  ranking + the 48/72h exclusion windows, BREAKING/DEVELOPING labelling
  rules, category/region classification + filtering, search-over-clusters,
  developing-story id stability across new coverage, literal-name-only
  politician matching (no inference), Trending Now vs. importance,
  Issue-Watch timeline/what-changed correctness, the full Current Affairs →
  Trending → Brief → Issue Watch path for two *different* stories (proving
  nothing is hardcoded), Daily Brief lead/developments/AI-overlay behaviour,
  empty-feed handling, and time-formatting helpers.
- **All routes probed** on the built server in demo mode (no Supabase, no
  news/AI keys): every primary nav destination, `/current-affairs`,
  `/issue-watch`, `/brief`, `/elections(+[id])`, `/evidence`, `/attention`,
  every Explore page, and a nonexistent politician slug — all return `200`
  with an honest empty/unavailable state (verified: no fabricated content,
  no stack traces) except the five expected 307 redirects
  (`/constituencies`, `/heatmap`, `/stock-market`, `/more`, `/fact-check`)
  and `/api/stock-refresh`'s expected `500 {"error":"Supabase not
  configured"}` in this unconfigured environment.
- **Rendered-HTML term scan** of every page above: no occurrence of "Bihar
  Assembly Election 2026", "Patna Sahib", "Raghopur", or "bihar_2020"
  anywhere. Vendor/source names appear only on `/about` (an explicit
  methodology/colophon page — judgment call, flagged for your review) and
  nowhere else.
- **Not run** (would need a real Supabase project and real provider keys,
  neither available in this sandbox): a live end-to-end pass with real
  data, RLS policy verification, and the cron endpoints' actual scheduled
  behavior on Vercel.

## Files changed (by area)

- Removed: `lib/fallback.js`, `lib/news.js`, `lib/trending.js`,
  `lib/electionWatch.js`, `lib/electionSelector.js`, `components/TheNumber.js`,
  `components/SinceYesterday.js`, `components/ChangeCard.js` (superseded by
  `ChangeRow.js`), old `components/TodaysBrief.js` (rewritten in place).
- Added: `lib/time.js`, `lib/news/{ingest,normalize,cluster,rank}.js`,
  `lib/current-affairs/{feed,categorize,politicians,search,get,serialize}.js`,
  `lib/issues/{trending,issue-watch}.js`, `lib/brief/{generate,get}.js`,
  `lib/elections/{classify,get}.js`, `lib/attention.js`,
  `lib/evidenceFeed.js`, `components/{RelTime,TodayTabs,StoryRow,
  CurrentAffairsFeed,TrendingNow,IssueWatch,TrendingNetas(rewritten),
  ElectionWatchCard,ChangeRow,FeaturedClaim,SectionHead}.js`,
  `app/{current-affairs,issue-watch}/page.js`, `app/elections/{page,[id]/page}.js`,
  `app/evidence/page.js`, `tests/unit/*`, `docs/AUDIT.md`, this file.
- Rewritten: `app/page.js`, `lib/data.js`, `lib/changes.js`, `lib/evidence.js`
  (appended), `lib/social.js` (HN window fix), `app/api/daily-brief/route.js`,
  `app/api/attention-refresh/route.js` (+ new `app/api/stock-refresh/route.js`
  alias), `app/api/fact-check/route.js` (rate limit/length guard),
  `app/{predictions,market,attention,calendar,coalition,politicians,
  politicians/[slug],fact-check,constituencies}/page.js`, `components/Nav.js`,
  `app/globals.css` (editorial layer appended), `README.md`.
- SQL: `supabase/seed.sql` → moved to `supabase/demo/seed.sql` (region tag
  fixed); `supabase/migrations/003_migrate_promises_to_ledger.sql` (deletes
  scoped to `claim_type='promise'`). **No other migration files touched. No
  live database was touched — this environment has no access to one.**
