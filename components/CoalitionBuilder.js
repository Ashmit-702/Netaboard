"use client";
import { useMemo, useState } from "react";

export default function CoalitionBuilder({ parties, total = 243, majority = 122 }) {
  const [selected, setSelected] = useState(new Set());

  const seatSum = useMemo(
    () => [...selected].reduce((s, i) => s + (parties[i]?.seats_current || 0), 0),
    [selected, parties]
  );

  function toggle(i) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const pct = Math.min((seatSum / total) * 100, 100);
  const markPct = (majority / total) * 100;
  const formed = seatSum >= majority;

  return (
    <div className="card">
      <div className="grid-4" style={{ marginBottom: 26 }}>
        {parties.map((p, i) => (
          <button key={p.abbreviation + i} className={"chip" + (selected.has(i) ? " active" : "")} onClick={() => toggle(i)}>
            <div className="cname">{p.abbreviation}</div>
            <div className="cseats">{p.seats_current} seats</div>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div><span style={{ fontFamily: "var(--mono)", fontSize: 34, fontWeight: 700 }}>{seatSum}</span> <span style={{ fontSize: 12, color: "var(--paper-faint)", textTransform: "uppercase" }}>seats selected</span></div>
        <div style={{ fontSize: 12, color: "var(--paper-faint)", textTransform: "uppercase" }}>{total} total · {majority} to govern</div>
      </div>

      <div style={{ height: 16, background: "var(--panel-2)", borderRadius: 20, position: "relative" }}>
        <div style={{ height: "100%", borderRadius: 20, width: pct + "%", background: "linear-gradient(90deg,var(--slate),var(--mint))", transition: "width .4s ease" }} />
        <div style={{ position: "absolute", top: -6, bottom: -6, width: 2, background: "var(--amber)", left: markPct + "%" }} />
        <div style={{ position: "absolute", top: -24, left: markPct + "%", transform: "translateX(-50%)", fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--amber)", whiteSpace: "nowrap" }}>{majority}</div>
      </div>

      <div className={"status-banner " + (seatSum === 0 ? "needs" : formed ? "formed" : "needs")} style={{ marginTop: 20 }}>
        {seatSum === 0
          ? "Select parties to build toward a majority."
          : formed
          ? `Government formed — ${seatSum} of ${total} seats, ${seatSum - majority} above majority.`
          : `${majority - seatSum} seats short of a majority.`}
      </div>
    </div>
  );
}
