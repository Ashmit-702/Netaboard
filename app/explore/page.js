import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = { title: "Explore — NetaBoard" };

const groups = [
  ["Analysis", [
    ["Election Predictions", "/predictions", "Model, confidence, and methodology — as recorded."],
    ["Crowd Forecast", "/market", "Crowd-sourced predictions with an accuracy leaderboard."],
    ["Political Attention", "/attention", "Attention volume, not approval — see the underlying signals."],
  ]],
  ["Deep Dives", [
    ["AI Manifesto Comparison", "/manifesto", "Two manifestos, compared issue by issue."],
    ["Historical Explorer", "/history", "Every Lok Sabha result since 1952."],
    ["Coalition Builder", "/coalition", "Tap parties, watch the majority line move."],
  ]],
  ["Community / Share", [
    ["Debate Arena", "/debate", "Structured for/against arguments, ranked by vote."],
    ["Political IQ Quiz", "/quiz", "Guess winners, seats, and symbols."],
    ["Political Meme Generator", "/memes", "Make one, download it, share it."],
  ]],
  ["Tools", [
    ["Daily Brief Archive", "/brief", "Today's generated brief, with sources."],
    ["Election Calendar", "/calendar", "Upcoming, recent results, and archive, grouped clearly."],
  ]],
];

export default function ExplorePage() {
  return (
    <>
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Explore</div>
        <h2 className="title">The rest of the toolkit.</h2>
        {groups.map(([groupName, items]) => (
          <div key={groupName} style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", marginBottom: 14, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
              {groupName}
            </div>
            <div>
              {items.map(([title, href, desc]) => (
                <a key={href} href={href} className="row-line" style={{ display: "flex", padding: "14px 0", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--paper-dim)", marginTop: 2 }}>{desc}</div>
                  </div>
                  <span style={{ color: "var(--amber)", fontSize: 13 }}>→</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
      <Footer />
    </>
  );
}
