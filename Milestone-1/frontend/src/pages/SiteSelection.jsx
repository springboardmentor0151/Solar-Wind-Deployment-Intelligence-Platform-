import { useEffect, useState } from "react";
import { HiOutlineMapPin, HiOutlinePlusCircle } from "react-icons/hi2";

import { getProjects } from "../services/projectService";
import { createSite, getSites } from "../services/siteService";
import { useAuth } from "../Authentication/AuthContext";
import { useToast } from "../context/ToastContext";

import DashboardLayout from "../components/layout/DashboardLayout";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";

export default function SiteSelection() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);

  const [siteName, setSiteName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadSites(selectedProjectId);
    } else {
      setSites([]);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error(error);
      showToast("Couldn't load projects.", "error");
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadSites = async (projectId) => {
    try {
      setLoadingSites(true);
      const data = await getSites(projectId);
      setSites(data);
    } catch (error) {
      console.error(error);
      showToast("Couldn't load sites for this project.", "error");
    } finally {
      setLoadingSites(false);
    }
  };

  const resetForm = () => {
    setSiteName("");
    setLatitude("");
    setLongitude("");
    setNotes("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProjectId) {
      showToast("Please select a project first.", "error");
      return;
    }

    if (!siteName.trim()) {
      showToast("Please enter a site name.", "error");
      return;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (latitude === "" || Number.isNaN(lat) || lat < -90 || lat > 90) {
      showToast("Latitude must be a number between -90 and 90.", "error");
      return;
    }

    if (longitude === "" || Number.isNaN(lon) || lon < -180 || lon > 180) {
      showToast("Longitude must be a number between -180 and 180.", "error");
      return;
    }

    try {
      setSaving(true);

      // Field names (siteName, latitude, longitude, projectId) match exactly
      // what SiteAnalysis.jsx reads via getSites(projectId) — no adapter
      // needed on that page.
      await createSite({
        siteName: siteName.trim(),
        latitude: lat,
        longitude: lon,
        notes: notes.trim(),
        projectId: selectedProjectId,
        createdBy: currentUser?.email || "Unknown",
      });

      showToast("Site saved successfully.");
      resetForm();
      loadSites(selectedProjectId);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to save site.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
        <h1 className="text-4xl font-bold text-slate-900">Site Selection</h1>
        <p className="mt-3 text-slate-600">
          Create sites under a project so they're available for analysis on
          the Site Analysis page.
        </p>

        {loadingProjects ? (
          <Loader label="Loading projects..." />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={HiOutlineMapPin}
            title="No Projects Available"
            message="Create a project first before adding sites."
          />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 bg-white rounded-3xl shadow-lg p-8 space-y-6"
          >
            <div>
              <label className="block font-medium mb-2 text-slate-700">
                Select Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="w-full border rounded-lg p-3"
              >
                <option value="">-- Choose a project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectName} ({project.energyType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2 text-slate-700">
                Site Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
                className="w-full border rounded-lg p-3"
                placeholder="e.g. North Field Site"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2 text-slate-700">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  className="w-full border rounded-lg p-3"
                  placeholder="-90 to 90"
                />
              </div>

              <div>
                <label className="block font-medium mb-2 text-slate-700">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  className="w-full border rounded-lg p-3"
                  placeholder="-180 to 180"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2 text-slate-700">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border rounded-lg p-3"
                placeholder="Any observations about this location..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Site"}
            </button>
          </form>
        )}

        {/* Existing sites for the selected project — confirms the save
            worked and that it'll show up in Site Analysis's dropdown. */}
        {selectedProjectId && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-5">
              Sites in this Project
            </h2>

            {loadingSites ? (
              <Loader label="Loading sites..." />
            ) : sites.length === 0 ? (
              <EmptyState
                icon={HiOutlinePlusCircle}
                title="No Sites Yet"
                message="Add your first site using the form above."
              />
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sites.map((site) => (
                  <div
                    key={site.id}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
                  >
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {site.siteName}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {site.latitude}, {site.longitude}
                    </p>
                    {site.notes && (
                      <p className="mt-3 text-sm text-slate-600">
                        {site.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
