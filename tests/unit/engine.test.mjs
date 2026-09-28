import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAll } from "../../lib/news/normalize.js";
import { clusterArticles } from "../../lib/news/cluster.js";
import { buildFeed, searchItems, sortItems } from "../../lib/current-affairs/feed.js";
import { matchesFilter, FILTERS, applyView } from "../../lib/current-affairs/search.js";
import { trendingNow } from "../../lib/issues/trending.js";
import { issueWatch } from "../../lib/issues/issue-watch.js";
import { generateBrief } from "../../lib/brief/generate.js";
import { relativeLabel, formatISTDateTime } from "../../lib/time.js";
import * as F from "./fixtures.mjs";

const feedOf = (...groups) => {
  const normalized = normalizeAll(F.asProvider(groups.flat()), F.NOW);
  return buildFeed(normalized, { now: F.NOW, roster: F.roster });
};
const find = (items, re) => items.find((i) => re.test(i.headline) || i.articles.some((a) => re.test(a.title)));

test("live-style ingestion: normalization strips HTML, dedupes same URL, drops junk and future dates", () => {
  const rawIn = [
    F.raw("<b>Parliament passes bill on data protection</b> &amp; privacy - The Hindu", "https://www.thehindu.com/news/bill/a1.ece?utm=x", 30, "<p>Lawmakers voted.</p>", "The Hindu"),
    F.raw("Parliament passes bill on data protection & privacy", "https://www.thehindu.com/news/bill/a1.ece", 30, "Lawmakers voted on Thursday."),   // same canonical URL
    F.raw("short", "https://x.com/a", 10),                                                                                // too short
    { title: "No url present but a long enough title", url: null },
    F.raw("Story with a timestamp from the future is treated as undated", "https://www.ndtv.com/x/1", -600),
  ];
  const out = normalizeAll(F.asProvider(rawIn), F.NOW);
  assert.equal(out.length, 2);
  const bill = out.find((a) => /Parliament/.test(a.title));
  assert.equal(bill.title, "Parliament passes bill on data protection & privacy");
  assert.ok(bill.description, "description kept from whichever duplicate had one");
  assert.equal(out.find((a) => /future/.test(a.title)).publishedAt, null);
  assert.deepEqual(bill.providers, ["gdelt"]);   // provenance retained for the backend
});

test("duplicate clustering + UPI-like multi-outlet story: differently-worded coverage becomes ONE item, discovered with no hardcoded topic", () => {
  const items = feedOf(F.upiArticles, F.distractors);
  const upi = items.filter((i) => i.articles.some((a) => /UPI/.test(a.title)));
  assert.equal(upi.length, 1, "all UPI coverage in one cluster");
  assert.equal(upi[0].articleCount, 9);
  assert.equal(upi[0].outletCount, 6, "hindustantimes x4 counts once: independent outlets only");
});

test("negative controls: a shared politician name or different regulators do NOT merge", () => {
  const items = feedOf(F.distractors);
  const modiExpressway = find(items, /expressway/i);
  const modiJapan = find(items, /Japan/i);
  assert.notEqual(modiExpressway.id, modiJapan.id);
  const rbi = find(items, /RBI/);
  const sebi = find(items, /SEBI/);
  assert.notEqual(rbi.id, sebi.id);
  assert.ok(rbi.articleCount === 2 && sebi.articleCount === 2);
});

test("publisher spam cannot dominate: 1 outlet x many articles ranks below 3 independent outlets", () => {
  const spam = ["a", "b", "c", "d", "e", "f"].map((k, i) => F.raw(`Zoning board approves quarry expansion near village ${k}`, `https://www.example-local.in/q/${k}`, 20 + i));
  const items = feedOf(spam, F.courtArticles);
  const q = find(items, /quarry/i);
  const s = find(items, /Supreme Court/i);
  assert.equal(q.outletCount, 1);
  assert.equal(s.outletCount, 3);
  assert.ok(s.score > q.score);
});

