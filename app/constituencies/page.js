import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { getConstituencies } from "@/lib/data";

export const metadata = { title: "Constituency Dashboard — NetaBoard" };

export default async function ConstituenciesPage() {
  const list = await getConstituencies();

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Constituency Dashboard</div>
        <h2 className="title">Every seat, broken down.</h2>
        <p className="sub">Vote share, margin, turnout, and development indicators — the numbers people search for every election.</p>

        <div className="grid-2">
          {list.map((c) => (
            <div key={c.name} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>{c.state}</div>
                </div>
                <span className="tag">{c.current_rep}</span>
              </div>
              <div className="grid-3" style={{ gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: "var(--amber)" }}>{c.vote_share}%</div>
                  <div style={{ fontSize: 11, color: "var(--paper-faint)", textTransform: "uppercase" }}>Vote share</div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: "var(--mint)" }}>{c.margin}%</div>
                  <div style={{ fontSize: 11, color: "var(--paper-faint)", textTransform: "uppercase" }}>Margin</div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700 }}>{c.turnout}%</div>
                  <div style={{ fontSize: 11, color: "var(--paper-faint)", textTransform: "uppercase" }}>Turnout</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
