// TODAY'S BRIEF — built from the Current Affairs feed, never from a separate
// news pipeline. Pure and deterministic: lead story, 3-5 further
// developments, and a "what to watch" list that is simply the stories that
// are demonstrably still developing (real coverage counts). Optional
// AI-written summaries (stored by the daily cron) may replace a story's
// summary text, but can never add, remove or reorder stories.

export function generateBrief(items, { now = Date.now(), aiSummaries = null, aiWatch = null } = {}) {
  // "What matters today": sports / entertainment (tier 3) never enter the
  // Brief unless the relevance layer promoted them for a genuine political /
  // public-interest reason. If nothing important exists the Brief is null —
  // the page then says so honestly rather than promoting a low-value story.
  const pool = (items || []).filter((it) => it.tier <= 2);
  if (!pool.length) return null;
  items = pool;
  const lead = items[0];
  const developments = items.slice(1, 6);

  const withText = (it) => {
    const ai = aiSummaries?.[it.id];
    return { ...it, summaryText: ai || it.summary || null, summaryIsGenerated: Boolean(ai) };
  };

  const used = new Set([lead.id, ...developments.map((d) => d.id)]);
  const watch = items
    .filter((it) => it.status && (it.recentOutlets6 >= 2))
    .slice(0, 3)
    .map((it) => ({
      id: it.id,
      headline: it.headline,
      status: it.status,
      note: `${it.recentOutlets6} outlets reporting in the last 6 hours; ${it.outletCount} in total.`,
    }));

  return {
    generatedAt: new Date(now).toISOString(),
    lead: withText(lead),
    developments: developments.map(withText),
    watch,
    aiWatch: aiWatch || null,
    coveredIds: [...used],
  };
}
