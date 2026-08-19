"use client";
import { useState } from "react";

const verdictColor = { True: "var(--mint)", False: "var(--red)", Misleading: "var(--amber)", "Needs Context": "var(--slate)" };

export default function FactCheckForm() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setResult(await res.json());
    } catch {
      setResult({ verdict: "Needs Context", explanation: "Something went wrong. Try again." });
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <textarea rows={5} placeholder="Paste a claim or speech excerpt…" value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={check} disabled={loading}>
        {loading ? "Checking…" : "Check this claim"}
      </button>
      {result && (
        <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          <span className="tag" style={{ borderColor: verdictColor[result.verdict] || "var(--line)", color: verdictColor[result.verdict] || "var(--paper)" }}>
            {result.verdict || "Unknown"}
          </span>
          <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 12 }}>{result.explanation}</p>
        </div>
      )}
    </div>
  );
}
