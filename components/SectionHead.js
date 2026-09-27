export default function SectionHead({ eyebrow, title, sub, href, linkLabel }) {
  return (
    <div style={{ marginBottom: 6 }}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <div className="sec-head">
        <h2>{title}</h2>
        {href && <a href={href} className="sec-link">{linkLabel || "See all"} →</a>}
      </div>
      {sub && <p className="sec-sub">{sub}</p>}
    </div>
  );
}
