import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import MinimalFooter from "@/components/MinimalFooter";
import ChangeCard from "@/components/ChangeCard";
import EditorialRow from "@/components/EditorialRow";
import HeroToday from "@/components/HeroToday";
import HomeSearchBox from "@/components/HomeSearchBox";
import StoryBehindNumber from "@/components/StoryBehindNumber";
import SinceYesterday from "@/components/SinceYesterday";
import TheNumber, { pickTheNumber } from "@/components/TheNumber";
import ElectionWatchCard from "@/components/ElectionWatchCard";
import { getPoliticians, getStocks } from "@/lib/data";
import { getAllChanges, parseAttentionFactors } from "@/lib/changes";
import { getElectionWatch } from "@/lib/electionWatch";
import { freshnessLabel } from "@/lib/freshness";

// Time-sensitive homepage — see note in lib/electionWatch.js and every
// section's freshness label. Revalidate instead of baking data in at build
// time, or "What Changed"/"Since Yesterday" would only ever update on redeploy.
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
  const [politicians, stocks, { changes, byType }, { election }] = await Promise.all([
    getPoliticians(), getStocks(), getAllChanges(), getElectionWatch(),
  ]);

  const heroChange = changes[0] || null;
  const restOfChanges = changes.slice(1, 5);
  const theNumberChange = pickTheNumber(changes);
  const topStock = stocks.find((s) => s.reason) || stocks[0];
  const attentionFactors = topStock ? parseAttentionFactors(topStock.reason) : [];

  return (
    <>
      <Ticker />
      <Nav />

      {/* ---------- HERO: TODAY IN POLITICS ---------- */}
      <HeroToday change={heroChange} />

      {/* ---------- WHAT CHANGED ---------- */}
      {restOfChanges.length > 0 && (
        <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
          <SectionHead eyebrow="What Changed" title="The strongest deltas right now." />
          <div className="grid-3">
            {restOfChanges.map((c, i) => <ChangeCard key={i} change={c} />)}
          </div>
        </section>
      )}

      {/* ---------- SINCE YESTERDAY + THE NUMBER (paired, full-width rhythm break) ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="grid-2">
          <div>
            <div className="eyebrow">Since Yesterday</div>
            <SinceYesterday changes={changes} byType={byType} />
          </div>
          <div>
            <div className="eyebrow">The Number</div>
            <TheNumber change={theNumberChange} />
          </div>
        </div>
      </section>

      {/* ---------- ELECTION WATCH ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Election Watch" title="Which election matters right now." sub="Selected from live status and real data — never fixed to one state." />
        <ElectionWatchCard election={election} />
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

      {/* ---------- THE EVIDENCE ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="The Evidence" title="One claim, checked." sub="The AI explains evidence — it doesn't invent it, and it isn't the sole authority." />
        {byType.fact_check?.[0] ? (
          (() => {
            const fc = byType.fact_check[0];
            const verdictColor = { true: "var(--mint)", false: "var(--red)", misleading: "var(--amber)", needs_context: "var(--slate)" }[fc.newValue] || "var(--slate)";
            const fresh = freshnessLabel(fc.timestamp);
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
                  <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: fresh.stale ? "var(--red)" : "var(--paper-faint)", marginTop: 8 }}>{fresh.label}</div>
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
          <EmptyState text="Not enough evidence yet. NetaBoard won't manufacture a verdict — try /fact-check to add the first real one." />
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
          <EmptyState text="No constituency movement recorded yet — this needs at least two real snapshots over time per seat. Shown honestly empty rather than invented." />
        )}
      </section>

      {/* ---------- POLITICAL ATTENTION (secondary) ---------- */}
      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Political Attention" title="Who's being talked about." sub="Attention is not approval. A scandal moves this the same direction as a good speech." />
        <div className="grid-2">
          <div>
            {stocks.slice(0, 4).map((s) => (
              <EditorialRow key={s.name} title={s.name} meta={null} delta={s.change_pct} href="/stock-market" />
            ))}
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
          {["Did this promise get fulfilled?", "What changed recently?", "Why did this election estimate move?", "Is this viral claim true?"].map((ex) => (
            <a key={ex} href={`/ask?q=${encodeURIComponent(ex)}`} style={{ textDecoration: "underline" }}>{ex}</a>
          ))}
        </div>
      </section>

      <MinimalFooter />
    </>
  );
}
