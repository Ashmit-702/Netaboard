// ISSUE WATCH — one or two major developing issues expanded with deeper
// context. Current Affairs detects the event; this expands it. Everything
// here is derived from the cluster's real, dated articles:
//
//   What happened   -> the reported description of the earliest coverage
//   Timeline        -> the cluster's articles in time order
//   What changed    -> coverage published AFTER the first report
//   Related         -> remaining articles
//   In the story    -> politicians literally named in the coverage
//
// "Why it matters", "who is affected" and "what to watch" would require
// interpretation; they are deliberately NOT generated here, because this
// layer must not invent. (See README: Known gaps.)
//
// "Context" is narrower than that: a templated synthesis of what the
// reporting structurally establishes (how many independent outlets, how
// long it has been covered, how many distinct developments) and what
// remains genuinely open GIVEN ONLY THAT (whether coverage is still active,
// whether any outlet has published a fuller account than the headline).
// It never asserts a cause, a motive, an effect, or a political conclusion
// that isn't itself a count of the coverage.

const MIN_OUTLETS = 3;

export function issueWatch(items, { max = 2 } = {}) {
  const candidates = items
    .filter((it) => it.outletCount >= MIN_OUTLETS && it.ageHours !== null && it.ageHours <= 48)
    .map((it) => ({ it, weight: it.score + Math.min(12, it.metrics.spanHours) + (it.status ? 8 : 0) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, max);

  return candidates.map(({ it }) => {
    const dated = it.articles.filter((a) => a.publishedAt);
    const first = dated[0] || it.articles[0];
    const withDesc = it.articles.find((a) => a.description);

    // Distinct headlines only, in time order.
    const seen = new Set();
    const timeline = [];
    for (const a of dated) {
      const key = a.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      timeline.push({ at: a.publishedAt, headline: a.title, outletName: a.outletName, url: a.url });
    }

    const firstTime = first?.publishedAt ? new Date(first.publishedAt).getTime() : null;
    const whatChanged = firstTime === null ? [] : timeline
      .filter((t) => new Date(t.at).getTime() - firstTime >= 2 * 3600000)   // genuinely later coverage, not the same hour
      .slice(-3).reverse();

    const hasSummary = Boolean(it.summary || withDesc);
    const spanH = Math.round(it.metrics.spanHours);
    const established = [
      `${it.outletCount} independent outlet${it.outletCount === 1 ? "" : "s"} ${it.outletCount === 1 ? "has" : "have"} reported on this story.`,
      spanH >= 1
        ? `Coverage spans ${spanH} hour${spanH === 1 ? "" : "s"}, from the first report to the most recent.`
        : "All reporting so far arrived within the same hour.",
      timeline.length > 1 ? `${timeline.length} distinct headlines have been recorded as the story developed.` : null,
    ].filter(Boolean);
    const unresolved = [
      (it.status === "BREAKING" || it.status === "DEVELOPING")
        ? "Coverage is still active — this account may change as more is reported."
        : "No outlet has reported further on this in the last several hours.",
      !hasSummary ? "No outlet has yet published a fuller account beyond the headline." : null,
      whatChanged.length === 0 ? "No development beyond the first report has been recorded yet." : null,
    ].filter(Boolean);

    return {
      id: it.id,
      topic: it.topicLabel,
      headline: it.headline,
      status: it.status,
      region: it.region,
      whatHappened: {
        text: it.summary || (withDesc ? withDesc.description : null),
        firstReportedAt: first?.publishedAt || null,
        firstHeadline: first?.title || null,
      },
      whatChanged,
      context: { established, unresolved },
      timeline: timeline.slice(-8),
      related: it.articles.filter((a) => a.title !== it.headline).slice(0, 5).map((a) => ({ title: a.title, url: a.url, outletName: a.outletName })),
      politicians: it.politicians,
      outletCount: it.outletCount,
      articleCount: it.articleCount,
      lastUpdatedAt: it.newestAt,
      url: it.url,
    };
  });
}
