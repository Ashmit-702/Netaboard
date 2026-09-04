import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import CoalitionBuilder from "@/components/CoalitionBuilder";
import { getParties } from "@/lib/data";
import { freshnessLabel } from "@/lib/freshness";

export const metadata = { title: "Coalition Builder — NetaBoard" };

export default async function CoalitionPage() {
  const { parties, electionMeta } = await getParties();
  const total = parties.reduce((s, p) => s + p.seats_current, 0) || 243;
  const fresh = electionMeta?.election_date ? freshnessLabel(electionMeta.election_date) : null;

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Coalition Builder</div>
        <h2 className="title">Tap parties. Watch the majority line.</h2>
        <div className="status-banner needs" style={{ marginBottom: 16 }}>
          Seat counts from <strong>{electionMeta?.name || "an unlinked source"}</strong>
          {electionMeta?.is_archived && " — ARCHIVE, not a current tally"}
          {fresh && ` · ${fresh.label}`}
        </div>
        <p className="sub">
          {total} seats, {Math.floor(total / 2) + 1} to govern. Click parties to build a coalition and see if it
          crosses the line.
        </p>
        <CoalitionBuilder parties={parties} total={total} majority={Math.floor(total / 2) + 1} />
      </section>
      <Footer />
    </>
  );
}
