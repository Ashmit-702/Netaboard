// Network layer: fetch raw articles from every CONFIGURED provider. Every
// provider is independent — one failing or being unconfigured never breaks
// the others. Returns per-provider status so the caller can distinguish
// "nothing happened" from "everything failed".
//
// One query per provider per refresh, on purpose: the free tiers of these
// APIs are small, and categories are assigned from content afterwards
// (lib/current-affairs/categorize.js), not requested one-by-one.
import { pickKey } from "../keyRotation.js";

const TIMEOUT_MS = 8000;

async function getJson(url) {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const providers = {
  gnews: async (q) => {
    const key = pickKey("GNEWS_API_KEY");
    if (!key) return null;
    const d = await getJson(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&sortby=publishedAt&apikey=${key}`);
    return (d.articles || []).map((a) => ({ title: a.title, url: a.url, source: a.source?.name, publishedAt: a.publishedAt, description: a.description }));
  },
  newsdata: async (q) => {
    const key = pickKey("NEWSDATA_API_KEY");
    if (!key) return null;
    const d = await getJson(`https://newsdata.io/api/1/latest?apikey=${key}&q=${encodeURIComponent(q)}&language=en`);
    return (d.results || []).map((a) => ({ title: a.title, url: a.link, source: a.source_name || a.source_id, publishedAt: a.pubDate ? a.pubDate.replace(" ", "T") + (/Z|[+-]\d\d:?\d\d$/.test(a.pubDate) ? "" : "Z") : null, description: a.description }));
  },
  currents: async (q) => {
    const key = pickKey("CURRENTS_API_KEY");
    if (!key) return null;
    const d = await getJson(`https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(q)}&language=en&apiKey=${key}`);
    return (d.news || []).map((a) => ({ title: a.title, url: a.url, source: null, publishedAt: a.published, description: a.description }));
  },
  guardian: async (q) => {
    const key = pickKey("GUARDIAN_API_KEY");
    if (!key) return null;
    const d = await getJson(`https://content.guardianapis.com/search?q=${encodeURIComponent(q)}&order-by=newest&page-size=30&show-fields=trailText&api-key=${key}`);
    return (d.response?.results || []).map((a) => ({ title: a.webTitle, url: a.webUrl, source: "The Guardian", publishedAt: a.webPublicationDate, description: a.fields?.trailText }));
  },
  // GDELT needs no key, so a production deployment always has at least one live source.
  gdelt: async (q) => {
    const d = await getJson(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`${q} sourcelang:english`)}&mode=artlist&maxrecords=75&timespan=2d&sort=datedesc&format=json`);
    return (d.articles || []).map((a) => ({
      title: a.title, url: a.url, source: a.domain,
      publishedAt: a.seendate ? a.seendate.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, "$1-$2-$3T$4:$5:$6Z") : null,
      description: null,
    }));
  },
};

export async function fetchAllProviders(query = process.env.NEWS_QUERY || "India") {
  const names = Object.keys(providers);
  const settled = await Promise.allSettled(names.map((n) => providers[n](query)));
  const results = [];
  settled.forEach((r, i) => {
    const provider = names[i];
    if (r.status === "fulfilled") {
      if (r.value === null) results.push({ provider, configured: false, ok: false, articles: [] });
      else results.push({ provider, configured: true, ok: true, articles: r.value });
    } else {
      results.push({ provider, configured: true, ok: false, error: String(r.reason?.message || r.reason), articles: [] });
    }
  });
  return results;
}
