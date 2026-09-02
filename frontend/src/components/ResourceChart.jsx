import { useMemo } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

function ResourceChart({ result }) {
  const barData = useMemo(() => {
    if (!result) return null;

    return {
      labels: [
        "Solar Score",
        "Wind Score",
        "Temperature",
        "Humidity",
        "Wind Speed",
        "Solar Irradiance",
      ],

      datasets: [
        {
          label: "Environmental Analysis",

          data: [
            result.solar_score,
            result.wind_score,
            result.temperature,
            result.humidity,
            result.wind_speed,
            result.solar_irradiance,
          ],

          backgroundColor: [
            "#f59e0b",
            "#10b981",
            "#ef4444",
            "#3b82f6",
            "#06b6d4",
            "#facc15",
          ],

          borderRadius: 8,
        },
      ],
    };
  }, [result]);

  const doughnutData = useMemo(() => {
    if (!result) return null;

    return {
      labels: ["Solar Score", "Wind Score"],

      datasets: [
        {
          data: [
            result.solar_score,
            result.wind_score,
          ],

          backgroundColor: [
            "#f59e0b",
            "#10b981",
          ],

          hoverOffset: 10,
        },
      ],
    };
  }, [result]);

  const lineData = useMemo(() => {
    if (!result) return null;

    return {
      labels: [
        "Temperature",
        "Humidity",
        "Wind",
        "Solar",
      ],

      datasets: [
        {
          label: "Environment Trend",

          data: [
            result.temperature,
            result.humidity,
            result.wind_speed,
            result.solar_irradiance,
          ],

          borderColor: "#2563eb",
          backgroundColor: "#93c5fd",

          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [result]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "top",
        },
      },
    }),
    []
  );

  if (!result) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "30px",
        display: "grid",
        gap: "20px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* BAR CHART */}

      <div
        style={{
          background: "#fff",
          padding: "15px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,.08)",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>
          📈 Renewable Energy Analytics
        </h2>

        <div
          style={{
            height: "280px",
            width: "100%",
            position: "relative",
          }}
        >
          <Bar
            data={barData}
            options={options}
          />
        </div>
      </div>

      {/* BOTTOM CHARTS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* DOUGHNUT */}

        <div
          style={{
            background: "#fff",
            padding: "10px",
            borderRadius: "12px",
            boxShadow:
              "0 4px 10px rgba(0,0,0,.08)",
            textAlign: "center",
            minWidth: 0,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <h3>☀ Solar vs Wind Score</h3>

          <div
            style={{
              height: "320px",
              width: "100%",
              maxWidth: "320px",
              margin: "20px auto",
              position: "relative",
            }}
          >
            <Doughnut
              data={doughnutData}
              options={options}
            />
          </div>
        </div>

        {/* LINE */}

        <div
          style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "12px",
            boxShadow:
              "0 4px 10px rgba(0,0,0,.08)",
            minWidth: 0,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <h3>📊 Environmental Trend</h3>

          <div
            style={{
              height: "320px",
              width: "100%",
              position: "relative",
            }}
          >
            <Line
              data={lineData}
              options={options}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceChart;