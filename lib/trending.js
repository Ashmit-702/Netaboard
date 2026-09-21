// Current-story discovery and trend detection, built entirely on the news
// feeds already configured in lib/news.js. No hardcoded topics: "UPI
// disruption", "election development" etc. are DISCOVERED from whatever the
// feeds actually return today, so a major real-world story surfaces without
// any code change.
//
// Pipeline:
//   fetch raw articles (duplicates kept on purpose)
//     -> cluster near-duplicate coverage into one story
//     -> score each cluster on freshness + cross-source volume + significance
//     -> rank, return top stories + extracted trending topics
//
// Scoring is deliberately simple and inspectable. Cross-source volume counts
// DISTINCT outlets, never repeat mentions from the same outlet — one
// publisher spamming a topic must not make it look nationally important.

import { getRawArticles } from "./news";

// Words too common in political headlines to carry topical meaning.
const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","as","is","are","was","were",
  "be","been","after","before","over","under","about","into","its","it","this","that","these","those","has","have",
  "had","will","would","can","could","may","might","not","no","new","says","said","say","amid","ahead","up","down",
  "out","more","most","than","then","now","who","what","why","how","india","indian","government","govt","news",
  "report","reports","update","updates","live","top","big","major","latest","today","against","during","two","one",
]);

function normalizeTitle(title) {
  return (title || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(title) {
  return normalizeTitle(title).split(" ").filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

// Distinctive entity-like terms: acronyms (UPI, NPCI, RBI, SEBI) and proper
// nouns, taken from the ORIGINAL casing before normalization. Two headlines
// sharing a rare entity are almost always the same story even when their
// remaining wording differs completely — which is exactly the case that
// pure word-overlap misses.
function entities(title) {
  const raw = (title || "").replace(/[^A-Za-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const out = new Set();
  for (const w of raw) {
    const lower = w.toLowerCase();
    if (STOPWORDS.has(lower)) continue;
    // All-caps acronyms of 2-6 chars, or capitalized words of 4+ chars.
    if (/^[A-Z0-9]{2,6}$/.test(w)) out.add(lower);
    else if (/^[A-Z][a-z]{3,}$/.test(w)) out.add(lower);
  }
  return out;
}

// Jaccard similarity on significant words — cheap, dependency-free, and
// good enough to recognize "UPI services down across banks" and "UPI outage
// hits users nationwide" as the same story.
function similarity(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return 0;
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  if (!shared) return 0;
  // Overlap coefficient (shared / smaller set) rather than plain Jaccard.
  // Jaccard punishes headlines of differing length and specificity, which
  // caused genuinely-identical stories to split into separate clusters —
  // e.g. four outlets covering one UPI outage in different words. Overlap
  // asks "is the shorter headline essentially contained in the longer
  // one?", which is the right question for near-duplicate detection.
  return shared / Math.min(a.size, b.size);
}

const SIMILARITY_THRESHOLD = 0.4;

// A rare shared acronym (UPI, NPCI, SEBI) is strong evidence of the same
// story on its own; a common one shared by everything is not. Only entities
// appearing in a minority of retrieved articles count as "rare".
function sharesRareEntity(aEnts, bEnts, rareSet) {
  for (const e of aEnts) if (bEnts.has(e) && rareSet.has(e)) return true;
  return false;
}

function clusterArticles(articles) {
  const withTokens = articles
    .filter((a) => a.title && a.title.length > 15)
    .map((a) => ({ ...a, tokens: tokenize(a.title), ents: entities(a.title) }))
    .filter((a) => a.tokens.length >= 2);

  // An entity is a meaningful join key unless it is so widespread that it
  // carries no topical signal (e.g. a term appearing in most of the feed).
  // The cap is a MAJORITY share rather than a third: a genuinely dominant
  // story legitimately has its key entity in many of the day's articles —
  // that is the signal, not noise — so only near-universal terms are
  // excluded. Absolute floor of 3 keeps this sane on small result sets.
  const entCounts = {};
  for (const a of withTokens) for (const e of a.ents) entCounts[e] = (entCounts[e] || 0) + 1;
  const cap = Math.max(3, Math.floor(withTokens.length * 0.6));
  const rareSet = new Set(
    Object.entries(entCounts).filter(([, n]) => n <= cap).map(([e]) => e)
  );

  const clusters = [];
  for (const article of withTokens) {
    // Compare against each cluster's ORIGINAL article tokens, not the
    // accumulated union — a growing union dilutes the overlap ratio and
    // makes later articles fail to match a cluster they belong to.
    const match = clusters.find((c) =>
      c.articles.some((existing) =>
        similarity(existing.tokens, article.tokens) >= SIMILARITY_THRESHOLD ||
        sharesRareEntity(existing.ents, article.ents, rareSet)
      )
    );
    if (match) {
      match.articles.push(article);
      match.tokens = [...new Set([...match.tokens, ...article.tokens])];
    } else {
      clusters.push({ tokens: [...article.tokens], articles: [article] });
    }
  }
  return clusters;
}

function hoursSince(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / 3600000;
}

/**
 * Score = freshness + distinct-outlet volume + article count (capped).
 * Every component is a real, countable property of the retrieved articles.
 */
function scoreCluster(cluster) {
  const outlets = new Set(cluster.articles.map((a) => a.source).filter(Boolean));
  const ages = cluster.articles.map((a) => hoursSince(a.publishedAt)).filter((h) => h !== null);
  const freshestHours = ages.length ? Math.min(...ages) : null;

  // Freshness: full marks under 6h, decaying to zero by 72h. Unknown dates
  // get a neutral-low value rather than being treated as fresh.
  let freshness = 8;
  if (freshestHours !== null) {
    if (freshestHours <= 6) freshness = 40;
    else if (freshestHours <= 24) freshness = 28;
    else if (freshestHours <= 48) freshness = 15;
    else if (freshestHours <= 72) freshness = 6;
    else freshness = 0;
  }

  const volume = outlets.size * 12;              // distinct outlets, not raw mentions
  const depth = Math.min(cluster.articles.length, 6) * 3;

  return {
    score: freshness + volume + depth,
    outletCount: outlets.size,
    freshestHours,
    articleCount: cluster.articles.length,
  };
}

// The representative headline for a cluster: prefer the freshest article
// that actually has a description, so summaries aren't empty.
function pickLead(cluster) {
  const sorted = [...cluster.articles].sort((a, b) => {
    const ha = hoursSince(a.publishedAt) ?? 9999;
    const hb = hoursSince(b.publishedAt) ?? 9999;
    return ha - hb;
  });
  return sorted.find((a) => a.description) || sorted[0];
}

// A short topic label from a cluster's most distinctive shared words —
// used for TRENDING NOW chips. Not an AI summary, just the real terms.
function topicLabel(cluster) {
  // Entities (UPI, NPCI, Supreme...) are far more informative as a topic
  // label than generic high-frequency words, so they lead. Acronyms keep
  // their uppercase form; other terms get title case.
  const entCounts = {};
  for (const a of cluster.articles) {
    for (const e of a.ents || []) entCounts[e] = (entCounts[e] || 0) + 1;
  }
  const tokenCounts = {};
  for (const a of cluster.articles) {
    for (const t of new Set(a.tokens)) {
      if (!entCounts[t]) tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    }
  }
  const byCount = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([w]) => w);
  const parts = [...byCount(entCounts), ...byCount(tokenCounts)].slice(0, 3);
  return parts
    .map((w) => (w.length <= 5 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" · ");
}

/**
 * getCurrentStories() — the single entry point the homepage uses.
 * Returns { stories, topics }. Both are empty arrays when the feeds return
 * nothing usable (no API keys, all sources down, or genuinely no news) —
 * callers must render an honest empty state, never substitute old data.
 */
export async function getCurrentStories({ query = "India politics", maxStories = 6, maxTopics = 8, maxIssues = 2, politicianNames = [] } = {}) {
  let articles = [];
  try {
    articles = await getRawArticles(query);
  } catch {
    return { stories: [], topics: [], issues: [] };
  }
  if (!articles.length) return { stories: [], topics: [], issues: [] };

  const scored = clusterArticles(articles)
    .map((c) => ({ cluster: c, ...scoreCluster(c) }))
    .filter((s) => s.outletCount >= 2 || (s.freshestHours !== null && s.freshestHours <= 24))
    .sort((a, b) => b.score - a.score);

  const stories = scored.slice(0, maxStories).map((s) => {
    const lead = pickLead(s.cluster);
    return {
      headline: lead.title,
      summary: lead.description || null,
      url: lead.url,
      publishedAt: lead.publishedAt,
      hoursOld: s.freshestHours,
      outletCount: s.outletCount,
      articleCount: s.articleCount,
      score: s.score,
    };
  });

  const topics = scored.slice(0, maxTopics).map((s) => {
    const lead = pickLead(s.cluster);
    return {
      label: topicLabel(s.cluster),
      outletCount: s.outletCount,
      hoursOld: s.freshestHours,
      url: lead.url,
      context: lead.title,
    };
  }).filter((t) => t.label);

  // Issue Watch: the top 1-2 clusters, enriched with their full article
  // list and — only where a real match exists — which known politicians
  // are named in the coverage. A politician is "involved" only if their
  // exact name appears as a substring in an article title in this cluster
  // — never inferred, never guessed.
  const issues = scored.slice(0, maxIssues).map((s) => {
    const lead = pickLead(s.cluster);
    const relatedArticles = s.cluster.articles.slice(0, 5).map((a) => ({ title: a.title, url: a.url, source: a.source }));
    const involved = politicianNames.filter((name) =>
      s.cluster.articles.some((a) => a.title && a.title.toLowerCase().includes(name.toLowerCase()))
    );
    return {
      topic: topicLabel(s.cluster),
      headline: lead.title,
      summary: lead.description || null,
      hoursOld: s.freshestHours,
      outletCount: s.outletCount,
      relatedArticles,
      politiciansInvolved: involved,
    };
  });

  return { stories, topics, issues };
}
