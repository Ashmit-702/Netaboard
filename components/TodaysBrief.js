function ageLabel(h) {
  if (h === null || h === undefined) return null;
  if (h < 1) return "Just now";
  if (h < 2) return "1 hour ago";
  if (h < 24) return `${Math.round(h)} hours ago`;
  if (h < 48) return "Yesterday";
  return `${Math.round(h / 24)} days ago`;
}

/**
 * TODAY'S BRIEF — the homepage's lead editorial element.
 *
 * Built from the live clustering pipeline (lib/trending.js), with the
 * stored AI brief (daily_briefs) used only as supporting "what to watch"
 * context. Live stories always lead: a real development must outrank a
 * cached summary. Nothing is fabricated — if the feeds return nothing,
 * this renders an honest empty state.
 */
export default function TodaysBrief({ stories, storedBrief }) {
  const lead = stories?.[0] || null;
  const supporting = (stories || []).slice(1, 5);
  const watch = storedBrief?.watch_today || null;

  if (!lead) {
    return (
      <div>
        <h1 style={{ fontSize: "clamp(28px,4vw,42px)", lineHeight: 1.1, marginBottom: 14, maxWidth: 760 }}>
          No current stories available.
        </h1>
        <p style={{ fontSize: 16, color: "var(--paper-dim)", lineHeight: 1.6, maxWidth: 620 }}>
          Today&apos;s brief builds from live news coverage. Nothing is being surfaced right now —
          rather than showing older material, this space stays empty until there is something real to
          report.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "clamp(30px,4.6vw,50px)", lineHeight: 1.07, marginBottom: 16, maxWidth: 880 }}>
        {lead.headline}
      </h1>

      {lead.summary && (
        <p style={{ fontSize: 17.5, color: "var(--paper-dim)", lineHeight: 1.6, maxWidth: 720, marginBottom: 18 }}>
          {lead.summary}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 34 }}>
        {lead.url && <a href={lead.url} target="_blank" rel="noreferrer" className="btn btn-primary">Read more</a>}
        <span style={{ fontSize: 12, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>
          {ageLabel(lead.hoursOld)}
          {lead.outletCount > 1 && ` · ${lead.outletCount} outlets covering`}
        </span>
      </div>

      {supporting.length > 0 && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--paper-faint)", marginBottom: 6 }}>
            Also today
          </div>
          {supporting.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" className="row-line" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "13px 0" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--paper-faint)", width: 20, flexShrink: 0, paddingTop: 3 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>{s.headline}</div>
                {s.summary && (
                  <div style={{ fontSize: 12.5, color: "var(--paper-dim)", marginTop: 3, lineHeight: 1.45 }}>
                    {s.summary.length > 160 ? s.summary.slice(0, 160).trim() + "…" : s.summary}
                  </div>
                )}
              </div>
              {s.outletCount > 1 && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--paper-faint)", flexShrink: 0, paddingTop: 3 }}>
                  {s.outletCount}
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      {watch && (
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--amber)", marginBottom: 6 }}>
            What to watch
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: 0, color: "var(--paper-dim)" }}>{watch}</p>
        </div>
      )}
    </div>
  );
}
