import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { StateBadge } from "@/components/ElectionWatchCard";
import { getElections } from "@/lib/elections/get";
import { groupElections, STATE_ORDER, STATE_LABEL } from "@/lib/elections/classify";
import { formatISTDate } from "@/lib/time";

export const metadata = { title: "Elections — NetaBoard" };
export const dynamic = "force-dynamic";

const EMPTY = {
  LIVE: "No election is live right now.",
  UPCOMING: "No upcoming elections with confirmed dates on record.",
  RESULTS: "No recent results on record.",
  ARCHIVE: "No archived elections on record.",
  NOT_ENOUGH_DATA: "",
};

export default async function ElectionsPage() {
  const { ok, elections } = await getElections();
  const groups = groupElections(elections);

  return (
    <>
      <Nav />
      <section className="wrap" style={{ paddingTop: 34 }}>
        <div className="eyebrow">Elections</div>
        <h1 className="lead-h" style={{ fontSize: "clamp(32px,5vw,52px)" }}>Current, upcoming, decided.</h1>
        <p className="sub">Every election is labelled from its recorded status and date — live, upcoming, results or archive — and each year stands on its own. Nothing here is filled in from older elections.</p>

        {!ok && <div className="empty" role="status">Election records couldn’t be loaded right now.</div>}
        {ok && !elections.length && <div className="empty">No elections are recorded yet.</div>}

        {ok && elections.length > 0 && STATE_ORDER.filter((s) => s !== "NOT_ENOUGH_DATA" || groups[s].length).map((s) => (
          <div key={s} style={{ marginBottom: 34 }}>
            <div className="kicker" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 4 }}>{STATE_LABEL[s]}</div>
            {groups[s].length ? groups[s].map((e) => (
              <a key={e.id} href={`/elections/${e.id}`} className="row-line" style={{ padding: "16px 0", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 260px" }}>
                  <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 19 }}>{e.name}</div>
                  <div className="meta" style={{ marginTop: 3 }}>{e.region} · {formatISTDate(e.election_date)}{e.daysUntil != null && ` · in ${e.daysUntil} days`}</div>
                  {!e.hasData && s !== "UPCOMING" && <div className="meta" style={{ marginTop: 3 }}>Not enough data — no structured result or estimate is recorded.</div>}
                </div>
                <StateBadge election={e} />
              </a>
            )) : <div className="empty">{EMPTY[s]}</div>}
          </div>
        ))}
      </section>
      <Footer />
    </>
  );
}
