function ageShort(h) {
  if (h === null || h === undefined) return "";
  if (h < 1) return "now";
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

// Current trending topics, extracted by lib/trending.js from live feeds.
// Nothing here is a fixed category list — labels come from the actual
// entities and terms dominating today's coverage.
export default function TrendingNow({ topics }) {
  if (!topics?.length) {
    return (
      <div style={{ color: "var(--paper-faint)", fontSize: 13.5, padding: "16px 0" }}>
        No major national trend detected right now.
      </div>
    );
  }
  return (
    <div>
      {topics.map((t, i) => (
        <a
          key={i}
          href={t.url || "#"}
          target={t.url ? "_blank" : undefined}
          rel={t.url ? "noreferrer" : undefined}
          className="row-line"
          style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 0" }}
        >
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--paper-faint)", width: 22, flexShrink: 0, paddingTop: 2 }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t.label}</div>
            {t.context && (
              <div style={{ fontSize: 12.5, color: "var(--paper-dim)", marginTop: 3, lineHeight: 1.45 }}>{t.context}</div>
            )}
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--paper-faint)", flexShrink: 0, paddingTop: 2 }}>
            {t.outletCount > 1 ? `${t.outletCount} outlets` : ageShort(t.hoursOld)}
          </span>
        </a>
      ))}
    </div>
  );
}
