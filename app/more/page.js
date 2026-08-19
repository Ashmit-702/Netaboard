import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { getRisk } from "@/lib/data";

export const metadata = { title: "More Tools — NetaBoard" };

export default async function MorePage() {
  const risk = await getRisk();

  const tools = [
    ["Constituency Dashboard", "/constituencies", "Vote share, margins, and development data per seat."],
    ["Live Heat Map", "/heatmap", "Every constituency, colored by lead."],
    ["Election Calendar", "/calendar", "Every election, one countdown timeline."],
    ["Historical Explorer", "/history", "Every Lok Sabha result since 1952."],
    ["Debate Arena", "/debate", "Structured for/against arguments, ranked by vote."],
    ["Political IQ Quiz", "/quiz", "Guess winners, seats, and symbols."],
    ["AI Manifesto Comparison", "/manifesto", "Two manifestos, compared issue by issue."],
    ["Political Meme Generator", "/memes", "Make one, download it, share it."],
    ["AI Fact Check", "/fact-check", "Paste a claim, get a sourced verdict."],
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
        <div className="eyebrow">More Tools</div>
        <h2 className="title">The rest of the toolkit.</h2>
        <div className="feat-grid">
          {tools.map(([title, href, desc], i) => (
            <a key={href} href={href} className="feat">
              <div className="fnum">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className="ftitle">{title}</div>
                <div className="fdesc">{desc}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
