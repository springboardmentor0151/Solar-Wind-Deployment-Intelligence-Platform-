import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";
import RecommendationCard from "../components/RecommendationCard";

import {
  FaTemperatureHigh,
  FaTint,
  FaWind,
  FaCloud,
  FaCloudRain,
} from "react-icons/fa";

import api from "../api/api";

function Forecast() {
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

  const handleForecast = async () => {
    if (!site) return;

    setLoading(true);

    try {
      const response = await api.post("/forecast/predict", {
        latitude: site.latitude,
        longitude: site.longitude,
      });

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch forecast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-8 bg-gray-100 min-h-screen">

        <PageHeader
          title="Weather Forecast"
          subtitle="Current weather conditions for the selected renewable energy site."
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
                text={loading ? "Loading..." : "Get Forecast"}
                onClick={handleForecast}
              />
            </div>

          </div>
        )}

        {result && (
          <>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">

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
                icon={<FaWind className="text-green-600" />}
                title="Wind Speed"
                value={`${result.wind_speed} km/h`}
              />

              <StatCard
                icon={<FaCloud className="text-gray-600" />}
                title="Cloud Cover"
                value={`${result.cloud_cover}%`}
              />

              <StatCard
                icon={<FaCloudRain className="text-cyan-600" />}
                title="Precipitation"
                value={`${result.precipitation} mm`}
              />

            </div>

            <RecommendationCard
              recommendation={
                result.wind_speed >= 6
                  ? "Current weather conditions are favorable for renewable energy generation."
                  : "Weather conditions are moderate. Continue monitoring for better renewable energy production."
              }
            />

          </>
        )}

      </div>
    </div>
  );
}

export default Forecast;