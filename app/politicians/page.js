import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TrendingNetas from "@/components/TrendingNetas";
import RelTime from "@/components/RelTime";
import { attentionHeadline, hasSufficientHistory } from "@/lib/attention";
import { getPoliticians, getAttention } from "@/lib/data";

export const metadata = { title: "Politicians — NetaBoard" };
export const dynamic = "force-dynamic";

export default async function PoliticiansPage() {
  const [{ ok, degraded, politicians }, attention] = await Promise.all([getPoliticians(), getAttention()]);
  // getAttention() already returns one (latest) row per politician.
  const attentionBySlug = new Map(attention.map((r) => [r.slug, r]));

  return (
    <>
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Trending Netas</div>
        <h1 className="lead-h" style={{ fontSize: "clamp(28px,4.4vw,44px)" }}>Who’s attracting unusual attention.</h1>
        <TrendingNetas rows={attention} />
      </section>

      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="sec-head">
          <h2>All Politicians</h2>
        </div>
        <p className="sec-sub">
          Attention movement, accountability, and evidence coverage — always shown together, never a bare score.
        </p>

        {!ok && <div className="empty" role="status">Politician records couldn’t be loaded right now.</div>}
        {ok && degraded && <div className="empty" role="status">Accountability scores are unavailable right now; the roster below is complete but unscored.</div>}
        {ok && politicians.length === 0 && <div className="empty">No politicians recorded yet.</div>}

        {ok && politicians.length > 0 && (
          <div className="rule-list">
            {politicians.map((p) => {
              const a = p.accountability;
              const att = attentionBySlug.get(p.slug);
              const up = att && att.change_pct > 0;
              return (
                <a
                  key={p.slug} href={`/politicians/${p.slug}`}
                  style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 0", flexWrap: "wrap" }}
                >
                  <div style={{ flex: "2 1 220px", minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 17.5, lineHeight: 1.25 }}>{p.name}</div>
                    <div className="meta" style={{ marginTop: 2 }}>{[p.role, p.party?.abbreviation].filter(Boolean).join(" · ")}</div>
                  </div>

                  <div style={{ flex: "1 1 170px", fontFamily: "var(--mono)", fontSize: 12.5 }}>
                    {att ? (
                      <span style={{ color: !hasSufficientHistory(att) ? "var(--paper-faint)" : up ? "var(--mint)" : "var(--red)", fontWeight: 700 }}>
                        {attentionHeadline(att)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--paper-faint)" }}>No recent reading</span>
                    )}
                    {att && <div className="meta" style={{ marginTop: 2 }}>updated <RelTime iso={att.recorded_at} /></div>}
                  </div>

                  <div style={{ flex: "1 1 150px", fontFamily: "var(--mono)", fontSize: 13 }}>
                    {a.accountabilityScore === null ? (
                      <span style={{ color: "var(--paper-faint)" }}>Not enough evidence</span>
                    ) : (
                      <span><strong style={{ fontSize: 15 }}>{a.accountabilityScore}</strong>/100 accountability</span>
                    )}
                    <div className="meta" style={{ marginTop: 2 }}>{a.evidenceCoverage}% evidence coverage</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
