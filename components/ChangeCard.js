const typeMeta = {
  election_prediction: { label: "Election Pulse", color: "var(--amber)" },
  promise_status: { label: "Accountability", color: "var(--mint)" },
  new_evidence: { label: "New Evidence", color: "var(--mint)" },
  fact_check: { label: "Fact Check", color: "var(--red)" },
  constituency: { label: "Constituency", color: "var(--amber)" },
  attention: { label: "Attention", color: "var(--slate)" },
};

const statusLabel = {
  fulfilled: "Fulfilled", partially_fulfilled: "Partially fulfilled", not_fulfilled: "Not fulfilled",
  disputed: "Disputed", unverified: "Unverified",
  true: "True", false: "False", misleading: "Misleading", needs_context: "Needs context",
};

function fmtVal(type, v) {
  if (v === null || v === undefined) return null;
  if (type === "election_prediction" || type === "constituency") return `${v}%`;
  if (type === "attention") return `${v} pts`;
  return statusLabel[v] || v;
}

// Renders one normalized Change object from lib/changes.js. Every field is
// read directly off the object — no calculation happens in this component.
export default function ChangeCard({ change }) {
  const meta = typeMeta[change.type] || { label: change.type, color: "var(--slate)" };
  const prev = fmtVal(change.type, change.previousValue);
  const next = fmtVal(change.type, change.newValue);
  const up = typeof change.delta === "number" && change.delta > 0;
  const down = typeof change.delta === "number" && change.delta < 0;

  return (
    <a href={change.href} className="card" style={{ display: "block" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="tag" style={{ color: meta.color, borderColor: meta.color }}>{meta.label}</span>
        {change.confidence != null && (
          <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--paper-faint)" }}>{change.confidence}% confidence</span>
        )}
      </div>

      <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4, lineHeight: 1.35 }}>{change.entity}</div>
      <div style={{ fontSize: 13, color: "var(--paper-dim)", marginBottom: 12, lineHeight: 1.4 }}>{change.title}</div>

      {(prev !== null || next !== null) && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10, fontFamily: "var(--mono)" }}>
          {prev !== null && <span style={{ fontSize: 15, color: "var(--paper-faint)" }}>{prev}</span>}
          {prev !== null && next !== null && <span style={{ color: "var(--paper-faint)" }}>→</span>}
          {next !== null && <span style={{ fontSize: 18, fontWeight: 700 }}>{next}</span>}
          {typeof change.delta === "number" && (
            <span style={{ fontSize: 13, fontWeight: 700, color: up ? "var(--mint)" : down ? "var(--red)" : "var(--paper-faint)" }}>
              {up ? "▲" : down ? "▼" : "—"} {Math.abs(change.delta)}{["election_prediction", "constituency"].includes(change.type) ? "pp" : change.type === "attention" ? "%" : ""}
            </span>
          )}
        </div>
      )}

      {change.reason && <p style={{ fontSize: 12.5, color: "var(--paper-dim)", lineHeight: 1.5, margin: 0 }}>{change.reason}</p>}

      <div style={{ fontSize: 10.5, color: "var(--paper-faint)", marginTop: 12, fontFamily: "var(--mono)" }}>
        {new Date(change.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        {change.sourceCount != null && ` · ${change.sourceCount} source(s)`}
      </div>
    </a>
  );
}
