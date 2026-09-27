"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Primary navigation: five destinations only. Everything secondary lives
// under Explore. "Today" also covers Current Affairs, the Daily Brief and
// Issue Watch (see TodayTabs).
const links = [
  { href: "/", label: "Today", match: (p) => p === "/" || p.startsWith("/current-affairs") || p.startsWith("/brief") || p.startsWith("/issue-watch") },
  { href: "/politicians", label: "Politicians", match: (p) => p.startsWith("/politicians") },
  { href: "/elections", label: "Elections", match: (p) => p.startsWith("/elections") },
  { href: "/evidence", label: "Evidence", match: (p) => p.startsWith("/evidence") },
  { href: "/explore", label: "Explore", match: (p) => p.startsWith("/explore") || ["/attention", "/predictions", "/manifesto", "/history", "/coalition", "/debate", "/quiz", "/memes", "/calendar", "/market"].some((x) => p.startsWith(x)) },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const cur = (l) => (l.match(pathname) ? "page" : undefined);

  return (
    <header className="site">
      <Link href="/" className="logo"><span className="dot" />NETABOARD</Link>

      <nav className="site nav-desktop" aria-label="Primary">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={cur(l)}>{l.label}</Link>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Link href="/ask" className="btn btn-ghost nav-ask" style={{ padding: "9px 16px", fontSize: 12 }}>
          Ask NetaBoard
        </Link>
        <button
          className="nav-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="nav-mobile" aria-label="Mobile navigation">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={cur(l)} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <Link href="/ask" onClick={() => setOpen(false)} style={{ color: "var(--amber)" }}>Ask NetaBoard</Link>
        </nav>
      )}
    </header>
  );
}
