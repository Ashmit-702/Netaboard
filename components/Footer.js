export default function Footer() {
  return (
    <footer className="site">
      <div className="foot-grid">
        <div>
          <h4>About this build</h4>
          <p className="disclaimer">
            NetaBoard runs on Next.js + Supabase, deployable free on Vercel. Predictions and
            probabilities shown are illustrative unless a page states its data source — this is
            analysis, not a certified forecast.
          </p>
        </div>
        <div>
          <h4>Free stack</h4>
          <div className="stack-row"><span className="k">Hosting</span><span>Vercel</span></div>
          <div className="stack-row"><span className="k">Database</span><span>Supabase Postgres</span></div>
          <div className="stack-row"><span className="k">Auth</span><span>Supabase Auth</span></div>
          <div className="stack-row"><span className="k">AI</span><span>Gemini free tier</span></div>
        </div>
        <div>
          <h4>Data sources</h4>
          <div className="stack-row"><span className="k">Results</span><span>ECI, MyNeta</span></div>
          <div className="stack-row"><span className="k">News</span><span>GNews free tier</span></div>
          <div className="stack-row"><span className="k">Sentiment</span><span>Reddit API (free)</span></div>
        </div>
      </div>
      <div className="foot-bottom">NETABOARD — NOT AFFILIATED WITH ANY PARTY OR THE ELECTION COMMISSION OF INDIA</div>
    </footer>
  );
}
