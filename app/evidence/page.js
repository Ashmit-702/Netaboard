import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FactCheckForm from "@/components/FactCheckForm";
import EvidenceLedgerItem from "@/components/EvidenceLedgerItem";
import { getRecentClaims } from "@/lib/evidenceFeed";

export const metadata = { title: "Evidence — NetaBoard" };
export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const { ok, claims } = await getRecentClaims({ limit: 30 });
  const withEvidence = claims.filter((c) => (c.evidence || []).length > 0).length;
  const byStatus = {};
  for (const c of claims) byStatus[c.latestVerdict.status] = (byStatus[c.latestVerdict.status] || 0) + 1;

  return (
    <>
      <Nav />
      <section className="wrap" style={{ paddingTop: 34 }}>
        <div className="eyebrow">Evidence</div>
        <h1 className="lead-h" style={{ fontSize: "clamp(32px,5vw,52px)" }}>What can actually be substantiated.</h1>
        <p className="sub">Claims, the evidence attached to them, and the verdicts that follow. The AI explains evidence; it does not invent scores, sources or confidence.</p>

        <div id="check" style={{ marginBottom: 44 }}>
          <div className="kicker" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 16 }}>Fact check a claim</div>
          <FactCheckForm />
        </div>

        <div className="kicker" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 6 }}>Recent verdicts</div>
        {!ok && <div className="empty" role="status">The evidence ledger couldn’t be loaded right now.</div>}
        {ok && claims.length === 0 && <div className="empty">No verdicts recorded yet. NetaBoard won’t manufacture one.</div>}
        {ok && claims.length > 0 && (
          <>
            <div className="meta" style={{ margin: "8px 0 10px" }}>
              <span>{claims.length} recent claims</span><span>{withEvidence} with attached evidence</span>
              {Object.entries(byStatus).map(([s, n]) => <span key={s}>{n} {s.replace(/_/g, " ")}</span>)}
            </div>
            <div>{claims.map((c) => <EvidenceLedgerItem key={c.id} claim={c} />)}</div>
          </>
        )}
      </section>
      <Footer />
    </>
  );
}
