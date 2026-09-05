import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { getRisk } from "@/lib/data";

export const metadata = { title: "Explore — NetaBoard" };

export default async function ExplorePage() {
  const risk = await getRisk();

  const groups = [
    ["Politics", [
      ["Coalition Builder", "/coalition", "Tap parties, watch the majority line move."],
      ["AI Manifesto Comparison", "/manifesto", "Two manifestos, compared issue by issue."],
      ["Historical Explorer", "/history", "Every Lok Sabha result since 1952."],
    ]],
    ["Analysis", [
      ["Prediction Market", "/market", "Crowd-sourced forecasts with an accuracy leaderboard."],
      ["Political Attention", "/stock-market", "Attention volume, not approval — see the underlying signals."],
      ["Constituency Grid", "/heatmap", "Every constituency, colored by lead."],
    ]],
    ["Community", [
      ["Debate Arena", "/debate", "Structured for/against arguments, ranked by vote."],
      ["Political IQ Quiz", "/quiz", "Guess winners, seats, and symbols."],
      ["Political Meme Generator", "/memes", "Make one, download it, share it."],
    ]],
    ["Tools", [
      ["Daily AI Brief", "/brief", "Today's politics in five minutes, with sources."],
      ["Election Calendar", "/calendar", "Every election, one countdown timeline."],
    ]],
  ];

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Geopolitical Risk Meter</div>
        <h2 className="title">Every country, at a glance.</h2>
        <p className="sub">War risk, economic risk, and political stability — condensed into three numbers per country.</p>
        <div className="grid-3">
          {risk.map((r) => (
            <div key={r.country} className="card">
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>{r.country}</div>
              {[["War Risk", r.war_risk, "var(--red)"], ["Economic Risk", r.economic_risk, "var(--amber)"], ["Political Stability", r.political_stability, "var(--mint)"]].map(([label, val, color]) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: "var(--paper-dim)" }}>{label}</span>
                    <span style={{ fontFamily: "var(--mono)", color }}>{val}%</span>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: val + "%", background: color }} /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="wrap tight">
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
