import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { getStocks } from "@/lib/data";

export const metadata = { title: "Political Attention Index — NetaBoard" };

export default async function StockMarketPage() {
  const stocks = await getStocks();

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Political Attention Index</div>
        <h2 className="title">How much is this person being talked about?</h2>
        <p className="sub">
          Renamed deliberately from "stock market" — this tracks attention volume (Wikipedia
          pageviews, news mentions, social mentions), not approval. A scandal spikes mentions the same
          way a good speech does. Rising here means "more people are talking about them," not "more
          people like them" — read the direction, not the color, as good news. See{" "}
          <code>/api/stock-refresh</code> for the data pipeline.
        </p>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {stocks.map((s, i) => {
            const up = s.change_pct >= 0;
            return (
              <div key={s.name} className="row-line" style={{ padding: "18px 24px", borderTop: i === 0 ? "none" : "1px solid var(--line)" }}>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 14.5 }}>{s.name}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 15, marginRight: 16 }}>{Number(s.price).toFixed(1)} attention pts</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: up ? "var(--mint)" : "var(--red)" }}>
                  {up ? "▲" : "▼"} {Math.abs(s.change_pct)}%
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <Footer />
    </>
  );
}
