import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import QuizWidget from "@/components/QuizWidget";
import { getQuiz } from "@/lib/data";

export const metadata = { title: "Political IQ Quiz — NetaBoard" };

const fallbackQuestions = [
  { question: "How many seats are in the Bihar Legislative Assembly?", options: ["203", "243", "288", "403"], correct_index: 1 },
  { question: "How many seats are needed for a majority in a 243-seat assembly?", options: ["120", "121", "122", "125"], correct_index: 2 },
  { question: "In which year was Article 370 revoked?", options: ["2017", "2018", "2019", "2020"], correct_index: 2 },
];

export default async function QuizPage() {
  const dbQuestions = await getQuiz();
  const questions = dbQuestions.length ? dbQuestions : fallbackQuestions;

  return (
    <>
      <Ticker />
      <Nav />
      <section className="wrap">
        <div className="eyebrow">Political IQ Quiz</div>
        <h2 className="title">Guess winners, seats, and symbols.</h2>
        <p className="sub">Quick rounds, instant scoring, one shareable number at the end.</p>
        <QuizWidget questions={questions} />
      </section>
      <Footer />
    </>
  );
}
