import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";
import RecommendationCard from "../components/RecommendationCard";

import {
  FaChartLine,
  FaDollarSign,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

import api from "../api/api";

function InvestmentRecommendation() {
  const { siteId } = useParams();

  const [site, setSite] = useState(null);
  const [result, setResult] = useState(null);
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

  const handleInvestment = async () => {
    if (!site) return;

    setLoading(true);

    try {
      const response = await api.post("/investment/recommend", {
        latitude: site.latitude,
        longitude: site.longitude,
      });

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze investment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen p-8">

        <PageHeader
          title="Investment Recommendation"
          subtitle="Analyze renewable energy investment potential for the selected site."
        />

        {/* Site Information */}

        {site && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

            <h2 className="text-xl font-bold mb-4">
              Selected Site
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
                text={loading ? "Analyzing..." : "Analyze Investment"}
                onClick={handleInvestment}
              />
            </div>

          </div>
        )}

        {result && (
          <>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

              <StatCard
                icon={<FaChartLine className="text-green-600" />}
                title="Investment Score"
                value={`${result.investment_score}%`}
              />

              <StatCard
                icon={<FaDollarSign className="text-blue-600" />}
                title="ROI"
                value={`${result.roi}%`}
              />

              <StatCard
                icon={<FaClock className="text-orange-500" />}
                title="Payback Period"
                value={`${result.payback_period} Years`}
              />

              <StatCard
                icon={<FaExclamationTriangle className="text-red-500" />}
                title="Risk"
                value={result.risk}
              />

            </div>

            <RecommendationCard
              recommendation={result.recommendation}
            />

          </>
        )}

      </div>
    </div>
  );
}

export default InvestmentRecommendation;