import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

import PageHeader from "../components/PageHeader";

import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";
import RecommendationCard from "../components/RecommendationCard";

import {
  FaTemperatureHigh,
  FaTint,
  FaSun,
  FaWind,
  FaMountain,
  FaTree,
  FaRoad,
  FaPlug,
} from "react-icons/fa";

function Environmental() {
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
  async function handleAnalyze(e) {
  e.preventDefault();

  if (!site) {
    alert("Site data is still loading.");
    return;
  }

  try {
    const response = await api.post("/environment/analyze", {
      latitude: site.latitude,
      longitude: site.longitude,
    });

    setResult(response.data);
  } catch (error) {
    console.log(error);
    alert("Analysis Failed");
  }
}

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen">
        <div className="p-8">
          <PageHeader
            title="🌍 Environmental Analysis"
            subtitle="Analyze environmental conditions for renewable energy deployment."
          />

          {/* Input Section */}

          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Environmental Parameters
            </h2>

            <form onSubmit={handleAnalyze}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">

  <h3 className="font-semibold text-lg">
    Selected Site
  </h3>

  {site ? (
    <>
      <p><strong>Name:</strong> {site.name}</p>
      <p><strong>Latitude:</strong> {site.latitude}</p>
      <p><strong>Longitude:</strong> {site.longitude}</p>
    </>
  ) : (
    <p>Loading site...</p>
  )}

</div>
              </div>

              <div className="mt-6">
                <PrimaryButton text="Analyze Environment" />
              </div>
            </form>
          </div>

          {/* Results */}

          {result && (
            <>
              {/* KPI Cards */}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={<FaTemperatureHigh className="text-red-500" />}
                  title="Temperature"
                  value={`${result.temperature} °C`}
                />

                <StatCard
                  icon={<FaTint className="text-blue-500" />}
                  title="Humidity"
                  value={`${result.humidity}%`}
                />

                <StatCard
                  icon={<FaSun className="text-yellow-500" />}
                  title="Solar Radiation"
                  value={`${result.solar_radiation} kWh/m²`}
                />

                <StatCard
                  icon={<FaWind className="text-cyan-500" />}
                  title="Wind Speed"
                  value={`${result.wind_speed} m/s`}
                />
              </div>

              {/* Environmental Metrics */}

              <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  🌿 Environmental Metrics
                </h2>

                <div className="space-y-6">
                  {/* Solar Radiation */}

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Solar Radiation</span>
                      <span>{result.solar_radiation}</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-yellow-500 h-4 rounded-full"
                        style={{
                          width: `${Math.min(
                            (result.solar_radiation / 10) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Wind Speed */}

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Wind Speed</span>
                      <span>{result.wind_speed} m/s</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{
                          width: `${Math.min(
                            (result.wind_speed / 20) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Information */}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={<FaMountain className="text-gray-600" />}
                  title="Elevation"
                  value={`${result.elevation} m`}
                />

                <StatCard
                  icon={<FaTree className="text-green-600" />}
                  title="Terrain"
                  value={result.terrain}
                />

                <StatCard
                  icon={<FaRoad className="text-orange-500" />}
                  title="Road Access"
                  value={result.road_access}
                />

                <StatCard
                  icon={<FaPlug className="text-purple-600" />}
                  title="Grid Connection"
                  value={result.grid_connection}
                />
              </div>

              {/* Land Type */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard
                  icon="🌱"
                  title="Land Type"
                  value={result.land_type}
                />

                <StatCard
                  icon="🌍"
                  title="Site Status"
                  value="Suitable for Renewable Analysis"
                />
              </div>

              {/* Recommendation */}

              <RecommendationCard
                recommendation={`This location has a temperature of ${result.temperature}°C, wind speed of ${result.wind_speed} m/s, and solar radiation of ${result.solar_radiation} kWh/m²/day. These environmental conditions should be considered when planning renewable energy deployment.`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Environmental;