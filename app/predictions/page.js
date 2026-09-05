import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Gauge from "@/components/Gauge";
import { adaptElectionForGauge } from "@/lib/data";
import { getElectionWatch } from "@/lib/electionWatch";
import { freshnessLabel } from "@/lib/freshness";

export const metadata = { title: "Election Predictions — NetaBoard" };

export default async function PredictionsPage() {
  const watch = await getElectionWatch();
  const election = adaptElectionForGauge(watch);
  const fresh = election ? freshnessLabel(election.lastUpdated) : null;

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        {election ? (
          <>
            <div className="eyebrow">{election.name}</div>
            <h2 className="title">The prediction — and exactly what it's built on.</h2>
            <p className="sub">
              Every field below is read directly from the <code>predictions</code> table — nothing here
              is implied or dressed up. If a field says "manual-estimate," that's what it actually is.
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
                <h3 style={{ fontSize: 15, marginBottom: 14 }}>Model &amp; methodology</h3>
                {[
                  ["Model", election.modelName],
                  ["Confidence", election.confidence != null ? `${election.confidence}%` : "Not recorded"],
                  ["Last updated", fresh?.label],
                  ["Source snapshot", election.sourceSnapshotAt ? new Date(election.sourceSnapshotAt).toLocaleDateString("en-IN") : "Not recorded"],
                ].map(([label, value]) => (
                  <div key={label} className="row-line">
                    <span style={{ flex: 1, fontSize: 13, color: "var(--paper-dim)" }}>{label}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: fresh?.stale && label === "Last updated" ? "var(--red)" : "var(--paper)" }}>{value}</span>
                  </div>
                ))}
                {election.methodology && (
                  <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--paper-dim)", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                    {election.methodology}
                  </p>
                )}
                <div className="status-banner needs" style={{ marginTop: 18 }}>
                  {election.modelName === "manual-estimate"
                    ? "This is a manually maintained estimate, not an automated forecast — there is no live turnout/sentiment pipeline behind it yet."
                    : `Model: ${election.modelName}`}
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
