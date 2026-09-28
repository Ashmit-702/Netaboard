import Nav from "@/components/Nav";
import MinimalFooter from "@/components/MinimalFooter";
import EditorialRow from "@/components/EditorialRow";
import SectionHead from "@/components/SectionHead";
import TodaysBrief from "@/components/TodaysBrief";
import StoryRow from "@/components/StoryRow";
import TrendingNow from "@/components/TrendingNow";
import IssueWatch from "@/components/IssueWatch";
import TrendingNetas from "@/components/TrendingNetas";
import ChangeRow from "@/components/ChangeRow";
import FeaturedClaim from "@/components/FeaturedClaim";
import ElectionWatchCard from "@/components/ElectionWatchCard";
import HomeSearchBox from "@/components/HomeSearchBox";
import TodayTabs from "@/components/TodayTabs";
import { getPoliticians, getAttention } from "@/lib/data";
import { getAllChanges } from "@/lib/changes";
import { getCurrentAffairs } from "@/lib/current-affairs/get";
import { getBrief } from "@/lib/brief/get";
import { getElections } from "@/lib/elections/get";
import { selectElectionWatch } from "@/lib/elections/classify";
import { getRecentClaims, pickFeaturedClaim } from "@/lib/evidenceFeed";
import { formatISTDate, formatISTClock } from "@/lib/time";

// Time-sensitive: rendered per request. News ingestion is cached separately
// (lib/current-affairs/get.js), so this does not multiply API calls.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { politicians } = await getPoliticians();
  const roster = politicians.map((p) => ({ name: p.name, slug: p.slug }));

  const [feed, { changes, byType }, attention, electionsRes, claimsRes] = await Promise.all([
    getCurrentAffairs({ roster }), getAllChanges(), getAttention(), getElections(), getRecentClaims(),
  ]);

  const brief = await getBrief(feed.items);
  const covered = new Set(brief?.coveredIds || []);
  const moreStories = feed.items.filter((it) => it.tier <= 2 && !covered.has(it.id)).slice(0, 10);
  const issueIds = new Set(feed.issues.map((i) => i.id));

  const featured = pickFeaturedClaim(claimsRes.claims);
  const electionWatch = selectElectionWatch(electionsRes.elections);

  const recordChanges = [...(byType.promise_status || []), ...(byType.new_evidence || [])];
  const changedPoliticians = politicians
    .map((p) => ({ p, latest: recordChanges.find((c) => c.entity === p.name) }))
    .filter((x) => x.latest).slice(0, 5);
  const otherChanges = changes.filter((c) => !["attention"].includes(c.type)).slice(0, 5);

  const nowIso = new Date().toISOString();
  return (
    <>
      <Nav />

      <section className="wrap" style={{ paddingTop: 34, paddingBottom: 40 }}>
        <div className="masthead">
          <span className="tagline">NetaBoard — Politics, with receipts.</span>
          <span className="stamp">{formatISTDate(nowIso, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {formatISTClock(nowIso)}</span>
        </div>
        <TodayTabs current="/" />
        <div className="eyebrow">Today&apos;s Brief</div>
        <TodaysBrief brief={brief} status={feed.status} />
      </section>

      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Current Affairs" title="What’s happening now." href="/current-affairs" linkLabel="All current affairs" />
        {feed.status === "failed" ? (
          <div className="empty">Current affairs couldn’t be refreshed right now.</div>
        ) : moreStories.length ? (
          <div className="cols-2">
            {[moreStories.filter((_, i) => i % 2 === 0), moreStories.filter((_, i) => i % 2 === 1)].map((col, c) => (
              <div key={c}>{col.map((it) => <StoryRow key={it.id} item={it} issueHref={issueIds.has(it.id) ? `/issue-watch#${it.id}` : undefined} />)}</div>
            ))}
          </div>
        ) : (
          <div className="empty">{feed.status === "empty" ? "No major current-affairs updates right now." : "Nothing further beyond today’s brief."}</div>
        )}
      </section>

      <section id="trending-now" className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Trending Now" title="Rising fastest." sub="Topics whose coverage is accelerating right now — not the same as the most important stories." />
        <TrendingNow topics={feed.trending} status={feed.status} />
      </section>

      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Issue Watch" title="One issue, in depth." href="/issue-watch" linkLabel="Full timelines" />
        <IssueWatch issues={feed.issues} status={feed.status} />
      </section>

      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Trending Netas" title="Who’s drawing unusual attention." href="/attention" linkLabel="Political Attention" />
        <TrendingNetas rows={attention} />
      </section>

      {otherChanges.length > 0 && (
        <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
          <SectionHead eyebrow="What Changed" title="Recent changes to the record." sub="Only genuine changes in the last two weeks." />
          <div className="rule-list">{otherChanges.map((c, i) => <ChangeRow key={i} change={c} />)}</div>
        </section>
      )}

      {featured && (
        <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
          <SectionHead eyebrow="The Evidence" title="One claim, checked." />
          <FeaturedClaim claim={featured} />
        </section>
      )}

      {electionWatch && (
        <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
          <SectionHead eyebrow="Election Watch" title="Which election matters now." href="/elections" linkLabel="All elections" />
          <ElectionWatchCard election={electionWatch} />
        </section>
      )}

      {changedPoliticians.length > 0 && (
        <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
          <SectionHead eyebrow="Accountability" title="Whose record just changed." sub="Score and evidence coverage always appear together." />
          <div className="rule-list">
            {changedPoliticians.map(({ p, latest }) => (
              <EditorialRow
                key={p.slug} eyebrow={p.name} href={`/politicians/${p.slug}`}
                title={p.accountability.accountabilityScore === null ? "Not enough evidence to score yet" : `${p.accountability.accountabilityScore}/100 accountability · ${p.accountability.evidenceCoverage}% evidence coverage`}
                meta={latest.reason || latest.title}
              />
            ))}
          </div>
        </section>
      )}

      <section className="wrap tight" style={{ borderTop: "1px solid var(--line)" }}>
        <SectionHead eyebrow="Ask NetaBoard" title="“Did this actually happen?”" />
        <HomeSearchBox />
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 16, fontSize: 12.5, color: "var(--paper-faint)" }}>
          {["Did this promise get fulfilled?", "What changed recently?", "Is this viral claim true?"].map((ex) => (
            <a key={ex} href={`/ask?q=${encodeURIComponent(ex)}`} style={{ textDecoration: "underline" }}>{ex}</a>
          ))}
        </div>
      </section>

      <MinimalFooter />
    </>
  );
}
