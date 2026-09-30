// NetaBoard's one signature data-visual pattern: the real, countable
// signals behind a Political Attention reading, categorized (News / Social
// / Discovery / Breadth) — never fabricated, never blended into one opaque
// number. `headline` is the model's own plain-language verdict
// (lib/attention.js:attentionHeadline) — "Not enough attention history",
// "Attention steady", or a genuine windowed percentage — never a bare
// "+3" that implies more precision or meaning than the signal supports.
export default function StoryBehindNumber({ title, headline, insufficientHistory, factors, href }) {
  const max = Math.max(1, ...factors.map((f) => f.value));
  const up = /^\+/.test(headline || "");
  const down = /^-/.test(headline || "");

  return (
    <div className="card">
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", fontFamily: "var(--sans)", marginBottom: 6 }}>
        The story behind the number
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, marginBottom: 4, color: insufficientHistory ? "var(--paper-faint)" : up ? "var(--mint)" : down ? "var(--red)" : "var(--paper)" }}>
        {headline}
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
