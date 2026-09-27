import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getMentionSignal } from "@/lib/social";

// Scheduled by Vercel Cron (see vercel.json): GET /api/attention-refresh
// (the old /api/stock-refresh path re-exports this handler.)
//
// Records one Political Attention reading per politician from the real
// mention/readership signals in lib/social.js. The reading is a smoothed
// index; `change_pct` is the movement versus that politician's PREVIOUS
// reading. The very first reading has no previous value to compare with, so
// its movement is 0 — it is never measured against an invented baseline.
// Attention is not approval: a controversy moves it the same way as a good
// speech.

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data: politicians } = await sb.from("politicians").select("id,name");
  const { data: lastRows } = await sb.from("stock_prices").select("politician_id,price").order("recorded_at", { ascending: false });

  const results = [];
  for (const p of politicians || []) {
    const { total, breakdown } = await getMentionSignal(p.name);
    const prev = lastRows?.find((r) => r.politician_id === p.id)?.price;
    const target = 60 + total * 3;
    const price = prev == null ? Math.round(target * 100) / 100 : Math.round((prev * 0.7 + target * 0.3) * 100) / 100;
    const change_pct = prev == null ? 0 : Math.round(((price - prev) / prev) * 1000) / 10;
    const reason = `${total} mentions in the last 24h (` + Object.entries(breakdown).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(", ") + ")";
    await sb.from("stock_prices").insert({ politician_id: p.id, price, change_pct, reason });
    results.push({ name: p.name, price, change_pct, breakdown });
  }

  return NextResponse.json({ ok: true, results });
}
