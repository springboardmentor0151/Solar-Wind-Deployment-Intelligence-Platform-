import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

function SiteDashboard() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSite();
  }, [siteId]);

  const loadSite = async () => {
    try {
      const res = await api.get(`/sites/${siteId}`);
      setSite(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen p-8">

        <div className="bg-white rounded-2xl shadow p-8">

          <h1 className="text-3xl font-bold">
            {site.name}
          </h1>

          <p className="text-gray-500 mt-2">
            Site Dashboard
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">

  <div
    className="bg-white rounded-2xl shadow p-6 hover:shadow-xl cursor-pointer"
    onClick={() => navigate(`/sites/${siteId}/gis`)}
  >
    <h2 className="text-xl font-bold">🗺 GIS Map</h2>
    <p className="text-gray-500 mt-2">
      View site on interactive map
    </p>
  </div>

  <div
    className="bg-white rounded-2xl shadow p-6 hover:shadow-xl cursor-pointer"
    onClick={() => navigate(`/sites/${siteId}/environment`)}
  >
    <h2 className="text-xl font-bold">🌱 Environmental</h2>
    <p className="text-gray-500 mt-2">
      Environmental analysis
    </p>
  </div>

  <div
    className="bg-white rounded-2xl shadow p-6 hover:shadow-xl cursor-pointer"
    onClick={() => navigate(`/sites/${siteId}/solar`)}
  >
    <h2 className="text-xl font-bold">☀ Solar</h2>
    <p className="text-gray-500 mt-2">
      Solar potential
    </p>
  </div>

  <div
    className="bg-white rounded-2xl shadow p-6 hover:shadow-xl cursor-pointer"
    onClick={() => navigate(`/sites/${siteId}/wind`)}
  >
    <h2 className="text-xl font-bold">💨 Wind</h2>
    <p className="text-gray-500 mt-2">
      Wind potential
    </p>
  </div>

  <div
    className="bg-white rounded-2xl shadow p-6 hover:shadow-xl cursor-pointer"
    onClick={() => navigate(`/sites/${siteId}/forecast`)}
  >
    <h2 className="text-xl font-bold">🌦 Weather Forecast</h2>
    <p className="text-gray-500 mt-2">
      View weather forecast
    </p>
  </div>

  <div
    className="bg-white rounded-2xl shadow p-6 hover:shadow-xl cursor-pointer"
    onClick={() => navigate(`/sites/${siteId}/investment`)}
  >
    <h2 className="text-xl font-bold">💰 Investment</h2>
    <p className="text-gray-500 mt-2">
      ROI and cost analysis
    </p>
  </div>
  <div
  className="bg-white rounded-2xl shadow p-6 hover:shadow-xl cursor-pointer"
  onClick={() => navigate(`/sites/${siteId}/report`)}
>
  <h2 className="text-xl font-bold">📄 Report</h2>
  <p className="text-gray-500 mt-2">
    Generate complete project report
  </p>
</div>

</div>

        </div>

      </div>
    </div>
  );
}

export default SiteDashboard;