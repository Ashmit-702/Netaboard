import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Gauge from "@/components/Gauge";
import { StateBadge } from "@/components/ElectionWatchCard";
import { getElection } from "@/lib/elections/get";
import { adaptElectionForGauge } from "@/lib/data";
import { formatISTDate } from "@/lib/time";
import { freshnessLabel } from "@/lib/freshness";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Election — NetaBoard" };

export default async function ElectionPage({ params }) {
  const res = await getElection(params.id);
  if (!res.ok) {
    return (<><Nav /><section className="wrap"><div className="empty" role="status">This election record couldn’t be loaded right now.</div></section><Footer /></>);
  }
  if (!res.found) return notFound();
  const e = res.election;
  const gauge = adaptElectionForGauge(e);
  const fresh = gauge ? freshnessLabel(gauge.lastUpdated) : null;

  return (
    <>
      <Nav />
      <section className="wrap" style={{ paddingTop: 34 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <StateBadge election={e} />
          <span className="kicker">{e.region} · {formatISTDate(e.election_date)}</span>
        </div>
        <h1 className="lead-h" style={{ fontSize: "clamp(30px,4.6vw,48px)" }}>{e.name}</h1>
        {e.description && <p className="sub">{e.description}</p>}
        {e.state === "ARCHIVE" && <div className="status-banner needs" style={{ marginTop: 0, marginBottom: 24 }}>ARCHIVE — a historical election. This is not current data.</div>}
        {e.note && <div className="status-banner needs" style={{ marginTop: 0, marginBottom: 24 }}>{e.note}</div>}
        {e.staleLive && <div className="status-banner needs" style={{ marginTop: 0, marginBottom: 24 }}>Marked live, but this record was last updated {e.updatedDaysAgo} days ago.</div>}

        {e.results.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="kicker" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>Seats won</div>
            {e.results.map((r, i) => (
              <div key={i} className="row-line"><span style={{ flex: 1, fontWeight: 600 }}>{r.party?.name}</span><span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{r.seats_won}</span></div>
            ))}
          </div>
        )}

        {gauge && (
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <Gauge labelA={gauge.optionA.label} pctA={gauge.optionA.probability} labelB={gauge.optionB.label} pctB={gauge.optionB.probability} history={gauge.history} />
            <dl className="dl" style={{ alignContent: "start" }}>
              <dt>Model</dt><dd>{gauge.modelName}</dd>
              <dt>Confidence</dt><dd>{gauge.confidence != null ? `${gauge.confidence}%` : "Not recorded"}</dd>
              <dt>Last updated</dt><dd style={{ color: fresh?.stale ? "var(--red)" : undefined }}>{fresh?.label}</dd>
              {gauge.methodology && (<><dt>Method</dt><dd>{gauge.methodology}</dd></>)}
            </dl>
          </div>
        )}
        {!gauge && !e.results.length && <div className="empty">Not enough data — no structured result or estimate has been recorded for this election.</div>}
        {e.source_url && <a href={e.source_url} target="_blank" rel="noreferrer" className="sec-link">Source →</a>}
        <div style={{ marginTop: 26 }}><a href="/elections" className="sec-link">← All elections</a></div>
      </section>
      <Footer />
    </>
  );
}
