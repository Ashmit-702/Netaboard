import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import AccountabilityScoreCard from "@/components/AccountabilityScoreCard";
import EvidenceLedgerItem from "@/components/EvidenceLedgerItem";
import { getPolitician } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function PoliticianPage({ params }) {
  const p = await getPolitician(params.slug);
  if (!p) return notFound();

  const promiseClaims = (p.claims || []).filter((c) => c.claim_type === "promise");

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Politician Profile</div>
        <h2 className="title">{p.name}</h2>
        <p className="sub">{p.role} · {p.party?.abbreviation}{p.bio ? ` — ${p.bio}` : ""}</p>

        <div className="grid-2">
          <div>
            <AccountabilityScoreCard accountability={p.accountability} />
            <div className="card" style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Evidence Ledger</h3>
              <div style={{ fontSize: 12, color: "var(--paper-faint)", marginBottom: 14 }}>
                Click any claim to see its evidence and verdict reasoning
              </div>
              {promiseClaims.map((c) => (
                <EvidenceLedgerItem key={c.id} claim={c} />
              ))}
              {!promiseClaims.length && <div style={{ color: "var(--paper-faint)", fontSize: 13.5 }}>No claims tracked yet.</div>}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Political Timeline</h3>
            {(p.timeline_events || []).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).map((ev, i) => (
              <div key={i} className="row-line" style={{ alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--paper-faint)", width: 78, flexShrink: 0 }}>
                  {new Date(ev.event_date).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ev.title}</div>
                  {ev.category && <span className="tag" style={{ marginTop: 4 }}>{ev.category}</span>}
                </div>
              </div>
            ))}
            {!(p.timeline_events || []).length && <div style={{ color: "var(--paper-faint)", fontSize: 13.5 }}>No timeline events logged yet.</div>}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
