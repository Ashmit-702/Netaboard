import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateText } from "@/lib/ai";
import { getHeadlines } from "@/lib/news";

// Called by Vercel Cron every morning: GET /api/daily-brief
// Vercel sends "Authorization: Bearer $CRON_SECRET" automatically once
// CRON_SECRET is set as an env var — see vercel.json + README.

async function summarize(headlines) {
  if (!headlines.length) {
    return {
      headline: "Demo brief — configure at least one news key (GNEWS_API_KEY, NEWSDATA_API_KEY, CURRENTS_API_KEY, or GUARDIAN_API_KEY) and one AI key.",
      stories: [],
      watch_today: "Set your API keys in the environment to activate this feature.",
    };
  }
  const prompt = `Summarize these Indian political headlines into JSON only:
{"headline":"one-line top story","stories":[{"title":"...","summary":"one sentence"}],"watch_today":"one sentence on what to watch"}
Headlines:\n${headlines.map((h) => `- ${h.title} (${h.source})`).join("\n")}`;

  const { text } = await generateText(prompt, { json: true });
  try { return JSON.parse(text || "{}"); }
  catch { return { headline: "Brief generation failed to parse.", stories: [], watch_today: "" }; }
}

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const headlines = await getHeadlines("India politics");
  const content = await summarize(headlines);

  const sb = supabaseServer();
  if (sb) {
    await sb.from("daily_briefs").upsert(
      { brief_date: new Date().toISOString().slice(0, 10), content },
      { onConflict: "brief_date" }
    );
  }
  return NextResponse.json({ ok: true, content, sources_used: headlines.length });
}
