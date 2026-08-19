"use client";
import { useState } from "react";

export default function ManifestoCompare() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function compare() {
    if (!a.trim() || !b.trim() || loading) return;
    setLoading(true);
    setResult("");
    const question = `Compare these two manifestos across Economy, Jobs, Healthcare, Education, and Infrastructure. Use short bullet points, neutral tone.\n\nManifesto A:\n${a}\n\nManifesto B:\n${b}`;
    try {
      const res = await fetch("/api/ask", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setResult(data.answer || data.error || "No response.");
    } catch { setResult("Something went wrong."); }
    setLoading(false);
  }

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card"><h3 style={{ fontSize: 13, marginBottom: 10 }}>Manifesto A</h3><textarea rows={8} value={a} onChange={(e) => setA(e.target.value)} placeholder="Paste or summarize manifesto A…" /></div>
        <div className="card"><h3 style={{ fontSize: 13, marginBottom: 10 }}>Manifesto B</h3><textarea rows={8} value={b} onChange={(e) => setB(e.target.value)} placeholder="Paste or summarize manifesto B…" /></div>
      </div>
      <button className="btn btn-primary" onClick={compare} disabled={loading}>{loading ? "Comparing…" : "Compare manifestos"}</button>
      {result && <div className="card" style={{ marginTop: 20, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 }}>{result}</div>}
    </div>
  );
}
