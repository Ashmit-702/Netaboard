import RelTime from "./RelTime";

const meta = {
  election_prediction: "Election movement", promise_status: "New verdict", new_evidence: "New evidence",
  fact_check: "New verdict", attention: "Attention movement",
};
const statusLabel = {
  fulfilled: "Fulfilled", partially_fulfilled: "Partially fulfilled", not_fulfilled: "Not fulfilled", disputed: "Disputed",
  unverified: "Unverified", true: "True", false: "False", misleading: "Misleading", needs_context: "Needs context",
};
const val = (t, v) => (v == null ? null : t === "election_prediction" ? `${v}%` : statusLabel[v] || v);

// One genuine recent change, as a compact editorial row.
export default function ChangeRow({ change }) {
  const prev = val(change.type, change.previousValue);
  const next = change.type === "attention" ? null : val(change.type, change.newValue);
  return (
    <a href={change.href} style={{ display: "block", padding: "15px 0" }}>
      <div className="kicker" style={{ marginBottom: 3 }}>{meta[change.type] || "Change"} · {change.entity}</div>
      <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>{change.title}</div>
      {(prev || next) && (
        <div style={{ fontFamily: "var(--mono)", fontSize: 13, marginTop: 4 }}>
          {prev && <span style={{ color: "var(--paper-faint)" }}>{prev}</span>}{prev && next && " → "}{next && <strong>{next}</strong>}
          {typeof change.delta === "number" && change.type === "election_prediction" && <span style={{ color: change.delta > 0 ? "var(--mint)" : "var(--red)" }}> {change.delta > 0 ? "▲" : "▼"} {Math.abs(change.delta)}pp</span>}
        </div>
      )}
      {typeof change.delta === "number" && change.type === "attention" && (
        <div style={{ fontFamily: "var(--mono)", fontSize: 13, marginTop: 4, color: change.delta > 0 ? "var(--mint)" : "var(--red)" }}>{change.delta > 0 ? "▲" : "▼"} {Math.abs(change.delta)}%</div>
      )}
      {change.reason && <p style={{ fontSize: 13.5, color: "var(--paper-dim)", margin: "5px 0 0", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{change.reason}</p>}
      <div className="meta" style={{ marginTop: 5 }}><RelTime iso={change.timestamp} />{change.confidence != null && <span>{change.confidence}% confidence</span>}</div>
    </a>
  );
}
