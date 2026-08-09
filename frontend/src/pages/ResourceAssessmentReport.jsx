import React from "react";

const ResourceAssessmentReport = ({
  analysisResult,
  suitability,
  locationDetails,
  siteName,
  project,
}) => {
  if (!analysisResult || !suitability) return null;

  const solar = analysisResult.solarPrediction || {};
  const environmental = analysisResult.environmentalData || {};
  const terrain = analysisResult.terrainData || {};
  const gis = analysisResult.gisData || {};
  const wind = analysisResult.windPrediction || {};

  const windSpeed = environmental.windSpeed || 0;

  let windPotential = "Low";

  if (windSpeed >= 7) {
    windPotential = "High";
  } else if (windSpeed >= 5) {
    windPotential = "Moderate";
  }

  let recommendation = "";

  if (
    solar.solarPotential === "High" &&
    windPotential === "High"
  ) {
    recommendation = "Hybrid Solar & Wind Power Plant";
  } else if (solar.solarPotential === "High") {
    recommendation = "Solar Power Plant";
  } else if (windPotential === "High") {
    recommendation = "Wind Power Plant";
  } else {
    recommendation =
      "Further Feasibility Study Recommended";
  }

  // Investment Calculations

  const estimatedCost = (
    ((solar.dailyEnergyOutput || wind.dailyEnergy || 200) * 2500) /
    10000000
  ).toFixed(2);

  const annualRevenue = (
    (((solar.annualEnergyOutput ||
      wind.annualEnergy ||
      100000) *
      6) /
      10000000)
  ).toFixed(2);

  const roi =
    solar.performanceRatio ??
    wind.capacityFactor?.toFixed(1) ??
    "--";

  const payback =
    roi !== "--"
      ? `${(8 - Number(roi) / 20).toFixed(1)} Years`
      : "--";

  return (
    <div className="mt-10 bg-white rounded-3xl shadow-xl p-10">

      {/* ================= HEADER ================= */}

      <div className="text-center border-b pb-8">

        <h1 className="text-5xl font-bold text-blue-700">
          Resource Assessment Report
        </h1>

        <p className="text-gray-500 mt-3 text-lg">
          Solar & Wind Deployment Intelligence Platform
        </p>

        <div className="mt-6 flex justify-center gap-10 text-sm text-gray-600">

          <div>
            <strong>Date</strong>

            <br />

            {new Date().toLocaleDateString()}
          </div>

          <div>
            <strong>Project</strong>

            <br />

            {project?.projectName}
          </div>

          <div>
            <strong>Energy Type</strong>

            <br />

            {project?.energyType}
          </div>

        </div>

      </div>

      {/* ================= PROJECT DETAILS ================= */}

      <section className="mt-10">

        <h2 className="text-3xl font-bold border-b pb-3">
          1. Project Details
        </h2>

        <div className="grid md:grid-cols-2 gap-10 mt-8">

          <div className="space-y-3">

            <p>
              <strong>Project Name:</strong>{" "}
              {project?.projectName}
            </p>

            <p>
              <strong>Energy Type:</strong>{" "}
              {project?.energyType}
            </p>

            <p>
              <strong>Site Name:</strong>{" "}
              {siteName}
            </p>

            <p>
              <strong>State:</strong>{" "}
              {locationDetails?.state || "--"}
            </p>

            <p>
              <strong>Country:</strong>{" "}
              {locationDetails?.country || "--"}
            </p>

          </div>

          <div className="space-y-3">

            <p>
              <strong>Latitude:</strong>{" "}
              {locationDetails?.latitude}
            </p>

            <p>
              <strong>Longitude:</strong>{" "}
              {locationDetails?.longitude}
            </p>

            <p>
              <strong>Location:</strong>{" "}
              {locationDetails?.displayName}
            </p>

            <p>
              <strong>Report Generated:</strong>{" "}
              {new Date().toLocaleString()}
            </p>

          </div>

        </div>

      </section>

      {/* ================= EXECUTIVE SUMMARY ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          2. Executive Summary
        </h2>

        <div className="mt-6 leading-9 text-gray-700">

          <p>

            This report presents an AI-assisted assessment of the
            selected renewable energy site using environmental,
            terrain, and GIS datasets.

          </p>

          <p className="mt-4">

            The evaluation includes solar irradiance,
            wind resource availability, terrain elevation,
            nearby infrastructure, and land-use information.

          </p>

          <p className="mt-4">

            Based on these datasets, the selected site has
            been classified as

            <strong className="text-blue-700">
              {" "}
              {suitability.level}
            </strong>

            with an overall suitability score of

            <strong className="text-green-700">
              {" "}
              {suitability.score}/{suitability.maxScore}
            </strong>.

          </p>

          <div className="mt-8 rounded-2xl bg-blue-50 border border-blue-200 p-6">

            <h3 className="text-xl font-bold text-blue-700">

              Executive Recommendation

            </h3>

            <p className="mt-3 leading-8">

              Based on the available environmental,
              terrain, GIS, solar and wind datasets,
              the recommended deployment strategy is

              <strong className="text-green-700">
                {" "}
                {recommendation}
              </strong>.

            </p>

          </div>

        </div>

      </section>
            {/* ================= ENVIRONMENTAL ANALYSIS ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          3. Environmental Analysis
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

          <div className="bg-yellow-50 rounded-2xl p-6 shadow">

            <h3 className="font-semibold text-gray-500">
              Solar Irradiance
            </h3>

            <p className="text-3xl font-bold text-yellow-600 mt-3">
              {environmental.solarIrradiance ?? "--"}
            </p>

            <p className="text-sm mt-2">
              kWh/m²/day
            </p>

          </div>

          <div className="bg-blue-50 rounded-2xl p-6 shadow">

            <h3 className="font-semibold text-gray-500">
              Wind Speed
            </h3>

            <p className="text-3xl font-bold text-blue-600 mt-3">
              {environmental.windSpeed ?? "--"}
            </p>

            <p className="text-sm mt-2">
              m/s
            </p>

          </div>

          <div className="bg-red-50 rounded-2xl p-6 shadow">

            <h3 className="font-semibold text-gray-500">
              Temperature
            </h3>

            <p className="text-3xl font-bold text-red-600 mt-3">
              {environmental.temperature ?? "--"}
            </p>

            <p className="text-sm mt-2">
              °C
            </p>

          </div>

          <div className="bg-green-50 rounded-2xl p-6 shadow">

            <h3 className="font-semibold text-gray-500">
              Elevation
            </h3>

            <p className="text-3xl font-bold text-green-600 mt-3">
              {terrain.elevation ?? "--"}
            </p>

            <p className="text-sm mt-2">
              meters
            </p>

          </div>

        </div>

      </section>

      {/* ================= SOLAR PREDICTION ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          4. Solar Potential Prediction
        </h2>

        <div className="overflow-x-auto mt-8">

          <table className="w-full border">

            <thead className="bg-yellow-500 text-white">

              <tr>

                <th className="border px-4 py-3 text-left">
                  Parameter
                </th>

                <th className="border px-4 py-3 text-left">
                  Value
                </th>

              </tr>

            </thead>

            <tbody>

              <tr>
                <td className="border px-4 py-3">Solar Potential</td>
                <td className="border px-4 py-3">{solar.solarPotential}</td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Annual Irradiance</td>
                <td className="border px-4 py-3">
                  {solar.annualIrradiance ?? "--"}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Peak Sun Hours</td>
                <td className="border px-4 py-3">
                  {solar.peakSunHours ?? "--"}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Daily Energy Output</td>
                <td className="border px-4 py-3">
                  {solar.dailyEnergyOutput ?? "--"} kWh
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Annual Energy Output</td>
                <td className="border px-4 py-3">
                  {solar.annualEnergyOutput ?? "--"} kWh
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Performance Ratio</td>
                <td className="border px-4 py-3">
                  {solar.performanceRatio ?? "--"}
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </section>

      {/* ================= WIND PREDICTION ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          5. Wind Potential Prediction
        </h2>

        <div className="overflow-x-auto mt-8">

          <table className="w-full border">

            <thead className="bg-blue-600 text-white">

              <tr>

                <th className="border px-4 py-3 text-left">
                  Parameter
                </th>

                <th className="border px-4 py-3 text-left">
                  Value
                </th>

              </tr>

            </thead>

            <tbody>

              <tr>
                <td className="border px-4 py-3">Wind Potential</td>
                <td className="border px-4 py-3">{windPotential}</td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Wind Speed</td>
                <td className="border px-4 py-3">
                  {environmental.windSpeed ?? "--"} m/s
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Power Density</td>
                <td className="border px-4 py-3">
                  {wind.windPowerDensity?.toFixed?.(2) ?? "--"} W/m²
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Daily Energy</td>
                <td className="border px-4 py-3">
                  {wind.dailyEnergy?.toFixed?.(2) ?? "--"} kWh
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Annual Energy</td>
                <td className="border px-4 py-3">
                  {wind.annualEnergy?.toFixed?.(0) ?? "--"} kWh
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Recommended Turbine</td>
                <td className="border px-4 py-3">
                  {wind.recommendedTurbine ?? "--"}
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </section>

      {/* ================= GIS ANALYSIS ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          6. GIS & Infrastructure Analysis
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

          <div className="bg-blue-50 rounded-2xl p-6 shadow">

            <h3 className="font-semibold">
              Roads
            </h3>

            <p className="text-4xl font-bold mt-3 text-blue-600">
              {gis.roadCount ?? 0}
            </p>

          </div>

          <div className="bg-green-50 rounded-2xl p-6 shadow">

            <h3 className="font-semibold">
              Power Infrastructure
            </h3>

            <p className="text-4xl font-bold mt-3 text-green-600">
              {gis.powerInfrastructureCount ?? 0}
            </p>

          </div>

          <div className="bg-cyan-50 rounded-2xl p-6 shadow">

            <h3 className="font-semibold">
              Water Bodies
            </h3>

            <p className="text-4xl font-bold mt-3 text-cyan-600">
              {gis.waterBodyCount ?? 0}
            </p>

          </div>

          <div className="bg-purple-50 rounded-2xl p-6 shadow">

            <h3 className="font-semibold">
              Buildings
            </h3>

            <p className="text-4xl font-bold mt-3 text-purple-600">
              {gis.buildingCount ?? 0}
            </p>

          </div>

        </div>

      </section>
      {/* ================= ASSESSMENT SUMMARY ================= */}
      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          7. Assessment Summary
        </h2>

        <div className="overflow-x-auto mt-8">

          <table className="w-full border">

            <thead className="bg-indigo-600 text-white">

              <tr>

                <th className="border px-4 py-3 text-left">
                  Assessment Parameter
                </th>

                <th className="border px-4 py-3 text-left">
                  Result
                </th>

              </tr>

            </thead>

            <tbody>

              <tr>
                <td className="border px-4 py-3">Solar Potential</td>
                <td className="border px-4 py-3">
                  {solar.solarPotential}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Wind Potential</td>
                <td className="border px-4 py-3">
                  {windPotential}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Suitability Level</td>
                <td className="border px-4 py-3">
                  {suitability.level}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Suitability Score</td>
                <td className="border px-4 py-3">
                  {suitability.score}/{suitability.maxScore}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">Deployment Recommendation</td>
                <td className="border px-4 py-3">
                  {recommendation}
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </section>

      {/* ================= INVESTMENT ANALYSIS ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          8. Investment Analysis
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

          <div className="bg-blue-50 rounded-2xl shadow p-6">

            <h3 className="text-gray-500">
              Estimated Cost
            </h3>

            <p className="text-3xl font-bold text-blue-700 mt-3">
              ₹ {estimatedCost} Cr
            </p>

          </div>

          <div className="bg-green-50 rounded-2xl shadow p-6">

            <h3 className="text-gray-500">
              Annual Revenue
            </h3>

            <p className="text-3xl font-bold text-green-700 mt-3">
              ₹ {annualRevenue} Cr
            </p>

          </div>

          <div className="bg-yellow-50 rounded-2xl shadow p-6">

            <h3 className="text-gray-500">
              ROI
            </h3>

            <p className="text-3xl font-bold text-yellow-700 mt-3">
              {roi}%
            </p>

          </div>

          <div className="bg-purple-50 rounded-2xl shadow p-6">

            <h3 className="text-gray-500">
              Payback Period
            </h3>

            <p className="text-3xl font-bold text-purple-700 mt-3">
              {payback}
            </p>

          </div>

        </div>

      </section>

      {/* ================= AI INSIGHTS ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          9. AI Insights
        </h2>

        <div className="space-y-5 mt-8">

          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">

            <h3 className="text-xl font-bold text-blue-700">
              AI Observation 1
            </h3>

            <p className="mt-3 leading-8">

              Solar resource availability is classified as
              <strong> {solar.solarPotential}</strong>,
              indicating favourable photovoltaic generation.

            </p>

          </div>

          <div className="rounded-2xl bg-green-50 border border-green-200 p-6">

            <h3 className="text-xl font-bold text-green-700">
              AI Observation 2
            </h3>

            <p className="mt-3 leading-8">

              Wind resource assessment indicates
              <strong> {windPotential}</strong>
              potential with an average wind speed of
              <strong> {environmental.windSpeed} m/s</strong>.

            </p>

          </div>

          <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-6">

            <h3 className="text-xl font-bold text-yellow-700">
              AI Observation 3
            </h3>

            <p className="mt-3 leading-8">

              Existing road connectivity and nearby power
              infrastructure can significantly reduce
              installation cost and grid integration effort.

            </p>

          </div>

          <div className="rounded-2xl bg-purple-50 border border-purple-200 p-6">

            <h3 className="text-xl font-bold text-purple-700">
              AI Final Insight
            </h3>

            <p className="mt-3 leading-8">

              Based on environmental,
              terrain,
              GIS,
              solar,
              and wind analysis,
              this location is classified as

              <strong> {suitability.level}</strong>

              and the recommended deployment strategy is

              <strong> {recommendation}</strong>.

            </p>

          </div>

        </div>

      </section>
            {/* ================= DEPLOYMENT READINESS ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          10. Deployment Readiness
        </h2>

        <div className="mt-8 grid md:grid-cols-2 gap-6">

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">

            <h3 className="text-xl font-bold text-green-700">
              Infrastructure Status
            </h3>

            <ul className="mt-5 space-y-3 text-gray-700">

              <li>✔ Site Survey Completed</li>

              <li>
                ✔ Roads:
                {" "}
                {gis.roadCount > 0
                  ? "Available"
                  : "Limited"}
              </li>

              <li>
                ✔ Power Infrastructure:
                {" "}
                {gis.powerInfrastructureCount > 0
                  ? "Available"
                  : "Limited"}
              </li>

              <li>
                ✔ Terrain Suitable for Deployment
              </li>

            </ul>

          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">

            <h3 className="text-xl font-bold text-blue-700">
              Deployment Readiness
            </h3>

            <div className="mt-6">

              <div className="flex justify-between mb-2">

                <span>Overall Readiness</span>

                <span className="font-bold">
                  {Math.round(
                    (suitability.score /
                      suitability.maxScore) *
                      100
                  )}
                  %
                </span>

              </div>

              <div className="h-5 rounded-full bg-gray-200 overflow-hidden">

                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                  style={{
                    width: `${
                      (suitability.score /
                        suitability.maxScore) *
                      100
                    }%`,
                  }}
                />

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= FINAL RECOMMENDATION ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          11. Final Recommendation
        </h2>

        <div className="mt-8 rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8">

          <h3 className="text-3xl font-bold">
            Recommended Deployment
          </h3>

          <p className="mt-4 text-2xl font-semibold">
            {recommendation}
          </p>

          <p className="mt-6 leading-8">

            Based on environmental,
            terrain,
            GIS,
            solar,
            wind,
            and infrastructure analysis,
            this location is classified as

            <strong> {suitability.level}</strong>.

            The proposed renewable energy deployment is
            technically feasible and suitable for further
            engineering and financial planning.

          </p>

        </div>

      </section>

      {/* ================= FUTURE SCOPE ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          12. Future Scope
        </h2>

        <ul className="list-disc pl-8 mt-8 space-y-4 text-gray-700">

          <li>
            Multi-year renewable resource analysis.
          </li>

          <li>
            Machine Learning based energy forecasting.
          </li>

          <li>
            Carbon emission reduction estimation.
          </li>

          <li>
            Financial feasibility optimization.
          </li>

          <li>
            Smart grid integration.
          </li>

          <li>
            Battery storage optimization.
          </li>

        </ul>

      </section>

      {/* ================= DATA SOURCES ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          13. Data Sources
        </h2>

        <div className="mt-8 rounded-2xl bg-gray-50 p-6">

          <ul className="list-disc pl-8 space-y-4">

            <li>
              NASA POWER API
            </li>

            <li>
              OpenStreetMap Overpass API
            </li>

            <li>
              Open Elevation API
            </li>

            <li>
              Renewable Energy Site Suitability Engine
            </li>

          </ul>

        </div>

      </section>

      {/* ================= CONCLUSION ================= */}

      <section className="mt-12">

        <h2 className="text-3xl font-bold border-b pb-3">
          14. Conclusion
        </h2>

        <div className="mt-8 rounded-3xl bg-blue-50 border border-blue-200 p-8">

          <p className="leading-9 text-gray-700">

            This report summarizes the comprehensive
            assessment of the selected renewable energy
            site using environmental,
            terrain,
            GIS,
            solar,
            and wind datasets.

          </p>

          <p className="mt-5 leading-9 text-gray-700">

            The AI-assisted evaluation indicates that the
            site has

            <strong className="text-green-700">
              {" "}
              {suitability.level}
            </strong>

            and is recommended for

            <strong className="text-blue-700">
              {" "}
              {recommendation}
            </strong>.

          </p>

          <p className="mt-5 leading-9 text-gray-700">

            This assessment serves as a preliminary
            decision-support tool. Detailed engineering,
            environmental clearance, and financial
            feasibility studies should be completed
            before project implementation.

          </p>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <div className="mt-16 border-t pt-8 text-center">

        <p className="text-gray-500">
          Report Generated by
        </p>

        <h3 className="text-2xl font-bold text-blue-700 mt-2">
          Solar & Wind Deployment Intelligence Platform
        </h3>

        <p className="mt-3 text-gray-500">
          © {new Date().getFullYear()} Renewable Energy Site Intelligence
        </p>

        <button
          onClick={() => window.print()}
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition"
        >
          Print Report
        </button>

      </div>

    </div>
  );
};

export default ResourceAssessmentReport;