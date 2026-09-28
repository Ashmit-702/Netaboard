import RelTime from "./RelTime";
import { kickerText } from "./StoryRow";
import { formatISTClock } from "@/lib/time";

// TODAY'S BRIEF — the homepage hero. Lead story, 3-5 further developments,
// what to watch, timestamp. Built from the Current Affairs engine
// (lib/brief). Asymmetric editorial layout: lead left, compact list right.
export default function TodaysBrief({ brief, status }) {
  if (!brief) {
    return (
      <div>
        <h1 className="lead-h" style={{ maxWidth: 760 }}>
          {status === "failed" ? "Current affairs couldn’t be refreshed right now." : "No major developments right now."}
        </h1>
        <p className="lead-p">
          {status === "failed"
            ? "The news feeds did not respond. Nothing older is shown in its place — this space stays honest until the feeds recover."
            : "Today’s brief is assembled from what is actually being reported. When something significant is, it will lead here."}
        </p>
      </div>
    );
  }
  const { lead, developments, watch, aiWatch } = brief;
  return (
    <div className="ed-grid">
      <div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <span className="kicker">Lead story · {kickerText(lead)}</span>
          {lead.status && <span className={`flag ${lead.status === "DEVELOPING" ? "dev" : ""}`}>{lead.status}</span>}
        </div>
        <a href={lead.url} target="_blank" rel="noreferrer"><h1 className="lead-h hero-h">{lead.headline}</h1></a>
        {lead.summaryText && <p className="lead-p">{lead.summaryText}{lead.summaryIsGenerated && <span className="meta" style={{ display: "inline", marginLeft: 8 }}>· AI-assisted summary of the reporting</span>}</p>}
        <div className="meta" style={{ marginBottom: 6 }}>
          <RelTime iso={lead.newestAt} />
          {lead.outletCount > 1 && <span>{lead.outletCount} outlets reporting</span>}
          {lead.politicians?.length > 0 && <span>Named: {lead.politicians.map((p, i) => <span key={p.slug}>{i > 0 && ", "}<a href={`/politicians/${p.slug}`}>{p.name}</a></span>)}</span>}
          <a href={lead.url} target="_blank" rel="noreferrer">Read more →</a>
        </div>
      </div>

      <aside className="ed-side" aria-label="Also in today's brief">
        <div className="kicker" style={{ marginBottom: 4 }}>Also today</div>
        <div className="rule-list">
          {developments.map((d, i) => (
            <a key={d.id} href={d.url} target="_blank" rel="noreferrer" style={{ display: "block", padding: "13px 0" }}>
              <div className="kicker" style={{ marginBottom: 3 }}>{String(i + 1).padStart(2, "0")} · {kickerText(d)}{d.status ? ` · ${d.status}` : ""}</div>
              <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.3 }}>{d.headline}</div>
              {d.summaryText && <div style={{ fontSize: 13, color: "var(--paper-dim)", marginTop: 4, lineHeight: 1.45 }}>{d.summaryText.length > 150 ? d.summaryText.slice(0, 150).replace(/\s+\S*$/, "") + "…" : d.summaryText}</div>}
            </a>
          ))}
        </div>
        {(watch.length > 0 || aiWatch) && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <div className="kicker" style={{ color: "var(--amber)", marginBottom: 6 }}>What to watch</div>
            {watch.map((w) => (
              <p key={w.id} style={{ fontSize: 13.5, lineHeight: 1.5, margin: "0 0 8px", color: "var(--paper-dim)" }}>
                <strong style={{ color: "var(--paper)" }}>Still {w.status === "BREAKING" ? "breaking" : "developing"}:</strong> {w.headline} <span style={{ color: "var(--paper-faint)" }}>— {w.note}</span>
              </p>
            ))}
            {aiWatch && <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0, color: "var(--paper-dim)" }}>{aiWatch}</p>}
          </div>
        )}
        <div className="meta" style={{ marginTop: 14 }}>Brief compiled {formatISTClock(brief.generatedAt)}</div>
      </aside>
    </div>
  );
}
