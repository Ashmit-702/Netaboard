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
          {result.sources?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--paper-faint)", marginBottom: 8 }}>
                Published fact-checks found
              </div>
              {result.sources.map((s, i) => (
                <div key={i} style={{ fontSize: 12.5, color: "var(--paper-dim)", marginBottom: 6 }}>
                  <strong>{s.publisher}</strong> rated a related claim <em>&ldquo;{s.rating}&rdquo;</em>
                  {s.url && <> — <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--amber)", textDecoration: "underline" }}>source</a></>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
