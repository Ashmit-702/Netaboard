// Political Attention — pure read-side logic. "Attention" is how much a
// person is genuinely, recently, and politically relevant right now. It is
// NOT approval, NOT popularity, and NOT raw mention volume — a scandal
// moves it the same way a good speech does, and a famous person's large
// baseline Wikipedia traffic does not by itself make them "trending" (see
// lib/attentionModel.js for why, and lib/attentionParse.js for how the
// `reason` text below is produced/read).
//
// The underlying table is still `stock_prices`; only the product language
// changed. Nothing here invents a number: rows come from the refresh job,
// and stale or history-insufficient rows are excluded from trending rather
// than presented as a real movement.

export const ATTENTION_FRESH_DAYS = 3;      // older than this is history, not "current"
export const TRENDING_THRESHOLD_PCT = 20;   // matches windowedTrend()'s own trending cutoff — not an arbitrary UI number
const INSUFFICIENT_MARK = "Not enough attention history yet";

const CATEGORY_LABEL = { News: "News coverage", Social: "Social discussion", Discovery: "Encyclopedia/search readership", Breadth: "Independent sources" };

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

export function hasSufficientHistory(row) {
  return Boolean(row?.reason) && !row.reason.startsWith(INSUFFICIENT_MARK);
}

/**
 * TRENDING NETAS — unusual, recent, politically-relevant attention only:
 * a fresh reading, with enough history to trust the comparison, whose
 * windowed change clears the same threshold the model itself calls
 * "trending" (not an arbitrary small UI cutoff, which is exactly what let a
 * 1-2% Wikipedia-noise wobble register as a "movement" before).
 */
export function trendingNetas(rows, { now = Date.now(), max = 5 } = {}) {
  return latestPerPolitician(rows)
    .filter((r) => r.slug && isFresh(r, now) && hasSufficientHistory(r) && typeof r.change_pct === "number" && Math.abs(r.change_pct) >= TRENDING_THRESHOLD_PCT)
    .sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
    .slice(0, max);
}

/**
 * Structured signal categories from the stored `reason` text — News, Social
 * (with its own per-platform breakdown), Discovery, Breadth — for the
 * detailed view on /attention and a politician's profile. Never blends
 * Discovery into the same number as News/Social.
 */
export function attentionFactors(reason) {
  if (!reason) return [];
  const news = Number((reason.match(/News:\s*(\d+)/) || [])[1] || 0);
  const socialTotal = Number((reason.match(/Social:\s*(\d+)/) || [])[1] || 0);
  const socialDetail = (reason.match(/Social:[^(]*\(([^)]+)\)/) || [])[1];
  const discovery = Number((reason.match(/Discovery:\s*([\d,]+)/) || [])[1]?.replace(/,/g, "") || 0);
  const breadth = Number((reason.match(/Breadth:\s*(\d+)/) || [])[1] || 0);

  const factors = [];
  if (news > 0) factors.push({ category: "News", label: CATEGORY_LABEL.News, value: news });
  if (socialTotal > 0) {
    const breakdown = socialDetail
      ? socialDetail.split(",").map((p) => p.trim().split(":")).map(([k, v]) => `${k} ${v}`).join(", ")
      : null;
    factors.push({ category: "Social", label: CATEGORY_LABEL.Social, value: socialTotal, breakdown });
  }
  if (discovery > 0) factors.push({ category: "Discovery", label: CATEGORY_LABEL.Discovery, value: discovery });
  if (breadth > 0) factors.push({ category: "Breadth", label: CATEGORY_LABEL.Breadth, value: breadth });
  return factors;
}

/** Human, non-numeric-jargon headline for a reading — no bare "+3" language. */
export function attentionHeadline(row) {
  if (!row) return "No attention data";
  if (!hasSufficientHistory(row)) return "Not enough attention history";
  const pct = row.change_pct;
  if (typeof pct !== "number" || Math.abs(pct) < TRENDING_THRESHOLD_PCT) return "Attention steady";
  return pct > 0 ? `+${pct}% attention vs previous 7-day average` : `${pct}% attention vs previous 7-day average`;
}
