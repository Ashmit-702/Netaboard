"use client";
import { useEffect, useRef, useState } from "react";

export default function Gauge({ labelA = "NDA", pctA = 72, labelB = "Mahagathbandhan", pctB = 28, history = [] }) {
  const [display, setDisplay] = useState(0);
  const arcRef = useRef(null);
  const arcLen = 345;

  useEffect(() => {
    let raf;
    let current = 0;
    const tick = () => {
      current += Math.max(0.6, pctA / 60);
      if (current > pctA) current = pctA;
      setDisplay(Math.round(current));
      if (arcRef.current) {
        const offset = arcLen - (arcLen * current) / 100;
        arcRef.current.setAttribute("stroke-dashoffset", offset);
      }
      if (current < pctA) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pctA]);

  return (
    <div className="card" style={{ maxWidth: 380 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Win Probability</div>
        <span className="tag live">Live</span>
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--paper-faint)", marginBottom: 10 }}>
        Model updated moments ago
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width="260" height="150" viewBox="0 0 260 150">
          <path d="M20,140 A110,110 0 0,1 240,140" fill="none" stroke="#171d33" strokeWidth="18" strokeLinecap="round" />
          <path
            ref={arcRef}
            d="M20,140 A110,110 0 0,1 240,140"
            fill="none"
            stroke="#ffb800"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={arcLen}
          />
          <text x="130" y="112" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="34" fontWeight="700" fill="#f5f3ec">
            {display}%
          </text>
          <text x="130" y="132" textAnchor="middle" fontFamily="Inter" fontSize="11" fill="#7b84a3">
            {labelA.toUpperCase()} WINNING CHANCE
          </text>
        </svg>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        <div><div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 22, color: "var(--amber)" }}>{pctA}%</div><div style={{ fontSize: 11.5, color: "var(--paper-dim)", textTransform: "uppercase" }}>{labelA}</div></div>
        <div><div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 22, color: "var(--mint)" }}>{pctB}%</div><div style={{ fontSize: 11.5, color: "var(--paper-dim)", textTransform: "uppercase" }}>{labelB}</div></div>
      </div>
      {history?.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {history.map((h, i) => (
            <div key={i} style={{ flex: 1, background: "var(--panel-2)", borderRadius: 4, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>{h.d}</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--amber)", marginTop: 2 }}>{h.v}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
