// The pure Election Watch priority algorithm, isolated in its own module
// with no dependency on Supabase or fallback data — both lib/electionWatch.js
// (real path) and lib/fallback.js (demo path) import from here, so the two
// can never silently diverge, and neither creates a circular import with
// the other.
export function buildSummary(preds) {
  if (!preds?.length) return null;
  const labels = [...new Set(preds.map((p) => p.option_label))];
  const series = preds.filter((p) => p.option_label === labels[0]);
  if (!series.length) return null;
  const latest = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : null;
  return {
    label: labels[0],
    value: Math.round(latest.probability),
    delta: prev ? Math.round((latest.probability - prev.probability) * 10) / 10 : null,
    timestamp: latest.recorded_at,
  };
}

/**
 * Priority: 1) an active/live election, 2) a recently concluded one that
 * actually has a post-result data point, 3) an upcoming one with real
 * prediction history, 4) the most recent election with any data at all,
 * labeled "archive". Never hardcodes which election wins — purely a
 * function of the status/data passed in.
 */
export function selectElection(elections, predsByElection) {
  if (!elections?.length) return null;
  // Archived elections are structurally excluded from every normal tier —
  // they exist for /history and constituency detail pages, never as
  // "current" homepage content, regardless of what data happens to be
  // attached to them.
  const active = elections.filter((e) => !e.is_archived);

  let chosen = active.find((e) => e.status === "live");
  let tier = "active";

  if (!chosen) {
    const concludedWithData = active
      .filter((e) => e.status === "concluded")
      .filter((e) => (predsByElection[e.id] || []).some((p) => new Date(p.recorded_at) >= new Date(e.election_date)))
      .sort((a, b) => new Date(b.election_date) - new Date(a.election_date));
    if (concludedWithData.length) { chosen = concludedWithData[0]; tier = "concluded"; }
  }

  if (!chosen) {
    const upcomingWithData = active
      .filter((e) => e.status === "upcoming" && (predsByElection[e.id] || []).length > 0)
      .sort((a, b) => {
        const aLatest = predsByElection[a.id].slice(-1)[0].recorded_at;
        const bLatest = predsByElection[b.id].slice(-1)[0].recorded_at;
        return new Date(bLatest) - new Date(aLatest);
      });
    if (upcomingWithData.length) { chosen = upcomingWithData[0]; tier = "upcoming"; }
  }

  if (!chosen) {
    // Last resort only — now allowed to include archived elections, always
    // explicitly labeled "archive" so the UI never presents them as current.
    const anyWithData = elections
      .filter((e) => (predsByElection[e.id] || []).length > 0)
      .sort((a, b) => new Date(b.election_date) - new Date(a.election_date));
    if (anyWithData.length) { chosen = anyWithData[0]; tier = "archive"; }
  }

  if (!chosen) return null;

  return {
    id: chosen.id, name: chosen.name, region: chosen.region,
    status: chosen.status, tier, description: chosen.description,
    summary: buildSummary(predsByElection[chosen.id]),
    href: "/predictions",
  };
}
