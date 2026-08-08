import ScoreChart from "../components/ScoreChart";
import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";

import api from "../api/api";

function Report() {
  const { siteId } = useParams();

  const [site, setSite] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSite();
  }, []);

  const loadSite = async () => {
    try {
      const response = await api.get(`/sites/${siteId}`);
      setSite(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load site.");
    }
  };

  const handleGenerate = async () => {
    if (!site) return;

    setLoading(true);

    try {
      const response = await api.post("/report/generate", {
        latitude: site.latitude,
        longitude: site.longitude,
      });

      setReport(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
  if (!report || !site) {
    alert("Please generate the report first.");
    return;
  }


  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(20);
  doc.text("Solar & Wind Deployment Intelligence Report", 15, y);

  y += 15;

  doc.setFontSize(14);
  doc.text("Site Information", 15, y);

  y += 10;
  doc.setFontSize(11);

  doc.text(`Site Name: ${site.name}`, 15, y);
  y += 8;

  doc.text(`Latitude: ${site.latitude}`, 15, y);
  y += 8;

  doc.text(`Longitude: ${site.longitude}`, 15, y);

  // Environmental
  y += 15;
  doc.setFontSize(14);
  doc.text("Environmental Analysis", 15, y);

  y += 10;
  doc.setFontSize(11);

  doc.text(`Score: ${report.environment.score}`, 15, y);
  y += 8;

  doc.text(`Suitability: ${report.environment.suitability}`, 15, y);
  y += 8;

  doc.text(
    `Recommendation: ${report.environment.recommendation}`,
    15,
    y
  );

  // Solar
  y += 15;
  doc.setFontSize(14);
  doc.text("Solar Analysis", 15, y);

  y += 10;
  doc.setFontSize(11);

  doc.text(
    `Solar Radiation: ${report.solar.solar_radiation}`,
    15,
    y
  );
  y += 8;

  doc.text(
    `Temperature: ${report.solar.temperature} °C`,
    15,
    y
  );
  y += 8;

  doc.text(
    `Solar Score: ${report.solar.solar_score}`,
    15,
    y
  );
  y += 8;

  doc.text(
    `Suitability: ${report.solar.suitability}`,
    15,
    y
  );

  // Wind
  y += 15;
  doc.setFontSize(14);
  doc.text("Wind Analysis", 15, y);

  y += 10;
  doc.setFontSize(11);

  doc.text(
    `Wind Speed: ${report.wind.wind_speed} km/h`,
    15,
    y
  );
  y += 8;

  doc.text(
    `Wind Score: ${report.wind.wind_score}`,
    15,
    y
  );
  y += 8;

  doc.text(
    `Suitability: ${report.wind.suitability}`,
    15,
    y
  );

  // Forecast
  y += 15;
  doc.setFontSize(14);
  doc.text("Weather Forecast", 15, y);

  y += 10;
  doc.setFontSize(11);

  doc.text(
    `Temperature: ${report.forecast.temperature} °C`,
    15,
    y
  );
  y += 8;

  doc.text(
    `Humidity: ${report.forecast.humidity}%`,
    15,
    y
  );
  y += 8;

  doc.text(
    `Wind Speed: ${report.forecast.wind_speed} km/h`,
    15,
    y
  );

  // Investment
  y += 15;
  doc.setFontSize(14);
  doc.text("Investment Analysis", 15, y);

  y += 10;
  doc.setFontSize(11);

  doc.text(
    `Investment Score: ${report.investment.investment_score}`,
    15,
    y
  );
  y += 8;

  doc.text(
    `ROI: ${report.investment.roi}%`,
    15,
    y
  );
  y += 8;

  doc.text(
    `Payback Period: ${report.investment.payback_period} Years`,
    15,
    y
  );
  y += 8;

  doc.text(
    `Risk: ${report.investment.risk}`,
    15,
    y
  );

  doc.save("Renewable_Energy_Report.pdf");
};
    


  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen p-8">

        <PageHeader
          title="Renewable Energy Report"
          subtitle="Generate a complete analysis report for the selected site."
        />

        <p className="text-gray-500 mb-6">
  Report Generated: {new Date().toLocaleString()}
</p>

        {site && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

            <h2 className="text-2xl font-bold mb-4">
              Selected Site
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div>
                <p className="text-gray-500">Site Name</p>
                <p className="font-semibold">{site.name}</p>
              </div>

              <div>
                <p className="text-gray-500">Latitude</p>
                <p className="font-semibold">{site.latitude}</p>
              </div>

              <div>
                <p className="text-gray-500">Longitude</p>
                <p className="font-semibold">{site.longitude}</p>
              </div>

            </div>

            <div className="mt-6">
              <PrimaryButton
                text={loading ? "Generating..." : "Generate Report"}
                onClick={handleGenerate}
              />
            </div>

          </div>
        )}

        {report && (
          <div className="space-y-8">

            {/* Environmental */}

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">
                🌱 Environmental Analysis
              </h2>

              <p><strong>Score:</strong> {report.environment.score}</p>
              <p><strong>Suitability:</strong> {report.environment.suitability}</p>
              <p><strong>Recommendation:</strong> {report.environment.recommendation}</p>
            </div>

            {/* Solar */}

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">
                ☀ Solar Analysis
              </h2>

              <p><strong>Solar Irradiance:</strong> {report.solar.solar_radiation} kWh/m²/day</p>
              <p><strong>Temperature:</strong> {report.solar.temperature} °C</p>
              <p><strong>Solar Score:</strong> {report.solar.solar_score}</p>
              <p><strong>Suitability:</strong> {report.solar.suitability}</p>
            </div>

            {/* Wind */}

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">
                💨 Wind Analysis
              </h2>

              <p><strong>Wind Speed:</strong> {report.wind.wind_speed} km/h</p>
              <p><strong>Elevation:</strong> {report.wind.elevation} m</p>
              <p><strong>Wind Score:</strong> {report.wind.wind_score}</p>
              <p><strong>Suitability:</strong> {report.wind.suitability}</p>
            </div>

            {/* Forecast */}

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">
                🌦 Weather Forecast
              </h2>

              <p><strong>Temperature:</strong> {report.forecast.temperature} °C</p>
              <p><strong>Humidity:</strong> {report.forecast.humidity}%</p>
              <p><strong>Wind Speed:</strong> {report.forecast.wind_speed} km/h</p>
              <p><strong>Cloud Cover:</strong> {report.forecast.cloud_cover}%</p>
              <p><strong>Precipitation:</strong> {report.forecast.precipitation} mm</p>
            </div>

            {/* Investment */}

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">
                💰 Investment Analysis
              </h2>

              <p><strong>Investment Score:</strong> {report.investment.investment_score}</p>
              <p><strong>ROI:</strong> {report.investment.roi}%</p>
              <p><strong>Payback Period:</strong> {report.investment.payback_period} Years</p>
              <p><strong>Risk:</strong> {report.investment.risk}</p>
              <p><strong>Recommendation:</strong> {report.investment.recommendation}</p>
            </div>

            {/* Overall Recommendation */}

<div className="bg-white rounded-2xl shadow-md p-6">
  <h2 className="text-2xl font-bold mb-4">
    🤖 Overall Recommendation
  </h2>

  <p className="text-lg leading-8">
    Based on the environmental, solar, wind, weather forecast, and investment
    analysis, this site is highly suitable for renewable energy deployment.
    A hybrid Solar + Wind installation is recommended to maximize energy
    generation and long-term return on investment.
  </p>
</div>

            {/* PDF Button */}

            <div className="text-center">
              <PrimaryButton
  text="Download PDF"
  onClick={downloadPDF}
/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  <ScoreChart
    title="Environmental Score"
    score={report.environment.score}
  />

  <ScoreChart
    title="Solar Score"
    score={report.solar.solar_score}
  />

  <ScoreChart
    title="Wind Score"
    score={report.wind.wind_score}
  />

  <ScoreChart
    title="Investment Score"
    score={report.investment.investment_score}
  />

</div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Report;