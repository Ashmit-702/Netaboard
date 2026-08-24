"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function AskChat() {
  const [q, setQ] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const firedRef = useRef(false);

  async function ask(overrideText) {
    const question = (overrideText ?? q).trim();
    if (!question || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "ai", text: data.answer || data.error || "No response." }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Something went wrong. Try again." }]);
    }
    setLoading(false);
  }

  // Supports arriving from the homepage's "Did this actually happen?" box
  // via /ask?q=... — auto-fires once on load, never re-fires on re-renders.
  useEffect(() => {
    const prefill = searchParams.get("q");
    if (prefill && !firedRef.current) {
      firedRef.current = true;
      ask(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="card">
      <div style={{ minHeight: 160, marginBottom: 16 }}>
        {messages.length === 0 && (
          <div style={{ color: "var(--paper-faint)", fontSize: 13.5 }}>
            Try: "Why is the Bihar election important?" or "Explain the coalition math like I'm 15."
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, fontFamily: "var(--mono)", color: m.role === "user" ? "var(--amber)" : "var(--mint)", textTransform: "uppercase", marginBottom: 4 }}>
              {m.role === "user" ? "You" : "NetaBoard AI"}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12.5, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>Thinking…</div>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input
          type="text" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Ask about any political topic…"
        />
        <button className="btn btn-primary" onClick={ask} disabled={loading}>Ask</button>
      </div>
    </div>
  );
}
