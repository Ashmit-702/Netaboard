import RelTime from "./RelTime";

// One Current Affairs story: category kicker, headline, 2-4 line summary,
// time, developing/breaking flag, breadth. No API or source-system names.
// `issueHref` is set when this story is also expanded in Issue Watch.
export function kickerText(item) {
  return [item.region, item.topic].filter(Boolean).join(" · ").toUpperCase();
}

export default function StoryRow({ item, issueHref, showSummary = true }) {
  return (
    <article className="story">
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span className="kicker">{kickerText(item)}</span>
        {item.status && <span className={`flag ${item.status === "DEVELOPING" ? "dev" : ""}`}>{item.status}</span>}
      </div>
      <a href={item.url} target="_blank" rel="noreferrer"><h3>{item.headline}</h3></a>
      {showSummary && item.summary && <p>{item.summary}</p>}
      <div className="meta">
        <RelTime iso={item.newestAt} />
        {item.outletCount > 1 && <span>{item.outletCount} outlets</span>}
        {item.politicians?.length > 0 && (
          <span>
            Named: {item.politicians.map((p, i) => (
              <span key={p.slug}>{i > 0 && ", "}<a href={`/politicians/${p.slug}`}>{p.name}</a></span>
            ))}
          </span>
        )}
        {issueHref && <a href={issueHref}>Issue Watch →</a>}
        <a href={item.url} target="_blank" rel="noreferrer">Read more →</a>
      </div>
    </article>
  );
}
