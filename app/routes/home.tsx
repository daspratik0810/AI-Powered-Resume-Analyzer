import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "CVorithm | Turn Your CV Into Opportunities" },
    { name: "description", content: "AI-driven resume analysis that helps you optimize your CV, improve ATS scores, and stand out to recruiters." },
  ];
}

export default function Home() {
  return <main className="bg-[url('/images/bg-main.svg')]">
    {/*NAVIGATION BAR*/}
    <Navbar />

    {/*MAIN-DESCRIPTION*/}
    <section className="main-section">
      <div className="page-heading">
        <h1>Your Resume Has a Story. We Reveal It.</h1>
        <h2> Every resume has blind spots. CVorithm finds them, explains them, and helps you fix them before recruiters
          ever notice.</h2>
      </div>
    </section>

    {/*TEMPLETES*/}



  </main>
}
