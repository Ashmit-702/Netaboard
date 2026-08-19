import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import VoteWidget from "@/components/VoteWidget";
import { getElection, getPredictors } from "@/lib/data";

export const metadata = { title: "Prediction Market — NetaBoard" };

export default async function MarketPage() {
  const election = await getElection();
  const predictors = await getPredictors();
  const options = [election.optionA.label, election.optionB.label, "Others"];
  const colors = { [election.optionA.label]: "var(--amber)", [election.optionB.label]: "var(--mint)", Others: "var(--slate)" };
  const initialCounts = { [election.optionA.label]: 5204, [election.optionB.label]: 3077, Others: 256 };

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Crowd Prediction Market</div>
        <h2 className="title">Everyone's guessing. See who's right.</h2>
        <p className="sub">Cast a prediction, watch the crowd's odds shift live, and climb the accuracy leaderboard once results land.</p>

        <div className="grid-2">
          <VoteWidget electionId={election.id} options={options} initialCounts={initialCounts} colors={colors} />
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
      </section>
      <Footer />
    </>
  );
}
