# NetaBoard — v4 pass: production parity, relevance, elections

## 1. Production/source parity — what I could and could not determine
- **Your repo ZIP (Netaboard-main.zip)**: `app/page.js` was byte-identical to `app/politicians/page.js` (exports `PoliticiansPage`). Every other file matched the delivered build. That alone makes `/` serve the Politicians page.
- **Live site** (`neta-ashen.vercel.app/`, fetched cache-busted): `/` returned the Politicians page with the new navigation — consistent with the repo above. I could **not** fetch `/brief`, `/predictions` or other paths (my fetch tool only opens URLs it has seen), so I cannot confirm the older-homepage behaviour you describe from here. I do not have access to your Git or Vercel settings, so the branch, root directory and which deployment is "Production" must be checked by you (checklist in README §3).
- **A second real cause of stale data, fixed**: `/attention`, `/coalition`, `/market`, `/debate` and `/quiz` were prerendered at build time, freezing database content at deploy time. They are now dynamic.
- **Tooling so this cannot recur silently**: every route now carries a build fingerprint (meta tag, `x-netaboard-build` header, `/api/version`). `npm run verify:prod -- <url>` checks the real deployment for a single build, a real homepage, the new navigation, no old/vendor strings, section order, politician links (200) and legacy redirects. `tests/unit/routes.test.mjs` fails if a route file exports the wrong component.
- **Live politicians error**: production shows "Politician records couldn't be loaded" while attention loads, so the politicians query fails there (most likely tables from migration 002 missing). The app now degrades to an unscored roster and logs the real error. See SQL diagnostic A1.

## 2. Relevance (Daily Brief / Current Affairs)
One pipeline, unchanged: normalize → dedupe → cluster → classify → **relevance** → freshness/breadth score → Current Affairs → Brief → Trending → Issue Watch.
- `lib/current-affairs/relevance.js` assigns tier 1 (politics, government, courts, security, India economy/environment), tier 2 (science/tech, business, world, unclassified) or tier 3 (sports, entertainment) plus score points (India, political signal). Not a blacklist: a tier-3 story with strong political/government signal and ≥3 outlets is promoted ("exceptional").
- Brief, Trending Now, Issue Watch and the homepage feed use tier ≤ 2 only. If nothing important exists the Brief says "No major developments right now."
- `/current-affairs`: default **All important**; filters India, Politics, Government & Policy, Economy, World, Science & Tech, Business, Security, Environment, Sports, Entertainment (shown only when present). Typing a search queries every tier.
- Issue Watch gained **Latest development**.

## 3. Elections vs Predictions
`/elections` reads election rows only. `/predictions` is separate and never hides an election; with no estimate it says so and lists live/upcoming elections. ECI bye-elections (polling 6 Oct 2026) are the real upcoming election; SQL in `docs/SUPABASE_CHANGES_v4.sql`.

## SUPABASE CHANGES REQUIRED
No schema change. Data: run `docs/SUPABASE_CHANGES_v4.sql` (diagnostics A, upcoming bye-elections B, optional demo-row guard C) and, if not yet done, `docs/SUPABASE_CHANGES_v3.sql`. Nothing is deleted.

## Removed/absent (verified by scan)
Constituencies, Heatmap, Geopolitical Risk, Stock Market, ticker, old navigation, developer footer: not present in source or rendered HTML. Vendor names appear only on `/about` (methodology).

## Tests actually run
`npm test` 35/35 pass; `npm run build` clean; verifier against the built server: all routes one build, correct section order, redirects OK. **Not run**: the verifier against your real production URL (my sandbox cannot reach it), live news providers, a real Supabase database, and a rendered mobile/desktop screenshot (no browser here — layout checked by CSS media queries only).
