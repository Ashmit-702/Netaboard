// Story clustering. Pure. One cluster = one story.
//
// Design goals, in order:
//  1. Same event reported in different words by different outlets -> ONE
//     cluster (e.g. "UPI services down across banks" + "UPI outage hits
//     users nationwide" share almost no words but do share the acronym UPI).
//  2. Different stories that merely mention the same politician/place must
//     NOT merge. A capitalised name alone is never enough; a broad acronym
//     that appears in a large share of the feed is ignored.
//  3. No chain drift: an article joins a cluster only if it links to a
//     meaningful FRACTION of that cluster's articles (average linkage), not
//     just one of them.
//
// Nothing here knows any topic in advance.

const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","as","is","are","was","were",
  "be","been","after","before","over","under","about","into","its","it","this","that","these","those","has","have",
  "had","will","would","can","could","may","might","not","no","new","says","said","say","amid","ahead","up","down",
  "out","more","most","than","then","now","who","what","why","how","india","indian","indians","government","govt",
  "news","report","reports","update","updates","live","top","big","major","latest","today","against","during","two",
  "one","also","says","hits","their","they","them","here","there","when","where","while","just","first","last",
  "year","years","day","days","week","time","people","state","says","set","gets","get","take","takes","make","makes",
]);
// Very generic acronyms that are never a story key on their own.
const GENERIC_ACRONYMS = new Set(["us","uk","pm","cm","mp","ai","tv","fir","rs","vs","ist","gmt","usd","inr"]);

const HOUR = 3600000;

