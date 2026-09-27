// Strips an engine item down to what the UI needs (and what is safe to send
// to the browser): no raw article list, no provider provenance, no metrics.
export function toClientItem(it, issueIds = new Set()) {
  return {
    id: it.id, headline: it.headline, summary: it.summary, url: it.url,
    region: it.region, topic: it.topic, secondaryTopic: it.secondaryTopic || null,
    status: it.status, newestAt: it.newestAt, outletCount: it.outletCount,
    score: it.score, searchText: it.searchText,
    politicians: (it.politicians || []).map((p) => ({ name: p.name, slug: p.slug })),
    inIssueWatch: issueIds.has(it.id),
  };
}
