import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StoryBehindNumber from "@/components/StoryBehindNumber";
import AttentionList from "@/components/AttentionList";
import TrendingNetas from "@/components/TrendingNetas";
import { getAttention } from "@/lib/data";
import { attentionFactors, attentionHeadline, hasSufficientHistory } from "@/lib/attention";

export const metadata = { title: "Political Attention — NetaBoard" };
export const dynamic = "force-dynamic";

export default async function AttentionPage() {
  const attention = await getAttention();
  const lead = attention[0];

  return (
    <>
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Political Attention</div>
        <h2 className="title">Who is genuinely, recently getting political attention?</h2>
        <p className="sub">
          Attention ≠ approval, and attention ≠ raw mention count. A scandal moves this the same way a good speech does — read it
          as "more relevant political coverage right now," never "more people like them." Wikipedia and search traffic are tracked
          as a separate discovery signal and never counted toward whether someone is trending — a famous person's large everyday
          readership does not by itself mean anything changed today.
        </p>

        <div className="eyebrow" style={{ marginTop: 8 }}>Trending Netas</div>
        <TrendingNetas rows={attention} />

        {lead && (
          <div style={{ marginTop: 34 }}>
            <StoryBehindNumber
              title={`${lead.name} — where this comes from`}
              headline={attentionHeadline(lead)}
              insufficientHistory={!hasSufficientHistory(lead)}
              factors={attentionFactors(lead.reason)}
              href="/about"
            />
          </div>
        )}

        <div className="sec-head" style={{ marginTop: 40 }}>
          <h2>All readings</h2>
        </div>
        <p className="sec-sub">Every politician with a recent attention reading, whether or not it clears the trending threshold.</p>
        <AttentionList rows={attention} />
      </section>
      <Footer />
    </>
  );
}
