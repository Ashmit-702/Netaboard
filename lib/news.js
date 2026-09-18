// Multi-source news aggregator. Every fetcher is independent and wrapped in
// try/catch via Promise.allSettled — one source failing (or not being
// configured) never breaks the others. Configure as many as you like; more
// sources = better dedupe and less single-outlet bias.
//
// Each fetcher now returns { title, url, source, publishedAt, description }.
// publishedAt and description were previously discarded — they're required
// for freshness ranking and story summaries in lib/trending.js.
import { pickKey } from "./keyRotation";

async function fromGNews(query) {
  const key = pickKey("GNEWS_API_KEY");
  if (!key) return [];
  const res = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&apikey=${key}`);
  const data = await res.json();
  return (data.articles || []).map((a) => ({
    title: a.title, url: a.url, source: a.source?.name || "GNews",
    publishedAt: a.publishedAt || null, description: a.description || null,
  }));
}

async function fromNewsData(query) {
  const key = pickKey("NEWSDATA_API_KEY");
  if (!key) return [];
  const res = await fetch(`https://newsdata.io/api/1/latest?apikey=${key}&q=${encodeURIComponent(query)}&language=en`);
  const data = await res.json();
  return (data.results || []).slice(0, 10).map((a) => ({
    title: a.title, url: a.link, source: a.source_id || "NewsData",
    publishedAt: a.pubDate || null, description: a.description || null,
  }));
}

async function fromCurrents(query) {
  const key = pickKey("CURRENTS_API_KEY");
  if (!key) return [];
  const res = await fetch(`https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(query)}&language=en&apiKey=${key}`);
  const data = await res.json();
  return (data.news || []).slice(0, 10).map((a) => ({
    title: a.title, url: a.url, source: "Currents",
    publishedAt: a.published || null, description: a.description || null,
  }));
}

async function fromGuardian(query) {
  const key = pickKey("GUARDIAN_API_KEY");
  if (!key) return [];
  const res = await fetch(`https://content.guardianapis.com/search?q=${encodeURIComponent(query)}&order-by=newest&show-fields=trailText&api-key=${key}`);
  const data = await res.json();
  return (data.response?.results || []).slice(0, 10).map((a) => ({
    title: a.webTitle, url: a.webUrl, source: "The Guardian",
    publishedAt: a.webPublicationDate || null, description: a.fields?.trailText || null,
  }));
}

// GDELT — zero signup, ever. Free global news-event database.
async function fromGDELT(query) {
  try {
    const res = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=20&timespan=2d&sort=datedesc&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a) => ({
      title: a.title, url: a.url, source: a.domain || "GDELT",
      // GDELT's seendate is like "20260821T143000Z" — normalize to ISO.
      publishedAt: a.seendate
        ? a.seendate.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, "$1-$2-$3T$4:$5:$6Z")
        : null,
      description: null,
    }));
  } catch { return []; }
}

/**
 * Raw article fetch across every configured source. Returns all articles
 * WITHOUT deduping, because lib/trending.js needs the duplicates — the
 * number of outlets covering the same story is the cross-source volume
 * signal used to rank significance.
 */
export async function getRawArticles(query = "India politics") {
  const results = await Promise.allSettled([
    fromGNews(query), fromNewsData(query), fromCurrents(query), fromGuardian(query), fromGDELT(query),
  ]);
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function getHeadlines(query = "India politics") {
  const all = await getRawArticles(query);
  // Dedupe by normalized title so the same story from two outlets isn't repeated.
  const seen = new Set();
  const deduped = [];
  for (const item of all) {
    const norm = item.title?.toLowerCase().slice(0, 60);
    if (norm && !seen.has(norm)) { seen.add(norm); deduped.push(item); }
  }
  return deduped.slice(0, 12);
}
