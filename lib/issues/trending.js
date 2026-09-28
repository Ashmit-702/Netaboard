// TRENDING NOW — topics whose coverage is RISING, not simply the most
// important stories (that is Current Affairs). Momentum is measured from
// real article timestamps: how many independent outlets reported in the last
// 6 hours versus the 6-24 hours before that.
//
// No hardcoded topics: labels come from the entities/terms of each cluster.

export function trendingNow(items, { max = 8 } = {}) {
  const rising = items
    .filter((it) => it.tier <= 2 && it.recentOutlets6 >= 2 && it.ageHours !== null && it.ageHours <= 12)
    .map((it) => {
      const ratio = (it.recentOutlets6 + 1) / (it.earlierOutlets + 1);   // >1 means accelerating
      return { it, trendScore: Math.round(it.recentOutlets6 * (1 + Math.log2(ratio)) * 10) / 10, ratio };
    })
    .sort((a, b) => b.trendScore - a.trendScore || b.it.score - a.it.score)
    .slice(0, max);

  return rising.map(({ it, ratio }) => ({
    id: it.id,
    label: it.topicLabel || it.headline,
    headline: it.headline,
    recentOutlets: it.recentOutlets6,
    outletCount: it.outletCount,
    accelerating: ratio > 1.5,
    newestAt: it.newestAt,
    url: it.url,
    region: it.region,
    topic: it.topic,
  })).filter((t) => t.label);
}
