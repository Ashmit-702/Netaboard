"use client";
import RelTime from "./RelTime";
import { attentionHeadline, hasSufficientHistory } from "@/lib/attention";

// Every politician's latest reading, in plain language — distinct from
// TrendingNetas (which shows only the few clearing the trending threshold).
// This view exists so "no one is trending" never reads as "no data exists".
export default function AttentionList({ rows }) {
  if (!rows?.length) return <div className="empty">No attention readings recorded yet.</div>;
  return (
    <div className="rule-list">
      {rows.map((r) => {
        const headline = attentionHeadline(r);
        const sufficient = hasSufficientHistory(r);
        const up = /^\+/.test(headline);
        const down = /^-/.test(headline);
        return (
          <a key={r.slug} href={`/politicians/${r.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15.5 }}>{r.name}</div>
              <div className="meta" style={{ marginTop: 2 }}>{[r.role, r.party].filter(Boolean).join(" · ")}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700, color: !sufficient ? "var(--paper-faint)" : up ? "var(--mint)" : down ? "var(--red)" : "var(--paper-dim)" }}>
                {headline}
              </div>
              <div className="meta" style={{ justifyContent: "flex-end" }}>updated <RelTime iso={r.recorded_at} /></div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
