// Renders a computed (never stored) accountability score, always alongside
// its own methodology — so the number is never shown without an explanation
// of exactly how it was derived, per the Evidence Ledger's core rule.
export default function AccountabilityScoreCard({ accountability }) {
  const { accountabilityScore: score, evidenceCoverage, scoredClaims, totalClaims: total, fulfilled, partial, notFulfilled, unverified: disputed, avgConfidence, methodology } = accountability;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", fontFamily: "var(--sans)" }}>
            Accountability Score
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 40, fontWeight: 700, marginTop: 4 }}>
            {score === null ? "—" : score}
            {score !== null && <span style={{ fontSize: 16, color: "var(--paper-faint)" }}> / 100</span>}
          </div>
        </div>
        {avgConfidence !== null && (
          <span className="tag" style={{ color: "var(--amber)", borderColor: "var(--amber)" }}>
            Avg. confidence {avgConfidence}%
          </span>
        )}
      </div>

      {/* Evidence coverage is shown unconditionally, right next to the score
          it qualifies — a high score built on low coverage should never be
          mistaken for a complete picture. */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
          <span style={{ color: "var(--paper-dim)" }}>Evidence coverage</span>
          <span style={{ fontFamily: "var(--mono)", color: "var(--amber)" }}>{evidenceCoverage}% ({scoredClaims} of {total} claims scored)</span>
        </div>
        <div className="bar-track"><div className="bar-fill" style={{ width: evidenceCoverage + "%", background: "var(--amber)" }} /></div>
      </div>

      <div className="grid-4" style={{ gap: 12, marginBottom: 16 }}>
        {[
          ["Tracked", total, "var(--paper)"],
          ["Fulfilled", fulfilled, "var(--mint)"],
          ["Partial", partial, "var(--amber)"],
          ["Not fulfilled", notFulfilled, "var(--red)"],
        ].map(([label, val, color]) => (
          <div key={label}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 11, color: "var(--paper-faint)", textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>

      {disputed > 0 && (
        <div style={{ fontSize: 12.5, color: "var(--paper-dim)", marginBottom: 12 }}>
          {disputed} claim{disputed !== 1 ? "s" : ""} disputed or awaiting evidence — tracked below, excluded from the score above.
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--paper-faint)", fontFamily: "var(--mono)", borderTop: "1px solid var(--line)", paddingTop: 12, lineHeight: 1.5 }}>
        {methodology}
      </div>
    </div>
  );
}
