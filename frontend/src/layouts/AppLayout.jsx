import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import PageTransition from "../components/ui/PageTransition";

export default function AppLayout({ children }) {
    return (
        <div className="noise relative min-h-screen bg-night-950">
            <Navbar />
            <main className="relative z-10">
                <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
        </div>
    );
}
