import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { getDailyBrief } from "@/lib/data";

export const metadata = { title: "Daily AI Brief — NetaBoard" };

export default async function BriefPage() {
  const brief = await getDailyBrief();
  const content = brief?.content || {
    headline: "Demo brief — connect Supabase and run /api/daily-brief to generate a real one.",
    stories: [
      { title: "Bihar 2026 model updated", summary: "NDA win probability moved to 72% on new turnout data." },
      { title: "Coalition talks continue", summary: "Smaller allies weigh seat-sharing ahead of the filing deadline." },
    ],
    watch_today: "Watch for the next round of constituency-level polling.",
  };

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Daily AI Brief</div>
        <h2 className="title">Today's politics in five minutes.</h2>
        <p className="sub">Instead of a hundred articles — the headline, the stories that matter, and what to watch.</p>

        <div className="card" style={{ maxWidth: 720 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, lineHeight: 1.3 }}>{content.headline}</div>
          {(content.stories || []).map((s, i) => (
            <div key={i} className="row-line" style={{ alignItems: "flex-start" }}>
              <span style={{ fontFamily: "var(--mono)", color: "var(--amber)", width: 20, flexShrink: 0 }}>{i + 1}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "var(--paper-dim)", marginTop: 3 }}>{s.summary}</div>
              </div>
            </div>
          ))}
          <div className="status-banner info" style={{ marginTop: 18 }}>Watch today: {content.watch_today}</div>
          {content.sources?.length > 0 && (
            <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", marginBottom: 10 }}>
                Sources ({content.sources.length})
              </div>
              {content.sources.map((s, i) => (
                <div key={i} style={{ fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ color: "var(--paper-dim)" }}>{s.source}</span>
                  {s.url && <> — <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--amber)", textDecoration: "underline" }}>{s.title}</a></>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
