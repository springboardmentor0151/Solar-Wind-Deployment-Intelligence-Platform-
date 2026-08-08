import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function ScoreChart({ title, score }) {

  // Choose color based on score
  const getColor = () => {
    if (score >= 90) return "#22c55e";   // Green
    if (score >= 75) return "#3b82f6";   // Blue
    if (score >= 60) return "#f59e0b";   // Orange
    return "#ef4444";                    // Red
  };

  const chartColor = getColor();

  const data = {
    labels: ["Score", "Remaining"],
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [
          chartColor,
          "#e5e7eb",
        ],
        borderColor: [
          chartColor,
          "#e5e7eb",
        ],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: "70%",
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">

      <h2 className="text-2xl font-bold text-center mb-5">
        {title}
      </h2>

      <Doughnut
        data={data}
        options={options}
      />

      <h1
        className="text-center text-5xl font-bold mt-6"
        style={{ color: chartColor }}
      >
        {score}
      </h1>

      <div className="flex justify-center mt-4">
        <span
          className="px-4 py-2 rounded-full text-white font-semibold"
          style={{ backgroundColor: chartColor }}
        >
          {score >= 90
            ? "Excellent"
            : score >= 75
            ? "Good"
            : score >= 60
            ? "Average"
            : "Poor"}
        </span>
      </div>

    </div>
  );
}

export default ScoreChart;