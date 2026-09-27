# NetaBoard — Initial Audit (before any changes)

Performed by unpacking `netaboard_24.zip`, reading every source file and
migration, then running `npm ci && next build` and probing every route on
the unmodified build in demo mode (no Supabase, no news/AI keys).

## Baseline facts
- Next.js 14.2.35, App Router, 92 source files (excluding `node_modules`),
  no tests, no test script in `package.json`. Build passed clean; 31 pages.
- `/stock-market`, `/constituencies`, `/heatmap`, `/more` were **already**
  real 307 redirects. `/attention` and `/api/attention-refresh` **already**
  existed and `vercel.json` **already** pointed its cron at the new path.
- No constituency page/component remained — only leftover `"constituency"`
  type-strings in `ChangeCard`, `TheNumber`, `SinceYesterday`, `fallback.js`
  (all four files have since been removed; see the changelog).
- No Geopolitical Risk route, query, or nav item existed anywhere in the app
  layer — only the (unused) `geopolitical_risk` table in `schema.sql`.
- **Missing entirely**: `/current-affairs`, `/elections`, `/evidence`, an
  Issue Watch page, any test harness, any Current Affairs engine. The old
  nav labels "Elections"/"Evidence" pointed at `/predictions`/`/fact-check`.

## Problems found (verified by running the code, not by reading claims)
1. **Fabricated data on every fallback path.** In demo mode the homepage
   showed an invented Tejashwi Yadav attention figure, a fabricated Bihar
   employment misleading-verdict, fake dated "changes", and a fake
   187.4-point attention score with invented Hacker News/Mastodon counts.
   `lib/data.js`'s `catch` blocks returned this same fake data on any
   transient Supabase error — indistinguishable from real content.
   `lib/fallback.js` also held a fake predictor leaderboard, and
   `/calendar` hardcoded a "Bihar Legislative Assembly Election 2020" and a
   "Tamil Nadu Assembly Election 2026" as permanent fallback rows.
   `/coalition` defaulted to a fabricated 243-seat total when no real party
   data existed.
2. **News discovery could not have found a real UPI outage.** Every
   provider was queried with the literal string `"India politics"` — a
   UPI-outage headline would not contain "politics" and could easily be
   missed. No provider covered economy/world/sports/tech at all.
3. **Clustering could over-merge.** An entity counted as "rare" up to 60%
   document frequency, and a single shared rare entity could merge clusters
   outright; two-token headline overlap could merge on one shared word.
   Outlet counting also under-counted independence (Currents/Guardian
   collapsed to one outlet each).
4. **Daily Brief ran a separate, weaker pipeline**  — `/api/daily-brief`
   deduped on the first 60 characters of a headline rather than using the
   cluster engine, and stored a literal `"Demo brief…"` row when nothing was
   fetched.
5. **Attention numbers didn't measure "unusual".** The score was an EMA of
   an invented "price" compared against a hardcoded 100 for a first reading;
   Hacker News counted all-time hits, not last-24h; raw source names
   (Wikipedia, GDELT, Hacker News, Mastodon) were printed on `/attention`.
6. **Unsafe SQL.** `seed.sql` ran unconditional `DELETE FROM
   politicians/parties/elections/stock_prices/…` at the top level (not
   isolated from a production setup path) and seeded a `region='bihar_2020'`
   tag on rows with no "demo" marker. **`003_migrate_promises_to_ledger.sql`
   ran an unscoped `delete from verdicts; delete from evidence; delete from
   claims;`** — a full-ledger wipe on any re-run, which was not documented
   anywhere and would destroy real fact-checks added since the migration
   first ran.
7. **Smaller issues**: `EvidenceLedgerItem` printed `"null% confidence"`;
   `/api/fact-check` had no rate limit or length guard; the homepage
   "Evidence" slot could surface an anonymous, evidence-free, AI-only
   verdict; `AskChat`'s example question referenced the Bihar election;
   `app/politicians/page.js` and `app/politicians/[slug]/page.js` destructured
   `getPoliticians()`/`getPolitician()` in a shape those functions didn't
   actually return, and `TrendingNetas`'s prop name didn't match its caller
   — these would have thrown or rendered nothing in production.

## Term scan of the *rendered* pages (baseline, demo mode)
"Bihar Assembly Election 2026", "Patna Sahib", "Raghopur", "bihar_2020"
did not appear in any rendered page even before changes (that leak had
already been fixed). "Bihar" appeared via demo politicians' *roles*, the
calendar's fallback rows, and the quiz. Source/vendor names (GNews, GDELT,
Groq, Gemini, OpenRouter, Vercel, Supabase) appeared on `/about` and
`/attention`.

## Supabase, before any changes
**NO SUPABASE CHANGES REQUIRED** for anything in the brief — Current
Affairs, Trending Now, Issue Watch, the Daily Brief, `/elections` and
`/evidence` all reuse tables that already exist (`daily_briefs`,
`stock_prices`, `elections`, `predictions`, `claims`/`evidence`/`verdicts`,
`party_election_results`). See `CHANGELOG_v2.md` for what the file-level SQL
fixes actually changed (repo files only — nothing was run against any live
database, which this environment cannot reach).
