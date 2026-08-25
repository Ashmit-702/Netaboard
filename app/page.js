import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import MinimalFooter from "@/components/MinimalFooter";
import Gauge from "@/components/Gauge";
import ChangeCard from "@/components/ChangeCard";
import EditorialRow from "@/components/EditorialRow";
import HeroToday from "@/components/HeroToday";
import HomeSearchBox from "@/components/HomeSearchBox";
import StoryBehindNumber from "@/components/StoryBehindNumber";
import { getElection, getPoliticians, getStocks } from "@/lib/data";
import { getAllChanges, parseAttentionFactors } from "@/lib/changes";

// "What Changed Today" is time-sensitive — without this, Next.js's default
// static generation would bake this page's data in at build time, and it
// would only ever update on the next redeploy, not reflect what actually
// changed. Revalidate every 5 minutes instead.
export const revalidate = 300;

function EmptyState({ text }) {
  return <div style={{ color: "var(--paper-faint)", fontSize: 13.5, padding: "20px 0" }}>{text}</div>;
}

function SectionHead({ eyebrow, title, sub }) {
  return (
    <>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="title">{title}</h2>
      {sub && <p className="sub">{sub}</p>}
    </>
  );
}

export default async function Home() {
  const [election, politicians, stocks, { changes, byType }] = await Promise.all([
    getElection(), getPoliticians(), getStocks(), getAllChanges(),
  ]);

  const heroChange = changes[0] || null;
  const restOfChanges = changes.slice(1, 5);

  const topStock = stocks.find((s) => s.reason) || stocks[0];
  const attentionFactors = topStock ? parseAttentionFactors(topStock.reason) : [];

  return (
    <>
      <Ticker />
      <Nav />

      {/* ---------- HERO: TODAY'S POLITICAL PICTURE ---------- */}
      <HeroToday change={heroChange} />

      {/* ---------- WHAT CHANGED TODAY (editorial grid, not uniform cards) ---------- */}
      {restOfChanges.length > 0 && (
        <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
          <SectionHead eyebrow="What Changed Today" title="The rest of today's movement." />
          <div className="grid-3">
            {restOfChanges.map((c, i) => <ChangeCard key={i} change={c} />)}
          </div>
        </section>
      )}

      {/* ---------- ELECTIONS ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Elections" title={election.name} />
        <div className="grid-2">
          <Gauge
            labelA={election.optionA.label} pctA={election.optionA.probability}
            labelB={election.optionB.label} pctB={election.optionB.probability}
            history={election.history}
          />
          <div>
            <div className="status-banner needs" style={{ marginBottom: 16 }}>
              A maintained estimate, not an automated forecast — the illustrative distinction matters.
              See <a href="/predictions" style={{ color: "inherit", textDecoration: "underline" }}>methodology</a>.
            </div>
            {(byType.election_prediction || []).length ? (
              byType.election_prediction.slice(0, 2).map((c, i) => (
                <EditorialRow key={i} eyebrow={c.entity} title={`${c.previousValue}% → ${c.newValue}%`} meta={c.reason} delta={c.delta} href={c.href} />
              ))
            ) : (
              <EmptyState text="No probability movement recorded yet." />
            )}
          </div>
        </div>
      </section>

      {/* ---------- ACCOUNTABILITY WATCH ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Accountability Watch" title="What changed in the political record." sub="Never a score without evidence coverage." />
        <div>
          {politicians.map((p) => {
            const latest = [...(byType.promise_status || []), ...(byType.new_evidence || [])]
              .find((c) => c.entity === p.name);
            return (
              <EditorialRow
                key={p.slug}
                eyebrow={p.name}
                title={
                  p.accountability.accountabilityScore === null
                    ? "Not enough evidence yet"
                    : `${p.accountability.accountabilityScore}/100 accountability · ${p.accountability.evidenceCoverage}% evidence coverage`
                }
                meta={latest ? latest.reason || latest.title : "No recent change to this record."}
                href={`/politicians/${p.slug}`}
              />
            );
          })}
        </div>
      </section>

      {/* ---------- FACT CHECK ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Fact Check" title="Recently checked." sub="The AI explains evidence — it doesn't invent it." />
        {byType.fact_check?.[0] ? (
          (() => {
            const fc = byType.fact_check[0];
            const verdictColor = { true: "var(--mint)", false: "var(--red)", misleading: "var(--amber)", needs_context: "var(--slate)" }[fc.newValue] || "var(--slate)";
            return (
              <div className="grid-2">
                <div>
                  <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 14, fontStyle: "italic", color: "var(--paper-dim)" }}>
                    &ldquo;{fc.title}&rdquo;
                  </div>
                  <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 34, color: verdictColor, textTransform: "uppercase", marginBottom: 8 }}>
                    {(fc.newValue || "").replace(/_/g, " ")}
                  </div>
                  {fc.confidence != null && <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--paper-dim)" }}>Confidence: {fc.confidence}%</div>}
                </div>
                <div className="card">
                  <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--paper-faint)", marginBottom: 6, fontFamily: "var(--sans)" }}>Why</div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 16 }}>{fc.reason}</p>
                  <div style={{ fontSize: 12, color: "var(--paper-dim)", marginBottom: 12 }}>
                    Published fact-checks: {fc.sourceCount ?? 0}
                  </div>
                  <a href="/fact-check" className="btn btn-ghost" style={{ fontSize: 12.5 }}>Read the evidence →</a>
                </div>
              </div>
            );
          })()
        ) : (
          <EmptyState text="No fact-checks logged yet — try /fact-check to add the first one." />
        )}
      </section>

      {/* ---------- CONSTITUENCY WATCH ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Constituency Watch" title="Where the ground is shifting." />
        {(byType.constituency || []).length ? (
          <div>
            {byType.constituency.slice(0, 5).map((c, i) => (
              <EditorialRow key={i} eyebrow={c.entity} title={`${c.previousValue}% → ${c.newValue}%`} meta={c.reason} delta={c.delta} href={c.href} />
            ))}
          </div>
        ) : (
          <EmptyState text="No constituency movement recorded yet — this needs at least two real snapshots over time per seat, and a fresh deployment starts with one. Shown honestly empty rather than invented. No geographic map is wired up yet either; see /heatmap for the current grid-based placeholder." />
        )}
      </section>

      {/* ---------- POLITICAL ATTENTION (secondary, minimal) ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Political Attention" title="Who's being talked about." sub="Attention is not approval. A scandal moves this the same direction as a good speech." />
        <div className="grid-2">
          <div>
            {stocks.slice(0, 4).map((s) => {
              const up = s.change_pct >= 0;
              return (
                <EditorialRow key={s.name} title={s.name} meta={null} delta={s.change_pct} href="/stock-market" />
              );
            })}
          </div>
          {topStock && (
            <StoryBehindNumber
              title={`${topStock.name} — attention volume`}
              value={topStock.price}
              delta={topStock.change_pct}
              factors={attentionFactors}
              href="/about"
            />
          )}
        </div>
      </section>

      {/* ---------- ASK NETABOARD ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Ask NetaBoard" title='"Did this actually happen?"' />
        <HomeSearchBox />
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 16, fontSize: 12.5, color: "var(--paper-faint)" }}>
          {["Did this promise get fulfilled?", "What changed in Bihar?", "Why did this election estimate move?", "Is this viral claim true?"].map((ex) => (
            <a key={ex} href={`/ask?q=${encodeURIComponent(ex)}`} style={{ textDecoration: "underline" }}>{ex}</a>
          ))}
        </div>
      </section>

      <MinimalFooter />
    </>
  );
}
