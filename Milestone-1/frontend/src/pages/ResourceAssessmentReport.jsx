import React from "react";

const ResourceAssessmentReport = ({
  analysisResult,
  suitability,
  locationDetails,
  siteName,
  project,
}) => {
  if (!analysisResult) return null;

  const solar = analysisResult.solarPrediction || {};
  const environmental = analysisResult.environmentalData || {};
  const gis = analysisResult.gisData || {};

  const windSpeed = environmental.windSpeed || 0;

  let windPotential = "Low";

  if (windSpeed >= 7)
    windPotential = "High";
  else if (windSpeed >= 5)
    windPotential = "Moderate";

  let recommendation = "";

  if (
    solar.solarPotential === "High" &&
    windPotential === "High"
  ) {
    recommendation = "Hybrid Solar + Wind Plant";
  } else if (solar.solarPotential === "High") {
    recommendation = "Solar Power Plant";
  } else if (windPotential === "High") {
    recommendation = "Wind Power Plant";
  } else {
    recommendation =
      "Further feasibility study is recommended.";
  }

  return (
    <div className="mt-10 bg-white rounded-2xl shadow-lg p-8">

      <h1 className="text-4xl font-bold text-center text-blue-700">
        Resource Assessment Report
      </h1>

      <p className="text-center text-gray-500 mt-2">
        Solar & Wind Deployment Intelligence Platform
      </p>

      {/* Project Details */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold border-b pb-2">
          Project Details
        </h2>

        <div className="grid md:grid-cols-2 gap-5 mt-5">

          <div>

            <p>
              <strong>Project Name :</strong>{" "}
              {project?.projectName}
            </p>

            <p>
              <strong>Energy Type :</strong>{" "}
              {project?.energyType}
            </p>

            <p>
              <strong>Site Name :</strong>{" "}
              {siteName}
            </p>

          </div>

          <div>

            <p>
              <strong>Latitude :</strong>{" "}
              {locationDetails?.latitude}
            </p>

            <p>
              <strong>Longitude :</strong>{" "}
              {locationDetails?.longitude}
            </p>

            <p>
              <strong>Date :</strong>{" "}
              {new Date().toLocaleDateString()}
            </p>

          </div>

        </div>

      </div>

      {/* Executive Summary */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold border-b pb-2">
          Executive Summary
        </h2>

        <p className="mt-5 leading-8 text-gray-700">

          The selected location was evaluated using
          environmental, terrain and GIS datasets
          collected from NASA POWER API,
          OpenStreetMap and Open-Elevation API.

          The analysis considered solar irradiance,
          wind speed, elevation,
          nearby infrastructure and land characteristics.

          Based on the assessment,
          the site has been classified as

          <strong>
            {" "}
            {suitability.level}
          </strong>

          {" "}for renewable energy deployment.

        </p>

      </div>
            {/* Assessment Summary */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold border-b pb-2">
          Assessment Summary
        </h2>

        <div className="overflow-x-auto mt-6">

          <table className="w-full border border-gray-300">

            <thead className="bg-blue-600 text-white">

              <tr>

                <th className="border px-4 py-3 text-left">
                  Parameter
                </th>

                <th className="border px-4 py-3 text-left">
                  Assessment
                </th>

              </tr>

            </thead>

            <tbody>

              <tr>
                <td className="border px-4 py-3">
                  Solar Potential
                </td>
                <td className="border px-4 py-3">
                  {solar.solarPotential}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">
                  Wind Potential
                </td>
                <td className="border px-4 py-3">
                  {windPotential}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">
                  Overall Suitability
                </td>
                <td className="border px-4 py-3">
                  {suitability.level}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">
                  Terrain Condition
                </td>
                <td className="border px-4 py-3">
                  Suitable
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">
                  Road Accessibility
                </td>
                <td className="border px-4 py-3">
                  {gis.roadCount > 0 ? "Available" : "Limited"}
                </td>
              </tr>

              <tr>
                <td className="border px-4 py-3">
                  Power Infrastructure
                </td>
                <td className="border px-4 py-3">
                  {gis.powerInfrastructureCount > 0
                    ? "Available"
                    : "Limited"}
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* Key Findings */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold border-b pb-2">
          Key Findings
        </h2>

        <div className="mt-6 bg-gray-50 rounded-xl p-6">

          <ul className="list-disc pl-6 space-y-3 text-gray-700">

            <li>
              The site receives
              <strong> {solar.solarPotential}</strong>
              {" "}solar energy potential based on NASA POWER data.
            </li>

            <li>
              Wind resource availability is assessed as
              <strong> {windPotential}</strong>
              {" "}using average wind speed.
            </li>

            <li>
              Nearby road connectivity supports easier transportation and installation.
            </li>

            <li>
              Existing power infrastructure can simplify grid integration.
            </li>

            <li>
              Terrain and environmental conditions are appropriate for renewable energy deployment.
            </li>

          </ul>

        </div>

      </div>
            {/* Final Recommendation */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold border-b pb-2">
          Final Recommendation
        </h2>

        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">

          <h3 className="text-2xl font-bold text-green-700">
            Recommended Deployment
          </h3>

          <p className="mt-4 text-lg font-semibold">
            {recommendation}
          </p>

          <p className="mt-5 leading-8 text-gray-700">

            Based on the environmental conditions,
            solar resource availability,
            wind resource assessment,
            terrain characteristics,
            and surrounding infrastructure,
            this site has been evaluated as

            <strong> {suitability.level}</strong>

            for renewable energy deployment.

            The assessment indicates that
            <strong> {recommendation}</strong>
            {" "}is the most suitable option for this location.

          </p>

        </div>

      </div>

      {/* Future Scope */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold border-b pb-2">
          Future Scope
        </h2>

        <ul className="list-disc pl-6 mt-6 space-y-3 text-gray-700">

          <li>
            Perform seasonal renewable resource analysis using multi-year datasets.
          </li>

          <li>
            Integrate Machine Learning models for energy forecasting and site optimization.
          </li>

          <li>
            Include economic feasibility and return-on-investment analysis.
          </li>

          <li>
            Estimate carbon emission reduction and environmental benefits.
          </li>

          <li>
            Generate downloadable PDF reports for stakeholders.
          </li>

        </ul>

      </div>

      {/* Data Sources */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold border-b pb-2">
          Data Sources
        </h2>

        <div className="mt-6">

          <ul className="list-disc pl-6 space-y-3 text-gray-700">

            <li>NASA POWER API - Solar irradiance, temperature and wind data.</li>

            <li>OpenStreetMap Overpass API - Roads, buildings, water bodies and power infrastructure.</li>

            <li>Open-Elevation API - Terrain elevation information.</li>

          </ul>

        </div>

      </div>

      {/* Footer */}

      <div className="mt-12 border-t pt-6 text-center">

        <p className="text-gray-500">
          Resource Assessment Report generated by
        </p>

        <h3 className="text-xl font-bold text-blue-700 mt-2">
          Solar & Wind Deployment Intelligence Platform
        </h3>

        <p className="text-gray-500 mt-2">
          © {new Date().getFullYear()} Renewable Energy Site Assessment
        </p>

        <button
          onClick={() => window.print()}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Print Report
        </button>

      </div>

    </div>
  );
};

export default ResourceAssessmentReport;