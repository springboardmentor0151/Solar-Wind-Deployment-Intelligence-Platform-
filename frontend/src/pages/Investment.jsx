import { useEffect, useState } from "react";

import Layout from "../components/Layout";
import API from "../services/api";

import "./Investment.css";

function Investment() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvestment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/analysis/optimize");

      setData(response.data);
    } catch (err) {
      console.error("Investment Error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to generate investment recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestment();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="investment-page">
          <div className="investment-loading">
            ⏳ Generating investment recommendations...
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="investment-page">
          <div className="investment-header">
            <h1>💰 Investment Recommendations</h1>
            <p>
              Renewable energy investment planning and financial
              recommendations
            </p>
          </div>

          <div className="investment-error">
            ❌ {error}
          </div>

          <button
            className="investment-button"
            onClick={loadInvestment}
          >
            🔄 Try Again
          </button>
        </div>
      </Layout>
    );
  }

  const sites = data?.sites || [];
  const bestSite = data?.recommended_site;

  if (sites.length === 0) {
    return (
      <Layout>
        <div className="investment-page">
          <div className="investment-header">
            <h1>💰 Investment Recommendations</h1>

            <p>
              Renewable energy investment planning and
              financial recommendations
            </p>
          </div>

          <div className="investment-empty">
            <h2>📍 No Sites Available</h2>

            <p>
              Add and analyze at least one renewable energy
              site before generating investment recommendations.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const score = Number(
    bestSite?.optimization_score || 0
  );

  let investmentLevel = "Low";
  let investmentClass = "low";

  if (score >= 70) {
    investmentLevel = "High";
    investmentClass = "high";
  } else if (score >= 50) {
    investmentLevel = "Moderate";
    investmentClass = "moderate";
  }

  const solarScore = Number(
    bestSite?.solar_score || 0
  );

  const windScore = Number(
    bestSite?.wind_score || 0
  );

  let technology =
    bestSite?.recommended_technology || "Hybrid";

  if (solarScore >= 65 && solarScore > windScore) {
    technology = "Solar";
  } else if (
    windScore >= 60 &&
    windScore > solarScore
  ) {
    technology = "Wind";
  } else if (
    solarScore >= 55 &&
    windScore >= 55
  ) {
    technology = "Hybrid";
  }

  let recommendation =
    "Conduct detailed feasibility assessment before investment.";

  if (score >= 70) {
    recommendation =
      "High-priority site. Suitable for detailed project development and investment assessment.";
  } else if (score >= 50) {
    recommendation =
      "Moderate investment opportunity. Complete feasibility, grid and financial assessment before deployment.";
  } else {
    recommendation =
      "Lower-priority opportunity. Additional site assessment is recommended before major investment.";
  }

  return (
    <Layout>
      <div className="investment-page">

        {/* HEADER */}

        <div className="investment-header">
          <h1>💰 Investment Recommendations</h1>

          <p>
            Renewable energy investment planning,
            technology selection and project prioritization
          </p>
        </div>


        {/* RECOMMENDED SITE */}

        <div className="investment-hero">

          <div>
            <span className="investment-label">
              🏆 Recommended Investment Site
            </span>

            <h2>
              {bestSite?.location_name ||
                "Best Available Site"}
            </h2>

            <p>
              Site #{bestSite?.site_id}
            </p>
          </div>

          <div
            className={`investment-level ${investmentClass}`}
          >
            {investmentLevel} Investment Potential
          </div>

        </div>


        {/* METRICS */}

        <div className="investment-grid">

          <div className="investment-card">
            <span>⚡ Optimization Score</span>

            <strong>
              {score.toFixed(2)}
            </strong>

            <small>/100</small>
          </div>


          <div className="investment-card">
            <span>☀ Solar Score</span>

            <strong>
              {solarScore.toFixed(2)}
            </strong>

            <small>/100</small>
          </div>


          <div className="investment-card">
            <span>💨 Wind Score</span>

            <strong>
              {windScore.toFixed(2)}
            </strong>

            <small>/100</small>
          </div>


          <div className="investment-card">
            <span>🔋 Recommended Technology</span>

            <strong>
              {technology}
            </strong>
          </div>

        </div>


        {/* RECOMMENDATION */}

        <div className="recommendation-card">

          <h2>
            ⭐ Investment Recommendation
          </h2>

          <p>
            {recommendation}
          </p>

        </div>


        {/* INVESTMENT PRIORITY */}

        <div className="investment-section">

          <h2>
            📊 Investment Priority
          </h2>

          <div className="priority-list">

            {sites.map((site) => {

              const siteScore = Number(
                site.optimization_score || 0
              );

              let priority = "Low";

              if (siteScore >= 70) {
                priority = "High";
              } else if (siteScore >= 50) {
                priority = "Medium";
              }

              return (
                <div
                  className="priority-row"
                  key={site.site_id}
                >

                  <div>
                    <strong>
                      {site.location_name}
                    </strong>

                    <span>
                      Site #{site.site_id}
                    </span>
                  </div>

                  <div>
                    <span>
                      Score
                    </span>

                    <strong>
                      {siteScore.toFixed(2)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Technology
                    </span>

                    <strong>
                      {site.recommended_technology ||
                        "Hybrid"}
                    </strong>
                  </div>

                  <div
                    className={`priority-badge ${priority.toLowerCase()}`}
                  >
                    {priority}
                  </div>

                </div>
              );
            })}

          </div>

        </div>


        {/* FINANCIAL CHECKLIST */}

        <div className="investment-section">

          <h2>
            💼 Investment Assessment Checklist
          </h2>

          <div className="checklist">

            <div>
              ☑ Resource potential assessment
            </div>

            <div>
              ☑ Site suitability assessment
            </div>

            <div>
              ☑ Renewable technology selection
            </div>

            <div>
              ☑ Grid connectivity assessment
            </div>

            <div>
              ☑ Land and infrastructure assessment
            </div>

            <div>
              ☑ Detailed financial feasibility
            </div>

          </div>

        </div>


        {/* REFRESH */}

        <div className="investment-actions">

          <button
            className="investment-button"
            onClick={loadInvestment}
          >
            🔄 Recalculate Recommendation
          </button>

        </div>

      </div>
    </Layout>
  );
}

export default Investment;