import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { supabaseServer } from "@/lib/supabaseServer";

export const metadata = { title: "Election Calendar — NetaBoard" };

async function getElections() {
  const sb = supabaseServer();
  // Real historical elections only — no fabricated "upcoming" demo entry
  // with a countdown implying real currency it doesn't have.
  const fallback = [
    { name: "Bihar Legislative Assembly Election 2020", region: "Bihar", election_date: "2020-11-10", status: "concluded", is_archived: true },
    { name: "Tamil Nadu Assembly Election 2026", region: "Tamil Nadu", election_date: "2026-05-04", status: "concluded", is_archived: true },
  ];
  if (!sb) return fallback;
  try {
    const { data } = await sb.from("elections").select("*").eq("is_demo", false).order("election_date", { ascending: true });
    return data?.length ? data : fallback;
  } catch { return fallback; }
}

export default async function CalendarPage() {
  const elections = await getElections();
  const today = new Date();
  const RECENT_DAYS = 180; // results within ~6 months count as "recent"

  // Grouped by what each election actually is, from its real date/status —
  // never labeling a completed election "upcoming" or making it look live.
  const upcoming = [];
  const recentResults = [];
  const archive = [];
  for (const e of elections) {
    const date = new Date(e.election_date);
    const daysSince = Math.floor((today - date) / 86400000);
    if (daysSince < 0) upcoming.push({ ...e, daysUntil: -daysSince });
    else if (daysSince <= RECENT_DAYS) recentResults.push({ ...e, daysSince });
    else archive.push({ ...e, daysSince });
  }
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  recentResults.sort((a, b) => a.daysSince - b.daysSince);
  archive.sort((a, b) => a.daysSince - b.daysSince);

  const Group = ({ label, items, render, empty }) => (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", marginBottom: 12, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
        {label}
      </div>
      {items.length ? items.map((e) => (
        <div key={e.name} className="row-line" style={{ padding: "14px 0", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.name}</div>
            <div style={{ fontSize: 12, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>
              {e.region} · {new Date(e.election_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          {render(e)}
        </div>
      )) : <div style={{ fontSize: 13, color: "var(--paper-faint)", padding: "12px 0" }}>{empty}</div>}
    </div>
  );

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Election Calendar</div>
        <h2 className="title">Every election, one timeline.</h2>
        <p className="sub">Grouped by what each election actually is right now — upcoming, recently decided, or historical.</p>

        <Group
          label="Upcoming"
          items={upcoming}
          empty="No upcoming elections with confirmed dates."
          render={(e) => <span className="tag" style={{ color: "var(--amber)", borderColor: "var(--amber)" }}>{e.daysUntil} days to go</span>}
        />
        <Group
          label="Recent Results"
          items={recentResults}
          empty="No elections decided in the last six months."
          render={() => <span className="tag" style={{ color: "var(--mint)", borderColor: "var(--mint)" }}>Results</span>}
        />
        <Group
          label="Archive"
          items={archive}
          empty="No historical elections recorded."
          render={() => <span className="tag" style={{ color: "var(--paper-faint)" }}>Archive</span>}
        />
      </section>
      <Footer />
    </>
  );
}
