import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateText } from "@/lib/ai";
import { cleanAIText } from "@/lib/sanitize";
import { getCurrentAffairs } from "@/lib/current-affairs/get";
import { generateBrief } from "@/lib/brief/generate";
import { istDateKey } from "@/lib/time";

// Scheduled by Vercel Cron (vercel.json): GET /api/daily-brief
//
// The Daily Brief is built from the SAME Current Affairs engine the homepage
// uses (no separate news pipeline). This job only stores an OPTIONAL layer on
// top: short summaries written by an AI from each story's own reported
// headline + description. The AI:
//   - sees only the stories the engine already selected,
//   - can only return text keyed by those story ids (anything else is dropped),
//   - never sets scores, order, sources or which stories appear.
// If no AI provider is configured, or nothing is current, nothing is stored
// and the homepage simply shows the deterministic brief.

const MAX_SUMMARY = 320;

async function aiSummaries(stories) {
  const prompt = `You are given news stories as JSON. For each story write ONE plain-prose sentence (max 45 words) that restates only what its headline and description say. Do not add facts, numbers, names, causes or predictions that are not in the input. No markdown.
Respond ONLY with JSON: {"summaries":{"<id>":"<sentence>"},"watch":"<one plain sentence naming which listed story is still developing, or empty string>"}
STORIES:
${JSON.stringify(stories.map((s) => ({ id: s.id, headline: s.headline, description: s.summary || "" })))}`;
  const { text } = await generateText(prompt, { json: true });
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    const allowed = new Set(stories.map((s) => s.id));
    const summaries = {};
    for (const [id, value] of Object.entries(parsed.summaries || {})) {
      if (!allowed.has(id) || typeof value !== "string") continue;   // ids we did not send are discarded
      const clean = cleanAIText(value);
      if (clean && clean.length <= MAX_SUMMARY) summaries[id] = clean;
    }
    return { summaries, watch: cleanAIText(parsed.watch) || "" };
  } catch { return null; }
}

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  const { data: roster } = sb ? await sb.from("politicians").select("name,slug") : { data: [] };
  const feed = await getCurrentAffairs({ roster: roster || [] });

  if (feed.status !== "ok") {
    // Never store a placeholder/demo brief.
    return NextResponse.json({ ok: true, stored: false, reason: feed.status === "failed" ? "news feeds failed" : "no current stories" });
  }

  const brief = generateBrief(feed.items);
  const stories = [brief.lead, ...brief.developments];
  const ai = await aiSummaries(stories);

  const content = {
    version: 2,
    generatedAt: brief.generatedAt,
    leadId: brief.lead.id,
    storyIds: stories.map((s) => s.id),
    summaries: ai?.summaries || {},
    watch_today: ai?.watch || "",
  };

  let stored = false;
  if (sb) {
    const { error } = await sb.from("daily_briefs").upsert({ brief_date: istDateKey(), content }, { onConflict: "brief_date" });
    stored = !error;
  }
  return NextResponse.json({ ok: true, stored, stories: stories.length, aiSummaries: Object.keys(content.summaries).length });
}
