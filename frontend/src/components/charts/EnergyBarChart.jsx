import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const energyData = [
  { month: "Jan", energy: 220 },
  { month: "Feb", energy: 260 },
  { month: "Mar", energy: 310 },
  { month: "Apr", energy: 350 },
  { month: "May", energy: 410 },
  { month: "Jun", energy: 460 },
  { month: "Jul", energy: 440 },
  { month: "Aug", energy: 390 },
  { month: "Sep", energy: 340 },
  { month: "Oct", energy: 290 },
  { month: "Nov", energy: 240 },
  { month: "Dec", energy: 210 },
];

export default function EnergyOutputChart() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Monthly Energy Output
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis
              label={{
                value: "kWh",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip />

            <Bar
              dataKey="energy"
              fill="#10B981"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}