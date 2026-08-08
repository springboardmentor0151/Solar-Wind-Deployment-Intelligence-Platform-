import { useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";
import PageHeader from "../components/PageHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";
import RecommendationCard from "../components/RecommendationCard";

import { FaStar, FaSun, FaWind } from "react-icons/fa";

function SiteSuitability() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [result, setResult] = useState(null);

  async function analyzeSite(e) {
    e.preventDefault();

    try {
      const response = await api.post("/suitability", {
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      setResult(response.data);
    } catch (error) {
      console.log(error);
      alert("Unable to analyze site.");
    }
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">
        <div className="p-8">
          <PageHeader
            title="📊 Site Suitability Analysis"
            subtitle="Evaluate the suitability of a location for renewable energy deployment."
          />

          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Site Parameters
            </h2>

            <form onSubmit={analyzeSite}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  type="number"
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />

                <InputField
                  type="number"
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>

              <div className="mt-6">
                <PrimaryButton text="Analyze Site" />
              </div>
            </form>
          </div>

          {/* Result Section */}
          {result && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-green-700 mb-8">
                Site Suitability Report
              </h2>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  icon={<FaStar className="text-green-600" />}
                  title="Overall Score"
                  value={`${result.overall_score}%`}
                />

                <StatCard
                  icon={<FaSun className="text-yellow-500" />}
                  title="Solar Score"
                  value={`${result.solar_score}%`}
                />

                <StatCard
                  icon={<FaWind className="text-blue-600" />}
                  title="Wind Score"
                  value={`${result.wind_score}%`}
                />
              </div>

              {/* Progress Bars */}
              <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                <h3 className="text-2xl font-bold mb-6">
                  📊 Resource Potential
                </h3>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Solar Potential</span>
                      <span>{result.solar_score}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-yellow-500 h-4 rounded-full"
                        style={{ width: `${result.solar_score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Wind Potential</span>
                      <span>{result.wind_score}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${result.wind_score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Overall Suitability</span>
                      <span>{result.overall_score}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full"
                        style={{ width: `${result.overall_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Suitability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard
                  icon="📍"
                  title="Location"
                  value={result.location}
                />

                <StatCard
                  icon="✅"
                  title="Suitability"
                  value={result.suitability}
                />
              </div>

              {/* AI Recommendation */}
              <RecommendationCard
                recommendation={result.recommendation}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SiteSuitability;