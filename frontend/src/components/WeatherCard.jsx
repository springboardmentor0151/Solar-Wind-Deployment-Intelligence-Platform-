function WeatherCard({ result }) {
  return (
    <div className="dashboard-card">

      <h2>🌤 Weather</h2>

      <h1>
        {result
          ? `${result.temperature}°C`
          : "--"}
      </h1>

      {result ? (
        <>
          <p>
            💧 Humidity: {result.humidity}%
          </p>

          <p>
            💨 Wind: {result.wind_speed} m/s
          </p>
        </>
      ) : (
        <p>
          Select a location on the map
        </p>
      )}

    </div>
  );
}

export default WeatherCard;