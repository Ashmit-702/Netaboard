// TRENDING NETAS — politicians with UNUSUAL recent attention: a fresh reading
// (last 3 days) whose movement versus their previous reading is at least 1%.
// Trending is not popularity and not approval. Every row links to a
// politician who exists in the database (the rows are joined from it), so a
// card can never lead to a 404.
import RelTime from "./RelTime";
import { trendingNetas } from "@/lib/attention";

export default function TrendingNetas({ rows, max = 5, showNote = true }) {
  const trending = trendingNetas(rows || [], { max });
  if (!trending.length) {
    return <div className="empty">No significant trending movement.</div>;
  }
  return (
    <div>
      {showNote && (
        <p className="sec-sub" style={{ marginTop: 0 }}>
          Trending is not popularity and not approval. It marks unusual recent attention — a controversy moves it the same way a good speech does.
        </p>
      )}
      <div className="rule-list">
        {trending.map((r, i) => {
          const up = r.change_pct > 0;
          return (
            <a key={r.slug} href={`/politicians/${r.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--paper-faint)", width: 22, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{r.name}</div>
                <div className="meta" style={{ marginTop: 2 }}>{[r.role, r.party].filter(Boolean).join(" · ")}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: up ? "var(--mint)" : "var(--red)" }}>
                  {up ? "▲ attention rising" : "▼ attention falling"} {Math.abs(r.change_pct)}%
                </div>
                <div className="meta" style={{ justifyContent: "flex-end" }}>updated <RelTime iso={r.recorded_at} /></div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
