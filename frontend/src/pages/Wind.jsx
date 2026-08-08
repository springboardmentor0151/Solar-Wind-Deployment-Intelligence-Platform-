import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";
import RecommendationCard from "../components/RecommendationCard";

import {
  FaWind,
  FaMountain,
  FaChartLine,
  FaCheckCircle,
} from "react-icons/fa";

function Wind() {
  const { siteId } = useParams();

  const [site, setSite] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadSite();
  }, [siteId]);

  const loadSite = async () => {
    try {
      const response = await api.get(`/sites/${siteId}`);
      setSite(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  async function handlePredict(e) {
    e.preventDefault();

    if (!site) {
      alert("Site data is still loading.");
      return;
    }

    try {
      const response = await api.post("/wind/predict", {
        latitude: site.latitude,
        longitude: site.longitude,
      });

      setResult(response.data);
    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(JSON.stringify(error.response.data, null, 2));
      } else {
        alert(error.message);
      }
    }
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen">
        <div className="p-8">

          <PageHeader
            title="🌬️ Wind Energy Prediction"
            subtitle="Predict wind energy potential using AI-powered analysis."
          />

          {/* Selected Site */}

          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Selected Site
            </h2>

            {site ? (
              <div className="space-y-2">
                <p><strong>Name:</strong> {site.name}</p>
                <p><strong>Latitude:</strong> {site.latitude}</p>
                <p><strong>Longitude:</strong> {site.longitude}</p>
              </div>
            ) : (
              <p>Loading site...</p>
            )}

            <div className="mt-6">
              <PrimaryButton
                text="Predict Wind Potential"
                onClick={handlePredict}
              />
            </div>

          </div>

          {/* Result */}

          {result && (
            <>
              {/* KPI Cards */}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

                <StatCard
                  icon={<FaWind className="text-blue-500" />}
                  title="Wind Speed"
                  value={`${result.wind_speed} m/s`}
                />

                <StatCard
                  icon={<FaMountain className="text-gray-600" />}
                  title="Elevation"
                  value={`${result.elevation} m`}
                />

                <StatCard
                  icon={<FaWind className="text-cyan-500" />}
                  title="Wind Score"
                  value={`${result.wind_score}%`}
                />

                <StatCard
                  icon={<FaCheckCircle className="text-green-600" />}
                  title="Suitability"
                  value={result.suitability}
                />

              </div>

              {/* Wind Score */}

              <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  🌬️ Wind Potential
                </h2>

                <div>

                  <div className="flex justify-between mb-2">
                    <span>Wind Potential</span>
                    <span>{result.wind_score}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4">

                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{
                        width: `${result.wind_score}%`,
                      }}
                    />

                  </div>

                </div>

              </div>

              {/* Summary */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                <StatCard
                  icon={<FaChartLine className="text-indigo-600" />}
                  title="Prediction"
                  value={
                    result.wind_score >= 80
                      ? "Excellent"
                      : result.wind_score >= 60
                      ? "Good"
                      : "Average"
                  }
                />

                <StatCard
                  icon="💨"
                  title="Energy Type"
                  value="Wind"
                />

              </div>

              {/* Recommendation */}

              <RecommendationCard
                recommendation={result.recommendation}
              />
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Wind;