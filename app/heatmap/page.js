import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { getConstituencies } from "@/lib/data";

export const metadata = { title: "Constituency Grid — NetaBoard" };

function colorFor(voteShare) {
  if (voteShare >= 55) return "var(--mint)";
  if (voteShare >= 48) return "var(--amber)";
  return "var(--red)";
}

export default async function HeatmapPage() {
  const constituencies = await getConstituencies();

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Constituency Grid</div>
        <h2 className="title">Every constituency, colored by lead.</h2>
        <p className="sub">
          Named honestly: this is a grid, not a geographic map. A real map would use Leaflet +
          OpenStreetMap plotting each constituency by lat/long — worth building once real per-seat
          coordinates are loaded. Green = strong lead, amber = close, red = trailing.
        </p>
        <div className="grid-4">
          {constituencies.map((c) => (
            <div key={c.name} className="card" style={{ borderLeft: `4px solid ${colorFor(c.vote_share)}` }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--paper-faint)", fontFamily: "var(--mono)", marginTop: 2 }}>{c.state}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, marginTop: 10, color: colorFor(c.vote_share) }}>{c.vote_share}%</div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
