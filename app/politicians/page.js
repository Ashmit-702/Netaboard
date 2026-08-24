import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { getPoliticians } from "@/lib/data";

export const metadata = { title: "Politician Tracker — NetaBoard" };

export default async function PoliticiansPage() {
  const politicians = await getPoliticians();

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Evidence Ledger &amp; Accountability Score</div>
        <h2 className="title">What was said. What the evidence shows.</h2>
        <p className="sub">
          Every promise here traces to a claim, its evidence, and a verdict — not a bare checkmark.
          The score is computed from that evidence, not assigned by hand.
        </p>

        <div className="grid-3">
          {politicians.map((p) => {
            const a = p.accountability;
            return (
              <a key={p.slug} href={`/politicians/${p.slug}`} className="card" style={{ display: "block" }}>
                <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--paper-faint)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                  {p.role} · {p.party?.abbreviation}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700 }}>
                    {a.score === null ? "—" : a.score}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--paper-faint)", textTransform: "uppercase" }}>
                    accountability{a.score !== null ? " / 100" : ""}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 14, fontSize: 11.5, fontFamily: "var(--mono)" }}>
                  <span style={{ color: "var(--mint)" }}>{a.fulfilled} fulfilled</span>
                  <span style={{ color: "var(--amber)" }}>{a.partial} partial</span>
                  <span style={{ color: "var(--red)" }}>{a.notFulfilled} not fulfilled</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 6 }}>
                  {a.evidenceCoverage}% evidence coverage
                </div>
                {a.disputed > 0 && (
                  <div style={{ fontSize: 11, color: "var(--paper-faint)", marginTop: 6 }}>
                    +{a.disputed} awaiting evidence
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </section>
      <Footer />
    </>
  );
}
