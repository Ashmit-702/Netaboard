import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";

export const metadata = { title: "Historical Election Explorer — NetaBoard" };

const elections = [
  { year: 1952, winner: "Indian National Congress", seats: "364 / 489", note: "First general election after independence." },
  { year: 1977, winner: "Janata Party", seats: "295 / 542", note: "First non-Congress government at the centre." },
  { year: 1998, winner: "BJP-led NDA (coalition)", seats: "182 / 543 (BJP)", note: "Start of the modern NDA coalition era." },
  { year: 2014, winner: "BJP", seats: "282 / 543", note: "First single-party majority since 1984." },
  { year: 2019, winner: "BJP", seats: "303 / 543", note: "NDA returned with an increased majority." },
  { year: 2024, winner: "BJP-led NDA (coalition)", seats: "240 / 543 (BJP)", note: "BJP fell short of a solo majority; governed via NDA coalition." },
];

export default function HistoryPage() {
  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Historical Election Explorer</div>
        <h2 className="title">Every Lok Sabha election, at a glance.</h2>
        <p className="sub">Seat counts and turning points since 1952. Expand this table from Supabase once you've loaded full ECI archives.</p>
        <div className="card" style={{ padding: 0 }}>
          {elections.map((e, i) => (
            <div key={e.year} className="row-line" style={{ padding: "18px 24px", borderTop: i === 0 ? "none" : "1px solid var(--line)" }}>
              <span style={{ fontFamily: "var(--mono)", fontWeight: 700, width: 56, color: "var(--amber)" }}>{e.year}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{e.winner}</div>
                <div style={{ fontSize: 12.5, color: "var(--paper-dim)", marginTop: 2 }}>{e.note}</div>
              </div>
              <span className="tag">{e.seats}</span>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
