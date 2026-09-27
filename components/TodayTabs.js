import Link from "next/link";

const tabs = [["/", "Today"], ["/brief", "Daily Brief"], ["/current-affairs", "Current Affairs"], ["/issue-watch", "Issue Watch"]];

export default function TodayTabs({ current }) {
  return (
    <nav className="today-tabs" aria-label="Today">
      {tabs.map(([href, label]) => (
        <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
