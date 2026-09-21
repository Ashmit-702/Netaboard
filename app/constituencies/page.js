import { redirect } from "next/navigation";

// Forced dynamic so this emits a real HTTP redirect (Location header) rather
// than a client-side-only RSC redirect signal, which a statically optimized
// page would otherwise produce — breaking curl, bots, and non-JS clients.
export const dynamic = 'force-dynamic';
export default function ConstituenciesPage() {
  redirect("/predictions");
}
