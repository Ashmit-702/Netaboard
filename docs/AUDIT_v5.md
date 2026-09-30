# NetaBoard — v5: homepage balance, attention model, elections audit

## 1. Homepage hierarchy
Reordered: Today's Brief (now compact — lead, 3 developments, what to watch)
→ Trending Now → Current Affairs (main feed, 3-column, up to 14 stories) →
Issue Watch → Trending Netas → Election Watch → What Changed → The Evidence
→ Accountability → Ask NetaBoard. `TodaysBrief` takes a `compact` prop; the
full version stays on `/brief`. De-dup: Current Affairs already excluded
every story used in the Brief and cross-links to Issue Watch via a
canonical `id` — unchanged, since it already satisfied "reference, don't
repeat"; only the ordering/sizing changed. `scripts/verify-production.mjs`
now asserts the new order.

## 2. Elections — audited, no code bug found
Read `classify.js`, `get.js`, and `app/elections/page.js` line by line.
UPCOMING is computed purely from `election_date`/`status`/`data_status`,
excludes `is_demo`/`is_archived`, and the page already shows UPCOMING
elections with no prediction requirement (`s !== "UPCOMING"` explicitly
skips the "not enough data" caveat for that state) — Elections was already
decoupled from Predictions. Added `tests/unit/elections.test.mjs` (not
present before) covering: a real future-dated row classifies UPCOMING, a
row without any prediction still counts, `is_demo`/`is_archived` are
excluded, and years are never mixed.

**Conclusion: this is very likely a DATA problem, not a code problem** — the
live database most likely doesn't yet contain a real upcoming row (the SQL
from `docs/SUPABASE_CHANGES_v3.sql`/`v4.sql` may not have been run yet, or
`is_demo`/`is_archived` might not exist there if migrations 006/008/010
weren't applied). I re-verified the October 2026 bye-elections against 5
independent sources (PIB, DD News, The Hawk, Wikipedia) — still accurate:
polling 6 Oct 2026, results 9 Oct 2026, Nagaon (Assam) Lok Sabha seat plus
5 Assembly seats. If you've already run that SQL and UPCOMING still doesn't
show, send me the output of `select * from elections where name like
'Bye-elections%'` and I'll debug the actual row rather than guess.

## 3. Political Attention — the Nitish problem, root cause and fix
**Root cause, confirmed in the old code**: `lib/social.js` summed Wikipedia
pageviews (scaled ÷50) directly into ONE `total` with GDELT/social counts;
the cron then EMA-smoothed that single number
(`price = prev*0.7 + target*0.3`) and computed `change_pct` against only the
PREVIOUS reading. A famous, long-tenured politician's baseline Wikipedia
traffic is large and noisy for reasons unrelated to politics — that noise
alone could move the EMA and register as "rising."

**Fix** (`lib/attentionModel.js`, `lib/social.js`, `lib/attentionParse.js`,
rewritten `app/api/attention-refresh/route.js`, `lib/attention.js`):
- Signals are separated into **News** (GDELT), **Social** (Mastodon/
  Bluesky/Reddit/HN), and **Discovery** (Wikipedia) — Discovery is tracked
  and shown but mathematically excluded from the political relevance score.
- Political relevance is **log-dampened** (10× the mentions is nowhere near
  10× the score) plus a **cross-source-breadth** bonus, so one loud source
  can't dominate.
- Trending is a **windowed comparison** — today's reading vs. that
  politician's own trailing 7-day daily average, read from real prior rows
  — not an EMA vs. one previous reading.
- With fewer than 3 distinct prior days of history, the state is
  **"Not enough attention history"**, never a fabricated 0%.
- A near-zero baseline is floored so it can't produce a runaway percentage,
  and two genuinely-inactive signals correctly show **"No significant
  recent political attention."**
- Trending Netas' threshold is now 20% (the model's own trending cutoff),
  not an arbitrary 1% that let small noise register.
- UI language changed from raw "+3" points to plain sentences: "+167%
  attention vs previous 7-day average", "Attention steady", "Not enough
  attention history". "Attention ≠ approval" appears on `/attention` and
  in `TrendingNetas`.
- **No schema change**: the structured breakdown is stored in the existing
  `reason` text column in a stable, parseable format
  (`lib/attentionParse.js`), so this needed zero migrations.

**Tested** with the exact three profiles the brief specifies
(`tests/unit/attention.test.mjs`): high-baseline/little-change → does not
trend; low-baseline/large-spike → does trend; genuinely inactive → never
fabricates a rise. Also tested: Wikipedia-only changes never move political
relevance; a near-zero baseline doesn't explode into a huge percentage;
insufficient history is never silently shown as 0%.

## SUPABASE CHANGES REQUIRED
No schema changes. Confirms `docs/SUPABASE_CHANGES_v3.sql` and `_v4.sql`
are still the right, current data to run if not already applied — the
October 2026 bye-election dates in `_v4.sql` were re-verified this pass and
are unchanged.

## Tests run
`npm test`: 47/47 pass (12 new: 3 profile tests, plus model/parse/read-side
coverage). `npm run build`: clean. Verified on a rebuilt local server: all
routes on one build fingerprint, homepage order Brief → Trending Now →
Current Affairs → Issue Watch → Trending Netas → Ask NetaBoard, legacy
redirects correct, no forbidden strings, `/attention` shows the new
plain-language model. **Not run**: your live production URL (unreachable
from this sandbox), a real Supabase database, live news/social providers.
