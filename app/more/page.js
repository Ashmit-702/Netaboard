import { redirect } from "next/navigation";

// Kept as a redirect so any old bookmarks/links to /more still work —
// the nav now points to /explore, which holds the same secondary features.
export default function MorePage() {
  redirect("/explore");
}
