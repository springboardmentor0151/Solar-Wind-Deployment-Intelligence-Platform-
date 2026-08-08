import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import api from "../api/api";

function ProjectWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);

  useEffect(() => {
    loadProject();
  }, []);

  async function loadProject() {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  if (!project) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-10">
          Loading Project...
        </div>
      </div>
    );
  }

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen p-8">

        <div className="bg-white rounded-2xl shadow p-8">

          <h1 className="text-3xl font-bold">
            {project.name}
          </h1>

          <p className="text-gray-600 mt-2">
            {project.description}
          </p>

          <div className="mt-6">
  <span className="font-semibold">Location:</span> {project.location}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">

  <button className="bg-green-600 text-white p-6 rounded-xl">
    📍 Sites
  </button>

  <button className="bg-blue-600 text-white p-6 rounded-xl">
    🗺 GIS Map
  </button>

  <button className="bg-yellow-500 text-white p-6 rounded-xl">
    🌍 Environmental
  </button>

  <button className="bg-orange-500 text-white p-6 rounded-xl">
    ☀ Solar
  </button>

  <button className="bg-cyan-600 text-white p-6 rounded-xl">
    💨 Wind
  </button>

  <button className="bg-purple-600 text-white p-6 rounded-xl">
    📊 Forecast
  </button>

  <button className="bg-pink-600 text-white p-6 rounded-xl">
    📈 Report
  </button>

  <button className="bg-indigo-600 text-white p-6 rounded-xl">
    ⚙ Deployment
  </button>

  <button className="bg-emerald-700 text-white p-6 rounded-xl">
    💰 Investment
  </button>

</div>


        </div>

      </div>

    </div>
  );
}

export default ProjectWorkspace;