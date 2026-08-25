const typeLabel = {
  election_prediction: "Election Pulse",
  promise_status: "Accountability",
  new_evidence: "Evidence Ledger",
  fact_check: "Fact Check",
  constituency: "Constituency Watch",
  attention: "Political Attention",
};

const statusWord = {
  fulfilled: "fulfilled", partially_fulfilled: "partially fulfilled", not_fulfilled: "not fulfilled",
  disputed: "disputed", unverified: "unverified",
  true: "confirmed true", false: "rated false", misleading: "rated misleading", needs_context: "flagged as needing context",
};

// Builds a headline from the single most significant real change — never a
// hardcoded story. If there's nothing to report, a plain empty state shows
// instead of inventing one.
function headlineFor(change) {
  switch (change.type) {
    case "election_prediction": {
      const up = change.delta > 0;
      return `${change.entity} moved to ${change.newValue}% — ${up ? "up" : "down"} ${Math.abs(change.delta)} points`;
    }
    case "promise_status":
      return `${change.entity}'s promise on ${change.title.toLowerCase()} is now ${statusWord[change.newValue] || change.newValue}`;
    case "new_evidence":
      return `New evidence was added to ${change.entity}'s record on "${change.title}"`;
    case "fact_check":
      return `A checked claim was ${statusWord[change.newValue] || change.newValue}`;
    case "constituency": {
      const up = change.delta > 0;
      return `${change.entity} shifted to ${change.newValue}% — ${up ? "up" : "down"} ${Math.abs(change.delta)} points`;
    }
    case "attention": {
      const up = change.delta > 0;
      return `${change.entity} is seeing a ${up ? "surge" : "drop"} in public attention`;
    }
    default:
      return change.title;
  }
}

export default function HeroToday({ change }) {
  if (!change) {
    return (
      <section className="wrap" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="eyebrow">Today</div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--paper-faint)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>
          Politics, with receipts.
        </div>
        <h1 style={{ fontSize: "clamp(32px,4.5vw,48px)", lineHeight: 1.1, marginBottom: 14, maxWidth: 780 }}>
          Nothing significant has changed yet.
        </h1>
        <p className="sub" style={{ fontSize: 16 }}>
          NetaBoard tracks political claims, promises, evidence, and elections — this space fills in
          as real movement happens. Check <a href="/politicians" style={{ color: "var(--amber)", textDecoration: "underline" }}>Politicians</a> or <a href="/predictions" style={{ color: "var(--amber)", textDecoration: "underline" }}>Elections</a> in the meantime.
        </p>
      </section>
    );
  }

  return (
    <section className="wrap" style={{ paddingTop: 56, paddingBottom: 44 }}>
      <div className="eyebrow">{typeLabel[change.type] || "Today"}</div>
      <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--paper-faint)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>
        Politics, with receipts.
      </div>
      <h1 style={{ fontSize: "clamp(32px,5vw,54px)", lineHeight: 1.06, marginBottom: 18, maxWidth: 820 }}>
        {headlineFor(change)}
      </h1>
      {change.reason && (
        <p style={{ fontSize: 17, color: "var(--paper-dim)", lineHeight: 1.6, maxWidth: 680, marginBottom: 22 }}>
          {change.reason}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <a href={change.href} className="btn btn-primary">Read the evidence</a>
        <span style={{ fontSize: 12, color: "var(--paper-faint)", fontFamily: "var(--mono)" }}>
          {new Date(change.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
          {change.confidence != null && ` · ${change.confidence}% confidence`}
        </span>
      </div>
    </section>
  );
}
