// Site-wide footer. Deliberately carries NO technology stack, API names, or
// build information — that belongs on /about (Methodology), not on every
// page of a political publication. Source data itself is untouched in the
// database and still shown inside evidence/fact-check detail views.
export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "40px 5vw", marginTop: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, maxWidth: 1180, margin: "0 auto" }}>
        <a href="/" className="logo" style={{ fontSize: 15 }}>NETABOARD</a>
        <div style={{ display: "flex", gap: 20, fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--paper-dim)", flexWrap: "wrap" }}>
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
