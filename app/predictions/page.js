import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Gauge from "@/components/Gauge";
import { getElection } from "@/lib/data";

export const metadata = { title: "Election Predictions — NetaBoard" };

export default async function PredictionsPage() {
  const election = await getElection();

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">{election.name}</div>
        <h2 className="title">The live probability model.</h2>
        <p className="sub">
          Not a poll average — a running estimate built from turnout signals, seat-level history, and
          news sentiment, re-scored as new data lands. Every number here links back to its inputs.
        </p>

        <div className="grid-2">
          <Gauge
            labelA={election.optionA.label}
            pctA={election.optionA.probability}
            labelB={election.optionB.label}
            pctB={election.optionB.probability}
            history={election.history}
          />
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>How this model works</h3>
            {[
              ["Historical baseline", "Past three assembly results, seat by seat, weighted by recency."],
              ["Turnout signal", "Early and postal-vote turnout compared against each party's historical floor."],
              ["News sentiment", "Article and mention volume per candidate, scored for tone."],
              ["Local corrections", "Constituency-level swing estimates layered on top of the state average."],
            ].map(([t, d]) => (
              <div key={t} className="row-line" style={{ alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</div>
                  <div style={{ fontSize: 12.5, color: "var(--paper-dim)", marginTop: 2 }}>{d}</div>
                </div>
              </div>
            ))}
            <div className="status-banner info" style={{ marginTop: 18 }}>
              Confidence: medium-high · rebuilt daily · illustrative model, not a certified forecast
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
