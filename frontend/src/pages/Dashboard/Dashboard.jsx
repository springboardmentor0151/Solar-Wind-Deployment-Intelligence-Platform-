import DashboardLayout from "../../layouts/DashboardLayout";
import "./Dashboard.css";

import {
  Sun,
  Wind,
  MapPin,
  FolderKanban,
  ArrowUpRight,
  CloudSun,
} from "lucide-react";

import { motion } from "framer-motion";

function Dashboard() {
  return (
    <DashboardLayout>

      {/* HERO */}

      <motion.div
        className="hero"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .7 }}
      >

        <div className="heroLeft">

          <p className="date">
            • Renewable Intelligence Platform
          </p>

          <h1>
            Good Evening 
          </h1>

          <h2>
            Welcome back, Sahithi
          </h2>

          <p className="heroText">
            Monitor renewable projects, analyze environmental
            conditions and receive AI powered deployment
            recommendations in real-time.
          </p>

          <div className="heroButtons">

            <button className="primaryBtn">
              View Projects
            </button>

            <button className="secondaryBtn">
              AI Prediction
            </button>

          </div>

        </div>

        <div className="heroRight">

          <div className="energyCircle">

            ☀

          </div>

          <div className="floatingCard">

            <CloudSun size={20} />

            <div>

              <h3>29°C</h3>

              <p>Perfect Solar Weather</p>

            </div>

          </div>

        </div>

      </motion.div>

      {/* KPI CARDS */}

      <div className="cards">

        <div className="card solar">

          <Sun size={40} />

          <span>Solar Index</span>

          <h2>94%</h2>

          <small>
            <ArrowUpRight size={15} />
            +4.2%
          </small>

        </div>

        <div className="card wind">

          <Wind size={40} />

          <span>Wind Speed</span>

          <h2>18 km/h</h2>

          <small>
            Optimal
          </small>

        </div>

        <div className="card site">

          <MapPin size={40} />

          <span>Sites</span>

          <h2>148</h2>

          <small>
            Active
          </small>

        </div>

        <div className="card project">

          <FolderKanban size={40} />

          <span>Projects</span>

          <h2>12</h2>

          <small>
            Running
          </small>

        </div>

      </div>

      {/* CONTENT */}

      <div className="bottom">

        <div className="map">

          <h2>🌍 Renewable Deployment Map</h2>

          <div className="placeholder">

            GIS Visualization

          </div>

        </div>

        <div className="rightPanel">

          <div className="ai">

            <h3>🤖 AI Recommendation</h3>

            <h1>Highly Suitable</h1>

            <p>Confidence : 96%</p>

            <button>Generate Report</button>

          </div>

          <div className="weather">

            <h3>Today's Weather</h3>

            <h2>29°C</h2>

            <p>Sunny</p>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Dashboard;