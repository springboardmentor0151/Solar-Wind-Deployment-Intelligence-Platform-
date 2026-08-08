import { useEffect, useState } from "react";
import {
  FaFolderOpen,
  FaMapMarkerAlt,
  FaChartLine,
  FaMoneyBillWave,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import api from "../api/api";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [user, setUser] = useState(null);
  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [projectsRes, sitesRes, userRes] = await Promise.all([
  api.get("/projects"),
  api.get("/sites"),
  api.get("/users/me"),
]);
console.log(userRes.data);
setProjects(projectsRes.data);
setSites(sitesRes.data);
setUser(userRes.data);

      setProjects(projectsRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      console.log("Dashboard Error:", error);
    }
  }

  const totalGeneration = sites.length * 7.8;
  const estimatedROI = 15 + projects.length * 0.4;

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
<PageHeader
  title={`👋 Welcome, ${user ? user.username : "User"}`}
  subtitle="AI-powered Solar & Wind Deployment Intelligence Platform"
/>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          <StatCard
            icon={<FaFolderOpen className="text-emerald-600" />}
            title="Projects"
            value={projects.length}
          />

          <StatCard
            icon={<FaMapMarkerAlt className="text-blue-600" />}
            title="Sites"
            value={sites.length}
          />

          <StatCard
            icon={<FaChartLine className="text-orange-500" />}
            title="Estimated Forecast"
            value={`${totalGeneration.toFixed(1)} GWh`}
          />

          <StatCard
            icon={<FaMoneyBillWave className="text-green-600" />}
            title="Estimated ROI"
            value={`${estimatedROI.toFixed(1)}%`}
          />

        </div>

        {/* Welcome Card */}

        <div className="bg-white rounded-3xl shadow-lg p-10">

          <h2 className="text-3xl font-bold text-green-700 mb-4">
            🌿 Solar & Wind Deployment Intelligence Platform
          </h2>

          <p className="text-gray-700 text-lg leading-8">
            Welcome to your Renewable Energy Intelligence Dashboard.
            Manage your renewable energy projects, analyze deployment sites,
            evaluate environmental conditions, generate AI-powered reports,
            forecast renewable energy potential, and optimize investment
            decisions—all from one platform.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">

            <div className="bg-green-50 rounded-2xl p-6">
              <h3 className="font-bold text-xl text-green-700">
                📁 Projects
              </h3>

              <p className="mt-3 text-gray-600">
                Create and manage renewable energy projects.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-bold text-xl text-blue-700">
                📍 Sites
              </h3>

              <p className="mt-3 text-gray-600">
                Add project sites and perform AI-based analysis.
              </p>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-6">
              <h3 className="font-bold text-xl text-yellow-700">
                📊 Reports
              </h3>

              <p className="mt-3 text-gray-600">
                Generate renewable energy reports and investment insights.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;