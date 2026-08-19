import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import DebateArena from "@/components/DebateArena";
import { getDebate } from "@/lib/data";

export const metadata = { title: "Debate Arena — NetaBoard" };

const fallbackDebate = {
  id: null,
  topic: "Should India adopt a Uniform Civil Code nationwide?",
  args: [
    { id: "f1", side: "for", content: "A single civil code would apply equal rights regardless of religion.", votes: 12 },
    { id: "a1", side: "against", content: "Personal laws reflect community diversity that a single code may flatten.", votes: 9 },
  ],
};

export default async function DebatePage() {
  const debate = (await getDebate()) || fallbackDebate;

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Debate Arena</div>
        <h2 className="title">{debate.topic}</h2>
        <p className="sub">Structured argument, not comment-section chaos. Best arguments rise by vote, not by who shouts first.</p>
        <DebateArena debateId={debate.id} initialArgs={debate.args} />
      </section>
      <Footer />
    </>
  );
}
