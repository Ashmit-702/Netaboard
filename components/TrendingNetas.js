// Shows 3-5 politicians with the strongest real attention movement — never
// more, and never fabricated. Sourced from lib/data.js's getStocks(), which
// itself is built from real signals (Wikipedia pageviews, GDELT, Hacker
// News, Mastodon — see lib/social.js). Explicitly NOT a popularity ranking.
export default function TrendingNetas({ stocks, compact = false }) {
  const trending = [...stocks]
    .filter((s) => typeof s.change_pct === "number" && s.change_pct !== 0)
    .sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
    .slice(0, compact ? 5 : 8);

  if (!trending.length) {
    return <div style={{ color: "var(--paper-faint)", fontSize: 13.5, padding: "16px 0" }}>No significant trending movement right now.</div>;
  }

  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--paper-faint)", marginBottom: 14, fontFamily: "var(--sans)" }}>
        TRENDING ≠ MOST POPULAR — this measures attention volume (mentions, pageviews), not approval.
        A controversy moves this the same direction as a good speech.
      </div>
      {trending.map((s, i) => {
        const up = s.change_pct > 0;
        const content = (
          <>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--paper-faint)", width: 22, flexShrink: 0 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{s.name}</div>
              {s.role && <div style={{ fontSize: 11.5, color: "var(--paper-faint)", marginTop: 1 }}>{s.role}</div>}
            </div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: up ? "var(--mint)" : "var(--red)", flexShrink: 0 }}>
              {up ? "▲" : "▼"} {Math.abs(s.change_pct)}%
            </span>
          </>
        );
        return s.slug ? (
          <a key={s.name} href={`/politicians/${s.slug}`} className="row-line" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
            {content}
          </a>
        ) : (
          <div key={s.name} className="row-line" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
