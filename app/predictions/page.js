import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Gauge from "@/components/Gauge";
import { adaptElectionForGauge } from "@/lib/data";
import { getElections } from "@/lib/elections/get";
import { groupElections } from "@/lib/elections/classify";
import { formatISTDate } from "@/lib/time";
import { freshnessLabel } from "@/lib/freshness";

export const metadata = { title: "Election Predictions — NetaBoard" };
export const dynamic = "force-dynamic";

// Predictions are model ESTIMATES, separate from the Elections page (which
// says which elections exist and what state they are in). An election with
// no estimate is simply not shown here — it is never a reason to hide the
// election itself, which lives at /elections.
export default async function PredictionsPage() {
  const { ok, elections } = await getElections();
  const groups = groupElections(elections);
  const withEstimate = [...groups.LIVE, ...groups.UPCOMING, ...groups.RESULTS.filter((e) => e.recent)].find((e) => e.summary);
  const election = adaptElectionForGauge(withEstimate);
  const upcoming = [...groups.LIVE, ...groups.UPCOMING];
  const fresh = election ? freshnessLabel(election.lastUpdated) : null;

  return (
    <>
      <Nav />
      <section className="wrap">
        {election ? (
          <>
            <div className="eyebrow">{election.name}</div>
            <h2 className="title">The prediction — and exactly what it's built on.</h2>
            <p className="sub">Model, confidence and methodology, as recorded.</p>

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
            <div className="eyebrow">Predictions</div>
            <h2 className="title">No current election has a verified estimate.</h2>
            <p className="sub">
              Predictions are model estimates and are shown only when one is recorded for a live, upcoming or just-decided election. NetaBoard does not fill this page with older or invented numbers.
              See <a href="/elections" style={{ color: "var(--amber)", textDecoration: "underline" }}>Elections</a> for what is live, upcoming and decided.
            </p>
            {!ok && <div className="empty" role="status">Election records couldn’t be loaded right now.</div>}
            {ok && upcoming.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="kicker" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>Elections without an estimate yet</div>
                {upcoming.map((e) => (
                  <a key={e.id} href={`/elections/${e.id}`} className="row-line" style={{ padding: "14px 0" }}>
                    <span style={{ flex: 1, fontWeight: 700 }}>{e.name}</span>
                    <span className="meta">{formatISTDate(e.election_date)}</span>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <Footer />
    </>
  );
}
