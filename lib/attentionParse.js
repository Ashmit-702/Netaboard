// Parses/serializes the `reason` text column on stock_prices into the
// structured signal the attention model needs, WITHOUT any schema change.
// Format (stable, both human-readable and machine-parseable):
//   "News: 3 GDELT articles · Social: 7 posts (mastodon:4, bluesky:2, reddit:1)
//    · Discovery: 12,400 Wikipedia views (24h) · Breadth: 3 independent sources"
import { politicalRelevance, discoveryScore, sourceBreadth } from "./attentionModel.js";

export function serializeReason(signal) {
  const socialTotal = Object.values(signal.social).reduce((a, b) => a + (b || 0), 0);
  const socialParts = Object.entries(signal.social).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(", ");
  const breadth = sourceBreadth(signal);
  return `News: ${signal.news.gdelt} GDELT article${signal.news.gdelt === 1 ? "" : "s"}`
    + ` · Social: ${socialTotal} post${socialTotal === 1 ? "" : "s"}${socialParts ? ` (${socialParts})` : ""}`
    + ` · Discovery: ${signal.discovery.wikipedia.toLocaleString("en-IN")} Wikipedia views (24h)`
    + ` · Breadth: ${breadth} independent source${breadth === 1 ? "" : "s"}`;
}

export function parseReason(reason) {
  if (!reason) return null;
  const news = Number((reason.match(/News:\s*(\d+)/) || [])[1] || 0);
  const social = Number((reason.match(/Social:\s*(\d+)/) || [])[1] || 0);
  const discovery = Number((reason.match(/Discovery:\s*([\d,]+)/) || [])[1]?.replace(/,/g, "") || 0);
  const breadth = Number((reason.match(/Breadth:\s*(\d+)/) || [])[1] || 0);
  return { news: { gdelt: news }, social: { mastodon: 0, bluesky: 0, reddit: 0, hackernews: 0, x: 0, _total: social }, discovery: { wikipedia: discovery }, breadth };
}

/** Re-derives a comparable relevance figure from a stored (parsed) reading. */
export function relevanceFromParsed(parsed) {
  if (!parsed) return 0;
  // politicalRelevance() sums individual social sources; a stored row only
  // has the social TOTAL, so approximate with an equivalent single bucket —
  // damp() is sub-linear, so this is a reasonable reconstruction, not exact.
  return politicalRelevance({ news: parsed.news, social: { mastodon: parsed.social._total }, breadth: parsed.breadth });
}
