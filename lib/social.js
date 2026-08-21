// Multi-source "how much is this person being talked about" signal, used to
// drive the Political Stock Market. Sources are ordered by how frictionless
// they are to actually get working — zero-signup sources first.
//
// X/Twitter: no free tier exists (dropped Feb 2026, pay-per-use only). The
// fromX() function below is fully wired and activates automatically if you
// buy credits and set X_BEARER_TOKEN — there's no free path around this,
// officially, from anyone.
//
// Reddit: the free tier is real (100 req/min, non-commercial), but as of
// 2026 new developer apps require manual approval that can take 2-4 weeks —
// no longer instant self-serve. Left in as optional; just don't expect it
// to be usable same-day.

// ---------- Wikipedia Pageviews — zero signup, ever ----------
// A politician's page traffic is a genuinely solid "how much attention are
// they getting right now" signal, and this API needs no key at all.
async function fromWikipedia(name) {
  const title = encodeURIComponent(name.replace(/ /g, "_"));
  const end = new Date();
  const start = new Date(end - 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
  try {
    const res = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${title}/daily/${fmt(start)}/${fmt(end)}`,
      { headers: { "User-Agent": "netaboard/1.0 (contact: you@example.com)" } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return (data.items || []).reduce((sum, i) => sum + (i.views || 0), 0);
  } catch { return 0; }
}

// ---------- GDELT Project — zero signup, ever ----------
// Free global news-event database. Counts recent articles mentioning the name.
async function fromGDELT(name) {
  try {
    const res = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${name}"`)}&mode=artlist&maxrecords=75&timespan=1d&format=json`
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return (data.articles || []).length;
  } catch { return 0; }
}

// ---------- Hacker News (Algolia) — zero signup, ever ----------
async function fromHackerNews(name) {
  try {
    const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(name)}&tags=story`);
    const data = await res.json();
    return data?.nbHits || 0;
  } catch { return 0; }
}

// ---------- Mastodon — zero signup, public hashtag timelines are open ----------
async function fromMastodon(name) {
  const instance = process.env.MASTODON_INSTANCE || "mastodon.social";
  const tag = name.replace(/[^a-zA-Z0-9]/g, "");
  if (!tag) return 0;
  try {
    const res = await fetch(`https://${instance}/api/v1/timelines/tag/${tag}?limit=40`);
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch { return 0; }
}

// ---------- Bluesky — free account + App Password, instant approval ----------
async function fromBluesky(name) {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;
  if (!identifier || !appPassword) return 0;
  try {
    const session = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password: appPassword }),
    }).then((r) => r.json());
    if (!session?.accessJwt) return 0;
    const res = await fetch(`https://bsky.social/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(name)}&limit=25`, {
      headers: { Authorization: `Bearer ${session.accessJwt}` },
    });
    const data = await res.json();
    return data?.posts?.length || 0;
  } catch { return 0; }
}

// ---------- Reddit — optional, real free tier but now approval-gated ----------
let redditToken = null;
let redditTokenExpiry = 0;

async function getRedditToken() {
  if (redditToken && Date.now() < redditTokenExpiry) return redditToken;
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "netaboard/1.0",
      },
      body: "grant_type=client_credentials",
    });
    const data = await res.json();
    if (!data.access_token) return null;
    redditToken = data.access_token;
    redditTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return redditToken;
  } catch { return null; }
}

async function fromReddit(name) {
  const token = await getRedditToken();
  if (!token) return 0;
  try {
    const res = await fetch(`https://oauth.reddit.com/search?q=${encodeURIComponent(name)}&t=day&limit=25`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "netaboard/1.0" },
    });
    const data = await res.json();
    return data?.data?.children?.length || 0;
  } catch { return 0; }
}

// ---------- X — paid only, no free tier exists ----------
// ---------- X — paid only (pay-per-use since Feb 2026, no free tier) ----------
// Uses recent search rather than the counts endpoint — counts availability
// under pay-per-use is inconsistently documented, while search/recent is the
// standard, definitely-billed, definitely-available endpoint. Billed per
// post returned (~$0.005/read as of Aug 2026) — max_results=25 keeps each
// call's cost small and predictable. -is:retweet filters out retweet noise
// so the count reflects original mentions, not amplification.
async function fromX(name) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return 0;
  try {
    const query = `"${name}" -is:retweet lang:en`;
    const res = await fetch(
      `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=25`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return (data?.data || []).length;
  } catch { return 0; }
}

export async function getMentionSignal(name) {
  const [wiki, gdelt, hn, mastodon, bluesky, reddit, x] = await Promise.allSettled([
    fromWikipedia(name), fromGDELT(name), fromHackerNews(name), fromMastodon(name),
    fromBluesky(name), fromReddit(name), fromX(name),
  ]);
  const val = (r) => (r.status === "fulfilled" ? r.value : 0);
  // Wikipedia pageviews run in the hundreds/thousands vs. single/double digits
  // elsewhere, so it's scaled down before summing — otherwise it would drown
  // out every other source in the total.
  const breakdown = {
    wikipedia_pageviews: val(wiki),
    gdelt_articles: val(gdelt),
    hackernews: val(hn),
    mastodon: val(mastodon),
    bluesky: val(bluesky),
    reddit: val(reddit),
    x: val(x),
  };
  const total = Math.round(breakdown.wikipedia_pageviews / 50) + breakdown.gdelt_articles
    + breakdown.hackernews + breakdown.mastodon + breakdown.bluesky + breakdown.reddit + breakdown.x;
  return { total, breakdown };
}
