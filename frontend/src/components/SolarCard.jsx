function SolarCard({ result }) {
  return (
    <div className="dashboard-card">

      <h2>☀ Solar Potential</h2>

      <h1>
        {result ? result.solar_irradiance : "--"}
      </h1>

      <p>
        {result
          ? "kWh/m²/day"
          : "Select a location on the map"}
      </p>

      {result && (
        <strong>
          Score: {result.solar_score}/100
        </strong>
      )}

    </div>
  );
}

export default SolarCard;