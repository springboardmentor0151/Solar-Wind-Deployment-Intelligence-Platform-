import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const locationData = [
  { location: "Delhi", projects: 5 },
  { location: "Rajasthan", projects: 8 },
  { location: "Gujarat", projects: 4 },
  { location: "Karnataka", projects: 6 },
];

const energyData = [
  { name: "Solar", value: 65 },
  { name: "Wind", value: 35 },
];

const forecastData = [
  { month: "Jan", generation: 20 },
  { month: "Feb", generation: 28 },
  { month: "Mar", generation: 35 },
  { month: "Apr", generation: 42 },
  { month: "May", generation: 48 },
  { month: "Jun", generation: 55 },
];

const COLORS = ["#16a34a", "#2563eb"];

function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">

      {/* Projects by Location */}

      <div className="bg-white rounded-2xl shadow-lg p-6">

        <h2 className="text-xl font-bold mb-5">
          Projects by Location
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={locationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="location" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="projects" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>

      </div>

      {/* Solar vs Wind */}

      <div className="bg-white rounded-2xl shadow-lg p-6">

        <h2 className="text-xl font-bold mb-5">
          Renewable Energy Mix
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={energyData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {energyData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

      </div>

      {/* Forecast */}

      <div className="bg-white rounded-2xl shadow-lg p-6 xl:col-span-2">

        <h2 className="text-xl font-bold mb-5">
          Monthly Energy Forecast
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="generation"
              stroke="#2563eb"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default DashboardCharts;