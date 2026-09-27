// The Election Calendar is a secondary Explore view over the SAME election
// data as /elections (lib/elections). No fallback/demo data of any kind: a
// database with nothing in it shows genuinely empty groups.
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getElections } from "@/lib/elections/get";
import { groupElections, STATE_LABEL } from "@/lib/elections/classify";
import { formatISTDate } from "@/lib/time";

export const metadata = { title: "Election Calendar — NetaBoard" };
export const dynamic = "force-dynamic";

const VIEW = [
  ["UPCOMING", "Upcoming", "No upcoming elections with confirmed dates."],
  ["RESULTS", "Recent Results", "No elections decided recently."],
  ["ARCHIVE", "Archive", "No historical elections recorded."],
];

export default async function CalendarPage() {
  const { ok, elections } = await getElections();
  const groups = groupElections(elections);

  return (
    <>
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Election Calendar</div>
        <h2 className="title">Every election, one timeline.</h2>
        <p className="sub">Grouped by what each election actually is right now — upcoming, recently decided, or historical. See <a href="/elections" style={{ color: "var(--amber)", textDecoration: "underline" }}>Elections</a> for full detail on any of these.</p>

        {!ok && <div className="empty" role="status">Election records couldn’t be loaded right now.</div>}
        {ok && VIEW.map(([key, label, empty]) => (
          <div key={key} style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", marginBottom: 12, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>{label}</div>
            {groups[key].length ? groups[key].map((e) => (
              <a key={e.id} href={`/elections/${e.id}`} className="row-line" style={{ padding: "14px 0", display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>{e.region} · {formatISTDate(e.election_date)}</div>
                </div>
                <span className="tag" style={{ color: key === "UPCOMING" ? "var(--amber)" : key === "RESULTS" ? "var(--mint)" : "var(--paper-faint)", borderColor: "currentColor" }}>
                  {key === "UPCOMING" ? `${e.daysUntil} days to go` : STATE_LABEL[e.state]}
                </span>
              </a>
            )) : <div style={{ fontSize: 13, color: "var(--paper-faint)", padding: "12px 0" }}>{empty}</div>}
          </div>
        ))}
      </section>
      <Footer />
    </>
  );
}
