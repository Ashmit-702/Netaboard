import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import ManifestoCompare from "@/components/ManifestoCompare";

export const metadata = { title: "Manifesto Comparison — NetaBoard" };

export default function ManifestoPage() {
  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">AI Manifesto Comparison</div>
        <h2 className="title">Two manifestos, side by side.</h2>
        <p className="sub">Paste in text from any two manifestos and get a neutral, issue-by-issue comparison.</p>
        <ManifestoCompare />
      </section>
      <Footer />
    </>
  );
}
