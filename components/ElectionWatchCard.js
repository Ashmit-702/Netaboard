import { STATE_LABEL } from "@/lib/elections/classify";
import { formatISTDate } from "@/lib/time";

export function StateBadge({ election }) {
  const cls = { LIVE: "live", UPCOMING: "upcoming", RESULTS: "results", ARCHIVE: "archive", NOT_ENOUGH_DATA: "nodata" }[election.state];
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <span className={`state ${cls}`}>{STATE_LABEL[election.state]}</span>
      {election.recent && <span className="state results" style={{ borderStyle: "dashed" }}>Recent</span>}
    </span>
  );
}

// Homepage Election Watch. Rendered only when a genuinely current election
// exists (see selectElectionWatch) — the page omits the section otherwise.
export default function ElectionWatchCard({ election }) {
  if (!election) return null;
  return (
    <a href={`/elections/${election.id}`} style={{ display: "block", padding: "6px 0" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <StateBadge election={election} />
        <span className="meta">{election.region} · {formatISTDate(election.election_date)}</span>
      </div>
      <h3 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 800 }}>{election.name}</h3>
      {election.summary ? (
        <p className="lead-p" style={{ marginTop: 10, marginBottom: 0 }}>
          Latest recorded estimate: <strong style={{ color: "var(--paper)" }}>{election.summary.label} {election.summary.value}%</strong>
          {typeof election.summary.delta === "number" && election.summary.delta !== 0 && <> ({election.summary.delta > 0 ? "▲" : "▼"} {Math.abs(election.summary.delta)}pp)</>}
          {" "}— {election.summary.modelName === "manual-estimate" ? "a manually maintained estimate, not an automated forecast." : `model: ${election.summary.modelName}.`}
        </p>
      ) : (
        <p className="lead-p" style={{ marginTop: 10, marginBottom: 0 }}>{election.hasResults ? "Structured results are available." : "No structured estimate or result has been recorded yet."}</p>
      )}
    </a>
  );
}
