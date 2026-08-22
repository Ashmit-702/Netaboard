import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateText } from "@/lib/ai";
import { searchPublishedFactChecks } from "@/lib/factcheck";
import { cleanAIText } from "@/lib/sanitize";

const SYSTEM = `You are a political fact-checker. You may be given real published fact-checks as
context. IMPORTANT: if a published fact-check exists with a clear rating for the same claim, your
verdict should match it unless you have a specific, stated reason to disagree — you are not the
final authority when a verified publisher has already ruled on this. Respond ONLY with strict JSON:
{"verdict":"True|Misleading|Needs Context|False","explanation":"2-3 sentence neutral explanation in
plain prose, no markdown, no asterisks"}. Do not include markdown fences or any other text.`;

export async function POST(req) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const published = await searchPublishedFactChecks(text);

  const context = published.length
    ? `\n\nPublished fact-checks found for related claims:\n${published
        .map((p) => `- "${p.claim}" — rated "${p.rating}" by ${p.publisher}`)
        .join("\n")}`
    : "";

  const { text: raw, provider, error } = await generateText(text + context, { system: SYSTEM, json: true });

  if (!raw) {
    return NextResponse.json({
      verdict: "Needs Context",
      explanation: "Demo mode — set GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY to run real fact-checks.",
      sources: published,
      error,
    });
  }

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { parsed = { verdict: "Needs Context", explanation: raw }; }

  parsed.explanation = cleanAIText(parsed.explanation);

  // Map the Fact Check verdict vocabulary onto the ledger's verdict vocabulary.
  const verdictMap = { True: "true", False: "false", Misleading: "misleading", "Needs Context": "needs_context" };
  const ledgerStatus = verdictMap[parsed.verdict] || "needs_context";

  const sb = supabaseServer();
  if (sb) {
    // Existing fact_checks log — unchanged, nothing here regresses.
    await sb.from("fact_checks").insert({
      input_text: text, verdict: parsed.verdict, explanation: parsed.explanation,
      sources: published,
    });

    // Additive: also write into the shared Evidence Ledger, so a fact-check
    // is stored the same shape as a promise claim — one reusable model,
    // not two parallel systems. Failures here never affect the response
    // the person already got above.
    try {
      const { data: claim } = await sb.from("claims").insert({
        claim_type: "fact_check", text, source_url: null,
      }).select("id").single();

      if (claim) {
        if (published.length) {
          await sb.from("evidence").insert(
            published.map((p) => ({
              claim_id: claim.id,
              description: `${p.publisher} rated a related claim "${p.rating}": ${p.claim}`,
              source_name: p.publisher, source_url: p.url, source_type: "fact_check",
              stance: ["True"].includes(p.rating) ? "supports" : ["False"].includes(p.rating) ? "contradicts" : "neutral",
            }))
          );
        }
        await sb.from("verdicts").insert({
          claim_id: claim.id, status: ledgerStatus, confidence: null,
          reasoning: parsed.explanation,
          methodology: published.length
            ? `Checked against ${published.length} published fact-check(s) before AI reasoning was applied.`
            : "No published fact-check found for this claim — AI reasoning only, no independent verification.",
          verdict_source: published.length ? "published_source" : "ai",
        });
      }
    } catch { /* ledger write is additive — never breaks the fact-check response */ }
  }

  return NextResponse.json({ ...parsed, sources: published, provider, grounded: published.length > 0 });
}
