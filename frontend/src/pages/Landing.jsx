import "./../styles/Landing.css";
import {
  FaSolarPanel,
  FaLeaf,
  FaMapMarkedAlt,
  FaWind,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  const handleStartAnalysis = () => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="landing">
      {/* ================= NAVBAR ================= */}

      <nav className="navbar">
        <div className="logo">⚡ Solar & Wind</div>

        <ul className="nav-links">
          <li>
            <a href="#home">Home</a>
          </li>
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#workflow">Workflow</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>

        <div className="nav-buttons">
          <button
            className="login-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="start-btn"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}

      <section className="hero" id="home">
        <span className="badge">
          AI Powered Renewable Energy Platform
        </span>

        <h1>
          Smart Solar & Wind
          <br />
          Deployment Intelligence
        </h1>

        <p>
          Analyze Solar Potential, Wind Resources, GIS Layers,
          Weather, Terrain and AI Recommendations from one
          platform.
        </p>

        <div className="hero-buttons">
          <button
            className="primary-btn"
            onClick={handleStartAnalysis}
          >
            Start Analysis
          </button>

          <button
            className="secondary-btn"
            onClick={() =>
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Learn More
          </button>
        </div>
      </section>

      {/* ================= FEATURES ================= */}

      <section className="features" id="features">
        <div className="feature-card">
          <FaSolarPanel className="icon" />
          <h3>Solar Prediction</h3>

          <p>
            Analyze solar irradiance using NASA POWER
            datasets.
          </p>
        </div>

        <div className="feature-card">
          <FaWind className="icon" />
          <h3>Wind Intelligence</h3>

          <p>
            Estimate wind resources using weather and AI
            prediction models.
          </p>
        </div>

        <div className="feature-card">
          <FaMapMarkedAlt className="icon" />
          <h3>GIS Analysis</h3>

          <p>
            Terrain, elevation and map-based renewable
            analysis.
          </p>
        </div>

        <div className="feature-card">
          <FaLeaf className="icon" />
          <h3>Environmental Data</h3>

          <p>
            Weather, humidity, temperature and environmental
            intelligence.
          </p>
        </div>
      </section>
     <section className="workflow" id="workflow">

    <h2>How It Works</h2>

    <p className="workflow-subtitle">
        AI-powered renewable energy site assessment in four simple steps
    </p>

    <div className="workflow-container">

        <div className="step">
            <div className="step-number">01</div>

            <div className="step-icon">📍</div>

            <h3>Select Location</h3>

            <p>
                Choose any project location from the interactive GIS map.
            </p>
        </div>

        <div className="step">
            <div className="step-number">02</div>

            <div className="step-icon">☀️</div>

            <h3>Collect Data</h3>

            <p>
                Retrieve NASA POWER, weather, elevation and terrain datasets.
            </p>
        </div>

        <div className="step">
            <div className="step-number">03</div>

            <div className="step-icon">🤖</div>

            <h3>AI Analysis</h3>

            <p>
                Predict solar score, wind score and renewable potential.
            </p>
        </div>

        <div className="step">
            <div className="step-number">04</div>

            <div className="step-icon">📄</div>

            <h3>Generate Report</h3>

            <p>
                Download a professional renewable energy assessment report.
            </p>
        </div>

    </div>

</section>
<section className="contact" id="contact">

  <h2>Contact Us</h2>

  <p>
    Solar & Wind Deployment Intelligence Platform
  </p>

  <p>📧 Email: support@solarwind.ai</p>

  <p>📞 Phone: +91 9876543210</p>

  <p>📍 Jabalpur, Madhya Pradesh, India</p>

</section>
    </div>
  );
}

export default Landing;