import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TodayTabs from "@/components/TodayTabs";
import IssueWatch from "@/components/IssueWatch";
import { getPoliticians } from "@/lib/data";
import { getCurrentAffairs } from "@/lib/current-affairs/get";

export const metadata = { title: "Issue Watch — NetaBoard" };
export const dynamic = "force-dynamic";

export default async function IssueWatchPage() {
  const { politicians } = await getPoliticians();
  const feed = await getCurrentAffairs({ roster: politicians.map((p) => ({ name: p.name, slug: p.slug })) });
  return (
    <>
      <Nav />
      <section className="wrap" style={{ paddingTop: 34 }}>
        <TodayTabs current="/issue-watch" />
        <div className="eyebrow">Issue Watch</div>
        <h1 className="lead-h" style={{ fontSize: "clamp(32px,5vw,52px)" }}>The issues that are still moving.</h1>
        <p className="sub">
          Current Affairs detects an event; Issue Watch expands it — what happened, what changed since the first report, and the timeline, all from the reporting itself.
          NetaBoard does not add interpretation it cannot source.
        </p>
        <IssueWatch issues={feed.issues} status={feed.status} full />
      </section>
      <Footer />
    </>
  );
}
