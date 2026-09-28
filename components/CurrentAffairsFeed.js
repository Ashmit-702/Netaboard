"use client";
import { useMemo, useState } from "react";
import StoryRow, { kickerText } from "./StoryRow";
import RelTime from "./RelTime";
import { FILTERS, FILTER_LABEL, matchesFilter, applyView, sortItems } from "@/lib/current-affairs/search";

// Filter / search / sort over story CLUSTERS (never raw articles). Filter
// chips shown are only those with at least one story today — "data-driven".
export default function CurrentAffairsFeed({ items }) {
  const [filter, setFilter] = useState("All");
  const [mode, setMode] = useState("important");
  const [q, setQ] = useState("");

  const available = useMemo(() => FILTERS.filter((f) => f === "All" || items.some((it) => matchesFilter(it, f))), [items]);
  const visible = useMemo(() => sortItems(applyView(items, { filter, query: q }), mode), [items, filter, mode, q]);

  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search current stories…"
          aria-label="Search current stories" style={{ maxWidth: 340, flex: "1 1 220px" }}
        />
        <div className="seg" role="group" aria-label="Sort">
          <button aria-pressed={mode === "important"} onClick={() => setMode("important")}>Most important</button>
          <button aria-pressed={mode === "latest"} onClick={() => setMode("latest")}>Latest</button>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Category">
        {available.map((f) => (
          <button key={f} className="filter" aria-pressed={filter === f} onClick={() => setFilter(f)}>{FILTER_LABEL[f] || f}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          {q || filter !== "All" ? "No current stories match this filter." : "No major current-affairs updates right now."}
        </div>
      ) : (
        <div id="story-list">
          {visible.map((it, i) => (
            <div key={it.id} style={i === 0 && mode === "important" && filter === "All" && !q ? { paddingBottom: 12, marginBottom: 6, borderBottom: "2px solid var(--paper)" } : undefined}>
              {i === 0 && mode === "important" && filter === "All" && !q ? (
                <article className="story" style={{ borderTop: "none" }}>
                  <StoryLead item={it} />
                </article>
              ) : (
                <StoryRow item={it} issueHref={it.inIssueWatch ? `/issue-watch#${it.id}` : undefined} />
              )}
            </div>
          ))}
        </div>
      )}
      <div className="meta" style={{ marginTop: 18 }}>{visible.length} {visible.length === 1 ? "story" : "stories"} shown</div>
    </div>
  );
}

// Occasional large lead story (top item of the default view).
function StoryLead({ item }) {
  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span className="kicker">{kickerText(item)}</span>
        {item.status && <span className={`flag ${item.status === "DEVELOPING" ? "dev" : ""}`}>{item.status}</span>}
      </div>
      <a href={item.url} target="_blank" rel="noreferrer"><h2 className="lead-h" style={{ marginTop: 8 }}>{item.headline}</h2></a>
      {item.summary && <p className="lead-p" style={{ display: "block" }}>{item.summary}</p>}
      <div className="meta">
        <RelTime iso={item.newestAt} />
        {item.outletCount > 1 && <span>{item.outletCount} outlets</span>}
        {item.politicians?.length > 0 && <span>Named: {item.politicians.map((p, i) => <span key={p.slug}>{i > 0 && ", "}<a href={`/politicians/${p.slug}`}>{p.name}</a></span>)}</span>}
        {item.inIssueWatch && <a href={`/issue-watch#${item.id}`}>Issue Watch →</a>}
        <a href={item.url} target="_blank" rel="noreferrer">Read more →</a>
      </div>
    </>
  );
}
