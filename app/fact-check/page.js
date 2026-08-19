import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import FactCheckForm from "@/components/FactCheckForm";

export const metadata = { title: "AI Fact Check — NetaBoard" };

export default function FactCheckPage() {
  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">AI Fact Check</div>
        <h2 className="title">Paste a claim. Get a verdict.</h2>
        <p className="sub">True, Misleading, Needs Context, or False — with a short neutral explanation. Every check is logged for review.</p>
        <FactCheckForm />
      </section>
      <Footer />
    </>
  );
}
