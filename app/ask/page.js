import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import AskChat from "@/components/AskChat";
import { Suspense } from "react";

export const metadata = { title: "Ask Politics — NetaBoard" };

export default function AskPage() {
  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Ask Politics (AI)</div>
        <h2 className="title">Plain-language answers, no jargon.</h2>
        <p className="sub">Ask about elections, policy, or how any of NetaBoard's numbers were built. Answers aim to show more than one side of contested questions.</p>
        <Suspense fallback={<div className="card">Loading…</div>}>
          <AskChat />
        </Suspense>
      </section>
      <Footer />
    </>
  );
}
