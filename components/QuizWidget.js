"use client";
import { useState } from "react";

export default function QuizWidget({ questions }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);
  const q = questions[i];

  function pick(idx) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correct_index) setScore((s) => s + 1);
  }

  function next() {
    if (i + 1 >= questions.length) { setDone(true); return; }
    setI((v) => v + 1);
    setPicked(null);
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 44, fontWeight: 700, color: "var(--amber)" }}>{pct}</div>
        <div style={{ color: "var(--paper-dim)", marginTop: 6 }}>Your Political IQ score — {score} of {questions.length} correct</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--paper-faint)", marginBottom: 10 }}>
        Question {i + 1} of {questions.length}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>{q.question}</div>
      <div style={{ display: "grid", gap: 10 }}>
        {q.options.map((opt, idx) => {
          let bg = "var(--panel-2)", border = "var(--line)";
          if (picked !== null) {
            if (idx === q.correct_index) { bg = "rgba(0,217,163,0.12)"; border = "var(--mint)"; }
            else if (idx === picked) { bg = "rgba(255,71,87,0.12)"; border = "var(--red)"; }
          }
          return (
            <button key={idx} onClick={() => pick(idx)} style={{ textAlign: "left", padding: "12px 14px", borderRadius: 4, background: bg, border: `1px solid ${border}`, color: "var(--paper)", cursor: picked === null ? "pointer" : "default" }}>
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={next}>
          {i + 1 >= questions.length ? "See score" : "Next question"}
        </button>
      )}
    </div>
  );
}
