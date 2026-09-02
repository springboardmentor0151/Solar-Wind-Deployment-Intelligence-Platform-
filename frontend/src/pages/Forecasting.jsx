import { useEffect, useState } from "react";

import Layout from "../components/Layout";
import API from "../services/api";

import "./Forecasting.css";

function Forecasting() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [forecast, setForecast] = useState(null);

  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // LOAD SITES
  // ========================================

  const loadSites = async () => {
    try {
      setLoadingSites(true);
      setError("");

      const response = await API.get("/sites/");

      setSites(response.data);

      if (response.data.length > 0) {
        setSelectedSiteId(String(response.data[0].id));
      }
    } catch (error) {
      console.error("Load Sites Error:", error);

      setError(
        error.response?.data?.detail ||
        "Unable to load saved sites."
      );
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  // ========================================
  // LOAD FORECAST
  // ========================================

  const loadForecast = async () => {
    if (!selectedSiteId) {
      setError("Please select a site.");
      return;
    }

    try {
      setLoadingForecast(true);
      setError("");

      const response = await API.get(
        `/forecast/site/${selectedSiteId}`
      );

      setForecast(response.data);
    } catch (error) {
      console.error("Forecast Error:", error);

      setForecast(null);

      setError(
        error.response?.data?.detail ||
        "Unable to generate forecast."
      );
    } finally {
      setLoadingForecast(false);
    }
  };

  // ========================================
  // AUTO LOAD FORECAST
  // ========================================

  useEffect(() => {
    if (selectedSiteId) {
      loadForecast();
    }
  }, [selectedSiteId]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <Layout>
      <div className="forecasting-page">

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="forecasting-header">
          <div>
            <h1>
              📈 Renewable Energy Forecasting
            </h1>

            <p>
              12-month solar, wind and renewable
              energy forecasting analysis
            </p>
          </div>
        </div>


        {/* ================================= */}
        {/* SITE CONTROL */}
        {/* ================================= */}

        <div className="forecast-control">

          <div>
            <h2>
              🔍 Select Analysis Site
            </h2>

            <p>
              Choose a saved site to generate its
              renewable energy forecast.
            </p>
          </div>

          <div className="forecast-control-row">

            <select
              value={selectedSiteId}
              onChange={(e) =>
                setSelectedSiteId(e.target.value)
              }
              disabled={loadingSites}
            >

              <option value="">
                {loadingSites
                  ? "Loading sites..."
                  : "Select a site"}
              </option>

              {sites.map((site) => (
                <option
                  key={site.id}
                  value={site.id}
                >
                  {site.location_name ||
                    `Site #${site.id}`}
                </option>
              ))}

            </select>

            <button
              onClick={loadForecast}
              disabled={
                loadingForecast ||
                !selectedSiteId
              }
            >
              {loadingForecast
                ? "⏳ Forecasting..."
                : "📊 Generate Forecast"}
            </button>

          </div>

          {error && (
            <div className="forecast-error">
              ❌ {error}
            </div>
          )}

        </div>


        {/* ================================= */}
        {/* FORECAST RESULT */}
        {/* ================================= */}

        {forecast && (

          <>
            {/* SITE */}
            <div className="forecast-site">

              <h2>
                📍 {forecast.location_name}
              </h2>

              <span>
                Site #{forecast.site_id}
              </span>

            </div>


            {/* ================================= */}
            {/* SUMMARY CARDS */}
            {/* ================================= */}

            <div className="forecast-summary">

              <div className="forecast-card solar">

                <span>
                  ☀ Solar Forecast
                </span>

                <strong>
                  {forecast.solar_forecast}
                </strong>

                <small>
                  /100
                </small>

              </div>


              <div className="forecast-card wind">

                <span>
                  💨 Wind Forecast
                </span>

                <strong>
                  {forecast.wind_forecast}
                </strong>

                <small>
                  /100
                </small>

              </div>


              <div className="forecast-card renewable">

                <span>
                  ⚡ Renewable Forecast
                </span>

                <strong>
                  {forecast.renewable_forecast}
                </strong>

                <small>
                  /100
                </small>

              </div>


              <div className="forecast-card trend">

                <span>
                  🎯 Forecast Trend
                </span>

                <strong>
                  {forecast.forecast_trend}
                </strong>

              </div>

            </div>


            {/* ================================= */}
            {/* MONTHLY FORECAST */}
            {/* ================================= */}

            <div className="monthly-section">

              <div className="section-heading">

                <div>
                  <h2>
                    📊 12-Month Forecast
                  </h2>

                  <p>
                    Expected renewable energy
                    potential throughout the year.
                  </p>
                </div>

              </div>


              <div className="monthly-list">

                {forecast.monthly_forecast.map(
                  (month) => (

                    <div
                      className="month-row"
                      key={month.month}
                    >

                      <div className="month-name">
                        Month {month.month}
                      </div>


                      <div className="month-data">

                        <div className="metric">

                          <span>
                            ☀ Solar
                          </span>

                          <div className="bar-container">
                            <div
                              className="solar-bar"
                              style={{
                                width: `${Math.min(
                                  month.solar,
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <strong>
                            {month.solar}
                          </strong>

                        </div>


                        <div className="metric">

                          <span>
                            💨 Wind
                          </span>

                          <div className="bar-container">
                            <div
                              className="wind-bar"
                              style={{
                                width: `${Math.min(
                                  month.wind,
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <strong>
                            {month.wind}
                          </strong>

                        </div>


                        <div className="metric">

                          <span>
                            ⚡ Renewable
                          </span>

                          <div className="bar-container">
                            <div
                              className="renewable-bar"
                              style={{
                                width: `${Math.min(
                                  month.renewable,
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <strong>
                            {month.renewable}
                          </strong>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* ================================= */}
            {/* FORECAST INTERPRETATION */}
            {/* ================================= */}

            <div className="forecast-recommendation">

              <h2>
                💡 Forecast Interpretation
              </h2>

              <p>
                This site currently shows a{" "}
                <strong>
                  {forecast.forecast_trend}
                </strong>{" "}
                renewable energy forecast.
              </p>

              <p>
                Solar forecast:{" "}
                <strong>
                  {forecast.solar_forecast}/100
                </strong>
                {" • "}
                Wind forecast:{" "}
                <strong>
                  {forecast.wind_forecast}/100
                </strong>
              </p>

              <p>
                The forecast should be used as a
                planning indicator together with
                site suitability, grid connectivity,
                land availability and financial
                feasibility assessments.
              </p>

            </div>

          </>

        )}

      </div>
    </Layout>
  );
}

export default Forecasting;