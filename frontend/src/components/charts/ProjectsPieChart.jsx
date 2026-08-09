import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const data = [
  { name: "Solar Projects", value: 12 },
  { name: "Wind Projects", value: 8 },
  { name: "Hybrid Projects", value: 5 },
];

const COLORS = ["#F59E0B", "#2563EB", "#10B981"];

export default function ProjectsPieChart() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 h-[500px]">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">
        Project Distribution
      </h2>

      {/* Pie Chart */}
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="47%"
              outerRadius={120}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex justify-center items-center gap-10 mt-8 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-amber-500"></span>
          <span className="text-base font-semibold text-slate-700">
            Solar
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-600"></span>
          <span className="text-base font-semibold text-slate-700">
            Wind
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-emerald-500"></span>
          <span className="text-base font-semibold text-slate-700">
            Hybrid
          </span>
        </div>
      </div>
    </div>
  );
}