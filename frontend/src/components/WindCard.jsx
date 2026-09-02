function WindCard({ result }) {
  return (
    <div className="dashboard-card">

      <h2>🌬 Wind Potential</h2>

      <h1>
        {result ? result.wind_speed : "--"}
      </h1>

      <p>
        {result
          ? "m/s"
          : "Select a location on the map"}
      </p>

      {result && (
        <strong>
          Score: {result.wind_score}/100
        </strong>
      )}

    </div>
  );
}

export default WindCard;