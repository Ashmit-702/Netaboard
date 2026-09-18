import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getConstituencies } from "@/lib/data";
import { freshnessLabel } from "@/lib/freshness";

export const metadata = { title: "Constituencies — NetaBoard" };

function SeatRow({ c }) {
  const fresh = c.election_date ? freshnessLabel(c.election_date) : null;
  return (
    <div className="row-line" style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "18px 0" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
        <div style={{ fontSize: 12, color: "var(--paper-faint)", marginTop: 2 }}>
          {c.state}
          {c.election_name ? ` · ${c.election_name}` : " · No election linked"}
        </div>
        {c.current_rep && (
          <div style={{ fontSize: 13, color: "var(--paper-dim)", marginTop: 6 }}>{c.current_rep}</div>
        )}
      </div>
      {c.vote_share != null ? (
        <div style={{ display: "flex", gap: 22, flexShrink: 0, fontFamily: "var(--mono)" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{c.vote_share}%</div>
            <div style={{ fontSize: 10, color: "var(--paper-faint)", textTransform: "uppercase" }}>Vote</div>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{c.margin}%</div>
            <div style={{ fontSize: 10, color: "var(--paper-faint)", textTransform: "uppercase" }}>Margin</div>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{c.turnout}%</div>
            <div style={{ fontSize: 10, color: "var(--paper-faint)", textTransform: "uppercase" }}>Turnout</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--paper-faint)", flexShrink: 0 }}>No result recorded</div>
      )}
    </div>
  );
}

export default async function ConstituenciesPage() {
  const list = await getConstituencies();
  // Archive-only records never act as the current picture — they render
  // under their own heading. If nothing is current, the page says so
  // rather than promoting historical data upward to fill the space.
  const current = list.filter((c) => !c.is_archived_constituency);
  const archive = list.filter((c) => c.is_archived_constituency);

  return (
    <>
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Constituencies</div>
        <h2 className="title">Every seat, broken down.</h2>
        <p className="sub">Each result is tied to the election it came from.</p>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 4 }}>
            Current
          </div>
          {current.length ? (
            current.map((c) => <SeatRow key={c.name} c={c} />)
          ) : (
            <div style={{ fontSize: 13.5, color: "var(--paper-faint)", padding: "20px 0", lineHeight: 1.6 }}>
              No current constituency data. NetaBoard tracks results against specific elections, and
              none of the seats on record belong to a current or upcoming one — historical results are
              listed below rather than presented as current.
            </div>
          )}
        </div>

        {archive.length > 0 && (
          <div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 4 }}>
              Archive
            </div>
            {archive.map((c) => <SeatRow key={c.name} c={c} />)}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
