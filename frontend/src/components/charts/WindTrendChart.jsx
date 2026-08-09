import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const windData = [
  { month: "Jan", wind: 3.2 },
  { month: "Feb", wind: 3.8 },
  { month: "Mar", wind: 4.5 },
  { month: "Apr", wind: 5.1 },
  { month: "May", wind: 5.8 },
  { month: "Jun", wind: 6.2 },
  { month: "Jul", wind: 5.9 },
  { month: "Aug", wind: 5.3 },
  { month: "Sep", wind: 4.8 },
  { month: "Oct", wind: 4.4 },
  { month: "Nov", wind: 3.9 },
  { month: "Dec", wind: 3.4 },
];

export default function WindTrendChart() {
  return (
    <div className="bg-white rounded-3xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Wind Speed Trend
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={windData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis
              label={{
                value: "m/s",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="wind"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{
                r: 5,
                fill: "#2563EB",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 7,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}