import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CoalitionBuilder from "@/components/CoalitionBuilder";
import { getParties } from "@/lib/data";
import { freshnessLabel } from "@/lib/freshness";

export const metadata = { title: "Coalition Builder — NetaBoard" };

export const dynamic = "force-dynamic";

export default async function CoalitionPage() {
  const { parties, electionMeta } = await getParties();
  const total = parties.reduce((s, p) => s + p.seats_current, 0);
  const fresh = electionMeta?.election_date ? freshnessLabel(electionMeta.election_date) : null;

  return (
    <>
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Coalition Builder</div>
        <h2 className="title">Tap parties. Watch the majority line.</h2>
        {total > 0 ? (
          <>
            <div className="status-banner needs" style={{ marginBottom: 16 }}>
              Seat counts from <strong>{electionMeta?.name}</strong>
              {electionMeta?.is_archived && " — ARCHIVE, not a current tally"}
              {fresh && ` · ${fresh.label}`}
            </div>
            <p className="sub">{total} seats, {Math.floor(total / 2) + 1} to govern. Click parties to build a coalition and see if it crosses the line.</p>
            <CoalitionBuilder parties={parties} total={total} majority={Math.floor(total / 2) + 1} />
          </>
        ) : (
          <p className="sub">Not enough data — no election-linked seat counts are recorded yet.</p>
        )}
      </section>
      <Footer />
    </>
  );
}
