import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getMentionSignal } from "@/lib/social";

// Called by Vercel Cron every few hours: GET /api/stock-refresh
// Pulls a mention-volume signal from every configured free source (Reddit,
// Bluesky, Hacker News, Mastodon — plus X if you've paid for API credits)
// and nudges each politician's "stock price" toward it. See lib/social.js
// for exactly what each source contributes and why X is opt-in.

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data: politicians } = await sb.from("politicians").select("id,name");
  const { data: lastPrices } = await sb.from("stock_prices").select("politician_id,price").order("recorded_at", { ascending: false });

  const results = [];
  for (const p of politicians || []) {
    const { total, breakdown } = await getMentionSignal(p.name);
    const prevPrice = lastPrices?.find((r) => r.politician_id === p.id)?.price || 100;
    // Transparent, simple formula: price drifts toward a mention-driven target.
    const target = 60 + total * 3;
    const price = Math.round((prevPrice * 0.7 + target * 0.3) * 100) / 100;
    const change_pct = Math.round(((price - prevPrice) / prevPrice) * 1000) / 10;
    const reason = `${total} mentions in the last 24h (` + Object.entries(breakdown).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(", ") + ")";
    await sb.from("stock_prices").insert({ politician_id: p.id, price, change_pct, reason });
    results.push({ name: p.name, price, change_pct, breakdown });
  }

  return NextResponse.json({ ok: true, results });
}
