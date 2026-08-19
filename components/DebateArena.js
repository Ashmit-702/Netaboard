"use client";
import { useState } from "react";

export default function DebateArena({ debateId, initialArgs }) {
  const [args, setArgs] = useState(initialArgs);
  const [text, setText] = useState("");
  const [side, setSide] = useState("for");

  async function submit() {
    if (!text.trim()) return;
    if (!debateId) { alert("Connect Supabase to post arguments."); return; }
    const optimistic = { id: `local-${Date.now()}`, side, content: text, votes: 0 };
    setArgs((a) => [...a, optimistic]);
    setText("");
    await fetch("/api/debate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debate_id: debateId, side, content: optimistic.content }),
    }).catch(() => {});
  }

  async function vote(id) {
    setArgs((a) => a.map((x) => (x.id === id ? { ...x, votes: x.votes + 1 } : x)));
    await fetch("/api/debate/vote", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  const forArgs = args.filter((a) => a.side === "for").sort((a, b) => b.votes - a.votes);
  const againstArgs = args.filter((a) => a.side === "against").sort((a, b) => b.votes - a.votes);

  const Column = ({ title, list, color }) => (
    <div className="card">
      <h3 style={{ fontSize: 13, textTransform: "uppercase", color, marginBottom: 14 }}>{title}</h3>
      {list.map((a) => (
        <div key={a.id} className="row-line" style={{ alignItems: "flex-start" }}>
          <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => vote(a.id)}>▲ {a.votes}</button>
          <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>{a.content}</span>
        </div>
      ))}
      {!list.length && <div style={{ color: "var(--paper-faint)", fontSize: 13 }}>No arguments yet — be first.</div>}
    </div>
  );

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <Column title="For" list={forArgs} color="var(--mint)" />
        <Column title="Against" list={againstArgs} color="var(--red)" />
      </div>
      <div className="card">
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <button className={"btn " + (side === "for" ? "btn-primary" : "btn-ghost")} onClick={() => setSide("for")}>For</button>
          <button className={"btn " + (side === "against" ? "btn-primary" : "btn-ghost")} onClick={() => setSide("against")}>Against</button>
        </div>
        <textarea rows={3} placeholder="Make your argument…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={submit}>Post argument</button>
      </div>
    </div>
  );
}
