import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StoryBehindNumber from "@/components/StoryBehindNumber";
import { getAttention } from "@/lib/data";
import { parseAttentionFactors } from "@/lib/changes";

export const metadata = { title: "Political Attention — NetaBoard" };

export default async function AttentionPage() {
  const attention = await getAttention();
  return (
    <>
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Political Attention</div>
        <h2 className="title">How much is this person being talked about?</h2>
        <p className="sub">
          Attention, not approval. A scandal moves this the same way a good speech does — read it as
          "more people are talking about them," never "more people like them."
        </p>
        <div className="grid-2">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {attention.map((s, i) => {
              const up = s.change_pct >= 0;
              return (
                <div key={s.name} className="row-line" style={{ padding: "18px 24px", borderTop: i === 0 ? "none" : "1px solid var(--line)" }}>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14.5 }}>{s.name}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 15, marginRight: 16 }}>{Number(s.score).toFixed(1)} attention pts</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: up ? "var(--mint)" : "var(--red)" }}>
                    {up ? "▲" : "▼"} {Math.abs(s.change_pct)}%
                  </span>
                </div>
              );
            })}
          </div>
          {attention[0] && (
            <StoryBehindNumber
              title={`${attention[0].name} — where this comes from`}
              value={attention[0].score}
              delta={attention[0].change_pct}
              factors={parseAttentionFactors(attention[0].reason)}
              href="/about"
            />
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
