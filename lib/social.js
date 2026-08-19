// Multi-source "how much is this person being talked about" signal, used to
// drive the Political Stock Market. X/Twitter is deliberately excluded by
// default — it dropped free API access in Feb 2026 and now runs on paid
// credits (see README) — but a paid path is included below, off unless you
// set X_BEARER_TOKEN yourself.
//
// Every source returns a plain mention count for a name/topic. Counts aren't
// directly comparable across platforms (Reddit vs Bluesky vs Hacker News have
// very different volumes), so stock-refresh treats this as a relative signal,
// not an absolute one.

let redditToken = null;
let redditTokenExpiry = 0;

async function getRedditToken() {
  if (redditToken && Date.now() < redditTokenExpiry) return redditToken;
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
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
}

async function fromReddit(name) {
  const token = await getRedditToken();
  if (!token) return 0;
  const res = await fetch(`https://oauth.reddit.com/search?q=${encodeURIComponent(name)}&t=day&limit=25`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "netaboard/1.0" },
  });
  const data = await res.json();
  return data?.data?.children?.length || 0;
}

// Bluesky's public read API needs no key at all for profile/feed reads.
// Keyword *search* now requires a session (a free Bluesky account + App
// Password — create one at bsky.app → Settings → App Passwords).
async function fromBluesky(name) {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;
  if (!identifier || !appPassword) return 0;
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
}

// Hacker News (Algolia) — fully free, no key, no auth. Low volume for Indian
// politics specifically, but useful as a general public-discourse signal and
// costs nothing to include.
async function fromHackerNews(name) {
  const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(name)}&tags=story`);
  const data = await res.json();
  return data?.nbHits || 0;
}

// Mastodon public hashtag/tag timelines are open on most instances without
// auth. Point MASTODON_INSTANCE at any instance you trust (default mastodon.social).
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

// Paid path — only runs if you've bought X API credits and set X_BEARER_TOKEN.
async function fromX(name) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return 0;
  const res = await fetch(`https://api.x.com/2/tweets/counts/recent?query=${encodeURIComponent(name)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return (data?.data || []).reduce((sum, d) => sum + (d.tweet_count || 0), 0);
}

export async function getMentionSignal(name) {
  const [reddit, bluesky, hn, mastodon, x] = await Promise.allSettled([
    fromReddit(name), fromBluesky(name), fromHackerNews(name), fromMastodon(name), fromX(name),
  ]);
  const val = (r) => (r.status === "fulfilled" ? r.value : 0);
  const breakdown = { reddit: val(reddit), bluesky: val(bluesky), hackernews: val(hn), mastodon: val(mastodon), x: val(x) };
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total, breakdown };
}
