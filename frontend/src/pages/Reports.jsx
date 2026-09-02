import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import "./Reports.css";

function Reports() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // LOAD SITES
  // ========================================

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/sites/");

      setSites(response.data || []);

      if (response.data?.length > 0) {
        setSelectedSite(response.data[0]);
      }
    } catch (err) {
      console.error("Reports sites error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load sites."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // ANALYZE SITE
  // ========================================

  const analyzeSite = async () => {
    if (!selectedSite) {
      setError("Please select a site.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");

      const response = await API.get(
        `/analysis/site/${selectedSite.id}`
      );

      setAnalysis(response.data);
    } catch (err) {
      console.error("Report analysis error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to analyze selected site."
      );

      setAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  };

  // ========================================
  // DOWNLOAD REPORT
  // ========================================

  const downloadReport = () => {
    if (!selectedSite) {
      setError("Please select a site first.");
      return;
    }

    const report = `
SOLAR & WIND DEPLOYMENT INTELLIGENCE PLATFORM
===============================================

SITE DEPLOYMENT REPORT

Site ID:
${selectedSite.id}

Location:
${selectedSite.location_name || "Selected Location"}

Latitude:
${selectedSite.latitude}

Longitude:
${selectedSite.longitude}

-----------------------------------------------
RESOURCE ASSESSMENT
-----------------------------------------------

Solar Score:
${selectedSite.solar_score ?? 0}/100

Wind Score:
${selectedSite.wind_score ?? 0}/100

Wind Potential:
${selectedSite.wind_potential ?? 0}

Recommendation:
${selectedSite.recommendation || "Not specified"}

-----------------------------------------------
ENVIRONMENTAL ANALYSIS
-----------------------------------------------

Solar Irradiance:
${analysis?.solar_irradiance ?? "N/A"} kWh/m²/day

Temperature:
${analysis?.temperature ?? "N/A"} °C

Wind Speed:
${analysis?.wind_speed ?? "N/A"} m/s

Humidity:
${analysis?.humidity ?? "N/A"} %

-----------------------------------------------
DEPLOYMENT RECOMMENDATION
-----------------------------------------------

${selectedSite.recommendation || "Further assessment required."}

-----------------------------------------------
END OF REPORT
-----------------------------------------------
`;

    const blob = new Blob([report], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download =
      `site-${selectedSite.id}-deployment-report.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <Layout>
        <div className="reports-page">
          <div className="investment-loading">
            ⏳ Loading deployment reports...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="reports-page">

        {/* HEADER */}

        <div className="reports-header">
          <h1>📄 Deployment Reports</h1>

          <p>
            Generate renewable-energy site intelligence
            and deployment reports.
          </p>
        </div>


        {/* ERROR */}

        {error && (
          <div className="investment-error">
            ❌ {error}
          </div>
        )}


        {/* SITE SELECTOR */}

        <div
          className="report-section"
          style={{
            marginBottom: "25px",
          }}
        >
          <h2>📍 Select Site</h2>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >

            <select
              value={selectedSite?.id || ""}
              onChange={(e) => {
                const site = sites.find(
                  (item) =>
                    String(item.id) === e.target.value
                );

                setSelectedSite(site);
                setAnalysis(null);
              }}
              style={{
                flex: 1,
                minWidth: "250px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
              }}
            >

              <option value="">
                Select a site
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
              className="report-button"
              onClick={analyzeSite}
              disabled={analyzing || !selectedSite}
            >
              {analyzing
                ? "⏳ Analyzing..."
                : "⚡ Analyze Site"}
            </button>

          </div>
        </div>


        {/* NO SITES */}

        {sites.length === 0 && (
          <div className="report-section">
            <h2>📍 No Sites Available</h2>

            <p>
              Create a site first before generating
              a deployment report.
            </p>
          </div>
        )}


        {/* SITE REPORT */}

        {selectedSite && (
          <>
            <div className="report-hero">

              <div>
                <div className="report-label">
                  📊 Deployment Intelligence Report
                </div>

                <h2>
                  {selectedSite.location_name ||
                    `Site #${selectedSite.id}`}
                </h2>

                <p>
                  Site #{selectedSite.id}
                </p>
              </div>

              <button
                className="report-button"
                onClick={downloadReport}
              >
                📥 Download Report
              </button>

            </div>


            {/* STATISTICS */}

            <div className="report-grid">

              <div className="report-card">
                <span>Optimization / Site Score</span>

                <strong>
                  {selectedSite.solar_score ?? 0}
                </strong>
              </div>


              <div className="report-card">
                <span>☀️ Solar Score</span>

                <strong>
                  {selectedSite.solar_score ?? 0}
                </strong>

                <small>/100</small>
              </div>


              <div className="report-card">
                <span>🌬️ Wind Score</span>

                <strong>
                  {selectedSite.wind_score ?? 0}
                </strong>

                <small>/100</small>
              </div>


              <div className="report-card">
                <span>💨 Wind Potential</span>

                <strong>
                  {selectedSite.wind_potential ?? 0}
                </strong>
              </div>

            </div>


            {/* ANALYSIS */}

            {analysis && (
              <div className="report-section">

                <h2>🌍 Environmental Analysis</h2>

                <div className="report-summary">

                  <div>
                    <span>Solar Irradiance</span>

                    <strong>
                      {analysis.solar_irradiance ??
                        "N/A"}{" "}
                      kWh/m²/day
                    </strong>
                  </div>

                  <div>
                    <span>Temperature</span>

                    <strong>
                      {analysis.temperature ??
                        "N/A"} °C
                    </strong>
                  </div>

                  <div>
                    <span>Wind Speed</span>

                    <strong>
                      {analysis.wind_speed ??
                        "N/A"} m/s
                    </strong>
                  </div>

                  <div>
                    <span>Humidity</span>

                    <strong>
                      {analysis.humidity ??
                        "N/A"} %
                    </strong>
                  </div>

                </div>

              </div>
            )}


            {/* RECOMMENDATION */}

            <div className="report-section recommendation">

              <h2>
                ⭐ Deployment Recommendation
              </h2>

              <p>
                {selectedSite.recommendation ||
                  "Further feasibility assessment is recommended."}
              </p>

            </div>


            {/* ASSESSMENT */}

            <div className="report-section">

              <h2>📋 Assessment Coverage</h2>

              <div className="assessment-list">

                <div>☑ Solar resource assessment</div>

                <div>☑ Wind resource assessment</div>

                <div>☑ Site suitability assessment</div>

                <div>☑ Environmental analysis</div>

                <div>☑ Renewable technology selection</div>

                <div>☑ Deployment recommendation</div>

              </div>

            </div>

          </>
        )}

      </div>
    </Layout>
  );
}

export default Reports;