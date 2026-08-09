import LandingNavbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Stats from "../components/landing/Stats";
import Timeline from "../components/landing/Timeline";
import Workflow from "../components/landing/Workflow";
import Architecture from "../components/landing/Architecture";
import TechStack from "../components/landing/TechStack";
import CTA from "../components/landing/CTA";
import Footer from "../components/layout/Footer";

function Landing() {
    return (
        <div className="noise relative min-h-screen bg-night-950 overflow-x-hidden">
            <LandingNavbar />
            <main>
                <Hero />
                <Features />
                <Stats />
                <Workflow />
                <Timeline />
                <Architecture />
                <TechStack />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}

export default Landing;
