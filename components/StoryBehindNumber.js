// NetaBoard's one signature data-visual pattern: a number, and the real,
// countable inputs behind it — never fabricated categories. Currently wired
// to Political Attention, the one place a genuine per-source breakdown
// exists (see lib/changes.js's parseAttentionFactors, which reads the exact
// counts app/api/stock-refresh/route.js already computed).
export default function StoryBehindNumber({ title, value, delta, factors, href }) {
  const max = Math.max(1, ...factors.map((f) => f.value));
  const up = delta > 0;

  return (
    <div className="card">
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", fontFamily: "var(--sans)", marginBottom: 6 }}>
        The story behind the number
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700 }}>{value}</span>
        {typeof delta === "number" && (
          <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: up ? "var(--mint)" : "var(--red)" }}>
            {up ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--paper-dim)", marginBottom: 18 }}>{title}</div>

      {factors.length > 0 ? (
        <div>
          {factors.map((f) => (
            <div key={f.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, fontFamily: "var(--mono)" }}>
                <span style={{ color: "var(--paper-dim)" }}>{f.label.replace(/_/g, " ")}</span>
                <span>{f.value}</span>
              </div>
              <div className="bar-track"><div className="bar-fill" style={{ width: (f.value / max) * 100 + "%", background: "var(--amber)" }} /></div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--paper-faint)" }}>No source breakdown recorded for this update yet.</div>
      )}

      {href && <a href={href} style={{ fontSize: 12, color: "var(--amber)", textDecoration: "underline", display: "inline-block", marginTop: 14 }}>See methodology →</a>}
    </div>
  );
}
