"use client";
import Link from "next/link";
import { useState } from "react";

const links = [
  ["/", "Today"],
  ["/predictions", "Elections"],
  ["/politicians", "Politicians"],
  ["/fact-check", "Fact Check"],
  ["/constituencies", "Constituencies"],
  ["/explore", "Explore"],
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site">
      <Link href="/" className="logo"><span className="dot" />NETABOARD</Link>

      <nav className="site nav-desktop">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>{label}</Link>
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
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          <Link href="/ask" onClick={() => setOpen(false)} style={{ color: "var(--amber)" }}>Ask NetaBoard</Link>
        </nav>
      )}
    </header>
  );
}
