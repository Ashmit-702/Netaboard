import RelTime from "./RelTime";

const verdictColor = { fulfilled: "var(--mint)", true: "var(--mint)", partially_fulfilled: "var(--amber)", misleading: "var(--amber)", not_fulfilled: "var(--red)", false: "var(--red)", disputed: "var(--red)", needs_context: "var(--slate)", unverified: "var(--slate)" };
const stance = { supports: "Supports", contradicts: "Contradicts", neutral: "Neutral" };

// THE EVIDENCE — one current claim, its verdict, why, and the evidence it
// rests on. Verdict text is what the ledger recorded; nothing is generated here.
export default function FeaturedClaim({ claim }) {
  const v = claim.latestVerdict;
  return (
    <div className="ed-grid">
      <div>
        <div className="kicker" style={{ marginBottom: 8 }}>The claim{claim.politician?.name ? ` · ${claim.politician.name}` : ""}</div>
        <blockquote style={{ margin: 0, fontFamily: "var(--display)", fontSize: "clamp(20px,2.6vw,28px)", lineHeight: 1.3, fontStyle: "italic" }}>“{claim.text}”</blockquote>
        <div style={{ marginTop: 18, display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--display)", fontWeight: 900, fontSize: "clamp(28px,4vw,42px)", textTransform: "uppercase", color: verdictColor[v.status] || "var(--slate)" }}>{v.status.replace(/_/g, " ")}</span>
          {v.confidence != null && <span className="meta">{v.confidence}% confidence</span>}
          <span className="meta"><RelTime iso={v.created_at} /></span>
        </div>
        {v.reasoning && <><div className="kicker" style={{ margin: "16px 0 4px" }}>Why</div><p style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>{v.reasoning}</p></>}
        <a href="/evidence" className="sec-link" style={{ display: "inline-block", marginTop: 14 }}>More verdicts →</a>
      </div>
      <aside className="ed-side">
        <div className="kicker" style={{ marginBottom: 4 }}>Evidence ({(claim.evidence || []).length})</div>
        <div className="rule-list">
          {(claim.evidence || []).slice(0, 4).map((e) => (
            <div key={e.id} style={{ padding: "12px 0" }}>
              <div className="kicker" style={{ color: e.stance === "supports" ? "var(--mint)" : e.stance === "contradicts" ? "var(--red)" : "var(--slate)" }}>{stance[e.stance]}{e.source_name ? ` · ${e.source_name}` : ""}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 2 }}>{e.description}{e.source_url && <> <a href={e.source_url} target="_blank" rel="noreferrer" style={{ color: "var(--amber)", textDecoration: "underline" }}>source</a></>}</div>
            </div>
          ))}
          {!(claim.evidence || []).length && <div className="empty">This verdict cites a published fact-check.</div>}
        </div>
      </aside>
    </div>
  );
}
