# NetaBoard

**Politics, with receipts.**

Track what was said. See what changed. Follow the evidence. Understand what
is happening now.

Next.js 14 (App Router) + Supabase. Built as a sharp, current, editorial
political product — not a dashboard of unrelated widgets, and not a wrapper
around an AI model.

> This README describes what actually exists in this tree, verified by
> running `npm run build` and requesting every route. See `docs/AUDIT.md` for
> the full audit and `docs/CHANGELOG_v2.md` for exactly what changed in this
> pass, including known gaps.

## Product areas

| Area | Route(s) | Source of truth |
|---|---|---|
| Today's Brief | `/`, `/brief` | Current Affairs engine (`lib/current-affairs`), never a separate pipeline |
| Current Affairs | `/current-affairs` | Live news feeds → cluster → rank (`lib/news`) |
| Trending Now | on `/`, `lib/issues/trending.js` | Rising coverage momentum, distinct from importance |
| Issue Watch | `/issue-watch` | 1–2 deep dives, derived from real cluster timelines only |
| Trending Netas | on `/`, `/attention` | Unusual attention movement — not popularity, not approval |
| Politicians | `/politicians`, `/politicians/[slug]` | `politicians`, `claims`, `evidence`, `verdicts` |
| Elections | `/elections`, `/elections/[id]` | `elections`, `predictions`, `party_election_results` |
| Evidence | `/evidence` | Claims → Evidence → Verdicts ledger (`lib/evidence.js`) |
| Political Attention | `/attention` | `stock_prices` table, renamed product language only |
| Explore (secondary) | `/explore` → manifestos, history, coalition, debate, quiz, memes, calendar, predictions, market | unchanged behaviour, moved under Explore in nav |

**Removed from the active product:** Constituencies (`/constituencies`,
`/heatmap` now 307-redirect to `/elections`), Geopolitical Risk (fully
removed — nav, data layer, routes). Both are documented in
`docs/AUDIT.md`; nothing was deleted from the database.

**No fallback/demo data in the app.** If Supabase is unset, empty, or a
query fails, every page renders an honest empty/unavailable state — never
invented politicians, scores, sources, or old Bihar data. Demo data lives
only in `supabase/demo/seed.sql`, which is never read by the app and never
run automatically.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. **SQL Editor** → run `supabase/schema.sql`.
3. Run every file in `supabase/migrations/` **in numeric order** (001 → 011).
   Read `docs/AUDIT.md` → "Migrations" first — two are destructive-by-design
   for a *fresh* database (003 rebuilds the evidence ledger from the legacy
   `promises` table; it is scoped to `claim_type = 'promise'` so it is now
   safe to re-run without touching real fact-checks added since).
4. Optional: run `supabase/demo/seed.sql` **only** on a fresh local/demo
   project. Never run it against a database with real data — it deletes
   rows first. It is intentionally outside `supabase/migrations/` so a
   production setup never touches it.
5. **Project Settings → API** → copy `Project URL`, `anon public` key, and
   `service_role` key (server-only) into your env vars (see below).

No further Supabase changes were required for this pass — Current Affairs,
Trending Now, Issue Watch, the Daily Brief, `/elections` and `/evidence` all
read tables that already exist.

## 2. Environment variables

Copy `.env.example` → `.env.local`. Nothing is required for the site to
build and run — every integration degrades to an honest empty state when
unconfigured:

- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`
- **AI** (`lib/ai.js`, tries in order) — `GROQ_API_KEY`, `GEMINI_API_KEY`,
  `OPENROUTER_API_KEY`
- **News** (`lib/news/ingest.js`) — `GNEWS_API_KEY`, `NEWSDATA_API_KEY`,
  `CURRENTS_API_KEY`, `GUARDIAN_API_KEY`. GDELT needs no key and is always
  on, so a deployment with zero news keys still has one live source.
  `NEWS_QUERY` (default `India`) and `NEWS_REVALIDATE_SECONDS` (default
  `900`) are optional.
- **Social / attention** (`lib/social.js`) — Wikipedia Pageviews, GDELT and
  Hacker News need no key; Mastodon needs `MASTODON_INSTANCE`; Bluesky and
  Reddit need their own free credentials; X is paid-only (see
  `.env.example` for details).
- **`CRON_SECRET`** — required for Vercel Cron to authenticate to
  `/api/daily-brief` and `/api/attention-refresh`.

## 3. Deploy

```bash
npm install -g vercel
vercel && vercel --prod
```

`vercel.json` schedules `/api/daily-brief` (once a day) and
`/api/attention-refresh` (every 6h — capped to once a day on Vercel Hobby).
The old `/api/stock-refresh` path still works: it re-exports the same
handler so an existing cron entry keeps functioning.

## 4. Local development

```bash
npm install
npm test        # unit tests for the news/clustering/ranking engine — see below
npm run dev
```

Without env vars, pages render their genuine empty states (e.g. "No major
current-affairs updates right now") rather than fabricated content — this is
correct behaviour, not a bug, and is what `docs/AUDIT.md` verified.

## Testing

`npm test` runs `tests/unit/*.test.mjs` (Node's built-in test runner, no
extra dependency) against `lib/news`, `lib/current-affairs`, `lib/issues`
and `lib/brief` using synthetic multi-outlet fixtures
(`tests/unit/fixtures.mjs`) shaped like real provider output. It exercises:
normalization/de-duplication, UPI-style multi-outlet clustering with no
hardcoded topic, negative controls (shared politician name / regulator does
NOT merge two stories), publisher-spam resistance, freshness
ranking/exclusion windows, BREAKING/DEVELOPING labelling, category/region
classification, search-over-clusters, developing-story identity stability,
literal-name-only politician matching, Trending Now vs. importance, Issue
Watch timeline correctness, and the full Current Affairs → Trending → Brief
→ Issue Watch path for two different stories (proving nothing is
hardcoded). See `docs/AUDIT.md` → "Tests actually executed" for what was
run against the live build (route probes, rendered-HTML term scan) versus
what remains manual (a real Supabase project, real news-provider keys).

## Project structure

```
app/
  page.js                    → homepage (Today's Brief, Current Affairs, Trending Now,
                                Issue Watch, Trending Netas, What Changed, Evidence,
                                Election Watch, Accountability, Ask NetaBoard)
  current-affairs/, issue-watch/, brief/   → Today's other views
  politicians/, politicians/[slug]/        → profiles, accountability, claims, evidence
  elections/, elections/[id]/              → live/upcoming/results/archive
  evidence/                                → claims → evidence → verdicts + fact-check form
  attention/                               → Political Attention (was Political Stock Market)
  explore/                                 → secondary: predictions, market, manifesto,
                                              history, coalition, debate, quiz, memes, calendar
  constituencies/, heatmap/                → 307 redirects to /elections (feature removed)
  api/                                     → ask, fact-check, vote, daily-brief,
                                              attention-refresh (+ stock-refresh alias), debate
lib/
  news/            → ingest (per-provider fetch), normalize, cluster, rank — pure, tested
  current-affairs/ → feed engine, categorize, politician entity matching, search/sort
  issues/          → trending.js, issue-watch.js — derived from the feed, no separate data
  brief/           → generate.js (pure) + get.js (Supabase + optional AI summary overlay)
  elections/       → classify.js (LIVE/UPCOMING/RESULTS/ARCHIVE, pure) + get.js (Supabase)
  attention.js      → Political Attention selection logic (trending, freshness)
  evidence.js       → accountability score + evidence coverage (deterministic)
  evidenceFeed.js   → recent claims + homepage-featured-claim selection
  changes.js        → "What Changed" — real, recent, dated changes only
  data.js           → remaining server data fetchers — NO fallback data anywhere
  time.js           → single source of truth for relative/absolute time, IST
supabase/
  schema.sql, migrations/   → production database, in order
  demo/seed.sql             → optional local/demo data — never run automatically
tests/unit/                 → engine tests + fixtures (see "Testing" above)
docs/AUDIT.md                → full initial audit of the inherited codebase
docs/CHANGELOG_v2.md          → exactly what changed in this pass
```

## Known gaps

See `docs/CHANGELOG_v2.md` → "Remaining known gaps" for the current list
(e.g. Issue Watch deliberately has no "why it matters" / "who is affected"
generation, since that would require interpretation this layer is built not
to add).
