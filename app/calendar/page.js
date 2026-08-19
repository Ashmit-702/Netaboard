import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { supabaseServer } from "@/lib/supabaseServer";

export const metadata = { title: "Election Calendar — NetaBoard" };

async function getElections() {
  const sb = supabaseServer();
  const fallback = [
    { name: "Bihar Assembly Election 2026", region: "Bihar", election_date: "2026-11-10", status: "upcoming" },
    { name: "Tamil Nadu Assembly Election 2026", region: "Tamil Nadu", election_date: "2026-05-06", status: "concluded" },
  ];
  if (!sb) return fallback;
  try {
    const { data } = await sb.from("elections").select("*").order("election_date", { ascending: true });
    return data?.length ? data : fallback;
  } catch { return fallback; }
}

export default async function CalendarPage() {
  const elections = await getElections();
  const today = new Date();

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Election Calendar</div>
        <h2 className="title">Every election, one timeline.</h2>
        <p className="sub">Upcoming and recent elections with a live countdown, status, and a link straight into predictions.</p>
        <div className="card" style={{ padding: 0 }}>
          {elections.map((e, i) => {
            const date = new Date(e.election_date);
            const days = Math.ceil((date - today) / 86400000);
            return (
              <div key={e.name} className="row-line" style={{ padding: "18px 24px", borderTop: i === 0 ? "none" : "1px solid var(--line)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>{e.region} · {date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
                </div>
                <span className="tag" style={{ color: days > 0 ? "var(--amber)" : "var(--paper-faint)" }}>
                  {days > 0 ? `${days} days to go` : "Concluded"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <Footer />
    </>
  );
}
