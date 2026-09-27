// The Current Affairs engine. Pure: takes normalized articles, returns
// story items. Trending Now, Issue Watch and the Daily Brief are all derived
// from THIS output — there is no second news pipeline.
import { clusterArticles } from "../news/cluster.js";
import { clusterMetrics, scoreCluster, storyStatus, isCurrent } from "../news/rank.js";
import { classifyCluster } from "./categorize.js";
import { matchPoliticians } from "./politicians.js";

function truncateSentence(text, max = 300) {
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return (lastStop > max * 0.5 ? cut.slice(0, lastStop + 1) : cut.replace(/\s+\S*$/, "") + "…").trim();
}

// The most representative headline: the one sharing the most vocabulary with
// the rest of the cluster (not simply the newest or the most sensational).
function pickLead(cluster) {
  const freq = new Map();
  for (const a of cluster.articles) for (const t of a.tokens) freq.set(t, (freq.get(t) || 0) + 1);
  const scored = cluster.articles.map((a) => ({
    a,
    rep: a.tokens.reduce((n, t) => n + (freq.get(t) || 0), 0) / Math.max(1, a.tokens.length),
  }));
  scored.sort((x, y) =>
    (y.a.description ? 1 : 0) - (x.a.description ? 1 : 0) ||
    y.rep - x.rep ||
    (y.a.time ?? 0) - (x.a.time ?? 0)
  );
  return scored[0].a;
}

function pickSummary(cluster, lead) {
  if (lead.description) return truncateSentence(lead.description);
  const other = [...cluster.articles].filter((a) => a.description).sort((x, y) => (y.time ?? 0) - (x.time ?? 0))[0];
  return other ? truncateSentence(other.description) : null;   // no description anywhere -> no summary; never invent one
}

export function topicLabel(cluster) {
  const entCounts = new Map();
  for (const a of cluster.articles) for (const e of a.ents.keys()) entCounts.set(e, (entCounts.get(e) || 0) + 1);
  const tokCounts = new Map();
  for (const a of cluster.articles) for (const t of a.tokens) if (!entCounts.has(t)) tokCounts.set(t, (tokCounts.get(t) || 0) + 1);
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([w]) => w);
  const parts = [...top(entCounts).slice(0, 2), ...top(tokCounts)].slice(0, 3);
  return parts.map((w) => (w.length <= 5 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(" · ");
}

export function buildFeed(normalized, { now = Date.now(), roster = [] } = {}) {
  const clusters = clusterArticles(normalized);
  const items = [];
  for (const c of clusters) {
    const m = clusterMetrics(c, now);
    if (!isCurrent(m)) continue;
    const lead = pickLead(c);
    const cls = classifyCluster(c.articles);
    const politicians = matchPoliticians(c.articles, lead.title, roster);
    const chronological = [...c.articles].sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
    items.push({
      id: c.id,
      headline: lead.title,
      summary: pickSummary(c, lead),
      url: lead.url,
      region: cls.region,
      topic: cls.topic,
      secondaryTopic: cls.secondary,
      topicLabel: topicLabel(c),
      status: storyStatus(m),
      newestAt: chronological.filter((a) => a.publishedAt).slice(-1)[0]?.publishedAt || null,
      firstReportedAt: chronological.find((a) => a.publishedAt)?.publishedAt || null,
      ageHours: m.newestAge,
      outletCount: m.outletCount,
      articleCount: m.articleCount,
      recentOutlets6: m.recentOutlets6,
      earlierOutlets: m.earlierOutlets,
      metrics: m,
      score: scoreCluster(m, { politicianMatches: politicians.length }),
      politicians,
      // Real, dated articles — powers the Issue Watch timeline. Provenance
      // (provider) stays here for the backend; UI shows the outlet only.
      articles: chronological.map((a) => ({ title: a.title, url: a.url, outletName: a.outletName, publishedAt: a.publishedAt, description: a.description, providers: a.providers })),
      searchText: [lead.title, ...c.articles.map((a) => a.title), pickSummary(c, lead) || "", ...politicians.map((p) => p.name)].join(" ").toLowerCase(),
    });
  }
  items.sort((a, b) => b.score - a.score || (b.newestAt || "").localeCompare(a.newestAt || ""));
  return items;
}

export { searchItems, sortItems } from "./search.js";
