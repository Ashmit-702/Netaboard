import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateText } from "@/lib/ai";
import { getHeadlines } from "@/lib/news";
import { cleanAIText } from "@/lib/sanitize";

// Called by Vercel Cron every morning: GET /api/daily-brief
// Vercel sends "Authorization: Bearer $CRON_SECRET" automatically once
// CRON_SECRET is set as an env var — see vercel.json + README.
//
// Can also be triggered manually to populate today's brief immediately
// instead of waiting for the schedule:
//   curl https://YOUR-SITE/api/daily-brief -H "Authorization: Bearer YOUR_CRON_SECRET"

async function summarize(headlines) {
  if (!headlines.length) {
    return {
      headline: "Demo brief — configure at least one news key (GNEWS_API_KEY, NEWSDATA_API_KEY, CURRENTS_API_KEY, or GUARDIAN_API_KEY) and one AI key.",
      stories: [],
      watch_today: "Set your API keys in the environment to activate this feature.",
      sources: [],
    };
  }
  const prompt = `Summarize these Indian political headlines into JSON only, no markdown formatting
inside any text field (no asterisks, no pipes, no headers):
{"headline":"one clear sentence naming the top story","stories":[{"title":"short title","summary":"1-2 plain-prose sentences"}],"watch_today":"one plain-prose sentence"}
Include at least 3 stories if the headlines support it. Headlines:
${headlines.map((h) => `- ${h.title} (${h.source})`).join("\n")}`;

  const { text } = await generateText(prompt, { json: true });
  let parsed;
  try { parsed = JSON.parse(text || "{}"); }
  catch { parsed = { headline: "Brief generation failed to parse.", stories: [], watch_today: "" }; }

  return {
    headline: cleanAIText(parsed.headline) || "No headline generated.",
    stories: (parsed.stories || []).map((s) => ({ title: cleanAIText(s.title), summary: cleanAIText(s.summary) })),
    watch_today: cleanAIText(parsed.watch_today) || "",
    // Real sources this brief was built from — shown in the UI so the brief
    // is traceable back to actual articles, not just an AI's word for it.
    sources: headlines.map((h) => ({ title: h.title, url: h.url, source: h.source })),
  };
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
