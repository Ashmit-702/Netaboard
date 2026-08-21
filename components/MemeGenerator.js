"use client";
import { useEffect, useRef, useState } from "react";

const bgs = ["#211c14", "#a8631f", "#0e6b62", "#a3271e", "#f2ede0"];

export default function MemeGenerator() {
  const canvasRef = useRef(null);
  const [top, setTop] = useState("WHEN THE EXIT POLLS");
  const [bottom, setBottom] = useState("DON'T MATCH THE RESULT");
  const [bg, setBg] = useState(bgs[0]);

  useEffect(() => { draw(); }, [top, bottom, bg]);

  function draw() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "rgba(107,98,82,0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i < c.width; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, c.height); ctx.stroke(); }

    ctx.textAlign = "center";
    ctx.fillStyle = "#f5f3ec";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 6;
    ctx.font = "800 40px Archivo Black, sans-serif";
    wrapText(ctx, top.toUpperCase(), c.width / 2, 60, c.width - 60, 46, true);
    wrapText(ctx, bottom.toUpperCase(), c.width / 2, c.height - 90, c.width - 60, 46, true);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, strokeFirst) {
    const words = text.split(" ");
    let line = "", lines = [];
    for (const w of words) {
      const test = line + w + " ";
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w + " "; }
      else line = test;
    }
    lines.push(line);
    lines.forEach((l, i) => {
      const ly = y + i * lineHeight;
      ctx.strokeText(l.trim(), x, ly);
      ctx.fillText(l.trim(), x, ly);
    });
  }

  function download() {
    const link = document.createElement("a");
    link.download = "netaboard-meme.png";
    link.href = canvasRef.current.toDataURL();
    link.click();
  }

  return (
    <div className="grid-2">
      <div className="card">
        <label style={{ fontSize: 12, color: "var(--paper-dim)" }}>Top text</label>
        <input type="text" value={top} onChange={(e) => setTop(e.target.value)} style={{ marginBottom: 14, marginTop: 6 }} />
        <label style={{ fontSize: 12, color: "var(--paper-dim)" }}>Bottom text</label>
        <input type="text" value={bottom} onChange={(e) => setBottom(e.target.value)} style={{ marginTop: 6 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {bgs.map((c) => (
            <button key={c} onClick={() => setBg(c)} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: bg === c ? "2px solid var(--paper)" : "1px solid var(--line)", cursor: "pointer" }} />
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={download}>Download PNG</button>
      </div>
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <canvas ref={canvasRef} width={480} height={480} style={{ maxWidth: "100%", borderRadius: 4 }} />
      </div>
    </div>
  );
}
