import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

const SYSTEM = `You are NetaBoard's "Ask Politics" assistant. Explain Indian and global politics
clearly and neutrally, like a knowledgeable friend, not a pundit. Keep answers under 200 words unless
asked for more. Present multiple sides of contested questions instead of pushing one view. If you are
not certain of a fact, say so instead of guessing.`;

export async function POST(req) {
  const { question } = await req.json();
  if (!question) return NextResponse.json({ error: "Missing question" }, { status: 400 });

  const { text, provider, error } = await generateText(question, { system: SYSTEM });
  if (!text) {
    return NextResponse.json({
      answer: "Demo mode — set GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY to get real AI answers here.",
      error,
    });
  }
  return NextResponse.json({ answer: text, provider });
}
