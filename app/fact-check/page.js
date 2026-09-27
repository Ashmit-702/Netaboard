import { redirect } from "next/navigation";

// Fact Check now lives inside the Evidence hub (/evidence#check).
export const dynamic = "force-dynamic";
export default function FactCheckRedirect() {
  redirect("/evidence#check");
}
