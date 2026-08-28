import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { getConstituencies } from "@/lib/data";
import { freshnessLabel } from "@/lib/freshness";

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
        <p className="sub">
          Every result below is tied to a specific election — never a bare "current" number. Most seats
          here are historical results (their most recent recorded election), shown for reference rather
          than implied to be live.
        </p>

        <div className="grid-2">
          {list.map((c) => {
            const fresh = c.election_date ? freshnessLabel(c.election_date) : { label: "No result recorded", stale: true };
            return (
              <div key={c.name} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>{c.state}</div>
                  </div>
                  <span className="tag">{c.current_rep || "No result recorded"}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 12, color: "var(--paper-dim)" }}>{c.election_name || "No election linked"}</span>
                  <span className="tag" style={{ color: c.is_archived || fresh.stale ? "var(--red)" : "var(--mint)", borderColor: c.is_archived || fresh.stale ? "var(--red)" : "var(--mint)" }}>
                    {c.is_archived ? "ARCHIVE" : fresh.label}
                  </span>
                </div>

                {c.vote_share != null ? (
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
                ) : (
                  <div style={{ fontSize: 12.5, color: "var(--paper-faint)" }}>Not enough verified data.</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <Footer />
    </>
  );
}
