import { freshnessLabel } from "@/lib/freshness";
import StoryBehindNumber from "./StoryBehindNumber";
import { parseAttentionFactors } from "@/lib/changes";

const numericTypes = ["election_prediction", "constituency", "attention"];

// Selects one signature number by largest real magnitude of change among
// types that actually carry a numeric delta — never an invented ranking.
export function pickTheNumber(changes) {
  const candidates = changes.filter((c) => numericTypes.includes(c.type) && typeof c.delta === "number");
  if (!candidates.length) return null;
  return candidates.reduce((best, c) => (Math.abs(c.delta) > Math.abs(best.delta) ? c : best));
}

export default function TheNumber({ change }) {
  if (!change) {
    return <div className="card" style={{ color: "var(--paper-faint)", fontSize: 13.5 }}>No single number stands out yet — check back as more data comes in.</div>;
  }

  const fresh = freshnessLabel(change.timestamp);
  const up = change.delta > 0;

  if (change.type === "attention") {
    return (
      <StoryBehindNumber
        title={change.entity}
        value={change.newValue}
        delta={change.delta}
        factors={parseAttentionFactors(change.reason)}
        href={change.href}
      />
    );
  }

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 44, fontWeight: 700, color: up ? "var(--mint)" : "var(--red)" }}>
          {up ? "+" : ""}{change.delta}{change.type === "election_prediction" || change.type === "constituency" ? "pp" : ""}
        </span>
      </div>
      <div style={{ fontSize: 14, color: "var(--paper-dim)", marginBottom: 4 }}>{change.entity}</div>
      <div style={{ fontSize: 12.5, color: "var(--paper-faint)", marginBottom: 14 }}>{change.previousValue}% → {change.newValue}%</div>
      {change.reason && <p style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>{change.reason}</p>}
      <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: fresh.stale ? "var(--red)" : "var(--paper-faint)" }}>{fresh.label}</div>
      <a href={change.href} style={{ fontSize: 12, color: "var(--amber)", textDecoration: "underline", display: "inline-block", marginTop: 10 }}>See methodology →</a>
    </div>
  );
}
