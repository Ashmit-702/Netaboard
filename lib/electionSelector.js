// The pure Election Watch priority algorithm, isolated in its own module
// with no dependency on Supabase or fallback data — both lib/electionWatch.js
// (real path) and lib/fallback.js (demo path) import from here, so the two
// can never silently diverge, and neither creates a circular import with
// the other. This is also now the ONLY place "which election is current"
// gets decided — /predictions and /market read through this too, not a
// separate unfiltered query, so a fabricated demo election can't leak in
// through a second code path.
export function buildSummary(preds) {
  if (!preds?.length) return null;
  const labels = [...new Set(preds.map((p) => p.option_label))];
  const seriesA = preds.filter((p) => p.option_label === labels[0]);
  const seriesB = labels[1] ? preds.filter((p) => p.option_label === labels[1]) : [];
  if (!seriesA.length) return null;

  const latestA = seriesA[seriesA.length - 1];
  const prevA = seriesA.length > 1 ? seriesA[seriesA.length - 2] : null;
  const latestB = seriesB[seriesB.length - 1];

  return {
    label: labels[0],
    value: Math.round(latestA.probability),
    delta: prevA ? Math.round((latestA.probability - prevA.probability) * 10) / 10 : null,
    timestamp: latestA.recorded_at,
    optionB: latestB ? { label: labels[1], value: Math.round(latestB.probability) } : null,
    history: seriesA.slice(-3).map((p) => ({
      d: new Date(p.recorded_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      v: Math.round(p.probability),
    })),
  };
}

/**
 * Priority: 1) live, 2) recently concluded with a real post-result data
 * point, 3) upcoming with real prediction history, 4) most recent election
 * with any data, labeled "archive". Demo elections (is_demo — fabricated
 * example data, regardless of date) are excluded from EVERY tier, including
 * the archive fallback: if nothing real qualifies, this returns null, and
 * the UI must show an honest empty state, never invent a replacement.
 */
export function selectElection(elections, predsByElection) {
  if (!elections?.length) return null;
  const real = elections.filter((e) => !e.is_demo);
  const active = real.filter((e) => !e.is_archived);

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
    const anyWithData = real // still excludes is_demo, but archived is fine here
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
