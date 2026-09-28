import { redirect } from "next/navigation";

// "Today" is the homepage. /today exists so the name works as a URL too.
export const dynamic = "force-dynamic";
export default function TodayRedirect() {
  redirect("/");
}
