import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import MemeGenerator from "@/components/MemeGenerator";

export const metadata = { title: "Political Meme Generator — NetaBoard" };

export default function MemesPage() {
  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Political Meme Generator</div>
        <h2 className="title">Make one. Share it.</h2>
        <p className="sub">Fully client-side — text renders straight onto canvas, no server round-trip, nothing uploaded.</p>
        <MemeGenerator />
      </section>
      <Footer />
    </>
  );
}
