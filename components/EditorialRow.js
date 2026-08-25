// A horizontal, rule-separated row — the editorial alternative to another
// floating card, used for secondary lists (Accountability Watch,
// Constituency Watch) so the homepage doesn't become "every section is a
// grid of boxes."
export default function EditorialRow({ eyebrow, title, meta, delta, href }) {
  const up = typeof delta === "number" && delta > 0;
  const down = typeof delta === "number" && delta < 0;
  return (
    <a href={href} className="row-line" style={{ padding: "16px 0", alignItems: "center", display: "flex" }}>
      <div style={{ flex: 1 }}>
        {eyebrow && <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", fontFamily: "var(--sans)", marginBottom: 3 }}>{eyebrow}</div>}
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        {meta && <div style={{ fontSize: 12.5, color: "var(--paper-dim)", marginTop: 3 }}>{meta}</div>}
      </div>
      {typeof delta === "number" && (
        <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: up ? "var(--mint)" : down ? "var(--red)" : "var(--paper-faint)", flexShrink: 0 }}>
          {up ? "▲" : down ? "▼" : "—"} {Math.abs(delta)}pp
        </span>
      )}
    </a>
  );
}
