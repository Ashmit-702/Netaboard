import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Gauge from "@/components/Gauge";
import { adaptElectionForGauge } from "@/lib/data";
import { getElectionWatch } from "@/lib/electionWatch";

export const metadata = { title: "Election Predictions — NetaBoard" };

export default async function PredictionsPage() {
  const watch = await getElectionWatch();
  const election = adaptElectionForGauge(watch);

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        {election ? (
          <>
            <div className="eyebrow">{election.name}</div>
            <h2 className="title">The prediction — and how it's actually made.</h2>
            <p className="sub">
              Being direct: this number is a maintained estimate, not an automated model. It lives in the
              <code>predictions</code> table in Supabase and updates when you (or a script you write) enter
              a new value — there's no live turnout/sentiment pipeline running behind it yet. Below is what
              a real version of this model would need, and what's already wired up versus still to build.
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
                <h3 style={{ fontSize: 15, marginBottom: 14 }}>What a real model needs</h3>
                {[
                  ["Historical baseline", "Past assembly results, seat by seat, weighted by recency.", "Not built — needs a results dataset"],
                  ["Turnout signal", "Early and postal-vote turnout vs. each party's historical floor.", "Not built — needs live ECI data"],
                  ["News sentiment", "Article and mention volume per candidate, scored for tone.", "Partially available — lib/social.js and lib/news.js already pull raw mention/article counts, just not yet fed into a probability calculation"],
                  ["Local corrections", "Constituency-level swing estimates layered on the state average.", "Not built — needs constituency-level historical data"],
                ].map(([t, d, status]) => (
                  <div key={t} className="row-line" style={{ alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</div>
                      <div style={{ fontSize: 12.5, color: "var(--paper-dim)", marginTop: 2 }}>{d}</div>
                      <div style={{ fontSize: 11.5, color: "var(--amber)", marginTop: 3, fontFamily: "var(--mono)" }}>{status}</div>
                    </div>
                  </div>
                ))}
                <div className="status-banner needs" style={{ marginTop: 18 }}>
                  Current status: manually maintained estimate, not a certified or automated forecast
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="eyebrow">Elections</div>
            <h2 className="title">No current election has enough verified data yet.</h2>
            <p className="sub">
              NetaBoard doesn't substitute old or fabricated data here. Check <a href="/calendar" style={{ color: "var(--amber)", textDecoration: "underline" }}>the election calendar</a> or <a href="/history" style={{ color: "var(--amber)", textDecoration: "underline" }}>historical results</a> in the meantime.
            </p>
          </>
        )}
      </section>
      <Footer />
    </>
  );
}