test("freshness ranking + old-article deprioritisation / exclusion windows", () => {
  const items = feedOf(F.upiArticles, F.sportsArticles, F.oldStories, F.continuing, F.stale72, F.undated);
  assert.equal(find(items, /Cyclone Vayu/), undefined, "96h-old story is out");
  assert.equal(find(items, /Metro/), undefined, "60h, 3 outlets, but not a continuing story -> out");
  assert.equal(find(items, /delimitation/), undefined, "undated stories are never presented as current");
  const flood = find(items, /flood relief/i);
  assert.ok(flood, "60h story kept because it is a continuing multi-outlet story");
  const upi = find(items, /UPI/);
  assert.ok(upi.score > flood.score, "fresh + broad beats older continuing story");
  assert.equal(items[0].id, upi.id);
});

test("single-outlet stories: kept only if <=24h, and rank low", () => {
  const items = feedOf(
    [F.raw("Local council debates new parking rules for the old town area", "https://www.only-one.in/a", 600)],  // 10h
    [F.raw("Regional festival preparations begin in the hill district", "https://www.only-two.in/b", 60 * 30)],    // 30h
    F.sportsArticles
  );
  assert.ok(find(items, /parking/));
  assert.equal(find(items, /festival/), undefined);
  assert.equal(items[0].topic, "Sports");
});

test("status labels are earned: BREAKING / DEVELOPING only with real coverage patterns", () => {
  const items = feedOf(F.upiArticles, F.distractors, F.sportsArticles);
  const upi = find(items, /UPI/);
  assert.ok(["BREAKING", "DEVELOPING"].includes(upi.status), `UPI status was ${upi.status}`);
  const modi = find(items, /expressway/i);
  assert.equal(modi.status, null, "ordinary 2-outlet story gets no label");
  const sports = find(items, /cricket/i);
  assert.equal(sports.status, null, "3 outlets but no recent-6h wave -> not labelled");
});

test("category + region classification and filtering", () => {
  const items = feedOf(F.upiArticles, F.sportsArticles, F.worldArticles);
  const sports = find(items, /cricket/i);
  const world = find(items, /European Central Bank/);
  const upi = find(items, /UPI/);
  assert.equal(sports.topic, "Sports");
  assert.equal(world.region, "World");
  assert.equal(upi.region, "India");
  assert.ok(matchesFilter(sports, "Sports") && !matchesFilter(sports, "Economy"));
  assert.ok(matchesFilter(world, "World") && !matchesFilter(world, "India"));
  assert.ok(matchesFilter(upi, "All"));
  assert.ok(FILTERS.includes("Science & Tech"));
});

test("search runs over story clusters, not articles", () => {
  const items = feedOf(F.upiArticles, F.sportsArticles, F.worldArticles);
  const hits = searchItems(items, "UPI");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].articleCount, 9);
  assert.equal(searchItems(items, "wickets").length, 1);
  assert.equal(searchItems(items, "nonexistent-term-zzz").length, 0);
  assert.equal(searchItems(items, "").length, items.length);
});

test("developing story keeps the SAME id while new coverage arrives", () => {
  const early = feedOf(F.upiArticles.filter((a) => (F.NOW - Date.parse(a.publishedAt)) / 60000 >= 90));
  const later = feedOf(F.upiArticles);
  const a = find(early, /UPI/), b = find(later, /UPI/);
  assert.equal(a.id, b.id);
  assert.ok(b.articleCount > a.articleCount);
});

test("politician entity matching: literal full name only, >=2 articles or in lead headline; no inference", () => {
  const named = [
    F.raw("Narendra Modi inaugurates metro extension, promises faster rail links", "https://www.thehindu.com/news/nm-metro/a1.ece", 40, "The Prime Minister said the line will cut commute times."),
    F.raw("Metro extension opened by Narendra Modi amid opposition criticism", "https://www.ndtv.com/india-news/nm-metro-2", 35),
    F.raw("Rahul Gandhi slams metro extension opening as election stunt", "https://www.hindustantimes.com/india-news/rg-metro-3.html", 30),
  ];
  const items = feedOf(named, F.upiArticles, F.distractors);
  const metro = find(items, /Narendra Modi/);
  assert.deepEqual(metro.politicians.map((p) => p.slug), ["narendra-modi"], "Modi named in 2 articles; Rahul Gandhi is not in this cluster so is not attached");
  const reaction = find(items, /Rahul Gandhi/);
  assert.deepEqual(reaction.politicians.map((p) => p.slug), ["rahul-gandhi"], "named in the lead headline");
  const upi = find(items, /UPI/);
  assert.deepEqual(upi.politicians, [], "no politician named in the UPI coverage => none attached (Finance Minister is NOT inferred)");
  // Surname-only headlines are deliberately NOT matched (too ambiguous to assert involvement).
  const exp = find(items, /expressway/i);
  assert.deepEqual(exp.politicians, []);
});

