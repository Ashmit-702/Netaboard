// Normalization and de-duplication of raw provider articles. Pure — no
// network, no Supabase. Provenance (which provider returned the article) is
// KEPT on every record for the backend, but nothing downstream shows it in
// normal UI.

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " ", "&#8217;": "’", "&#8216;": "‘", "&#8220;": "“", "&#8221;": "”" };

export function cleanText(input) {
  if (!input) return null;
  let s = String(input)
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39|#8217|#8216|#8220|#8221);/g, (m) => ENTITIES[m] || m)
    .replace(/\s+/g, " ")
    .trim();
  // Common feed boilerplate that carries no information.
  s = s.replace(/\s*(The post .*? appeared first on .*?\.?|Read more.*|Continue reading.*)$/i, "").trim();
  return s.length ? s : null;
}

const TWO_PART_TLDS = new Set(["co.in", "org.in", "net.in", "gov.in", "nic.in", "ac.in", "com.au", "co.uk", "org.uk", "co.nz", "com.pk", "com.bd", "co.za"]);

// Independence is judged by registrable domain, so
// economictimes.indiatimes.com and timesofindia.indiatimes.com count as ONE
// publisher — a group repeating a story is not two independent confirmations.
export function outletFromUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^(www|m|amp|mobile)\./, "");
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    const last2 = parts.slice(-2).join(".");
    return TWO_PART_TLDS.has(last2) ? parts.slice(-3).join(".") : last2;
  } catch { return null; }
}

export function canonicalUrl(url) {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "")).toLowerCase();
  } catch { return null; }
}

export function titleKey(title) {
  return (title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function stripOutletSuffix(title, outletName) {
  if (!title || !outletName) return title;
  const m = title.match(/^(.*?)\s+[-–—|]\s+([^-–—|]{2,40})$/);
  if (m && m[2].trim().toLowerCase() === outletName.trim().toLowerCase()) return m[1].trim();
  return title;
}

function parseDate(v, now) {
  if (!v) return null;
  const t = new Date(v).getTime();
  if (Number.isNaN(t)) return null;
  // A timestamp in the future is a feed error, not news from tomorrow.
  if (t > now + 10 * 60000) return null;
  return new Date(t).toISOString();
}

export function normalizeArticle(raw, provider, now = Date.now()) {
  if (!raw || !raw.url || !raw.title) return null;
  const outlet = outletFromUrl(raw.url);
  if (!outlet) return null;
  const title = cleanText(stripOutletSuffix(cleanText(raw.title), raw.source));
  if (!title || title.length < 15) return null;
  return {
    provider,                                   // provenance — backend only
    title,
    titleKey: titleKey(title),
    url: raw.url,
    urlKey: canonicalUrl(raw.url),
    outlet,                                     // registrable domain: the independence unit
    outletName: raw.source && raw.source.length < 60 ? raw.source : outlet,
    publishedAt: parseDate(raw.publishedAt, now),
    description: cleanText(raw.description),
  };
}

/**
 * Normalize + de-duplicate. Same URL, or same title from the same outlet,
 * collapses to one record (preferring the one with a description). The SAME
 * story from DIFFERENT outlets is deliberately kept — that is the
 * cross-outlet signal the clustering step counts.
 */
export function normalizeAll(rawByProvider, now = Date.now()) {
  const out = [];
  const seenUrl = new Map();
  const seenTitle = new Map();
  for (const { provider, articles } of rawByProvider) {
    for (const raw of articles || []) {
      const a = normalizeArticle(raw, provider, now);
      if (!a) continue;
      const tKey = `${a.outlet}|${a.titleKey}`;
      const existing = seenUrl.get(a.urlKey) ?? seenTitle.get(tKey);
      if (existing) {
        if (!existing.description && a.description) existing.description = a.description;
        if (!existing.publishedAt && a.publishedAt) existing.publishedAt = a.publishedAt;
        existing.providers = [...new Set([...(existing.providers || [existing.provider]), a.provider])];
        continue;
      }
      a.providers = [a.provider];
      seenUrl.set(a.urlKey, a);
      seenTitle.set(tKey, a);
      out.push(a);
    }
  }
  return out;
}
