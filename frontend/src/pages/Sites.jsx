import { useEffect, useState } from "react";
import API from "../services/api";
import SitesMap from "../components/SitesMap";
import Layout from "../components/Layout";
import "./Sites.css";

function Sites() {
  // ================================
  // FORM STATE
  // ================================

  const [projectName, setProjectName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [solarScore, setSolarScore] = useState("");
  const [windScore, setWindScore] = useState("");
  const [windPotential, setWindPotential] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const [sites, setSites] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // ================================
  // LOAD SITES
  // ================================

  const loadSites = async () => {
    try {
      const response = await API.get("/sites/");
      setSites(response.data);
    } catch (error) {
      console.error("Load Sites Error:", error);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  // ================================
  // FIND LOCATION
  // ================================

  const findLocation = async () => {
    if (!locationName.trim()) {
      alert("Please enter a location name.");
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          locationName
        )}`,
        {
          headers: {
            "User-Agent": "SolarWindDeploymentPlatform/1.0",
          },
        }
      );

      const data = await response.json();

      if (!data || data.length === 0) {
        alert("Location not found. Try another location.");
        return;
      }

      const location = data[0];

      const lat = Number(location.lat).toFixed(5);
      const lng = Number(location.lon).toFixed(5);

      setLatitude(lat);
      setLongitude(lng);
      setLocationName(location.display_name);

    } catch (error) {
      console.error("Location Search Error:", error);
      alert("Unable to find location.");
    }
  };

  // ================================
  // MAP LOCATION SELECT
  // ================================

  const selectMapLocation = async (lat, lng) => {
    const latitudeValue = Number(lat).toFixed(5);
    const longitudeValue = Number(lng).toFixed(5);

    setLatitude(latitudeValue);
    setLongitude(longitudeValue);
    setLocationName("Loading location...");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "User-Agent": "SolarWindDeploymentPlatform/1.0",
          },
        }
      );

      const data = await response.json();
      const address = data.address || {};

      const name =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        data.display_name ||
        "Selected Location";

      setLocationName(name);

    } catch (error) {
      console.error("Reverse Location Error:", error);
      setLocationName("Selected Location");
    }
  };

  // ================================
  // SAVE SITE
  // ================================

  const saveSite = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    if (!latitude || !longitude) {
      alert("Please find a location or select a location on the map.");
      return;
    }

    try {
      await API.post("/sites/", {
        project_name: projectName,

        location_name:
          locationName || "Selected Location",

        latitude: Number(latitude),
        longitude: Number(longitude),

        solar_score:
          Number(solarScore) || 0,

        wind_score:
          Number(windScore) || 0,

        wind_potential:
          Number(windPotential) || 0,

        recommendation:
          recommendation || "Not specified",
      });

      alert("Site saved successfully.");

      clearForm();
      await loadSites();

    } catch (error) {
      console.error("Create Site Error:", error);

      alert(
        error.response?.data?.detail ||
        "Unable to create site."
      );
    }
  };

  // ================================
  // EDIT SITE
  // ================================

  const editSite = (site) => {
    setProjectName(
      site.project_name || ""
    );

    setLocationName(
      site.location_name || "Selected Location"
    );

    setLatitude(site.latitude);
    setLongitude(site.longitude);

    setSolarScore(
      site.solar_score ?? ""
    );

    setWindScore(
      site.wind_score ?? ""
    );

    setWindPotential(
      site.wind_potential ?? ""
    );

    setRecommendation(
      site.recommendation || ""
    );

    setEditingId(site.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================================
  // UPDATE SITE
  // ================================

  const updateSite = async () => {
    if (!editingId) {
      alert("No site selected for editing.");
      return;
    }

    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    if (!latitude || !longitude) {
      alert("Latitude and longitude are required.");
      return;
    }

    try {
      const siteData = {
        project_name: projectName,

        location_name:
          locationName || "Selected Location",

        latitude: Number(latitude),
        longitude: Number(longitude),

        solar_score:
          Number(solarScore) || 0,

        wind_score:
          Number(windScore) || 0,

        wind_potential:
          Number(windPotential) || 0,

        recommendation:
          recommendation || "Not specified",
      };

      await API.put(
        `/sites/${editingId}`,
        siteData
      );

      alert("Site updated successfully.");

      clearForm();
      await loadSites();

    } catch (error) {
      console.error(
        "Update Site Error:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Unable to update site."
      );
    }
  };

  // ================================
  // DELETE SITE
  // ================================

  const deleteSite = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this site?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/sites/${id}`);

      alert("Site deleted successfully.");

      if (editingId === id) {
        clearForm();
      }

      await loadSites();

    } catch (error) {
      console.error(
        "Delete Site Error:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Unable to delete site."
      );
    }
  };

  // ================================
  // CLEAR FORM
  // ================================

  const clearForm = () => {
    setProjectName("");
    setLocationName("");
    setLatitude("");
    setLongitude("");

    setSolarScore("");
    setWindScore("");
    setWindPotential("");
    setRecommendation("");

    setEditingId(null);
  };

  // ================================
  // UI
  // ================================

  return (
    <Layout>

      <div className="sites-page">

        {/* ============================= */}
        {/* HEADER */}
        {/* ============================= */}

        <div className="dashboard-header">

          <h1>
            📍 Site Management
          </h1>

          <p>
            Save and manage renewable energy
            deployment locations
          </p>

        </div>


        {/* ============================= */}
        {/* FORM */}
        {/* ============================= */}

        <div className="site-form">

          <h2>
            {editingId
              ? "✏ Edit Site"
              : "➕ Add New Site"}
          </h2>

          <p className="form-help">
            Enter project details and select
            your renewable energy location.
          </p>


          {/* PROJECT NAME */}

          <div className="form-group">

            <label>
              Project Name
            </label>

            <input
              className="site-input"
              type="text"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) =>
                setProjectName(e.target.value)
              }
            />

          </div>


          {/* LOCATION SEARCH */}

          <div className="location-search">

            <input
              className="site-input location-input"
              type="text"
              placeholder="Enter location e.g. Pune, Maharashtra"
              value={locationName}
              onChange={(e) =>
                setLocationName(e.target.value)
              }
            />

            <button
              type="button"
              className="find-location-button"
              onClick={findLocation}
            >
              🔍 Find Location
            </button>

          </div>


          {/* COORDINATES */}

          <div className="coordinates-box">

            <div>

              <label>
                Latitude
              </label>

              <input
                className="site-input"
                value={latitude}
                readOnly
                placeholder="Select location"
              />

            </div>


            <div>

              <label>
                Longitude
              </label>

              <input
                className="site-input"
                value={longitude}
                readOnly
                placeholder="Select location"
              />

            </div>

          </div>


          {/* MAP */}

          <div className="form-map">

            <h3>
              🗺 Select Location From Map
            </h3>

            <p>
              Click anywhere on the map to choose
              your site location.
            </p>

            <SitesMap
              sites={sites}
              selectLocation={selectMapLocation}
            />

          </div>


          {/* SITE DATA */}

          <div className="site-form-grid">

            <input
              className="site-input"
              type="number"
              step="any"
              placeholder="Solar Score"
              value={solarScore}
              onChange={(e) =>
                setSolarScore(e.target.value)
              }
            />


            <input
              className="site-input"
              type="number"
              step="any"
              placeholder="Wind Score"
              value={windScore}
              onChange={(e) =>
                setWindScore(e.target.value)
              }
            />


            <input
              className="site-input"
              type="number"
              step="any"
              placeholder="Wind Potential"
              value={windPotential}
              onChange={(e) =>
                setWindPotential(e.target.value)
              }
            />


            <input
              className="site-input"
              type="text"
              placeholder="Recommendation"
              value={recommendation}
              onChange={(e) =>
                setRecommendation(e.target.value)
              }
            />

          </div>


          {/* BUTTONS */}

          <div className="site-form-actions">

            <button
              type="button"
              className="site-button"
              onClick={
                editingId
                  ? updateSite
                  : saveSite
              }
              style={{
                background:
                  editingId
                    ? "#f59e0b"
                    : "#16a34a",
              }}
            >
              {editingId
                ? "Update Site"
                : "💾 Save Site"}
            </button>


            {editingId && (

              <button
                type="button"
                className="site-button"
                onClick={clearForm}
                style={{
                  background: "#6b7280",
                }}
              >
                Cancel
              </button>

            )}

          </div>

        </div>


        {/* ============================= */}
        {/* SAVED SITES */}
        {/* ============================= */}

        <div className="sites-section">

          <div className="section-title">

            <h2>
              📍 Saved Sites
            </h2>

            <span>
              {sites.length} site
              {sites.length !== 1
                ? "s"
                : ""}
            </span>

          </div>


          {sites.length === 0 ? (

            <div className="empty-sites">

              <h3>
                📍 No Sites Available
              </h3>

              <p>
                Add your first renewable
                energy site above.
              </p>

            </div>

          ) : (

            <div className="site-list">

              {sites.map((site) => (

                <div
                  key={site.id}
                  className="site-card"
                >

                  <div className="site-card-header">

                    <h2>
                      📍{" "}
                      {site.project_name ||
                        site.location_name ||
                        `Site #${site.id}`}
                    </h2>

                    <span>
                      Site #{site.id}
                    </span>

                  </div>


                  <div className="site-details">

                    <p>
                      <strong>
                        Project Name:
                      </strong>{" "}
                      {site.project_name ||
                        "Not specified"}
                    </p>


                    <p>
                      <strong>
                        Location:
                      </strong>{" "}
                      {site.location_name ||
                        "Unknown Location"}
                    </p>


                    <p>
                      <strong>
                        Latitude:
                      </strong>{" "}
                      {site.latitude}
                    </p>


                    <p>
                      <strong>
                        Longitude:
                      </strong>{" "}
                      {site.longitude}
                    </p>


                    <p>
                      <strong>
                        Solar Score:
                      </strong>{" "}
                      {site.solar_score}/100
                    </p>


                    <p>
                      <strong>
                        Wind Score:
                      </strong>{" "}
                      {site.wind_score}/100
                    </p>


                    <p>
                      <strong>
                        Wind Potential:
                      </strong>{" "}
                      {site.wind_potential}
                    </p>


                    <p className="recommendation-text">

                      <strong>
                        Recommendation:
                      </strong>{" "}

                      {site.recommendation}

                    </p>

                  </div>


                  {/* ACTIONS */}

                  <div className="site-actions">

                    <button
                      type="button"
                      className="site-action-button edit-button"
                      onClick={() =>
                        editSite(site)
                      }
                    >
                      ✏ Edit
                    </button>


                    <button
                      type="button"
                      className="site-action-button delete-button"
                      onClick={() =>
                        deleteSite(site.id)
                      }
                    >
                      🗑 Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </Layout>
  );
}

export default Sites;