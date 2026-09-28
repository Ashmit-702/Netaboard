import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StoryBehindNumber from "@/components/StoryBehindNumber";
import { getAttention } from "@/lib/data";
import { attentionFactors } from "@/lib/attention";
import TrendingNetas from "@/components/TrendingNetas";
import RelTime from "@/components/RelTime";

export const metadata = { title: "Political Attention — NetaBoard" };

export const dynamic = "force-dynamic";

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
        {attention.length === 0 && <div className="empty">No attention readings recorded yet.</div>}
        <div className="grid-2">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <TrendingNetas rows={attention} max={attention.length || 5} showNote={false} />
          </div>
          {attention[0] && (
            <StoryBehindNumber
              title={`${attention[0].name} — where this comes from`}
              value={attention[0].score}
              delta={attention[0].change_pct}
              factors={attentionFactors(attention[0].reason)}
              href="/about"
            />
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
