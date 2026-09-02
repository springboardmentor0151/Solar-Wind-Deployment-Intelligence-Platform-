import { useEffect, useState } from "react";

import Layout from "../components/Layout";
import API from "../services/api";

import "./Optimization.css";


function Optimization() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ========================================
  // LOAD OPTIMIZATION
  // ========================================

  const loadOptimization = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/analysis/optimize");

      setData(response.data);

    } catch (err) {
      console.error("Optimization Error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to calculate deployment optimization."
      );

      setData(null);

    } finally {
      setLoading(false);
    }
  };


  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadOptimization();
  }, []);


  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <Layout>

        <div className="optimization-page">

          <div className="optimization-header">
            <h1>⚙ Deployment Optimization</h1>

            <p>
              Solar & Wind site ranking and
              deployment planning
            </p>
          </div>

          <div className="optimization-empty">
            <h2>⏳ Calculating...</h2>

            <p>
              Evaluating available renewable
              energy sites.
            </p>
          </div>

        </div>

      </Layout>
    );
  }


  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <Layout>

        <div className="optimization-page">

          <div className="optimization-header">
            <h1>⚙ Deployment Optimization</h1>

            <p>
              Solar & Wind site ranking and
              deployment planning
            </p>
          </div>


          <div className="optimization-error">

            <h2>❌ Optimization Failed</h2>

            <p>{error}</p>

          </div>


          <button
            className="optimization-button"
            onClick={loadOptimization}
          >
            🔄 Try Again
          </button>

        </div>

      </Layout>
    );
  }


  // ========================================
  // NORMALIZE DATA
  // ========================================

  const sites = Array.isArray(data?.sites)
    ? data.sites
    : [];


  const bestSite =
    data?.recommended_site ||
    sites[0] ||
    null;


  const totalSites =
    data?.total_sites ??
    sites.length;


  const solarSites =
    sites.filter(
      (site) =>
        String(
          site.recommended_technology || ""
        ).toLowerCase() === "solar"
    ).length;


  const windSites =
    sites.filter(
      (site) =>
        String(
          site.recommended_technology || ""
        ).toLowerCase() === "wind"
    ).length;


  const hybridSites =
    sites.filter(
      (site) =>
        String(
          site.recommended_technology || ""
        ).toLowerCase() === "hybrid"
    ).length;


  // ========================================
  // NO SITES
  // ========================================

  if (sites.length === 0) {
    return (
      <Layout>

        <div className="optimization-page">

          <div className="optimization-header">

            <h1>
              ⚙ Deployment Optimization
            </h1>

            <p>
              Solar & Wind site ranking and
              deployment planning
            </p>

          </div>


          <div className="optimization-empty">

            <h2>
              📍 No Sites Available
            </h2>

            <p>
              Add renewable energy sites first,
              then return here to calculate the
              best deployment location.
            </p>

          </div>

        </div>

      </Layout>
    );
  }


  return (
    <Layout>

      <div className="optimization-page">


        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="optimization-header">

          <h1>
            ⚙ Deployment Optimization
          </h1>

          <p>
            Intelligent ranking of renewable
            energy deployment sites
          </p>

        </div>


        {/* ================================= */}
        {/* RECOMMENDED SITE */}
        {/* ================================= */}

        {bestSite && (

          <div className="best-site-card">

            <div className="best-site-title">
              🏆 Recommended Deployment Site
            </div>


            <h2>
              {bestSite.location_name ||
                `Site #${bestSite.site_id}`}
            </h2>


            <p>
              Site #{bestSite.site_id}
            </p>


            <div className="best-site-grid">


              <div>
                <span>
                  Optimization Score
                </span>

                <strong>
                  {bestSite.optimization_score ??
                    "--"}
                  /100
                </strong>
              </div>


              <div>
                <span>
                  Solar Score
                </span>

                <strong>
                  {bestSite.solar_score ??
                    "--"}
                  /100
                </strong>
              </div>


              <div>
                <span>
                  Wind Score
                </span>

                <strong>
                  {bestSite.wind_score ??
                    "--"}
                  /100
                </strong>
              </div>


              <div>
                <span>
                  Recommended Technology
                </span>

                <strong>
                  {bestSite.recommended_technology ||
                    "Hybrid"}
                </strong>
              </div>

            </div>


            {/* RECOMMENDATION */}

            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                borderRadius: "10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
            >

              <strong>
                💡 Deployment Recommendation
              </strong>

              <p>
                {bestSite.recommendation ||
                  data?.recommendation ||
                  "This site has been identified as the best available deployment option based on renewable resource scores."}
              </p>

            </div>

          </div>

        )}


        {/* ================================= */}
        {/* SUMMARY */}
        {/* ================================= */}

        <div className="optimization-summary">


          <div className="summary-card">

            <span>
              📍 Total Sites
            </span>

            <strong>
              {totalSites}
            </strong>

          </div>


          <div className="summary-card">

            <span>
              🏆 Recommended Site
            </span>

            <strong>
              #{bestSite?.site_id ?? "--"}
            </strong>

          </div>


          <div className="summary-card">

            <span>
              ☀ Solar Focus
            </span>

            <strong>
              {solarSites}
            </strong>

          </div>


          <div className="summary-card">

            <span>
              💨 Wind Focus
            </span>

            <strong>
              {windSites}
            </strong>

          </div>


          <div className="summary-card">

            <span>
              ⚡ Hybrid
            </span>

            <strong>
              {hybridSites}
            </strong>

          </div>

        </div>


        {/* ================================= */}
        {/* RANKING */}
        {/* ================================= */}

        <div className="ranking-section">


          <div className="section-title">

            <h2>
              📊 Site Intelligence Ranking
            </h2>

            <span>
              {sites.length} sites evaluated
            </span>

          </div>


          <div className="ranking-list">


            {sites.map((site, index) => {

              const rank =
                site.rank ??
                index + 1;


              const technology =
                site.recommended_technology ||
                "Hybrid";


              return (

                <div
                  key={
                    site.site_id ??
                    site.id ??
                    index
                  }
                  className={
                    rank === 1
                      ? "ranking-card first"
                      : "ranking-card"
                  }
                >


                  {/* RANK */}

                  <div className="rank-number">

                    {rank === 1
                      ? "🏆"
                      : `#${rank}`}

                  </div>


                  {/* SITE */}

                  <div className="ranking-info">

                    <h3>
                      {site.location_name ||
                        `Site #${site.site_id}`}
                    </h3>

                    <p>
                      Site #{site.site_id}
                    </p>

                  </div>


                  {/* OPTIMIZATION */}

                  <div className="ranking-score">

                    <span>
                      Optimization
                    </span>

                    <strong>
                      {site.optimization_score ??
                        "--"}
                    </strong>

                  </div>


                  {/* SOLAR */}

                  <div className="ranking-score">

                    <span>
                      Solar
                    </span>

                    <strong>
                      {site.solar_score ??
                        "--"}
                    </strong>

                  </div>


                  {/* WIND */}

                  <div className="ranking-score">

                    <span>
                      Wind
                    </span>

                    <strong>
                      {site.wind_score ??
                        "--"}
                    </strong>

                  </div>


                  {/* TECHNOLOGY */}

                  <div className="technology">

                    {technology === "Solar" && (
                      <>☀ Solar</>
                    )}

                    {technology === "Wind" && (
                      <>💨 Wind</>
                    )}

                    {technology === "Hybrid" && (
                      <>⚡ Hybrid</>
                    )}

                    {![
                      "Solar",
                      "Wind",
                      "Hybrid",
                    ].includes(technology) && (
                      <>⚡ {technology}</>
                    )}

                  </div>

                </div>

              );

            })}

          </div>

        </div>


        {/* ================================= */}
        {/* DECISION SUPPORT */}
        {/* ================================= */}

        <div
          style={{
            marginTop: "30px",
            padding: "25px",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >

          <h2>
            💡 Investment Decision Support
          </h2>

          <p>
            The optimization engine ranks sites
            using their renewable resource
            potential and recommends the most
            suitable deployment technology.
          </p>


          {bestSite && (

            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#f9fafb",
                borderRadius: "8px",
              }}
            >

              <strong>
                Recommended Action:
              </strong>

              <p>
                Prioritize Site #
                {bestSite.site_id} at{" "}
                {bestSite.location_name ||
                  "the selected location"}{" "}
                for{" "}
                {bestSite.recommended_technology ||
                  "renewable energy"}{" "}
                deployment.
              </p>

            </div>

          )}

        </div>


        {/* ================================= */}
        {/* ACTIONS */}
        {/* ================================= */}

        <div className="optimization-actions">

          <button
            className="optimization-button"
            onClick={loadOptimization}
          >
            🔄 Recalculate Optimization
          </button>

        </div>


      </div>

    </Layout>
  );
}


export default Optimization;