// Multi-source news aggregator. Every fetcher is independent and wrapped in
// try/catch via Promise.allSettled — one source failing (or not being
// configured) never breaks the others. Configure as many as you like; more
// sources = better dedupe and less single-outlet bias in the daily brief.
import { pickKey } from "./keyRotation";

async function fromGNews(query) {
  const key = pickKey("GNEWS_API_KEY");
  if (!key) return [];
  const res = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=8&apikey=${key}`);
  const data = await res.json();
  return (data.articles || []).map((a) => ({ title: a.title, url: a.url, source: a.source?.name || "GNews" }));
}

async function fromNewsData(query) {
  const key = pickKey("NEWSDATA_API_KEY");
  if (!key) return [];
  const res = await fetch(`https://newsdata.io/api/1/latest?apikey=${key}&q=${encodeURIComponent(query)}&language=en`);
  const data = await res.json();
  return (data.results || []).slice(0, 8).map((a) => ({ title: a.title, url: a.link, source: a.source_id || "NewsData" }));
}

async function fromCurrents(query) {
  const key = pickKey("CURRENTS_API_KEY");
  if (!key) return [];
  const res = await fetch(`https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(query)}&language=en&apiKey=${key}`);
  const data = await res.json();
  return (data.news || []).slice(0, 8).map((a) => ({ title: a.title, url: a.url, source: "Currents" }));
}

async function fromGuardian(query) {
  const key = pickKey("GUARDIAN_API_KEY");
  if (!key) return [];
  const res = await fetch(`https://content.guardianapis.com/search?q=${encodeURIComponent(query)}&api-key=${key}`);
  const data = await res.json();
  return (data.response?.results || []).slice(0, 8).map((a) => ({ title: a.webTitle, url: a.webUrl, source: "The Guardian" }));
}

export async function getHeadlines(query = "India politics") {
  const results = await Promise.allSettled([
    fromGNews(query), fromNewsData(query), fromCurrents(query), fromGuardian(query),
  ]);
  const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  // Dedupe by normalized title so the same story from two outlets isn't repeated.
  const seen = new Set();
  const deduped = [];
  for (const item of all) {
    const norm = item.title?.toLowerCase().slice(0, 60);
    if (norm && !seen.has(norm)) { seen.add(norm); deduped.push(item); }
  }
  return deduped.slice(0, 12);
}
