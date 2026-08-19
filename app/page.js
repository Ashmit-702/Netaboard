import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Gauge from "@/components/Gauge";
import { supabaseServer } from "@/lib/supabaseServer";
import { fallbackElection } from "@/lib/fallback";

async function getLatestElection() {
  const sb = supabaseServer();
  if (!sb) return fallbackElection;
  try {
    const { data: election } = await sb
      .from("elections")
      .select("id,name")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!election) return fallbackElection;

    const { data: preds } = await sb
      .from("predictions")
      .select("option_label,probability,recorded_at")
      .eq("election_id", election.id)
      .order("recorded_at", { ascending: true });
    if (!preds || preds.length === 0) return fallbackElection;

    const labels = [...new Set(preds.map((p) => p.option_label))];
    const latestA = [...preds].reverse().find((p) => p.option_label === labels[0]);
    const latestB = [...preds].reverse().find((p) => p.option_label === labels[1]);
    const history = preds
      .filter((p) => p.option_label === labels[0])
      .slice(-3)
      .map((p) => ({
        d: new Date(p.recorded_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        v: Math.round(p.probability),
      }));

    return {
      name: election.name,
      optionA: { label: labels[0], probability: Math.round(latestA?.probability ?? 0) },
      optionB: { label: labels[1] || "Others", probability: Math.round(latestB?.probability ?? 0) },
      history,
    };
  } catch {
    return fallbackElection;
  }
}

export default async function Home() {
  const election = await getLatestElection();

  return (
    <>
      <Ticker />
      <Nav />

      <section className="wrap" style={{ paddingTop: 60 }}>
        <div className="grid-2" style={{ alignItems: "center" }}>
          <div>
            <div className="eyebrow">{election.name}</div>
            <h1 style={{ fontSize: "clamp(38px,5.6vw,60px)", lineHeight: 1.02, marginBottom: 20 }}>
              Politics, tracked<br />like a <span style={{ color: "var(--amber)" }}>live score.</span>
            </h1>
            <p className="sub" style={{ fontSize: 17 }}>
              Probabilities instead of punditry. Every prediction shows its math, every promise shows
              its receipts, and every seat count updates the moment the numbers move.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/brief" className="btn btn-primary">See today&apos;s briefing</a>
              <a href="/coalition" className="btn btn-ghost">Build a coalition →</a>
            </div>
          </div>

          <Gauge
            labelA={election.optionA.label}
            pctA={election.optionA.probability}
            labelB={election.optionB.label}
            pctB={election.optionB.probability}
            history={election.history}
          />
        </div>
      </section>

      <section className="wrap tight">
        <div className="eyebrow">Everything on NetaBoard</div>
        <h2 className="title">One platform, not twenty tabs.</h2>
        <p className="sub">Track politicians, predict elections, build coalitions, and get your politics briefing — all in one place.</p>
        <div className="feat-grid">
          {[
            ["Election Predictions", "/predictions", "Live probability model, updated as new data lands"],
            ["Prediction Market", "/market", "Crowd-sourced forecasts with an accuracy leaderboard"],
            ["Coalition Builder", "/coalition", "Tap parties, watch the majority line move"],
            ["Politician Tracker", "/politicians", "Promise trackers and timelines, per leader"],
            ["Constituency Dashboard", "/constituencies", "Vote share, margins, and development data"],
            ["Political Stock Market", "/stock-market", "Reputational price moves, driven by real events"],
            ["Daily AI Brief", "/brief", "Today's politics in five minutes, not fifty articles"],
            ["Ask Politics (AI)", "/ask", "Plain-language answers to political questions"],
          ].map(([title, href, desc], i) => (
            <a key={href} href={href} className="feat">
              <div className="fnum">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className="ftitle">{title}</div>
                <div className="fdesc">{desc}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
