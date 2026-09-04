import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import VoteWidget from "@/components/VoteWidget";
import { adaptElectionForGauge, getPredictors } from "@/lib/data";
import { getElectionWatch } from "@/lib/electionWatch";

export const metadata = { title: "Prediction Market — NetaBoard" };

export default async function MarketPage() {
  const watch = await getElectionWatch();
  const election = adaptElectionForGauge(watch);
  const predictors = await getPredictors();

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Crowd Prediction Market</div>
        <h2 className="title">Everyone's guessing. See who's right.</h2>
        <p className="sub">Cast a prediction, watch the crowd's odds shift live, and climb the accuracy leaderboard once results land.</p>

        {election ? (
          <div className="grid-2">
            <VoteWidget
              electionId={election.id}
              options={[election.optionA.label, election.optionB.label, "Others"]}
              colors={{ [election.optionA.label]: "var(--amber)", [election.optionB.label]: "var(--mint)", Others: "var(--slate)" }}
              initialCounts={{ [election.optionA.label]: 0, [election.optionB.label]: 0, Others: 0 }}
            />
            <div className="card">
              <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--paper-dim)", marginBottom: 14 }}>Top Predictors</h3>
              {predictors.map((p, i) => (
                <div key={p.display_name} className="row-line">
                  <span style={{ fontFamily: "var(--mono)", color: "var(--paper-faint)", width: 18 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{p.display_name}</span>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--mint)", fontWeight: 700 }}>{p.accuracy_pct}% acc.</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{ color: "var(--paper-dim)" }}>
            No active election to predict right now — check back once a real election has enough
            verified data, or see <a href="/calendar" style={{ color: "var(--amber)", textDecoration: "underline" }}>the calendar</a>.
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
