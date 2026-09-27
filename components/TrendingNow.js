import RelTime from "./RelTime";

// TRENDING NOW — topics whose coverage is accelerating (lib/issues/trending).
// Different from Current Affairs, which ranks by importance. Labels are the
// real entities/terms of each story cluster; nothing is a fixed category.
export default function TrendingNow({ topics, status }) {
  if (!topics?.length) {
    return <div className="empty">{status === "failed" ? "Trending topics couldn’t be refreshed right now." : "No topic is rising sharply right now."}</div>;
  }
  return (
    <div className="cols-2">
      {[topics.filter((_, i) => i % 2 === 0), topics.filter((_, i) => i % 2 === 1)].map((col, c) => (
        <div key={c} className="rule-list">
          {col.map((t) => (
            <a key={t.id} href={t.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: 14, padding: "13px 0", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--paper-faint)", width: 22, flexShrink: 0 }}>
                {String(topics.indexOf(t) + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.005em" }}>{t.label}</div>
                <div style={{ fontSize: 13, color: "var(--paper-dim)", marginTop: 2, lineHeight: 1.4 }}>{t.headline}</div>
                <div className="meta" style={{ marginTop: 4 }}>
                  <span>{t.accelerating ? "▲ Rising" : "Active"} · {t.recentOutlets} outlets in the last 6 hours</span>
                  <RelTime iso={t.newestAt} />
                </div>
              </div>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}
