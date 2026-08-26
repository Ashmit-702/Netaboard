import { freshnessLabel } from "@/lib/freshness";

const tierLabel = {
  active: "Active now",
  concluded: "Recently concluded",
  upcoming: "Upcoming",
  archive: "Archive",
};

export default function ElectionWatchCard({ election }) {
  if (!election) {
    return (
      <div className="card" style={{ color: "var(--paper-dim)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No major election movement today.</div>
        <a href="/calendar" style={{ fontSize: 13, color: "var(--amber)", textDecoration: "underline" }}>Explore the election archive →</a>
      </div>
    );
  }

  const fresh = election.summary ? freshnessLabel(election.summary.timestamp) : { label: "No probability estimate recorded", stale: true };

  return (
    <a href={election.href} className="card" style={{ display: "block" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="tag" style={{ color: "var(--amber)", borderColor: "var(--amber)" }}>{tierLabel[election.tier] || election.status}</span>
        <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: fresh.stale ? "var(--red)" : "var(--paper-faint)" }}>{fresh.label}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{election.name}</div>
      {election.summary ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 15, color: "var(--paper-dim)" }}>{election.summary.label}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700 }}>{election.summary.value}%</span>
          {typeof election.summary.delta === "number" && (
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: election.summary.delta > 0 ? "var(--mint)" : "var(--red)" }}>
              {election.summary.delta > 0 ? "▲" : "▼"} {Math.abs(election.summary.delta)}pp
            </span>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--paper-faint)", marginTop: 8 }}>{election.description}</div>
      )}
    </a>
  );
}
