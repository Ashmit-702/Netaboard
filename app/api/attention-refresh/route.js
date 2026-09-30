import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getMentionSignal } from "@/lib/social";
import { politicalRelevance, discoveryScore, windowedTrend } from "@/lib/attentionModel.js";
import { serializeReason, parseReason, relevanceFromParsed } from "@/lib/attentionParse.js";

// Scheduled by Vercel Cron (see vercel.json): GET /api/attention-refresh
// (the old /api/stock-refresh path re-exports this handler.)
//
// v2 model (see lib/attentionModel.js): `price` stores each day's raw
// POLITICAL relevance score (news + social, log-dampened, Wikipedia
// EXCLUDED). `change_pct` is a genuine windowed comparison — today's
// reading vs. that politician's own trailing 7-day daily average — read
// from REAL prior rows, never an EMA against a single previous reading
// (which is what let Wikipedia noise alone move the number). With fewer
// than 3 distinct prior days of history, change_pct is stored as 0 and the
// `reason` text is prefixed "Not enough attention history yet" so the UI
// can tell that apart from a genuinely flat reading. Attention is not
// approval: a controversy moves it the same way as a good speech.

const HISTORY_LOOKBACK_DAYS = 8;

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data: politicians } = await sb.from("politicians").select("id,name");
  const since = new Date(Date.now() - HISTORY_LOOKBACK_DAYS * 86400000).toISOString();
  const { data: historyRows } = await sb.from("stock_prices").select("politician_id,reason,recorded_at").gte("recorded_at", since).order("recorded_at", { ascending: true });
  const historyBy = {};
  for (const r of historyRows || []) (historyBy[r.politician_id] ||= []).push(r);

  const results = [];
  for (const p of politicians || []) {
    const signal = await getMentionSignal(p.name);
    const relevance = politicalRelevance(signal);
    const discovery = discoveryScore(signal);

    const history = (historyBy[p.id] || [])
      .map((r) => ({ at: new Date(r.recorded_at).getTime(), relevance: relevanceFromParsed(parseReason(r.reason)) }));
    const trend = windowedTrend(history, relevance);

    const price = relevance;   // today's raw political-relevance score (not smoothed)
    const change_pct = trend.sufficientHistory ? trend.changePct : 0;
    const reasonBody = serializeReason(signal) + ` · Discovery score ${discovery} (not counted toward attention or trending)`;
    const reason = trend.sufficientHistory ? reasonBody : `Not enough attention history yet — ${reasonBody}`;

    await sb.from("stock_prices").insert({ politician_id: p.id, price, change_pct, reason });
    results.push({ name: p.name, price, change_pct, state: trend.state, discovery, breakdown: signal.breakdown });
  }

  return NextResponse.json({ ok: true, results });
}
