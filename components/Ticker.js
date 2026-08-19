// Server component — pure markup + CSS animation, no client JS needed.
// Swap `data` for a live feed from /api/stock-refresh once Supabase is wired up.
const fallback = [
  ["MODI", "+3"], ["RAHUL G.", "+1"], ["NITISH K.", "-1"], ["MAMATA B.", "-2"],
  ["STALIN", "+4"], ["TEJASHWI Y.", "+2"], ["SHAH", "+2"], ["KEJRIWAL", "-3"],
  ["OWAISI", "0"], ["YOGI A.", "+1"],
];

export default function Ticker({ data = fallback }) {
  const tripled = [...data, ...data, ...data];
  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {tripled.map(([name, chg], i) => {
          const num = parseFloat(chg);
          const cls = num > 0 ? "up" : num < 0 ? "down" : "";
          const arrow = num > 0 ? "▲" : num < 0 ? "▼" : "—";
          return (
            <span key={i}>
              {name} <span className={cls}>{arrow} {chg}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
