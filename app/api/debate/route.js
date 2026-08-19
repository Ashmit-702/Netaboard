import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req) {
  const sb = supabaseServer();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { debate_id, side, content } = await req.json();
  if (!debate_id || !side || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const { error } = await sb.from("debate_arguments").insert({ debate_id, side, content: content.slice(0, 999) });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
