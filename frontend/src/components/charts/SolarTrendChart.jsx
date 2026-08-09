import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", irradiance: 4.2 },
  { month: "Feb", irradiance: 4.8 },
  { month: "Mar", irradiance: 5.5 },
  { month: "Apr", irradiance: 6.1 },
  { month: "May", irradiance: 6.4 },
  { month: "Jun", irradiance: 6.8 },
  { month: "Jul", irradiance: 6.2 },
  { month: "Aug", irradiance: 5.9 },
  { month: "Sep", irradiance: 5.4 },
  { month: "Oct", irradiance: 5.0 },
  { month: "Nov", irradiance: 4.5 },
  { month: "Dec", irradiance: 4.1 },
];

export default function SolarTrendChart() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <h2 className="text-lg font-semibold mb-4">
        Solar Irradiance Trend
      </h2>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="irradiance"
              stroke="#f59e0b"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}