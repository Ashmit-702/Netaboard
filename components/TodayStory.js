import { freshnessLabel } from "@/lib/freshness";

function ageLabel(hoursOld) {
  if (hoursOld === null || hoursOld === undefined) return null;
  if (hoursOld < 1) return "Just now";
  if (hoursOld < 2) return "1 hour ago";
  if (hoursOld < 24) return `${Math.round(hoursOld)} hours ago`;
  if (hoursOld < 48) return "Yesterday";
  return `${Math.round(hoursOld / 24)} days ago`;
}

// The lead current story, discovered by lib/trending.js from live feeds.
// Outlet count is shown as a corroboration signal ("12 outlets covering")
// rather than naming any API or publisher — that's editorial, not technical.
export default function TodayStory({ story }) {
  if (!story) return null;
  return (
    <div>
      <h1 style={{ fontSize: "clamp(30px,4.6vw,50px)", lineHeight: 1.07, marginBottom: 16, maxWidth: 860 }}>
        {story.headline}
      </h1>
      {story.summary && (
        <p style={{ fontSize: 17, color: "var(--paper-dim)", lineHeight: 1.6, maxWidth: 700, marginBottom: 20 }}>
          {story.summary}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {story.url && (
          <a href={story.url} target="_blank" rel="noreferrer" className="btn btn-primary">Read more</a>
        )}
        <span style={{ fontSize: 12, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>
          {ageLabel(story.hoursOld)}
          {story.outletCount > 1 && ` · ${story.outletCount} outlets covering`}
        </span>
      </div>
    </div>
  );
}
