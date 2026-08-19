import Link from "next/link";

const links = [
  ["/predictions", "Predictions"],
  ["/market", "Market"],
  ["/coalition", "Coalition"],
  ["/politicians", "Politicians"],
  ["/constituencies", "Constituencies"],
  ["/stock-market", "Stock Market"],
  ["/brief", "Daily Brief"],
  ["/ask", "Ask AI"],
  ["/more", "More"],
];

export default function Nav() {
  return (
    <header className="site">
      <Link href="/" className="logo"><span className="dot" />NETABOARD</Link>
      <nav className="site">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
    </header>
  );
}
