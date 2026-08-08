import { useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";
import PageHeader from "../components/PageHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";
import RecommendationCard from "../components/RecommendationCard";

import {
  FaBolt,
  FaIndustry,
  FaMapMarkedAlt,
  FaLeaf,
} from "react-icons/fa";

function DeploymentOptimization() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [result, setResult] = useState(null);

  async function optimizeSite(e) {
    e.preventDefault();

    try {
      const response = await api.post("/optimization", {
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      setResult(response.data);
    } catch (error) {
      console.log(error);
      alert("Unable to optimize deployment.");
    }
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen">
        <div className="p-8">
          <PageHeader
            title="⚙️ Deployment Optimization"
            subtitle="Optimize renewable energy deployment using AI-powered analysis."
          />

          {/* Input Section */}

          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Deployment Parameters
            </h2>

            <form onSubmit={optimizeSite}>
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
                <PrimaryButton text="Optimize Deployment" />
              </div>
            </form>
          </div>

          {/* Results */}

          {result && (
            <>
              {/* KPI Cards */}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={<FaLeaf className="text-green-600" />}
                  title="Recommended Plant"
                  value={result.recommended_plant}
                />

                <StatCard
                  icon={<FaBolt className="text-yellow-500" />}
                  title="Capacity"
                  value={`${result.capacity_mw} MW`}
                />

                <StatCard
                  icon={<FaMapMarkedAlt className="text-blue-600" />}
                  title="Land Required"
                  value={`${result.land_required_acres} Acres`}
                />

                <StatCard
                  icon={<FaIndustry className="text-purple-600" />}
                  title="Annual Generation"
                  value={`${result.annual_generation_gwh} GWh`}
                />
              </div>

              {/* Deployment Details */}

              <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  📊 Deployment Details
                </h2>

                {/* Infrastructure */}

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">
                      Infrastructure Units
                    </span>

                    <span>
                      {result.infrastructure_units.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{
                        width: `${Math.min(
                          result.infrastructure_units / 10,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Location */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard
                    icon="📍"
                    title="Location"
                    value={result.location}
                  />

                  <StatCard
                    icon="🏗️"
                    title="Infrastructure"
                    value={result.infrastructure_units.toLocaleString()}
                  />
                </div>
              </div>

              {/* AI Recommendation */}

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

export default DeploymentOptimization;