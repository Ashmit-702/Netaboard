import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TodayTabs from "@/components/TodayTabs";
import CurrentAffairsFeed from "@/components/CurrentAffairsFeed";
import RelTime from "@/components/RelTime";
import { getPoliticians } from "@/lib/data";
import { getCurrentAffairs } from "@/lib/current-affairs/get";
import { toClientItem } from "@/lib/current-affairs/serialize";

export const metadata = { title: "Current Affairs — NetaBoard" };
export const dynamic = "force-dynamic";

export default async function CurrentAffairsPage() {
  const { politicians } = await getPoliticians();
  const feed = await getCurrentAffairs({ roster: politicians.map((p) => ({ name: p.name, slug: p.slug })) });
  const issueIds = new Set(feed.issues.map((i) => i.id));
  const items = feed.items.map((it) => toClientItem(it, issueIds));

  return (
    <>
      <Nav />
      <section className="wrap" style={{ paddingTop: 34 }}>
        <TodayTabs current="/current-affairs" />
        <div className="eyebrow">Current Affairs</div>
        <h1 className="lead-h" style={{ fontSize: "clamp(32px,5vw,52px)" }}>What’s happening now.</h1>
        <p className="sub" style={{ marginBottom: 26 }}>
          Important developments from the last 48 hours, one item per story. Ranked by freshness and how many independent outlets are reporting.
          {feed.fetchedAt && <> Feeds refreshed <RelTime iso={feed.fetchedAt} />.</>}
        </p>
        {feed.status === "failed" ? (
          <div className="empty" role="status">Current affairs couldn’t be refreshed right now.</div>
        ) : (
          <CurrentAffairsFeed items={items} />
        )}
      </section>
      <Footer />
    </>
  );
}
