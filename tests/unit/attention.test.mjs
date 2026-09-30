import test from "node:test";
import assert from "node:assert/strict";
import { politicalRelevance, discoveryScore, windowedTrend, attentionHeadline as modelHeadline } from "../../lib/attentionModel.js";
import { serializeReason, parseReason, relevanceFromParsed } from "../../lib/attentionParse.js";
import { trendingNetas, attentionFactors, attentionHeadline, hasSufficientHistory } from "../../lib/attention.js";

const DAY = 86400000;
const NOW = Date.parse("2026-09-24T10:00:00Z");

// A signal shaped like lib/social.js's getMentionSignal() output.
const sig = (news, social, wiki) => ({ news: { gdelt: news }, social: { mastodon: social, bluesky: 0, reddit: 0, hackernews: 0, x: 0 }, discovery: { wikipedia: wiki } });

test("Wikipedia/discovery is excluded from political relevance entirely", () => {
  const withoutWiki = politicalRelevance(sig(2, 1, 0));
  const withHugeWiki = politicalRelevance(sig(2, 1, 500000));
  assert.equal(withoutWiki, withHugeWiki, "changing only Wikipedia views must not move the political relevance score");
  assert.ok(discoveryScore(sig(0, 0, 50000)) > 0, "but it IS tracked as its own discovery score");
});

test("political relevance is log-dampened: 10x the mentions is nowhere near 10x the score", () => {
  const small = politicalRelevance(sig(2, 0, 0));
  const big = politicalRelevance(sig(20, 0, 0));
  assert.ok(big > small);
  assert.ok(big < small * 10);
});

// ---- The three brief-mandated profiles ---------------------------------

test("PROFILE 1 — high baseline (famous), little REAL recent change: must NOT trend", () => {
  // Nitish-shaped: large, fairly stable daily political relevance for a week
  // (steady news coverage of a long-serving figure), today barely different.
  const history = Array.from({ length: 7 }, (_, i) => ({ at: NOW - (i + 1) * DAY, relevance: 18 + (i % 2) })); // ~18-19 daily
  const today = 19; // current = 100 vs baseline = 98 in the brief's own example: ~+2%
  const trend = windowedTrend(history, today, NOW);
  assert.equal(trend.sufficientHistory, true);
  assert.ok(Math.abs(trend.changePct) < TRENDING_CUTOFF(), `changePct was ${trend.changePct}, should be small`);
  assert.equal(trend.state, "steady");
  assert.notEqual(modelHeadline(trend), "");
  assert.ok(!/^\+\d{2,}/.test(modelHeadline(trend)) || Math.abs(trend.changePct) < 20);
});

test("PROFILE 2 — low baseline, genuinely large recent spike: SHOULD be capable of trending", () => {
  // brief's own numeric example: baseline ~150 -> current ~400 => +167%
  const history = Array.from({ length: 7 }, (_, i) => ({ at: NOW - (i + 1) * DAY, relevance: 5 })); // low, stable baseline
  const today = 15; // a real, large jump
  const trend = windowedTrend(history, today, NOW);
  assert.equal(trend.sufficientHistory, true);
  assert.ok(trend.changePct >= 20, `expected a trend-worthy jump, got ${trend.changePct}%`);
  assert.equal(trend.state, "trending_up");
  assert.match(modelHeadline(trend), /^\+\d/);
});

test("PROFILE 3 — genuinely inactive politician: never shows a fabricated rising trend", () => {
  const history = Array.from({ length: 7 }, (_, i) => ({ at: NOW - (i + 1) * DAY, relevance: 0 }));
  const trend = windowedTrend(history, 0, NOW);
  assert.equal(trend.state, "inactive");
  assert.equal(trend.changePct, 0);
  assert.equal(modelHeadline(trend), "No significant recent political attention");
});

test("insufficient history is reported honestly, not as a 0% trend", () => {
  const trend = windowedTrend([{ at: NOW - DAY, relevance: 10 }], 12, NOW); // only 1 prior day
  assert.equal(trend.sufficientHistory, false);
  assert.equal(trend.state, "insufficient_history");
  assert.equal(modelHeadline(trend), "Not enough attention history");
});

test("a near-zero baseline doesn't produce a runaway percentage (EPS floor)", () => {
  const history = Array.from({ length: 7 }, (_, i) => ({ at: NOW - (i + 1) * DAY, relevance: 0.01 }));
  const trend = windowedTrend(history, 3, NOW);
  assert.ok(trend.changePct < 1000, `changePct exploded to ${trend.changePct}% from a near-zero baseline`);
});

// ---- reason text round-trip ----------------------------------------------

test("reason text is a faithful, parseable round trip and Discovery is labelled as not counted", () => {
  const s = sig(4, 3, 12000);
  const text = serializeReason(s);
  assert.match(text, /News: 4 GDELT/);
  assert.match(text, /Discovery: 12,000 Wikipedia/);
  assert.match(text, /Breadth: 2 independent sources/); // gdelt + mastodon nonzero = 2
  const parsed = parseReason(text);
  assert.equal(parsed.news.gdelt, 4);
  assert.equal(parsed.discovery.wikipedia, 12000);
  assert.ok(relevanceFromParsed(parsed) > 0);
});

// ---- read-side: attention.js ---------------------------------------------

function TRENDING_CUTOFF() { return 20; }

test("trendingNetas requires sufficient history — an insufficient-history row never appears even with a big change_pct", () => {
  const rows = [
    { slug: "a", name: "A", recorded_at: new Date(NOW).toISOString(), change_pct: 55, reason: "Not enough attention history yet — News: 2 ..." },
    { slug: "b", name: "B", recorded_at: new Date(NOW).toISOString(), change_pct: 55, reason: "News: 2 GDELT articles · Social: 0 posts · Discovery: 0 Wikipedia views (24h) · Breadth: 1 independent source" },
  ];
  const trending = trendingNetas(rows, { now: NOW });
  assert.deepEqual(trending.map((r) => r.slug), ["b"]);
});

test("trendingNetas threshold matches the model's own trending cutoff (20%), not an arbitrary 1%", () => {
  const rows = [{ slug: "c", name: "C", recorded_at: new Date(NOW).toISOString(), change_pct: 5, reason: "News: 1 GDELT article · Breadth: 1 independent source" }];
  assert.equal(trendingNetas(rows, { now: NOW }).length, 0, "a 5% wobble must not count as trending");
});

test("attentionFactors separates News / Social / Discovery / Breadth as distinct categories", () => {
  const reason = "News: 3 GDELT articles · Social: 5 posts (mastodon:3, bluesky:2) · Discovery: 8,200 Wikipedia views (24h) · Breadth: 2 independent sources";
  const factors = attentionFactors(reason);
  const byCat = Object.fromEntries(factors.map((f) => [f.category, f]));
  assert.equal(byCat.News.value, 3);
  assert.equal(byCat.Social.value, 5);
  assert.equal(byCat.Discovery.value, 8200);
  assert.equal(byCat.Breadth.value, 2);
});

test("attentionHeadline never shows bare '+3' style language", () => {
  const row = { change_pct: 45, reason: "News: 5 GDELT articles · Breadth: 3 independent sources" };
  const h = attentionHeadline(row);
  assert.match(h, /vs previous 7-day average/);
  assert.doesNotMatch(h, /^[+-]?\d+$/);
});
