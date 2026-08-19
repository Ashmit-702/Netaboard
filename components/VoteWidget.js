"use client";
import { useEffect, useState } from "react";

// Simple, non-identifying per-browser fingerprint so one visitor = one vote.
// Not tied to any personal data — just prevents trivial double-voting.
function getFingerprint() {
  const key = "netaboard_fp";
  let fp = null;
  try { fp = document.cookie.split("; ").find((r) => r.startsWith(key + "="))?.split("=")[1]; } catch {}
  if (!fp) {
    fp = crypto.randomUUID();
    try { document.cookie = `${key}=${fp}; max-age=31536000; path=/`; } catch {}
  }
  return fp;
}

export default function VoteWidget({ electionId, options, initialCounts, colors }) {
  const [counts, setCounts] = useState(initialCounts);
  const [voted, setVoted] = useState(null);
  const [msg, setMsg] = useState("Lock your prediction — one per election, results verified after counting.");

  useEffect(() => {
    if (!electionId) return;
    fetch(`/api/vote?election_id=${electionId}`).then((r) => r.json()).then((d) => {
      if (d.counts && Object.keys(d.counts).length) setCounts((c) => ({ ...c, ...d.counts }));
    }).catch(() => {});
  }, [electionId]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  async function vote(label) {
    if (voted) { setMsg("You've already locked a prediction for this election."); return; }
    if (!electionId) { setMsg("Demo mode — connect Supabase to record real votes."); return; }
    setCounts((c) => ({ ...c, [label]: (c[label] || 0) + 1 }));
    setVoted(label);
    setMsg(`Locked in: ${label}. Come back after results to see your accuracy score.`);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ election_id: electionId, option_label: label, fingerprint: getFingerprint() }),
      });
      if (res.status === 409) setMsg("You've already locked a prediction for this election.");
    } catch {}
  }

  return (
    <div className="card">
      {options.map((label) => {
        const pct = Math.round(((counts[label] || 0) / total) * 100);
        return (
          <div key={label} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 7 }}>
              <span style={{ fontWeight: 700 }}>{label}</span>
              <span style={{ fontFamily: "var(--mono)", color: "var(--paper-dim)" }}>{pct}% · {(counts[label] || 0).toLocaleString("en-IN")} votes</span>
            </div>
            <div className="bar-track"><div className="bar-fill" style={{ width: pct + "%", background: colors[label] || "var(--slate)" }} /></div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
        {options.map((label) => (
          <button key={label} className="btn btn-ghost" style={{ flex: 1, minWidth: 110 }} onClick={() => vote(label)} disabled={!!voted}>
            Predict {label}
          </button>
        ))}
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--paper-faint)", marginTop: 16 }}>{msg}</div>
    </div>
  );
}
