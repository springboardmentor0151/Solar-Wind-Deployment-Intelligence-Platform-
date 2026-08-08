import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

import PageHeader from "../components/PageHeader";

import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";
import RecommendationCard from "../components/RecommendationCard";

import {
  FaSun,
  FaChartLine,
  FaCheckCircle,
} from "react-icons/fa";

function Solar() {
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
      const response = await api.post("/solar/predict", {
  latitude: site.latitude,
  longitude: site.longitude,
});


      setResult(response.data);
    } catch (error) {
      console.log(error);

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
            title="☀️ Solar Energy Prediction"
            subtitle="Predict solar energy potential using AI-powered analysis."
          />

          {/* Input Section */}

          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Solar Prediction Parameters
            </h2>

            <form onSubmit={handlePredict}>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">

  <h3 className="font-semibold text-lg mb-3">
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

              <div className="mt-6">
                <PrimaryButton
                  text="Predict Solar Potential"
                />
              </div>

            </form>

          </div>

          {/* Result Section */}

          {result && (
            <>
              {/* KPI Cards */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                <StatCard
                  icon={<FaSun className="text-yellow-500" />}
                  title="Solar Score"
                  value={`${result.solar_score}%`}
                />

                <StatCard
                  icon={<FaCheckCircle className="text-green-600" />}
                  title="Suitability"
                  value={result.suitability}
                />

                <StatCard
                  icon={<FaChartLine className="text-blue-600" />}
                  title="Prediction"
                  value={
                    result.solar_score >= 80
                      ? "Excellent"
                      : result.solar_score >= 60
                      ? "Good"
                      : "Average"
                  }
                />

              </div>

              {/* Solar Potential */}

              <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  ☀️ Solar Potential
                </h2>

                <div>

                  <div className="flex justify-between mb-2">

                    <span>Solar Potential</span>

                    <span>{result.solar_score}%</span>

                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4">

                    <div
                      className="bg-yellow-500 h-4 rounded-full"
                      style={{
                        width: `${result.solar_score}%`,
                      }}
                    />

                  </div>

                </div>

              </div>

              {/* Suitability */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                <StatCard
                  icon="🌞"
                  title="Solar Suitability"
                  value={result.suitability}
                />

                <StatCard
                  icon="📍"
                  title="Energy Type"
                  value="Solar"
                />

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

export default Solar;