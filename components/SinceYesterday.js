const typeCountLabel = {
  election_prediction: "election",
  promise_status: "politician",
  new_evidence: "new evidence",
  fact_check: "fact check",
  constituency: "constituency",
  attention: "attention signal",
};

// Every count here is derived live from the actual changes array — nothing
// is a hardcoded "7 meaningful changes" example.
export default function SinceYesterday({ changes, byType }) {
  const total = changes.length;
  const entries = Object.entries(byType).filter(([, list]) => list.length > 0);

  return (
    <div className="card">
      <div style={{ fontFamily: "var(--mono)", fontSize: 42, fontWeight: 700, marginBottom: 4 }}>{total}</div>
      <div style={{ fontSize: 14, color: "var(--paper-dim)", marginBottom: 16 }}>
        meaningful change{total !== 1 ? "s" : ""} recorded
      </div>
      {entries.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
          {entries.map(([type, list]) => (
            <span key={type} style={{ fontSize: 12.5, fontFamily: "var(--mono)", color: "var(--paper-dim)" }}>
              {list.length} {typeCountLabel[type] || type}{list.length !== 1 ? "s" : ""}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--paper-faint)" }}>Nothing recorded yet.</div>
      )}
    </div>
  );
}
