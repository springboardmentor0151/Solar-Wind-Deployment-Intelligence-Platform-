import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

export default function AnalyticsCharts({
  temperature,
  windSpeed,
  rainfall,
  solarRadiation,
  elevation,
  landArea,
}) {
  const weatherData = [
    {
      name: "Temp",
      value: Number(temperature),
    },
    {
      name: "Wind",
      value: Number(windSpeed),
    },
    {
      name: "Solar",
      value: Number(solarRadiation),
    },
    {
      name: "Rain",
      value: Number(rainfall),
    },
  ];

  const radarData = [
    {
      subject: "Solar",
      value: Number(solarRadiation),
    },
    {
      subject: "Wind",
      value: Number(windSpeed) * 10,
    },
    {
      subject: "Elevation",
      value: Number(elevation) / 10,
    },
    {
      subject: "Area",
      value: Number(landArea) * 20,
    },
  ];

  const pieData = [
    {
      name: "Solar",
      value: Number(solarRadiation),
    },
    {
      name: "Wind",
      value: Number(windSpeed) * 10,
    },
  ];

  const COLORS = ["#f59e0b", "#2563eb"];

  return (
    <div
      style={{
        marginTop: 40,
      }}
    >
      <h2
        style={{
          marginBottom: 25,
          color: "#0f766e",
          fontSize: "28px",
        }}
      >
        📊 Resource Analytics
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))",
          gap: "25px",
        }}
      >
        {/* Weather Analytics */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "18px",
            boxShadow: "0 10px 25px rgba(0,0,0,.08)",
          }}
        >
          <h3
            style={{
              color: "#0f766e",
              marginBottom: 15,
            }}
          >
            📈 Weather Analytics
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weatherData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar
                dataKey="value"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "18px",
            boxShadow: "0 10px 25px rgba(0,0,0,.08)",
          }}
        >
          <h3
            style={{
              color: "#0f766e",
              marginBottom: 15,
            }}
          >
            🌍 Renewable Potential
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />

              <PolarAngleAxis dataKey="subject" />

              <PolarRadiusAxis />

              <Radar
                dataKey="value"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />

              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "18px",
            boxShadow: "0 10px 25px rgba(0,0,0,.08)",
          }}
        >
          <h3
            style={{
              color: "#0f766e",
              marginBottom: 15,
            }}
          >
            ☀ Solar vs Wind
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={85}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendation */}

      <div
        style={{
          marginTop: "30px",
          background: "#ffffff",
          padding: "25px",
          borderRadius: "18px",
          boxShadow: "0 10px 25px rgba(0,0,0,.08)",
        }}
      >
        <h3
          style={{
            color: "#0f766e",
            marginBottom: "15px",
          }}
        >
          🤖 AI Recommendation
        </h3>

        <p
          style={{
            fontSize: "17px",
            lineHeight: "1.7",
            color: "#374151",
          }}
        >
          {Number(solarRadiation) > Number(windSpeed)
            ? "This location has strong solar radiation. Solar energy installation is recommended for higher renewable energy generation."
            : "This location has comparatively better wind resources. Wind energy installation is recommended for improved power generation."}
        </p>
      </div>
    </div>
  );
}