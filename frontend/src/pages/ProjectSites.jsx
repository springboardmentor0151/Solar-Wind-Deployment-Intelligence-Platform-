import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

function ProjectSites() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

const [editId, setEditId] = useState(null);

const [editName, setEditName] = useState("");

const [editLatitude, setEditLatitude] = useState("");

const [editLongitude, setEditLongitude] = useState("");
  useEffect(() => {
    fetchSites();
  }, [projectId]);

  const fetchSites = async () => {
    try {
      const res = await api.get(`/sites/project/${projectId}`);
      setSites(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSite = async () => {
  try {
    // Get latitude & longitude from OpenStreetMap
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );
   
   

    const geoData = await geoResponse.json();

    if (geoData.length === 0) {
      alert("Location not found.");
      return;
    }

    const latitude = parseFloat(geoData[0].lat);
    const longitude = parseFloat(geoData[0].lon);

    // Save site in your backend
    await api.post("/sites", {
      name,
      latitude,
      longitude,
      project_id: Number(projectId),
    });

    setName("");
    setLocation("");
    setShowForm(false);

    fetchSites();

    alert("Site created successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to create site.");
  }
};

const deleteSite = async (siteId) => {
  if (!window.confirm("Delete this site?")) return;

  try {
    const response = await api.delete(`/sites/${siteId}`);

    console.log(response.data);

    alert("Site deleted successfully!");

    fetchSites();

  } catch (err) {
    console.log(err);

    console.log(err.response);

    alert(JSON.stringify(err.response?.data));
  }
};
const openEdit = (site) => {

  setEditId(site.id);

  setEditName(site.name);

  setEditLatitude(site.latitude);

  setEditLongitude(site.longitude);

  setShowEdit(true);

};
const updateSite = async () => {

  try {

    await api.put(`/sites/${editId}`, {
      name: editName,
      latitude: Number(editLatitude),
      longitude: Number(editLongitude),
    });

    alert("Site updated successfully!");

    setShowEdit(false);

    fetchSites();

  } catch (error) {

    console.log(error);

    alert(
      error.response?.data?.detail ||
      "Failed to update site."
    );

  }

};
 return (
  <div className="flex">
    <Sidebar />

    <div className="flex-1 bg-slate-100 min-h-screen p-8">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Project #{projectId}
          </h1>

          <p className="text-gray-500">
            Manage all sites for this project
          </p>
        </div>

        <button
  onClick={() => setShowForm(!showForm)}
  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
>
  + Create Site
</button>
      </div>
      {showForm && (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-8">

    <h2 className="text-xl font-bold mb-4">
      Create New Site
    </h2>

    <input
      type="text"
      placeholder="Site Name"
      className="border p-2 rounded w-full mb-3"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
    <input
  type="text"
  placeholder="Location (e.g. Jaipur, Rajasthan, India)"
  className="border p-2 rounded w-full mb-4"
  value={location}
  onChange={(e) => setLocation(e.target.value)}
/>
    

    <button
      onClick={handleCreateSite}
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
    >
      Create Site
    </button>

  </div>
)}

      {loading ? (
        <p>Loading...</p>
      ) : sites.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-6">
          No sites found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-white rounded-xl shadow p-6"
            >
              <h2 className="text-xl font-semibold">
                {site.name}
              </h2>

              <p className="text-gray-600 mt-2">
                Latitude: {site.latitude}
              </p>

              <p className="text-gray-600">
                Longitude: {site.longitude}
              </p>

            <div className="flex gap-2 mt-5">

  <button
    onClick={() => navigate(`/sites/${site.id}`)}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex-1"
  >
    Open
  </button>

  <button
    onClick={() => openEdit(site)}
    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
  >
    Edit
  </button>

  <button
    onClick={() => deleteSite(site.id)}
    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
  >
    Delete
  </button>

</div>
            </div>
          ))}
        </div>
      )}
      {showEdit && (

<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

  <div className="bg-white rounded-2xl shadow-xl p-8 w-[500px]">

    <h2 className="text-2xl font-bold mb-6">
      Edit Site
    </h2>

    <input
      className="w-full border rounded-lg p-3 mb-4"
      value={editName}
      onChange={(e) => setEditName(e.target.value)}
    />

    <input
      type="number"
      className="w-full border rounded-lg p-3 mb-4"
      value={editLatitude}
      onChange={(e) => setEditLatitude(e.target.value)}
    />

    <input
      type="number"
      className="w-full border rounded-lg p-3"
      value={editLongitude}
      onChange={(e) => setEditLongitude(e.target.value)}
    />

    <div className="flex justify-end gap-3 mt-6">

      <button
        onClick={() => setShowEdit(false)}
        className="bg-gray-500 text-white px-5 py-2 rounded-lg"
      >
        Cancel
      </button>

      <button
        onClick={updateSite}
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
  
);
}

export default ProjectSites;