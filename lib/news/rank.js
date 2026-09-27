// Cluster metrics, scoring and status. Pure. Every number is a countable
// property of the retrieved articles — nothing is estimated or invented.
import { hoursSince } from "../time.js";

// Outlet independence is what matters: ten articles from one publisher are
// ONE voice. Per-outlet contribution to depth is capped at 2 for the same
// reason.
export function clusterMetrics(cluster, now = Date.now()) {
  const byOutlet = new Map();
  for (const a of cluster.articles) byOutlet.set(a.outlet, (byOutlet.get(a.outlet) || 0) + 1);

  const dated = cluster.articles.filter((a) => a.time !== null);
  const ages = dated.map((a) => hoursSince(a.publishedAt, now)).filter((h) => h !== null);
  const newestAge = ages.length ? Math.min(...ages) : null;
  const oldestAge = ages.length ? Math.max(...ages) : null;

  const outletsWithin = (h) => new Set(dated.filter((a) => hoursSince(a.publishedAt, now) <= h).map((a) => a.outlet)).size;
  const recent6 = outletsWithin(6);
  const recent24 = outletsWithin(24);

  return {
    outletCount: byOutlet.size,
    articleCount: cluster.articles.length,
    cappedArticles: [...byOutlet.values()].reduce((n, c) => n + Math.min(2, c), 0),
    newestAge, oldestAge,
    spanHours: newestAge !== null ? oldestAge - newestAge : 0,
    recentOutlets6: recent6,
    recentOutlets24: recent24,
    earlierOutlets: Math.max(0, recent24 - recent6),
    described: cluster.articles.filter((a) => a.description).length,
  };
}

/**
 * Score = freshness (0-40, smooth decay) + independent-outlet breadth
 * (0-36, logarithmic so 20 outlets is not 20x one) + depth (0-9) + momentum
 * (0-15: independent outlets reporting in the last 6h) + relevance (0-6:
 * a tracked politician is actually named).
 */
export function scoreCluster(m, { politicianMatches = 0 } = {}) {
  const freshness = m.newestAge === null ? 6 : 40 * Math.exp(-Math.max(0, m.newestAge) / 18);
  const breadth = Math.min(36, 12 * Math.log2(1 + m.outletCount));
  const depth = Math.min(9, m.cappedArticles * 1.5);
  const momentum = Math.min(15, m.recentOutlets6 * 5);
  const relevance = Math.min(6, politicianMatches * 3);
  return Math.round((freshness + breadth + depth + momentum + relevance) * 10) / 10;
}

/**
 * BREAKING  = a young story, very fresh, with strong independent coverage.
 * DEVELOPING = an established story still drawing new independent coverage.
 * Anything else gets no label — ordinary stories are not dressed up.
 */
export function storyStatus(m) {
  if (m.newestAge === null) return null;
  if (m.outletCount >= 4 && m.newestAge <= 3 && m.oldestAge <= 8 && m.recentOutlets6 >= 3) return "BREAKING";
  if (m.outletCount >= 3 && m.spanHours >= 3 && m.recentOutlets6 >= 2) return "DEVELOPING";
  return null;
}

/**
 * Freshness window. Main feed: newest report within 48h. A story may stay to
 * 72h only if it is a genuinely continuing multi-outlet story (>=3 outlets
 * spanning >=24h). Clusters with no usable date are excluded — we cannot
 * claim something is current when we do not know when it happened.
 */
export function isCurrent(m) {
  if (m.newestAge === null) return false;
  if (m.newestAge <= 48) {
    // A lone report is only "current" if it is very recent; it ranks low anyway.
    return m.outletCount >= 2 || m.newestAge <= 24;
  }
  return m.newestAge <= 72 && m.outletCount >= 3 && m.spanHours >= 24;
}
