import { useState } from "react";
import API from "../services/api";

function ResultCard({ result }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveSite = async () => {
    if (!result || saving || saved) {
      return;
    }

    setSaving(true);

    try {
      const siteData = {
        location_name:
          result.location_name || "Unknown Location",

        latitude: parseFloat(result.latitude),
        longitude: parseFloat(result.longitude),

        solar_score: parseFloat(result.solar_score),
        wind_score: parseFloat(result.wind_score),

        wind_potential: parseFloat(result.wind_potential),

        recommendation: result.recommendation,
      };

      console.log("Saving site:", siteData);

      await API.post("/sites/", siteData);

      setSaved(true);

      alert("Site saved successfully!");

    } catch (error) {
      console.error("Save site error:", error);

      const detail =
        error.response?.data?.detail;

      alert(
        detail
          ? `Error saving site:\n${detail}`
          : "Error saving site. Check Console."
      );

    } finally {
      setSaving(false);
    }
  };

  if (!result) {
    return (
      <div className="result-card">

        <div className="result-header">
          <h2>📊 Renewable Energy Analysis</h2>

          <p>
            Select a location on the map to view
            the analysis.
          </p>
        </div>

        <div className="result-empty">

          <div className="empty-icon">
            📍
          </div>

          <h3>
            No Analysis Available
          </h3>

          <p>
            Click anywhere on the map to analyze
            a location.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="result-card">

      {/* HEADER */}

      <div className="result-header">

        <h2>
          📊 Renewable Energy Analysis
        </h2>

        <p>
          Environmental, terrain & renewable
          energy statistics
        </p>

      </div>


      {/* ============================= */}
      {/* SELECTED LOCATION */}
      {/* ============================= */}

      <div className="selected-location-card">

        <div className="selected-location-icon">
          📍
        </div>

        <div className="selected-location-content">

          <span className="selected-location-label">
            SELECTED LOCATION
          </span>

          <h2>
            {result.location_name ||
              "Unknown Location"}
          </h2>

          <div className="coordinates">

            <span>
              Latitude:
              <strong>
                {Number(result.latitude).toFixed(5)}
              </strong>
            </span>

            <span>
              Longitude:
              <strong>
                {Number(result.longitude).toFixed(5)}
              </strong>
            </span>

          </div>

        </div>

      </div>


      {/* ============================= */}
      {/* LOCATION INFORMATION */}
      {/* ============================= */}

      <div className="result-section-card">

        <h3>
          📍 Location Information
        </h3>

        <div className="result-grid">

          <div className="result-item">

            <span>
              Location Name
            </span>

            <strong>
              {result.location_name ||
                "Unknown Location"}
            </strong>

          </div>

          <div className="result-item">

            <span>
              Latitude
            </span>

            <strong>
              {Number(result.latitude).toFixed(5)}
            </strong>

          </div>

          <div className="result-item">

            <span>
              Longitude
            </span>

            <strong>
              {Number(result.longitude).toFixed(5)}
            </strong>

          </div>

          <div className="result-item">

            <span>
              Elevation
            </span>

            <strong>
              {result.elevation}
            </strong>

            <small>
              meters
            </small>

          </div>

        </div>

      </div>


      {/* ============================= */}
      {/* WEATHER */}
      {/* ============================= */}

      <div className="result-section-card">

        <h3>
          🌤 Weather Conditions
        </h3>

        <div className="result-grid">

          <div className="result-item">

            <span>
              Temperature
            </span>

            <strong>
              {result.temperature} °C
            </strong>

          </div>

          <div className="result-item">

            <span>
              Humidity
            </span>

            <strong>
              {result.humidity}%
            </strong>

          </div>

          <div className="result-item">

            <span>
              Wind Speed
            </span>

            <strong>
              {result.wind_speed} m/s
            </strong>

          </div>

        </div>

      </div>


      {/* ============================= */}
      {/* SOLAR */}
      {/* ============================= */}

      <div className="result-section-card">

        <h3>
          ☀ Solar Potential
        </h3>

        <div className="result-grid">

          <div className="result-item">

            <span>
              Solar Irradiance
            </span>

            <strong>
              {result.solar_irradiance}
            </strong>

            <small>
              kWh/m²/day
            </small>

          </div>

          <div className="result-item">

            <span>
              Solar Score
            </span>

            <strong>
              {result.solar_score}/100
            </strong>

          </div>

          <div className="result-item">

            <span>
              Potential
            </span>

            <strong
              className={
                result.solar_score >= 70
                  ? "score-good"
                  : "score-average"
              }
            >
              {result.solar_score >= 70
                ? "Good"
                : result.solar_score >= 50
                ? "Moderate"
                : "Low"}
            </strong>

          </div>

        </div>

      </div>


      {/* ============================= */}
      {/* WIND */}
      {/* ============================= */}

      <div className="result-section-card">

        <h3>
          💨 Wind Potential
        </h3>

        <div className="result-grid">

          <div className="result-item">

            <span>
              Wind Speed
            </span>

            <strong>
              {result.wind_speed} m/s
            </strong>

          </div>

          <div className="result-item">

            <span>
              Wind Score
            </span>

            <strong>
              {result.wind_score}/100
            </strong>

          </div>

          <div className="result-item">

            <span>
              Wind Potential
            </span>

            <strong>
              {result.wind_potential}
            </strong>

            <small>
              estimated potential
            </small>

          </div>

        </div>

      </div>


      {/* ============================= */}
      {/* RECOMMENDATION */}
      {/* ============================= */}

      <div className="recommendation-card">

        <h3>
          ⭐ Final Recommendation
        </h3>

        <h2>
          {result.recommendation}
        </h2>

        <p>
          Solar Score: {result.solar_score}/100
          {" • "}
          Wind Score: {result.wind_score}/100
        </p>

        <button
          className="save-site-button"
          onClick={saveSite}
          disabled={saving || saved}
        >
          {saving
            ? "Saving..."
            : saved
            ? "✓ Site Saved"
            : "💾 Save This Site"}
        </button>

      </div>

    </div>
  );
}

export default ResultCard;