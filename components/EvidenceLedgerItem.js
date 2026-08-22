"use client";
import { useState } from "react";

const statusMeta = {
  fulfilled: { label: "Fulfilled", color: "var(--mint)", mark: "✔" },
  partially_fulfilled: { label: "Partially fulfilled", color: "var(--amber)", mark: "◐" },
  not_fulfilled: { label: "Not fulfilled", color: "var(--red)", mark: "✖" },
  disputed: { label: "Disputed", color: "var(--red)", mark: "?" },
  unverified: { label: "Unverified", color: "var(--slate)", mark: "○" },
  true: { label: "True", color: "var(--mint)", mark: "✔" },
  false: { label: "False", color: "var(--red)", mark: "✖" },
  misleading: { label: "Misleading", color: "var(--amber)", mark: "◐" },
  needs_context: { label: "Needs context", color: "var(--slate)", mark: "?" },
};

const stanceMeta = {
  supports: { label: "Supports", color: "var(--mint)" },
  contradicts: { label: "Contradicts", color: "var(--red)" },
  neutral: { label: "Neutral", color: "var(--slate)" },
};

// One claim's full evidence chain, collapsed by default: claim -> original
// statement -> evidence -> verdict -> confidence -> methodology -> timestamp.
// This is the Evidence Ledger rendered, not a hardcoded checkmark list.
export default function EvidenceLedgerItem({ claim }) {
  const [open, setOpen] = useState(false);
  const v = claim.latestVerdict;
  const meta = statusMeta[v?.status] || statusMeta.unverified;

  return (
    <div className="row-line" style={{ alignItems: "flex-start", flexDirection: "column", gap: 0, cursor: "pointer" }} onClick={() => setOpen(!open)}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%" }}>
        <span className="mark" style={{ color: meta.color }}>{meta.mark}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>{claim.text}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 5, flexWrap: "wrap" }}>
            <span className="tag" style={{ color: meta.color, borderColor: meta.color }}>{meta.label}</span>
            {v && <span style={{ fontSize: 11, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>{v.confidence}% confidence</span>}
            <span style={{ fontSize: 11, color: "var(--amber)" }}>{open ? "hide evidence ▲" : "show evidence ▼"}</span>
          </div>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 12, marginLeft: 28, paddingLeft: 14, borderLeft: "2px solid var(--line)", width: "calc(100% - 28px)" }} onClick={(e) => e.stopPropagation()}>
          {claim.source_url && (
            <div style={{ fontSize: 12, marginBottom: 10 }}>
              <span style={{ color: "var(--paper-faint)" }}>Original statement: </span>
              <a href={claim.source_url} target="_blank" rel="noreferrer" style={{ color: "var(--amber)", textDecoration: "underline" }}>source</a>
              {claim.claim_date && <span style={{ color: "var(--paper-faint)" }}> · {claim.claim_date}</span>}
            </div>
          )}

          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", marginBottom: 6, fontFamily: "var(--sans)" }}>
            Evidence ({claim.evidence?.length || 0})
          </div>
          {(claim.evidence || []).length === 0 && (
            <div style={{ fontSize: 12.5, color: "var(--paper-faint)", marginBottom: 12 }}>No evidence attached yet.</div>
          )}
          {(claim.evidence || []).map((e) => {
            const sm = stanceMeta[e.stance] || stanceMeta.neutral;
            return (
              <div key={e.id} style={{ fontSize: 12.5, marginBottom: 8, lineHeight: 1.45 }}>
                <span className="tag" style={{ color: sm.color, borderColor: sm.color, marginRight: 6, fontSize: 9.5 }}>{sm.label}</span>
                {e.description}
                {e.source_name && <span style={{ color: "var(--paper-faint)" }}> — {e.source_name}</span>}
                {e.source_url && <> · <a href={e.source_url} target="_blank" rel="noreferrer" style={{ color: "var(--amber)", textDecoration: "underline" }}>link</a></>}
              </div>
            );
          })}

          {v && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", marginBottom: 6, fontFamily: "var(--sans)" }}>Verdict</div>
              <p style={{ fontSize: 13, lineHeight: 1.55, margin: "0 0 8px" }}>{v.reasoning}</p>
              <div style={{ fontSize: 11, color: "var(--paper-faint)", fontFamily: "var(--mono)", lineHeight: 1.5 }}>{v.methodology}</div>
              <div style={{ fontSize: 10.5, color: "var(--paper-faint)", marginTop: 6 }}>
                {v.verdict_source === "ai" ? "AI-assisted reasoning" : v.verdict_source === "published_source" ? "From a published fact-check" : "Manually reviewed"} · {v.created_at?.slice?.(0, 10) || v.created_at}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
