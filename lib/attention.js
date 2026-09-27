// Political Attention — pure selection logic. "Attention" is how much a
// person is being talked about (mentions, readership). It is NOT approval and
// NOT popularity: a scandal moves it the same way a good speech does.
//
// The underlying table is still `stock_prices` (renaming it would be risk for
// no functional gain); only the product language changed. Nothing here
// invents a number: rows come from the refresh job, and stale rows are
// dropped rather than presented as current.

export const ATTENTION_FRESH_DAYS = 3;   // older than this is history, not "trending"
export const MIN_MOVEMENT_PCT = 1;       // smaller moves are noise, not "unusual"

const NEUTRAL_LABELS = {
  wikipedia_pageviews: "Encyclopedia readership",
  gdelt_articles: "News coverage",
  hackernews: "Tech-forum discussion",
  mastodon: "Social posts",
  bluesky: "Social posts",
  reddit: "Forum discussion",
  x: "Social posts",
};

/** One (latest) row per politician from rows sorted newest-first. */
export function latestPerPolitician(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows || []) {
    const key = r.slug || r.name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export function isFresh(row, now = Date.now()) {
  if (!row?.recorded_at) return false;
  const t = new Date(row.recorded_at).getTime();
  return !Number.isNaN(t) && (now - t) / 86400000 <= ATTENTION_FRESH_DAYS;
}

export function trendingNetas(rows, { now = Date.now(), max = 5 } = {}) {
  return latestPerPolitician(rows)
    .filter((r) => r.slug && isFresh(r, now) && typeof r.change_pct === "number" && Math.abs(r.change_pct) >= MIN_MOVEMENT_PCT)
    .sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
    .slice(0, max);
}

/** Parses the per-source counts the refresh job stores in `reason`, with neutral labels. */
export function attentionFactors(reason) {
  if (!reason) return [];
  const match = reason.match(/\(([^)]+)\)/);
  if (!match) return [];
  const merged = new Map();
  for (const pair of match[1].split(",")) {
    const [key, value] = pair.split(":").map((s) => s.trim());
    const n = Number(value) || 0;
    if (!key || n <= 0) continue;
    const label = NEUTRAL_LABELS[key] || "Other signals";
    merged.set(label, (merged.get(label) || 0) + n);
  }
  return [...merged.entries()].map(([label, value]) => ({ label, value }));
}
