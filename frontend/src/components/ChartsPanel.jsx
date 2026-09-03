import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip
} from "chart.js";
import { Bar, Doughnut, Line, Radar } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LineElement, LinearScale, PointElement, RadialLinearScale, Tooltip);

const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } };

export default function ChartsPanel({ prediction }) {
  if (!prediction) return null;
  const forecast = prediction.forecast || [];
  const months = forecast.map((item) => item.month);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="h-80 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Solar Gauge</h3>
        <Doughnut options={options} data={{ labels: ["Solar Potential", "Remaining"], datasets: [{ data: [prediction.solar_potential, 100 - prediction.solar_potential], backgroundColor: ["#f59e0b", "#e2e8f0"] }] }} />
      </div>
      <div className="h-80 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Wind Gauge</h3>
        <Doughnut options={options} data={{ labels: ["Wind Potential", "Remaining"], datasets: [{ data: [prediction.wind_potential, 100 - prediction.wind_potential], backgroundColor: ["#0ea5e9", "#e2e8f0"] }] }} />
      </div>
      <div className="h-80 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Suitability Radar</h3>
        <Radar
          options={options}
          data={{
            labels: ["Solar", "Wind", "Suitability", "Investment", "Confidence"],
            datasets: [{ label: "Score", data: [prediction.solar_potential, prediction.wind_potential, prediction.suitability_score, prediction.investment_score, prediction.confidence_score], backgroundColor: "rgba(16,185,129,.18)", borderColor: "#10b981" }]
          }}
        />
      </div>
      <div className="h-80 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Annual Metrics</h3>
        <Bar options={options} data={{ labels: ["Capacity Factor", "Performance Ratio", "ROI", "Suitability"], datasets: [{ label: "Value", data: [prediction.capacity_factor, prediction.performance_ratio, prediction.roi_estimate, prediction.suitability_score], backgroundColor: ["#06b6d4", "#10b981", "#64748b", "#84cc16"] }] }} />
      </div>
      <div className="h-80 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
        <h3 className="font-semibold">Monthly Generation Forecast</h3>
        <Line
          options={options}
          data={{
            labels: months,
            datasets: [
              { label: "Solar MWh", data: forecast.map((item) => item.solar_mwh), borderColor: "#f59e0b", backgroundColor: "#f59e0b" },
              { label: "Wind MWh", data: forecast.map((item) => item.wind_mwh), borderColor: "#0ea5e9", backgroundColor: "#0ea5e9" },
              { label: "Hybrid MWh", data: forecast.map((item) => item.hybrid_mwh), borderColor: "#10b981", backgroundColor: "#10b981" }
            ]
          }}
        />
      </div>
    </div>
  );
}
