import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import CoalitionBuilder from "@/components/CoalitionBuilder";
import { getParties } from "@/lib/data";

export const metadata = { title: "Coalition Builder — NetaBoard" };

export default async function CoalitionPage() {
  const parties = await getParties();
  const total = parties.reduce((s, p) => s + p.seats_current, 0) || 243;

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Coalition Builder</div>
        <h2 className="title">Tap parties. Watch the majority line.</h2>
        <p className="sub">
          {total} seats, {Math.floor(total / 2) + 1} to govern. Click parties to build a coalition and see if it
          crosses the line — based on the current seat tally in <code>parties</code>.
        </p>
        <CoalitionBuilder parties={parties} total={total} majority={Math.floor(total / 2) + 1} />
      </section>
      <Footer />
    </>
  );
}
