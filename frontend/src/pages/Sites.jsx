import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

import PageHeader from "../components/PageHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";

import {
  FaMapMarkerAlt,
  FaDatabase,
  FaProjectDiagram,
  FaCheckCircle,
  FaLeaf,
  FaGlobe,
} from "react-icons/fa";

function Sites() {
  const [sites, setSites] = useState([]);

  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [projectId, setProjectId] = useState("");

  async function loadSites() {
    try {
      const response = await api.get("/sites");
      setSites(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.post("/sites", {
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        project_id: Number(projectId),
      });

      setName("");
      setLatitude("");
      setLongitude("");
      setProjectId("");

      loadSites();

    } catch (error) {
      console.log(error);

      if (error.response) {
        alert(JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  useEffect(() => {
    loadSites();
  }, []);

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen">

        <div className="p-8">

          <PageHeader
            title="📍 Site Management"
            subtitle="Manage renewable energy deployment sites with AI insights."
          />

          {/* KPI */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

            <StatCard
              icon={<FaDatabase className="text-green-600" />}
              title="Total Sites"
              value={sites.length}
            />

            <StatCard
              icon={<FaProjectDiagram className="text-blue-600" />}
              title="Projects Linked"
              value={
                new Set(sites.map((s) => s.project_id)).size
              }
            />

            <StatCard
              icon={<FaCheckCircle className="text-emerald-600" />}
              title="Status"
              value="Active"
            />

            <StatCard
              icon={<FaLeaf className="text-lime-600" />}
              title="AI Ready"
              value="100%"
            />

          </div>
         {/* Create Site + Summary */}

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

  {/* Create Site Form */}

  <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-8">

    <div className="flex items-center gap-3 mb-6">

      <div className="bg-green-100 p-3 rounded-xl">
        <FaMapMarkerAlt className="text-green-600 text-2xl" />
      </div>

      <div>

        <h2 className="text-2xl font-bold text-slate-800">
          Create New Site
        </h2>

        <p className="text-gray-500">
          Register a renewable energy deployment location.
        </p>

      </div>

    </div>

    <form onSubmit={handleSubmit}>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <InputField
          type="text"
          placeholder="Site Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <InputField
          type="number"
          placeholder="Project ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />

        <InputField
          type="number"
          step="any"
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
        />

        <InputField
          type="number"
          step="any"
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
        />

      </div>

      <div className="mt-8">
        <PrimaryButton text="Create Site" />
      </div>

    </form>

  </div>

  {/* Deployment Summary */}

  <div className="bg-gradient-to-br from-green-600 via-emerald-500 to-teal-500 rounded-3xl shadow-xl text-white p-8">

    <h2 className="text-2xl font-bold mb-8">
      Deployment Summary
    </h2>

    <div className="space-y-6">

      <div className="bg-white/10 rounded-xl p-4">

        <p className="text-green-100 text-sm">
          Total Sites
        </p>

        <h2 className="text-4xl font-bold">
          {sites.length}
        </h2>

      </div>

      <div className="flex justify-between items-center">

        <span className="flex items-center gap-2">
          <FaGlobe />
          GIS Ready
        </span>

        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
          Enabled
        </span>

      </div>

      <div className="flex justify-between items-center">

        <span className="flex items-center gap-2">
          <FaLeaf />
          Renewable
        </span>

        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
          Active
        </span>

      </div>

      <div className="flex justify-between items-center">

        <span className="flex items-center gap-2">
          <FaProjectDiagram />
          Projects
        </span>

        <span className="font-semibold">
          {new Set(sites.map((s) => s.project_id)).size}
        </span>

      </div>

      <div className="mt-8">

        <div className="flex justify-between mb-2">

          <span>Deployment Progress</span>

          <span>100%</span>

        </div>

        <div className="w-full bg-white/20 rounded-full h-3">

          <div className="bg-white h-3 rounded-full w-full"></div>

        </div>

      </div>

    </div>

  </div>

</div>
   

          {/* Renewable Energy Sites */}

          <div className="mb-6">

            <h2 className="text-3xl font-bold text-slate-800">
              Renewable Energy Sites
            </h2>

            <p className="text-gray-500">
              View all deployed renewable energy locations.
            </p>

          </div>

          {sites.length === 0 ? (

            <div className="bg-white rounded-2xl shadow-md p-12 text-center">

              <FaMapMarkerAlt className="mx-auto text-6xl text-green-500 mb-4" />

              <h2 className="text-2xl font-bold">
                No Sites Available
              </h2>

              <p className="text-gray-500 mt-2">
                Create your first renewable energy site.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

              {sites.map((site) => (

                <div
                  key={site.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >

                  <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-5 text-white">

                    <div className="flex justify-between items-center">

                      <div>

                        <h2 className="text-xl font-bold">
                          {site.name}
                        </h2>

                        <p className="text-green-100">
                          Site #{site.id}
                        </p>

                      </div>

                      <div className="bg-white/20 p-3 rounded-full">

                        <FaMapMarkerAlt size={24} />

                      </div>

                    </div>

                  </div>

                  <div className="p-6 space-y-4">

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Project
                      </span>

                      <span className="font-semibold">
                        #{site.project_id}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Latitude
                      </span>

                      <span className="font-medium">
                        {site.latitude}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Longitude
                      </span>

                      <span className="font-medium">
                        {site.longitude}
                      </span>
                    </div>

                    <hr />

                    <div className="flex justify-between items-center">

                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                        Active
                      </span>

                      <span className="text-sm text-gray-500">
                        Renewable Site
                      </span>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}


        </div>
      </div>
    </div>
  );
}

export default Sites;