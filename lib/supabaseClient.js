"use client";
// Browser-side Supabase client — safe to expose, uses the anon (public) key.
// Row Level Security policies (see supabase/schema.sql) control what this key can actually touch.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey ? createClient(url, anonKey) : null;
