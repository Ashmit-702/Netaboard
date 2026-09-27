import RelTime from "./RelTime";
import { formatISTDateTime } from "@/lib/time";

// ISSUE WATCH — a major developing issue explored: what happened, what
// changed since the first report, the timeline, related developments, and
// any politicians literally named in the coverage. All of it is the
// cluster's real reporting (lib/issues/issue-watch). Interpretive sections
// (why it matters / who is affected) are intentionally absent.
export default function IssueWatch({ issues, status, full = false }) {
  if (!issues?.length) {
    return <div className="empty">{status === "failed" ? "Issue Watch couldn’t be refreshed right now." : "No major issue stands out right now."}</div>;
  }
  return (
    <div>
      {issues.map((issue, idx) => (
        <article key={issue.id} id={issue.id} style={{ padding: idx === 0 ? "4px 0 26px" : "26px 0", borderTop: idx === 0 ? "none" : "1px solid var(--line)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <span className="kicker" style={{ color: "var(--amber)" }}>{issue.topic}</span>
            {issue.status && <span className={`flag ${issue.status === "DEVELOPING" ? "dev" : ""}`}>{issue.status}</span>}
            <span className="meta"><RelTime iso={issue.lastUpdatedAt} /> · {issue.outletCount} outlets · {issue.articleCount} reports</span>
          </div>
          <h3 className="lead-h" style={{ fontSize: "clamp(24px,3.4vw,36px)" }}>{issue.headline}</h3>

          <dl className="dl" style={{ marginTop: 14 }}>
            <dt>What happened</dt>
            <dd>
              {issue.whatHappened.text || <span style={{ color: "var(--paper-faint)" }}>Reporting so far carries no summary text.</span>}
              {issue.whatHappened.firstReportedAt && <div className="meta" style={{ marginTop: 4 }}>First reported {formatISTDateTime(issue.whatHappened.firstReportedAt)}</div>}
            </dd>

            <dt>What changed</dt>
            <dd>
              {issue.whatChanged.length ? issue.whatChanged.map((c) => (
                <div key={c.url} style={{ marginBottom: 8 }}>
                  <a href={c.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>{c.headline}</a>
                  <div className="meta">{formatISTDateTime(c.at)} · {c.outletName}</div>
                </div>
              )) : <span style={{ color: "var(--paper-faint)" }}>No further updates since the first reports.</span>}
            </dd>

            {issue.politicians.length > 0 && (<>
              <dt>Named in coverage</dt>
              <dd>{issue.politicians.map((p, i) => <span key={p.slug}>{i > 0 && ", "}<a href={`/politicians/${p.slug}`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{p.name}</a></span>)}</dd>
            </>)}

            {full && issue.timeline.length > 0 && (<>
              <dt>Timeline</dt>
              <dd>
                {issue.timeline.map((t) => (
                  <div key={t.url} style={{ display: "flex", gap: 14, marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--paper-faint)", width: 118, flexShrink: 0, paddingTop: 2 }}>{formatISTDateTime(t.at)}</span>
                    <span><a href={t.url} target="_blank" rel="noreferrer">{t.headline}</a> <span className="meta" style={{ display: "inline" }}>· {t.outletName}</span></span>
                  </div>
                ))}
              </dd>
            </>)}

            {issue.related.length > 0 && (<>
              <dt>Related developments</dt>
              <dd>
                {(full ? issue.related : issue.related.slice(0, 3)).map((a) => (
                  <div key={a.url} style={{ marginBottom: 6 }}>
                    <a href={a.url} target="_blank" rel="noreferrer">{a.title}</a> <span className="meta" style={{ display: "inline" }}>· {a.outletName}</span>
                  </div>
                ))}
              </dd>
            </>)}
          </dl>
          {!full && <a href={`/issue-watch#${issue.id}`} className="sec-link" style={{ display: "inline-block", marginTop: 12 }}>Full timeline →</a>}
        </article>
      ))}
    </div>
  );
}
