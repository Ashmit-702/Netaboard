// Election state classification. Pure. Every election is labelled from its
// real status/date/flags — never from its name — and demo rows are excluded
// outright. States: LIVE | UPCOMING | RESULTS | ARCHIVE | NOT_ENOUGH_DATA,
// plus `recent` (results declared in the last 30 days).

const DAY = 86400000;

export function classifyElection(e, { now = Date.now(), hasResults = false, hasPredictions = false } = {}) {
  if (!e || e.is_demo) return null;
  const date = e.election_date ? new Date(e.election_date).getTime() : null;
  const daysSince = date === null ? null : Math.floor((now - date) / DAY);
  const updatedAt = e.last_updated_at ? new Date(e.last_updated_at).getTime() : null;
  const updatedDaysAgo = updatedAt === null ? null : Math.floor((now - updatedAt) / DAY);

  let state;
  let note = null;
  if (e.is_archived || e.data_status === "archive") state = "ARCHIVE";
  else if (e.status === "live" || e.data_status === "live") state = "LIVE";
  else if (e.status === "concluded" || e.data_status === "results") state = daysSince !== null && daysSince > 365 ? "ARCHIVE" : "RESULTS";
  else if (e.status === "upcoming" || e.data_status === "upcoming") {
    if (daysSince !== null && daysSince > 1) { state = "NOT_ENOUGH_DATA"; note = "The scheduled date has passed and no result has been recorded."; }
    else state = "UPCOMING";
  } else state = "NOT_ENOUGH_DATA";

  return {
    ...e,
    state,
    note,
    recent: state === "RESULTS" && daysSince !== null && daysSince >= 0 && daysSince <= 30,
    daysUntil: daysSince !== null && daysSince < 0 ? -daysSince : null,
    daysSince,
    staleLive: state === "LIVE" && updatedDaysAgo !== null && updatedDaysAgo > 3,
    updatedDaysAgo,
    hasResults, hasPredictions,
    hasData: hasResults || hasPredictions,
  };
}

export const STATE_ORDER = ["LIVE", "UPCOMING", "RESULTS", "ARCHIVE", "NOT_ENOUGH_DATA"];
export const STATE_LABEL = { LIVE: "Live", UPCOMING: "Upcoming", RESULTS: "Results", ARCHIVE: "Archive", NOT_ENOUGH_DATA: "Not enough data" };

/** Groups classified elections by state, sorted within each group by date. Years are never mixed into one row. */
export function groupElections(list) {
  const groups = Object.fromEntries(STATE_ORDER.map((s) => [s, []]));
  for (const e of list) if (e) groups[e.state].push(e);
  groups.LIVE.sort((a, b) => new Date(b.election_date) - new Date(a.election_date));
  groups.UPCOMING.sort((a, b) => a.daysUntil - b.daysUntil);
  groups.RESULTS.sort((a, b) => new Date(b.election_date) - new Date(a.election_date));
  groups.ARCHIVE.sort((a, b) => new Date(b.election_date) - new Date(a.election_date));
  return groups;
}

/**
 * Election Watch for the homepage. Only genuinely current material:
 * LIVE, or RECENT results that have data, or an UPCOMING election within
 * 120 days. Archive is never surfaced. Returns null when nothing qualifies —
 * the homepage then omits the section rather than forcing an election in.
 */
export function selectElectionWatch(classified) {
  const list = (classified || []).filter(Boolean);
  const live = list.filter((e) => e.state === "LIVE").sort((a, b) => new Date(b.election_date) - new Date(a.election_date));
  if (live.length) return live[0];
  const recent = list.filter((e) => e.recent && e.hasData).sort((a, b) => a.daysSince - b.daysSince);
  if (recent.length) return recent[0];
  const upcoming = list.filter((e) => e.state === "UPCOMING" && e.daysUntil !== null && e.daysUntil <= 120).sort((a, b) => a.daysUntil - b.daysUntil);
  return upcoming[0] || null;
}

/** Summary of an election's prediction series (real rows only). */
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
    history: seriesA.slice(-3).map((p) => ({ d: new Date(p.recorded_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" }), v: Math.round(p.probability) })),
    modelName: latestA.model_name || "manual-estimate",
    confidence: latestA.confidence ?? null,
    methodology: latestA.methodology || null,
    sourceSnapshotAt: latestA.source_snapshot_at || null,
  };
}
