import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Features from "../components/Features";
import Workflow from "../components/Workflow";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

import "../index.css";
import "../App.css";

export default function Home() {
  return (
    <div className="relative overflow-x-hidden bg-white">
      <Navbar />

      <main>
        <Hero />
        <About />
        <Features />
        <Workflow />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}