// POLITICAL ATTENTION MODEL v2 — fixes the "Nitish problem": a long-tenured,
// high-name-recognition politician showing a manufactured "rising" trend
// from noisy day-to-day Wikipedia pageview variation, when nothing
// politically relevant actually happened.
//
// Root cause in the old model: `total` summed Wikipedia pageviews (scaled
// /50) directly into ONE undifferentiated number, then EMA-smoothed that
// number and compared it to the PREVIOUS single EMA reading. A famous
// person's baseline pageviews are large and noisy on their own — that noise
// alone could move "change_pct" without any real news or social signal.
//
// Fix, matching the brief's model exactly:
//   1. DISCOVERY signals (Wikipedia/search) are tracked SEPARATELY from
//      POLITICAL signals (news coverage, social discussion). Discovery is
//      shown to the person, but never itself produces a "trending" verdict.
//   2. Political relevance uses log-dampening (doubling raw mentions must
//      not double the score) plus a cross-source-breadth bonus, so one loud
//      source can't dominate.
//   3. Trending is a WINDOWED comparison — today's 24h political signal vs.
//      that politician's own trailing 7-day daily average (baseline) — not
//      an EMA-vs-previous-reading, which is what let daily noise register
//      as a trend.
//   4. With too little history, or with both windows near zero, the model
//      says so plainly rather than computing a misleading percentage.
//
// Pure, no I/O — takes signal objects (from lib/social.js) and history rows
// already read from the database.

const EPS = 0.75;          // floor so a near-zero baseline can't produce a runaway %
const MIN_HISTORY_DAYS = 3; // distinct prior days needed before trend is meaningful
const MIN_HISTORY_READINGS = 3;

/** log-dampened count: 0->0, but doubling raw input never doubles the score. */
const damp = (n) => Math.log2(1 + Math.max(0, n));

/**
 * Political relevance score from ONE reading's raw signal. Wikipedia is
 * deliberately excluded — it is a discovery signal, not political activity.
 */
export function politicalRelevance(signal) {
  const news = damp(signal.news?.gdelt || 0);
  const social = damp((signal.social?.mastodon || 0) + (signal.social?.bluesky || 0) + (signal.social?.reddit || 0) + (signal.social?.hackernews || 0) + (signal.social?.x || 0));
  const breadth = signal.breadth || 0;   // distinct non-zero NEWS/SOCIAL sources (never counts Wikipedia)
  // News is weighted highest — it is the closest thing to real political activity.
  return Math.round((news * 3 + social * 1.2 + breadth * 1.5) * 100) / 100;
}

/** Discovery score, tracked and shown, but never a trending input on its own. */
export function discoveryScore(signal) {
  return Math.round(damp(signal.discovery?.wikipedia || 0) * 100) / 100;
}

export function sourceBreadth(signal) {
  const nonzero = [signal.news?.gdelt, signal.social?.mastodon, signal.social?.bluesky, signal.social?.reddit, signal.social?.hackernews, signal.social?.x]
    .filter((v) => (v || 0) > 0).length;
  return nonzero;
}

/**
 * Windowed trend from parsed HISTORY (oldest→newest, each { at, relevance }),
 * PLUS today's fresh relevance. Compares the last 24h against the trailing
 * 7-day daily average (excluding the last 24h).
 *
 * @returns {{ sufficientHistory, recent24h, baselineDaily, changePct, state }}
 *   state: "trending_up" | "trending_down" | "steady" | "insufficient_history" | "inactive"
 */
export function windowedTrend(history, todayRelevance, now = Date.now()) {
  const DAY = 86400000;
  const priorDays = new Set(history.filter((h) => now - h.at > DAY).map((h) => new Date(h.at).toISOString().slice(0, 10)));
  const sufficientHistory = priorDays.size >= MIN_HISTORY_DAYS && history.length >= MIN_HISTORY_READINGS;

  const recent24h = todayRelevance; // the fresh reading itself represents "recent" (cron runs ~daily)
  if (!sufficientHistory) {
    return { sufficientHistory: false, recent24h, baselineDaily: null, changePct: null, state: recent24h < EPS ? "inactive" : "insufficient_history" };
  }

  const prior = history.filter((h) => now - h.at > DAY && now - h.at <= 8 * DAY);
  const baselineDaily = prior.length ? prior.reduce((s, h) => s + h.relevance, 0) / prior.length : 0;

  if (recent24h < EPS && baselineDaily < EPS) return { sufficientHistory: true, recent24h, baselineDaily, changePct: 0, state: "inactive" };

  const changePct = Math.round(((recent24h - baselineDaily) / Math.max(baselineDaily, EPS)) * 1000) / 10;
  let state = "steady";
  if (changePct >= 20) state = "trending_up";
  else if (changePct <= -20) state = "trending_down";
  return { sufficientHistory: true, recent24h, baselineDaily, changePct, state };
}

/** Human copy for the model's verdict — no raw "attention points" language. */
export function attentionHeadline(trend) {
  if (trend.state === "insufficient_history") return "Not enough attention history";
  if (trend.state === "inactive") return "No significant recent political attention";
  if (trend.state === "trending_up") return `+${trend.changePct}% attention vs previous 7-day average`;
  if (trend.state === "trending_down") return `${trend.changePct}% attention vs previous 7-day average`;
  return "Attention steady";
}
