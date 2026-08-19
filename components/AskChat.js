"use client";
import { useState } from "react";

export default function AskChat() {
  const [q, setQ] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!q.trim() || loading) return;
    const question = q.trim();
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