test("Issue Watch Context is structural only — no invented cause, motive, or political conclusion", () => {
  const items = feedOf(F.upiArticles, F.distractors, F.sportsArticles);
  const issues = issueWatch(items);
  const upi = issues.find((i) => /UPI/i.test(i.headline));
  assert.ok(upi.context, "context object exists");
  assert.ok(upi.context.established.length >= 1);
  assert.match(upi.context.established[0], /outlet/i);
  assert.ok(upi.context.established.some((l) => /hour/i.test(l)));
  // Never invents "why" or "who is responsible" language.
  const allText = [...upi.context.established, ...upi.context.unresolved].join(" ");
  assert.doesNotMatch(allText, /because|caused by|responsible|blame|likely due to/i);
});

test("Trending Now = rising topics (recent multi-outlet momentum), distinct from importance", () => {
  const items = feedOf(F.upiArticles, F.sportsArticles, F.continuing);
  const t = trendingNow(items);
  assert.ok(t.length >= 1);
  assert.ok(/UPI/i.test(t[0].label), `top trending label: ${t[0].label}`);
  assert.ok(!t.some((x) => /flood/i.test(x.headline)), "day-old continuing story is not 'rising now'");
});

test("Issue Watch is derived from a real cluster: timeline in time order, what-changed only after the first report", () => {
  const items = feedOf(F.upiArticles, F.distractors, F.sportsArticles);
  const issues = issueWatch(items);
  assert.ok(issues.length >= 1 && issues.length <= 2);
  const upi = issues.find((i) => /UPI/i.test(i.headline));
  assert.ok(upi, "the UPI story reaches Issue Watch without being named anywhere in code");
  const times = upi.timeline.map((t) => Date.parse(t.at));
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  const first = Date.parse(upi.whatHappened.firstReportedAt);
  for (const c of upi.whatChanged) assert.ok(Date.parse(c.at) - first >= 2 * 3600000);
  assert.ok(upi.whatHappened.text);
  assert.equal(upi.outletCount, 6);
});

test("end-to-end without hardcoding: the same story reaches Current Affairs -> Trending -> Brief -> Issue Watch; a different story does too on another day", () => {
  for (const [articles, re] of [[F.upiArticles, /UPI/], [F.courtArticles, /Supreme Court/i]]) {
    const items = feedOf(articles, F.worldArticles);
    const lead = items[0];
    assert.match(lead.headline + lead.articles.map((a) => a.title).join(" "), re);
    const brief = generateBrief(items, { now: F.NOW });
    assert.equal(brief.lead.id, lead.id);
    assert.ok(trendingNow(items).some((t) => t.id === lead.id));
    assert.ok(issueWatch(items).some((i) => i.id === lead.id));
  }
});

test("Daily Brief: lead + <=5 developments from the SAME feed; AI text only overrides matching ids; watch list is data-derived", () => {
  const items = feedOf(F.upiArticles, F.distractors, F.sportsArticles, F.worldArticles);
  const brief = generateBrief(items, { now: F.NOW, aiSummaries: { [items[0].id]: "Generated line.", "s-unknown": "ghost" } });
  assert.equal(brief.lead.id, items[0].id);
  assert.equal(brief.lead.summaryText, "Generated line.");
  assert.equal(brief.lead.summaryIsGenerated, true);
  assert.ok(brief.developments.length <= 5 && brief.developments.length >= 3);
  assert.ok(!brief.developments.some((d) => d.summaryIsGenerated), "unmatched ids never invent summaries");
  for (const w of brief.watch) assert.ok(items.find((i) => i.id === w.id).status);
  assert.equal(generateBrief([], { now: F.NOW }), null);
});

test("empty feed -> empty items (caller renders an honest empty state)", () => {
  assert.deepEqual(feedOf([]), []);
  assert.deepEqual(sortItems([], "latest"), []);
});

