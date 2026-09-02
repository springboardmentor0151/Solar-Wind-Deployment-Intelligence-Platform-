function DashboardCards({ result }) {
  const cards = [
    {
      title: "Location",
      value: result?.location_name || "--",
      icon: "📍",
      color: "#2563eb",
      unit: result
        ? `${Number(result.latitude).toFixed(4)}, ${Number(
            result.longitude
          ).toFixed(4)}`
        : "Select a location",
    },
    {
      title: "Solar Irradiance",
      value: result
        ? Number(result.solar_irradiance).toFixed(2)
        : "--",
      icon: "☀️",
      color: "#f59e0b",
      unit: "kWh/m²/day",
    },
    {
      title: "Humidity",
      value: result
        ? `${Number(result.humidity).toFixed(0)}%`
        : "--",
      icon: "💧",
      color: "#0891b2",
      unit: "Relative humidity",
    },
    {
      title: "Temperature",
      value: result
        ? `${Number(result.temperature).toFixed(1)}°C`
        : "--",
      icon: "🌡️",
      color: "#ef4444",
      unit: "Current temperature",
    },
    {
      title: "Wind Speed",
      value: result
        ? Number(result.wind_speed).toFixed(2)
        : "--",
      icon: "💨",
      color: "#059669",
      unit: "m/s",
    },
    {
      title: "Elevation",
      value: result
        ? Number(result.elevation).toFixed(0)
        : "--",
      icon: "⛰️",
      color: "#7c3aed",
      unit: "meters",
    },
    {
      title: "Solar Score",
      value: result
        ? `${Number(result.solar_score).toFixed(1)}`
        : "--",
      icon: "☀️",
      color: "#ea580c",
      unit: "out of 100",
    },
    {
      title: "Wind Score",
      value: result
        ? `${Number(result.wind_score).toFixed(1)}`
        : "--",
      icon: "🌬️",
      color: "#4f46e5",
      unit: "out of 100",
    },
  ];

  return (
    <div className="dashboard-cards">
      {cards.map((card, index) => (
        <div
          className="dashboard-stat-card"
          key={index}
          style={{
            "--card-color": card.color,
          }}
        >
          <div className="dashboard-stat-header">
            <span className="dashboard-stat-icon">
              {card.icon}
            </span>

            <span className="dashboard-stat-title">
              {card.title}
            </span>
          </div>

          <div className="dashboard-stat-value">
            {card.value}
          </div>

          <div className="dashboard-stat-unit">
            {card.unit}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardCards;