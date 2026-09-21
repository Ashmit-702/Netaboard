function ageLabel(h) {
  if (h === null || h === undefined) return "";
  if (h < 1) return "Just now";
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// One or two major current issues, explored in more depth than a headline —
// real related articles, and real politician matches only (see
// lib/trending.js: a name must literally appear in the cluster's coverage).
export default function IssueWatch({ issues }) {
  if (!issues?.length) {
    return <div style={{ color: "var(--paper-faint)", fontSize: 13.5, padding: "16px 0" }}>No major issue stands out right now.</div>;
  }
  return (
    <div className={issues.length > 1 ? "grid-2" : undefined}>
      {issues.map((issue, i) => (
        <div key={i} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span className="tag" style={{ color: "var(--amber)", borderColor: "var(--amber)" }}>{issue.topic}</span>
            <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--paper-faint)" }}>
              {ageLabel(issue.hoursOld)}{issue.outletCount > 1 ? ` · ${issue.outletCount} outlets` : ""}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.35, marginBottom: 8 }}>{issue.headline}</div>
          {issue.summary && (
            <p style={{ fontSize: 13.5, color: "var(--paper-dim)", lineHeight: 1.55, marginBottom: 14 }}>{issue.summary}</p>
          )}

          {issue.politiciansInvolved?.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--paper-dim)", marginBottom: 12 }}>
              Named in coverage: <strong>{issue.politiciansInvolved.join(", ")}</strong>
            </div>
          )}

          {issue.relatedArticles?.length > 0 && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              {issue.relatedArticles.map((a, j) => (
                <a key={j} href={a.url} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 12.5, color: "var(--paper-dim)", padding: "5px 0", lineHeight: 1.4 }}>
                  {a.title}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
