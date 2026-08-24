"use client";
import { useState } from "react";

// Sends the person straight into Ask AI with their question pre-filled and
// auto-submitted — see the ?q= handling in AskChat.js.
export default function HomeSearchBox() {
  const [q, setQ] = useState("");
  function go() {
    if (!q.trim()) return;
    window.location.href = `/ask?q=${encodeURIComponent(q.trim())}`;
  }
  return (
    <div className="card" style={{ display: "flex", gap: 10, padding: 16 }}>
      <input
        type="text" value={q} onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder='"Did this actually happen?"'
        style={{ fontSize: 15 }}
      />
      <button className="btn btn-primary" onClick={go}>Ask NetaBoard</button>
    </div>
  );
}