export function tokenize(text) {
  // 3+ characters so story acronyms (UPI, GST, IPL) survive as tokens.
  return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Entity-like terms from the ORIGINAL casing: acronyms (UPI, NPCI, SEBI) and
// capitalised words. Returns Map(term -> "acronym" | "name").
export function entities(text) {
  const out = new Map();
  const raw = (text || "").replace(/[^A-Za-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  raw.forEach((w) => {
    const lower = w.toLowerCase();
    if (STOPWORDS.has(lower)) return;
    if (/^[A-Z][A-Z0-9]{2,5}$/.test(w) && !GENERIC_ACRONYMS.has(lower)) out.set(lower, "acronym");
    else if (/^[A-Z][a-z]{3,}$/.test(w)) out.set(lower, out.get(lower) || "name");
  });
  return out;
}

function prep(article) {
  const text = article.title;
  const descSnippet = (article.description || "").slice(0, 220);
  return {
    ...article,
    tokens: [...new Set(tokenize(text))],
    ents: entities(text),
    descTokens: new Set(tokenize(descSnippet)),
    descEnts: entities(descSnippet),
    time: article.publishedAt ? new Date(article.publishedAt).getTime() : null,
  };
}

function overlap(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return { shared: 0, ratio: 0 };
  const b = new Set(bTokens);
  let shared = 0;
  for (const t of aTokens) if (b.has(t)) shared++;
  return { shared, ratio: shared / Math.min(aTokens.length, bTokens.length) };
}

/** Are two articles about the same story? `ctx.specific` = story-identifying entities. */
// An entity identifies a story if it is either rare, or BURSTY: a big
// share of the articles carrying it fall inside one 12-hour window (an
// event). A standing entity — a party, a city, a minister — is spread evenly
// across the whole window and therefore never qualifies on volume alone.
// This is what lets a dominant story's key acronym (UPI in 9 of 17
// headlines) cluster together while "BJP" in 40% of a political feed does not.
function specificEntities(articles, dfCap) {
  const byTerm = new Map();
  for (const a of articles) for (const term of a.ents.keys()) {
    if (!byTerm.has(term)) byTerm.set(term, []);
    byTerm.get(term).push(a.time);
  }
  const specific = new Set();
  for (const [term, times] of byTerm) {
    if (times.length <= dfCap) { specific.add(term); continue; }
    const dated = times.filter((t) => t !== null).sort((x, y) => x - y);
    if (dated.length < 3 || dated.length < times.length * 0.8) continue;
    let best = 0;
    for (let i = 0, j = 0; i < dated.length; i++) {
      while (dated[i] - dated[j] > 12 * HOUR) j++;
      best = Math.max(best, i - j + 1);
    }
    if (best / dated.length >= 0.7) specific.add(term);
  }
  return specific;
}

export function linked(a, b, ctx) {
  if (a.time !== null && b.time !== null && Math.abs(a.time - b.time) > 72 * HOUR) return false;
  const gapHours = a.time !== null && b.time !== null ? Math.abs(a.time - b.time) / HOUR : 0;

  // 1. Shared vocabulary in the headlines.
  const { shared, ratio } = overlap(a.tokens, b.tokens);
  // Two shared words is only enough when they make up most of the shorter
  // headline; "Modi inaugurates ..." must not glue a highway to a metro line.
  if (shared >= 3 && ratio >= 0.45) return true;
  if (shared >= 2 && ratio >= 0.75) return true;

  // 2. Shared story-defining acronym (UPI, NPCI, ...), reported close in time.
  let sharedEnts = 0;
  for (const [term, kind] of a.ents) {
    if (!b.ents.has(term)) continue;
    if (!ctx.specific.has(term)) continue;              // standing/widespread entity: identifies nothing
    if (kind === "acronym" && b.ents.get(term) === "acronym" && gapHours <= 36) return true;
    sharedEnts++;
  }
  // 3. Two or more distinct shared entities (a name alone is not enough).
  if (sharedEnts >= 2) return true;

  // 4. Weak headline overlap corroborated by descriptions.
  if (shared >= 1 && a.descTokens.size && b.descTokens.size) {
    let descShared = 0;
    for (const t of a.descTokens) if (b.descTokens.has(t)) descShared++;
    if (shared + descShared >= 5 && descShared / Math.min(a.descTokens.size, b.descTokens.size) >= 0.3) return true;
  }
  return false;
}

function assignId(cluster) {
  // Stable identity: derived from the EARLIEST article in the cluster (its
  // canonical URL), which does not change as later coverage is added. So a
  // developing story keeps the same id from 10:30 to 1:20.
  const anchor = [...cluster.articles].sort((x, y) => (x.time ?? Infinity) - (y.time ?? Infinity) || x.urlKey.localeCompare(y.urlKey))[0];
  let h = 2166136261;
  const s = anchor.urlKey;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return "s" + (h >>> 0).toString(36);
}

export function clusterArticles(normalized) {
  const articles = normalized
    .map(prep)
    .filter((a) => a.tokens.length >= 2 || [...a.ents.values()].includes("acronym"))
    // oldest first: the earliest report seeds each cluster
    .sort((x, y) => (x.time ?? Infinity) - (y.time ?? Infinity));

  const dfCap = Math.max(6, Math.ceil(articles.length * 0.3));
  const ctx = { specific: specificEntities(articles, dfCap) };

  const clusters = [];
  for (const article of articles) {
    let best = null;
    for (const c of clusters) {
      const links = c.articles.reduce((n, existing) => n + (linked(existing, article, ctx) ? 1 : 0), 0);
      if (!links) continue;
      const fraction = links / c.articles.length;
      // Small clusters: one link suffices. Larger: a third of members must agree.
      const ok = c.articles.length <= 2 ? links >= 1 : fraction >= 0.34;
      // Prefer the cluster the article is most strongly tied to: more linked
      // members first (a bridge article joins the story it shares most with),
      // then higher fraction.
      if (ok && (!best || links > best.links || (links === best.links && fraction > best.fraction))) best = { c, fraction, links };
    }
    if (best) best.c.articles.push(article);
    else clusters.push({ articles: [article] });
  }
  for (const c of clusters) c.id = assignId(c);
  return clusters;
}
