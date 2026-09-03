import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { FiActivity, FiBatteryCharging, FiCheckCircle, FiDollarSign, FiMapPin, FiSun, FiTrendingUp, FiWind, FiZap } from "react-icons/fi";

import { getDashboard } from "../api/projects.js";
import MetricCard from "../components/MetricCard.jsx";

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const emptyDashboard = {
  total_projects: 0,
  total_analyzed_sites: 0,
  suitable_sites: 0,
  highly_suitable_sites: 0,
  average_site_score: 0,
  solar_potential: null,
  wind_potential: null,
  estimated_capacity_mw: 0,
  estimated_energy_generation_mwh: 0,
  estimated_investment: "N/A",
  estimated_roi: null,
  recommended_technology: "N/A",
  solar_capacity: 0,
  wind_capacity: 0,
  suitability_distribution: { High: 0, Medium: 0, Low: 0, Unsuitable: 0, "No data": 0 },
  technology_comparison: { Solar: 0, Wind: 0, Hybrid: 0 },
  environmental_averages: {},
  investment_analytics: {},
  latest_projects: [],
  recent_reports: []
};

const pct = (value) => (value === null || value === undefined ? "N/A" : `${value}%`);
const mwh = (value) => (value ? `${Math.round(value).toLocaleString()} MWh` : "0 MWh");

export default function Home() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then((data) => setDashboard({ ...emptyDashboard, ...data }))
      .catch(() => {
        setError("Unable to load executive analytics. Please try again.");
        setDashboard(emptyDashboard);
      });
  }, []);

  const distribution = dashboard.suitability_distribution || emptyDashboard.suitability_distribution;
  const technology = dashboard.technology_comparison || emptyDashboard.technology_comparison;
  const environmental = dashboard.environmental_averages || {};

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-canopy-700">Executive Dashboard</p>
        <h2 className="mt-2 text-3xl font-bold">Renewable Deployment Intelligence</h2>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FiActivity} label="Total Projects" value={dashboard.total_projects} />
        <MetricCard icon={FiMapPin} label="Analyzed Sites" value={dashboard.total_analyzed_sites} tone="text-ocean-700 bg-ocean-50" />
        <MetricCard icon={FiCheckCircle} label="Suitable Sites" value={dashboard.suitable_sites} />
        <MetricCard icon={FiTrendingUp} label="Highly Suitable" value={dashboard.highly_suitable_sites} tone="text-canopy-700 bg-canopy-50" />
        <MetricCard icon={FiSun} label="Solar Potential" value={pct(dashboard.solar_potential)} tone="text-amber-700 bg-amber-50" />
        <MetricCard icon={FiWind} label="Wind Potential" value={pct(dashboard.wind_potential)} tone="text-sky-700 bg-sky-50" />
        <MetricCard icon={FiBatteryCharging} label="Average Site Score" value={pct(dashboard.average_site_score)} />
        <MetricCard icon={FiZap} label="Estimated Capacity" value={`${dashboard.estimated_capacity_mw} MW`} />
        <MetricCard icon={FiZap} label="Estimated Generation" value={mwh(dashboard.estimated_energy_generation_mwh)} />
        <MetricCard icon={FiDollarSign} label="Estimated Investment" value={dashboard.estimated_investment || "N/A"} />
        <MetricCard icon={FiTrendingUp} label="Estimated ROI" value={pct(dashboard.estimated_roi)} />
        <MetricCard icon={FiCheckCircle} label="Recommended Technology" value={dashboard.recommended_technology || "N/A"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Suitability Distribution</h3>
          <Doughnut
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
            data={{
              labels: Object.keys(distribution),
              datasets: [{ data: Object.values(distribution), backgroundColor: ["#16a34a", "#eab308", "#f97316", "#dc2626", "#64748b"] }]
            }}
          />
        </div>
        <div className="h-80 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Technology Comparison</h3>
          <Bar
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
            data={{ labels: Object.keys(technology), datasets: [{ data: Object.values(technology), backgroundColor: ["#f59e0b", "#0ea5e9", "#10b981"] }] }}
          />
        </div>
        <div className="h-80 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Environmental Factors</h3>
          <Bar
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
            data={{
              labels: ["Irradiance", "Wind", "Temp", "Rainfall", "Elevation", "Slope"],
              datasets: [{
                data: [
                  environmental.solar_irradiance || 0,
                  environmental.wind_speed || 0,
                  environmental.temperature || 0,
                  environmental.rainfall || 0,
                  environmental.elevation || 0,
                  environmental.land_slope || 0
                ],
                backgroundColor: "#0f766e"
              }]
            }}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Latest Projects</h3>
          <div className="mt-4 space-y-3">
            {dashboard.latest_projects.length ? dashboard.latest_projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-slate-500">{project.region} - {project.project_type}</p>
                </div>
                <p className="font-bold text-canopy-700">{project.suitability_score ?? "N/A"}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No projects available.</p>}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Investment Analytics</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950"><dt className="text-sm text-slate-500">Average ROI</dt><dd className="mt-1 text-xl font-bold">{pct(dashboard.investment_analytics?.average_roi)}</dd></div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950"><dt className="text-sm text-slate-500">Investment Score</dt><dd className="mt-1 text-xl font-bold">{pct(dashboard.investment_analytics?.average_investment_score)}</dd></div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950"><dt className="text-sm text-slate-500">Capacity Factor</dt><dd className="mt-1 text-xl font-bold">{pct(dashboard.investment_analytics?.average_capacity_factor)}</dd></div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950"><dt className="text-sm text-slate-500">Annual Generation</dt><dd className="mt-1 text-xl font-bold">{mwh(dashboard.investment_analytics?.estimated_annual_generation_mwh)}</dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
