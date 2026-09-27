import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TodayTabs from "@/components/TodayTabs";
import TodaysBrief from "@/components/TodaysBrief";
import { getPoliticians } from "@/lib/data";
import { getCurrentAffairs } from "@/lib/current-affairs/get";
import { getBrief } from "@/lib/brief/get";

export const metadata = { title: "Daily Brief — NetaBoard" };
export const dynamic = "force-dynamic";

export default async function BriefPage() {
  const { politicians } = await getPoliticians();
  const feed = await getCurrentAffairs({ roster: politicians.map((p) => ({ name: p.name, slug: p.slug })) });
  const brief = await getBrief(feed.items);
  return (
    <>
      <Nav />
      <section className="wrap" style={{ paddingTop: 34 }}>
        <TodayTabs current="/brief" />
        <div className="eyebrow">Daily Brief</div>
        <TodaysBrief brief={brief} status={feed.status} />
      </section>
      <Footer />
    </>
  );
}
