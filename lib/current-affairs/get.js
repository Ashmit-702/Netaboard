// Server entry point for the Current Affairs engine. This is the ONLY
// place that touches the network for news. Ingestion is cached in Next's
// data cache (default 15 min, NEWS_REVALIDATE_SECONDS to change) so the
// homepage, /current-affairs, /brief, /issue-watch and politician pages all
// share ONE set of API calls per refresh window — protecting free-tier
// quotas — while clustering/ranking (cheap) runs per request against the
// current clock, so relative times and freshness windows are always right.
import { unstable_cache } from "next/cache";
import { fetchAllProviders } from "../news/ingest.js";
import { normalizeAll } from "../news/normalize.js";
import { buildFeed } from "./feed.js";
import { trendingNow } from "../issues/trending.js";
import { issueWatch } from "../issues/issue-watch.js";

const REVALIDATE = Number(process.env.NEWS_REVALIDATE_SECONDS) || 900;

const cachedIngest = unstable_cache(
  async () => {
    const results = await fetchAllProviders();
    // If nothing at all succeeded, THROW so the failure is not cached and the
    // next request retries instead of serving an error for 15 minutes.
    if (!results.some((r) => r.ok)) {
      const err = new Error("all news providers failed or are unconfigured");
      err.providers = results.map(({ provider, configured, ok, error }) => ({ provider, configured, ok, error }));
      throw err;
    }
    return {
      fetchedAt: new Date().toISOString(),
      providers: results.map(({ provider, configured, ok, error, articles }) => ({ provider, configured, ok, error, count: articles.length })),
      raw: results.filter((r) => r.ok).map(({ provider, articles }) => ({ provider, articles })),
    };
  },
  ["news-ingest-v2"],
  { revalidate: REVALIDATE, tags: ["news"] }
);

/**
 * @returns {{ status: "ok"|"empty"|"failed", items, trending, issues, fetchedAt, providers }}
 *  ok     - at least one current story
 *  empty  - feeds worked, nothing current/significant
 *  failed - could not refresh (no provider succeeded)
 * Never falls back to seed/demo/old data.
 */
export async function getCurrentAffairs({ roster = [] } = {}) {
  try {
    const ingest = await cachedIngest();
    const now = Date.now();
    const normalized = normalizeAll(ingest.raw, now);
    const items = buildFeed(normalized, { now, roster });
    return {
      status: items.length ? "ok" : "empty",
      items,
      trending: trendingNow(items),
      issues: issueWatch(items),
      fetchedAt: ingest.fetchedAt,
      providers: ingest.providers,
      articleCount: normalized.length,
    };
  } catch (err) {
    return { status: "failed", items: [], trending: [], issues: [], fetchedAt: null, providers: err.providers || [], articleCount: 0 };
  }
}
