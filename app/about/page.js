import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";

export const metadata = { title: "About & Methodology — NetaBoard" };

export default function AboutPage() {
  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap" style={{ maxWidth: 760 }}>
        <div className="eyebrow">About &amp; Methodology</div>
        <h2 className="title">What NetaBoard actually is.</h2>
        <p className="sub">
          NetaBoard tracks political claims and promises, attaches evidence to each one, and computes
          scores from that evidence rather than assigning them by hand. This page explains exactly how,
          and where the honest limits are.
        </p>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>The Evidence Ledger</h3>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--paper-dim)" }}>
            Every tracked promise is a <em>claim</em>. Each claim can have multiple pieces of{" "}
            <em>evidence</em> attached — sourced, dated, and marked as supporting, contradicting, or
            neutral. A <em>verdict</em> is then computed from that evidence: confidence is not typed in
            by hand or invented by an AI model — it's a fixed formula (40 base + 8 per evidence item +
            25 × agreement ratio, clamped 15–95) applied to whatever evidence actually exists. Zero
            evidence always means low confidence, regardless of what anyone claims.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Accountability Score</h3>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--paper-dim)" }}>
            Score = (fulfilled×1 + partially fulfilled×0.5) ÷ scored claims × 100. Disputed or
            unverified claims are tracked and shown but excluded from the score until they have a real
            verdict. <strong>Evidence coverage</strong> — the share of a politician's tracked promises
            that actually have a verdict — is shown next to every score, always. A high score built on
            low coverage is a different fact from a high score built on a complete record, and this app
            never lets one look like the other.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Election estimates</h3>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--paper-dim)" }}>
            Being direct: the probabilities shown on Elections are maintained estimates, not an
            automated forecasting model. There is no live turnout, seat-level swing, or sentiment
            pipeline feeding them yet — see <a href="/predictions" style={{ color: "var(--amber)", textDecoration: "underline" }}>/predictions</a> for exactly what's built versus what a real model would still need.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Political Attention</h3>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--paper-dim)" }}>
            Deliberately not called a "stock market." It tracks mention volume — Wikipedia pageviews,
            GDELT news articles, Hacker News, Mastodon — not approval. A scandal moves this the same
            direction as a good speech. Read it as "how much attention," never "how well received."
          </p>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Fact Check</h3>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--paper-dim)" }}>
            Every claim is first checked against Google's Fact Check Tools API — the same ClaimReview
            database used by PolitiFact, Snopes, BOOM Live, and others. If a published verdict exists,
            the AI is instructed to defer to it rather than override it. The AI's role is to explain
            evidence, not to invent it — every verdict shows whether it's grounded in a published
            source or is AI judgment alone.
          </p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Built with</h3>
          <div className="stack-row"><span className="k">Hosting</span><span>Vercel</span></div>
          <div className="stack-row"><span className="k">Database</span><span>Supabase Postgres</span></div>
          <div className="stack-row"><span className="k">AI</span><span>Groq / Gemini / OpenRouter</span></div>
          <div className="stack-row"><span className="k">News</span><span>GNews, NewsData, Currents, The Guardian, GDELT</span></div>
          <div className="stack-row"><span className="k">Attention signal</span><span>Wikipedia, GDELT, Hacker News, Mastodon</span></div>
          <div className="stack-row"><span className="k">Fact-checking</span><span>Google Fact Check Tools API</span></div>
          <p className="disclaimer" style={{ marginTop: 14 }}>
            NetaBoard is not affiliated with any party or the Election Commission of India.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
