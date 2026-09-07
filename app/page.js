import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import FactCheckForm from "@/components/FactCheckForm";

export const metadata = { title: "Fact Check — NetaBoard" };

export default function FactCheckPage() {
  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Fact Check</div>
        <h2 className="title">The evidence is the authority.</h2>
        <p className="sub">
          Every claim is checked against Google's published fact-check database before an AI reasons
          about it — the AI explains what the evidence shows, it doesn't replace it. Every check is
          logged for review.
        </p>
        <FactCheckForm />
      </section>
      <Footer />
    </>
  );
}
