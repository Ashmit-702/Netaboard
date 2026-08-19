import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { getPoliticians } from "@/lib/data";

export const metadata = { title: "Politician Tracker — NetaBoard" };

const markFor = { done: ["y", "✔"], partial: ["p", "◐"], broken: ["n", "✖"] };

export default async function PoliticiansPage() {
  const politicians = await getPoliticians();

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Promise Tracker &amp; Political Timeline</div>
        <h2 className="title">What was said. What actually happened.</h2>
        <p className="sub">Every leader's manifesto, checked against their term. No spin — just what's done, in progress, or dropped.</p>

        <div className="grid-3">
          {politicians.map((p) => (
            <a key={p.slug} href={`/politicians/${p.slug}`} className="card" style={{ display: "block" }}>
              <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--paper-faint)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                {p.role} · {p.party?.abbreviation}
              </div>
              {(p.promises || []).slice(0, 4).map((pr, i) => {
                const [cls, sym] = markFor[pr.status] || ["p", "◐"];
                return (
                  <div key={i} className="row-line" style={{ alignItems: "flex-start" }}>
                    <span className={"mark " + cls}>{sym}</span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>{pr.text}</span>
                  </div>
                );
              })}
            </a>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
