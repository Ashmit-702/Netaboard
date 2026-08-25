// Homepage-only footer. Deliberately doesn't repeat the tech stack or build
// info the way components/Footer.js does on every other page — the
// front page sells the product, not the implementation. That content lives
// at /about for anyone who wants it.
export default function MinimalFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "40px 5vw", marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, maxWidth: 1180, margin: "0 auto" }}>
        <div className="logo" style={{ fontSize: 15 }}>NETABOARD</div>
        <div style={{ display: "flex", gap: 20, fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--paper-dim)" }}>
          <a href="/about">About &amp; Methodology</a>
          <a href="/explore">Explore</a>
          <a href="/ask">Ask NetaBoard</a>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 28, fontSize: 10.5, color: "var(--paper-faint)", fontFamily: "var(--sans)", letterSpacing: ".04em" }}>
        NETABOARD — NOT AFFILIATED WITH ANY PARTY OR THE ELECTION COMMISSION OF INDIA
      </div>
    </footer>
  );
}
