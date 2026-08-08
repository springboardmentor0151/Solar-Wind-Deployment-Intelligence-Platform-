import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

import PageHeader from "../components/PageHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";

import {
  FaFolderOpen,
  FaPlusCircle,
  FaMapMarkerAlt,
  FaList,
} from "react-icons/fa";

function Projects() {
  const [projects, setProjects] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [activeTab, setActiveTab] = useState("add");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);

const [editId, setEditId] = useState(null);

const [editName, setEditName] = useState("");

const [editDescription, setEditDescription] = useState("");

const [editLocation, setEditLocation] = useState("");

  async function loadProjects() {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (error) {
      console.log(error);
    }
  }
  const deleteProject = async (projectId) => {

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this project?"
  );

  if (!confirmDelete) return;

  try {

    await api.delete(`/projects/${projectId}`);

    alert("Project deleted successfully!");

    loadProjects();

  } catch (error) {

    console.log(error);

    console.log(error.response);

alert(JSON.stringify(error.response.data));

  }

};
const openEdit = (project) => {

  setEditId(project.id);

  setEditName(project.name);

  setEditDescription(project.description);

  setEditLocation(project.location);

  setShowEdit(true);

};
const updateProject = async () => {

  try {

    await api.put(`/projects/${editId}`, {
      name: editName,
      description: editDescription,
      location: editLocation,
    });

    alert("Project Updated!");

    setShowEdit(false);

    loadProjects();

  } catch (error) {

    console.log(error);

    alert("Update Failed!");

  }

};
 async function handleSubmit(e) {
  e.preventDefault();

  try {
    await api.post("/projects", {
      name,
      description,
      location,
    });

    setName("");
    setDescription("");
    setLocation("");

    await loadProjects();

    setActiveTab("view");
  } catch (error) {
    console.log(error);

    if (error.response) {
      alert(JSON.stringify(error.response.data, null, 2));
    }
  }
}
  
    



  useEffect(() => {
    loadProjects();
  }, []);
  const filteredProjects = projects.filter((project) =>
  project.name.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen">
        <div className="p-8">

          <PageHeader
           title="📁 Renewable Energy Projects"
subtitle="Manage solar and wind deployment projects across different locations."
          />

          {/* KPI Cards */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

            <StatCard
              icon={<FaFolderOpen className="text-green-600" />}
              title="Total Projects"
              value={projects.length}
            />

            <StatCard
              icon={<FaPlusCircle className="text-blue-600" />}
             title="Project Status"
             value="Active" 
            />

            <StatCard
              icon={<FaMapMarkerAlt className="text-red-500" />}
              title="Locations"
              value={
                new Set(projects.map((p) => p.location)).size
              }
            />
            <StatCard
  icon={<FaList className="text-purple-600" />}
  title="Project Ready"
  value={`${projects.length} Active`}
/>

          </div>

          {/* Tabs */}

          <div className="flex gap-4 mb-8">

            <button
              onClick={() => setActiveTab("add")}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                activeTab === "add"
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-white shadow text-gray-700 hover:bg-gray-100"
              }`}
            >
              ➕ Add Project
            </button>

            <button
              onClick={() => setActiveTab("view")}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                activeTab === "view"
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-white shadow text-gray-700 hover:bg-gray-100"
              }`}
            >
              📋 View Projects
            </button>

          </div>

          {/* Add Project */}

          {activeTab === "add" && (

            <div className="bg-white rounded-2xl shadow-md p-6">
         

            <h2 className="text-2xl font-bold text-slate-800 mb-6">
  Create New Project
</h2>
              <form onSubmit={handleSubmit}>

                <div className="space-y-4">

                  <InputField
                    type="text"
                    placeholder="Project Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <textarea
                    placeholder="Project Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border rounded-xl p-4 focus:ring-2 focus:ring-green-500 outline-none"
                    rows={4}
                    required
                  />

                  <InputField
                    type="text"
                    placeholder="Project Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />

                </div>

                <div className="mt-6">
                <PrimaryButton text="Create Project" />
                </div>

              </form>

            </div>

          )}

          {/* View Projects */}

          {activeTab === "view" && (

            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex items-center gap-3 mb-6">

                <FaList className="text-green-600 text-2xl" />

                <h2 className="text-2xl font-bold text-slate-800">
                  Project List
                </h2>
                <div className="mt-6 mb-6">
  <input
    type="text"
    placeholder="🔍 Search Project..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full md:w-96 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
  />
</div>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="bg-gradient-to-r from-green-600 to-blue-600 text-white">

                      <th className="p-4 text-left">ID</th>
                      <th className="p-4 text-left">Project</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left">Location</th>
                      <th className="p-4 text-center">
    Status
</th>
<th className="p-4 text-center">Action</th>



                    </tr>

                  </thead>

                  <tbody>

                    {filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => (

                        <tr
                          key={project.id}
                          className="border-b hover:bg-green-50 hover:shadow-md transition duration-300"
                        >

                          <td className="p-4">{project.id}</td>
                          <td className="p-4 font-semibold">
                            {project.name}
                          </td>
                          <td className="p-4">
                            {project.description}
                          </td>
                          <td className="p-4">
  {project.location}
</td>
<td className="p-4 text-center">
    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
        Active
    </span>
</td>
<td className="p-4 text-center">
  <div className="flex justify-center gap-2">

  <button
    onClick={() => navigate(`/projects/${project.id}/sites`)}
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
  >
    Open
  </button>

  <button
    onClick={() => openEdit(project)}
    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
  >
    Edit
  </button>

  <button
    onClick={() => deleteProject(project.id)}
    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
  >
    Delete
  </button>

</div>
  
</td>
                          

   


                        </tr>

                      ))

                    ) : (

                      <tr>

                        <td
                          colSpan="6"
                          className="text-center py-10 text-gray-500"
                        >
                          📂 No Projects Found.
Create your first renewable energy project.
                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

               )}

      {/* Edit Project Modal */}

      {showEdit && (

        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

          <div className="bg-white rounded-2xl shadow-xl p-8 w-[500px]">

            <h2 className="text-2xl font-bold mb-6">
              Edit Project
            </h2>

            <input
              className="w-full border rounded-lg p-3 mb-4"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <textarea
              rows={4}
              className="w-full border rounded-lg p-3 mb-4"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />

            <input
              className="w-full border rounded-lg p-3"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setShowEdit(false)}
                className="bg-gray-500 text-white px-5 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={updateProject}
                className="bg-green-600 text-white px-5 py-2 rounded-lg"
              >
                Save Changes
              </button>

            
   </div>

          </div>

        </div>

      )}

    </div>

  </div>

</div>

);
}

export default Projects;