test("sorting modes: Latest = newest report first; Most important = score", () => {
  const items = feedOf(F.upiArticles, F.sportsArticles, F.worldArticles);
  const latest = sortItems(items, "latest");
  assert.equal(latest[0].newestAt >= latest[1].newestAt, true);
  const important = sortItems(items, "important");
  assert.equal(important[0].score >= important[1].score, true);
});

test("time helpers: relative labels and consistent IST formatting", () => {
  const at = (m) => new Date(F.NOW - m * 60000).toISOString();
  assert.equal(relativeLabel(at(0.2), F.NOW), "Just now");
  assert.equal(relativeLabel(at(8), F.NOW), "8 min ago");
  assert.equal(relativeLabel(at(42), F.NOW), "42 min ago");
  assert.equal(relativeLabel(at(120), F.NOW), "2 hours ago");
  assert.equal(relativeLabel(at(60 * 30), F.NOW), "Yesterday");
  assert.equal(formatISTDateTime("2026-09-24T10:00:00Z"), "24 Sept, 3:30 pm IST");
});

// ------------------------- relevance layer -------------------------------
test("relevance: a celebrity story with 8 outlets does NOT lead the Brief over a political story with 3", () => {
  const items = feedOf(F.celebrityArticles, F.courtArticles);
  const brief = generateBrief(items, { now: F.NOW });
  assert.match(brief.lead.headline, /Supreme Court|SC reserves/i);
  const ent = find(items, /Bollywood/);
  assert.equal(ent.topic, "Entertainment");
  assert.equal(ent.tier, 3);
  assert.ok(!brief.developments.some((d) => d.id === ent.id), "entertainment is not even a development");
});

test("relevance: big sports story is tier 3, excluded from Brief, Trending Now and Issue Watch", () => {
  const items = feedOf(F.bigSports, F.upiArticles);
  const sports = find(items, /cricket/i);
  assert.equal(sports.tier, 3);
  assert.equal(generateBrief(items, { now: F.NOW }).lead.id, find(items, /UPI/).id);
  assert.ok(!trendingNow(items).some((t) => t.id === sports.id));
  assert.ok(!issueWatch(items).some((i) => i.id === sports.id));
});

test("relevance: with ONLY sports/entertainment the Brief is honestly empty (null), not filled with them", () => {
  const items = feedOf(F.bigSports, F.celebrityArticles);
  assert.ok(items.length >= 2);
  assert.equal(generateBrief(items, { now: F.NOW }), null);
});

test("relevance: a sports story that is really a government/parliament matter is promoted (exceptional), not blacklisted", () => {
  const items = feedOf(F.sportsPolicy);
  const it = items[0];
  assert.equal(it.exceptional, true);
  assert.equal(it.tier, 2);
  assert.ok(generateBrief(items, { now: F.NOW }));
});

test("relevance: default feed view = important only; Sports/Entertainment filters and explicit search still reach tier 3", () => {
  const items = feedOf(F.bigSports, F.celebrityArticles, F.courtArticles, F.upiArticles);
  const all = applyView(items, { filter: "All" });
  assert.ok(all.length >= 2 && all.every((i) => i.tier <= 2));
  assert.ok(applyView(items, { filter: "Sports" }).every((i) => i.topic === "Sports") && applyView(items, { filter: "Sports" }).length === 1);
  assert.equal(applyView(items, { filter: "Entertainment" }).length, 1);
  assert.ok(applyView(items, { filter: "All", query: "cricket" }).length === 1, "typing a query searches every tier");
  assert.ok(!applyView(items, { filter: "Politics" }).some((i) => i.tier > 2));
});

test("relevance: important stories outrank low-value ones in 'Most important' ordering", () => {
  const items = sortItems(feedOf(F.bigSports, F.celebrityArticles, F.courtArticles), "important");
  assert.ok(items[0].tier === 1);
  assert.ok(items.findIndex((i) => i.tier === 1) < items.findIndex((i) => i.tier === 3));
});

test("issue watch exposes the latest development (newest headline) without interpretation", () => {
  const upi = issueWatch(feedOf(F.upiArticles, F.courtArticles)).find((i) => /UPI/i.test(i.headline));
  assert.ok(upi.latestDevelopment);
  assert.equal(upi.latestDevelopment.at, upi.timeline[upi.timeline.length - 1].at);
});
