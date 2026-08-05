import AnalyticsCharts from "../components/AnalyticsCharts";
import DashboardCard from "../components/DashboardCard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MapPicker from "../components/MapPicker";

export default function Sites() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const [sites, setSites] = useState([]);
  const [editingSiteId, setEditingSiteId] = useState(null);
  const [editSiteName, setEditSiteName] = useState("");

  const [siteName, setSiteName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [landArea, setLandArea] = useState("");
  const [elevation, setElevation] = useState("");
  const [infrastructure, setInfrastructure] = useState("");
  const [ownership, setOwnership] = useState("");
  const [projectId, setProjectId] = useState("1");

  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [prediction, setPrediction] = useState("");
  const [score, setScore] = useState(0);
  const [rating, setRating] = useState("");
  const [location, setLocation] = useState("");
  const [taluk, setTaluk] = useState("");
  const [solarRadiation, setSolarRadiation] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [temperature, setTemperature] = useState("");
  const [rainfall, setRainfall] = useState("");
  const fetchSites = async () => {
  try {
    const res = await axios.get(
      "http://127.0.0.1:8000/sites/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSites(res.data);
  } catch (err) {
    console.log(err);
  }
};

  useEffect(() => {
    fetchSites();
  }, []);

  const getLocationDetails = async (lat, lon) => {
  try {
    const response = await axios.get(
      `http://127.0.0.1:8000/location/details?lat=${lat}&lon=${lon}`
    );

    const data = response.data;
    console.log(JSON.stringify(data, null, 2));
    setLocation(data.location || "");
    setTaluk(data.taluk || "");
    setDistrict(data.district || "");
    setStateName(data.state || "");
    setCountry(data.country || "");
    setElevation(data.elevation || "");
    setInfrastructure(data.infrastructure || "");
    setOwnership(data.ownership || "");
    
  } catch (err) {
    console.log(err);
    alert("Unable to fetch location details");
  }
};

// Fetch weather details automatically
const getWeatherDetails = async (lat, lon) => {
  try {
    const response = await axios.get(
      `http://127.0.0.1:8000/weather/?lat=${lat}&lon=${lon}`
    );

    const data = response.data;
    console.log("Weather API Response:");
    console.log(JSON.stringify(data, null, 2));
    setTemperature(data.temperature || "");
    setWindSpeed(data.wind_speed || "");
    setRainfall(data.rainfall ?? "");
    setSolarRadiation(data.solar_radiation);
    console.log("Temperature:", data.temperature);
    console.log("Wind:", data.wind_speed);
    console.log("Rain:", data.rainfall);
    console.log("Solar:", data.solar_radiation);

  } catch (err) {
    console.log(err);
    alert("Unable to fetch weather details");
  }
};
const searchPlace = async () => {
  if (!searchLocation.trim()) {
    alert("Please enter a location");
    return;
  }

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`
    );

    if (response.data.length === 0) {
      alert("Location not found");
      return;
    }

    const place = response.data[0];

    const lat = Number(place.lat).toFixed(6);
    const lon = Number(place.lon).toFixed(6);

    setLatitude(lat);
    setLongitude(lon);

    await getLocationDetails(lat, lon);
    await getWeatherDetails(lat, lon);

alert("Location Found Successfully!");
  } catch (err) {
    console.log(err);
    alert("Unable to search location");
  }
};
const predictSuitability = async () => {

  console.log({
    latitude,
    longitude,
    landArea,
    elevation
  });

  if (!latitude || !longitude || !landArea || !elevation) {
    alert("Please select a location and enter land area and elevation.");
    return;
  }

  try {
    const res = await axios.post(
  "http://127.0.0.1:8000/predict/",
  {
    latitude: Number(latitude),
    longitude: Number(longitude),
    land_area: Number(landArea),
    elevation: Number(elevation),
    solar_radiation: Number(solarRadiation),
    wind_speed: Number(windSpeed),
    temperature: Number(temperature),
    rainfall: Number(rainfall),
  }
);

    setPrediction(res.data.prediction);
    setScore(res.data.score);
    setRating(res.data.rating);
  } catch (err) {
    console.log(err);
    alert("Prediction failed");
  }
};
const createSite = async () => {
    if (
      !siteName ||
      !latitude ||
      !longitude ||
      !landArea ||
      !elevation ||
      !infrastructure ||
      !ownership ||
      !projectId
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/sites/",
        {
  site_name: siteName,
  latitude: Number(latitude),
  longitude: Number(longitude),
  land_area: Number(landArea),
  elevation: Number(elevation),
  infrastructure,
  land_ownership: ownership,
  prediction,
  score,
  rating,
  project_id: Number(projectId),
},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Site Created Successfully");

      setSiteName("");
      setLatitude("");
      setLongitude("");
      setLandArea("");
      setElevation("");
      setInfrastructure("");
      setOwnership("");

      setLocation("");
      setTaluk("");
      setDistrict("");
      setStateName("");
      setCountry("");

      fetchSites();
    } catch (err) {
      console.log(err);
      alert("Failed to create site");
    }
  };
  const deleteSite = async (siteId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this site?"
  );

  if (!confirmDelete) {
    return;
  }

  try {
    await axios.delete(
      `http://127.0.0.1:8000/sites/${siteId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Site deleted successfully!");

    // Refresh the site list
    fetchSites();

  } catch (err) {
    console.log(err);
    alert("Failed to delete site.");
  }
};

const editSite = (site) => {
  setEditingSiteId(site.id);
  setEditSiteName(site.site_name);
};

const updateSite = async () => {
  try {
    await axios.put(
      `http://127.0.0.1:8000/sites/${editingSiteId}`,
      {
        site_name: editSiteName,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Site updated successfully!");

    setEditingSiteId(null);
    setEditSiteName("");

    fetchSites();
  } catch (err) {
    console.log(err);
    alert("Failed to update site");
  }
};


const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  fontSize: "15px",
  background: "#fff",
  boxSizing: "border-box",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "20px",
};
  return (
 <div
  className={darkMode ? "dark" : ""}
  style={{
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    padding: "40px",
  }}
>
<div
  style={{
  width: "100%",
  maxWidth: "1800px",
  margin: "0 auto",
  padding: "20px",
}}
>
    <h1
  style={{
    fontSize: "36px",
    color: "var(--text)",
    marginBottom: "25px",
    fontWeight: "700",
  }}
>
🌍 Renewable Energy Resource Assessment
</h1>
<button
  onClick={() => setDarkMode(!darkMode)}
  style={{
    marginBottom: "20px",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "none",
    background: "var(--button)",
    color: "white",
  }}
>
  {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
</button>
<h2
  style={{
    color: "var(--text)",
    marginBottom: "20px",
  }}
>
  🔍 Search Location
</h2>


   <div
  style={{
    background: "var(--card)",
    borderRadius: "20px",
    padding: "25px",
    marginBottom: "25px",
    boxShadow: "0 10px 30px rgba(0,0,0,.08)",
  }}
>

    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      <input
        type="text"
        placeholder="Search city, village or district"
        value={searchLocation}
        onChange={(e) => setSearchLocation(e.target.value)}
        style={{
          flex: 1,
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ccc"
        }}
      />

      <button
        onClick={searchPlace}
        style={{
          background: "#0f766e",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Search
      </button>
    </div>

      <button
        onClick={() => {
          navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log(position);

    const lat = position.coords.latitude.toFixed(6);
    const lon = position.coords.longitude.toFixed(6);

    console.log("Current Latitude:", lat);
    console.log("Current Longitude:", lon);

    setLatitude(lat);
    setLongitude(lon);

    getLocationDetails(lat, lon);
    getWeatherDetails(lat, lon);
  },
  (error) => {
    console.log(error);
    alert(error.message);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
);
        }}
      >
        📍 Use My Current Location
      </button>

      <br /><br />

      <MapPicker
  latitude={latitude}
  longitude={longitude}
  setLatitude={setLatitude}
  setLongitude={setLongitude}
  getLocationDetails={getLocationDetails}
  getWeatherDetails={getWeatherDetails}
  setLandArea={setLandArea}
  />
      <br /><br />

      <div
  style={{
    background: "#ffffff",
    padding: "25px",
    borderRadius: "20px",
    marginTop: "25px",
    boxShadow: "0 10px 25px rgba(0,0,0,.08)",
  }}
>
  <h2
    style={{
      color: "var(--text)",
      marginBottom: "20px",
    }}
  >
    📍 Site Information
  </h2>

  <div style={gridStyle}>

    <input
      style={inputStyle}
      placeholder="Site Name"
      value={siteName}
      onChange={(e)=>setSiteName(e.target.value)}
    />

    <input
      style={inputStyle}
      placeholder="Land Area (Acres)"
      value={landArea}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="Latitude"
      value={latitude}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="Longitude"
      value={longitude}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="Exact Location"
      value={location}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="Taluk"
      value={taluk}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="District"
      value={district}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="State"
      value={stateName}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="Country"
      value={country}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="Elevation (Meters)"
      value={elevation}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="Infrastructure"
      value={infrastructure}
      readOnly
    />

    <input
      style={inputStyle}
      placeholder="Land Ownership"
      value={ownership}
      readOnly
    />

  </div>
</div>

      <br /><br />

</div>
<div
  style={{
    background: "#ffffff",
    borderRadius: "20px",
    padding: "25px",
    marginTop: "30px",
    marginBottom: "30px",
    boxShadow: "0 10px 25px rgba(0,0,0,.08)",
  }}
>
  <h2
    style={{
      color: "var(--text)",
      marginBottom: "25px",
    }}
  >
    📊 Resource Summary
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
      gap: "20px",
    }}
  >

  <DashboardCard
    title="Temperature"
    value={temperature}
    unit="°C"
    icon="🌡️"
    color="#ef4444"
  />

  <DashboardCard
    title="Wind Speed"
    value={windSpeed}
    unit="km/h"
    icon="💨"
    color="#3b82f6"
  />

  <DashboardCard
    title="Solar Radiation"
    value={solarRadiation}
    unit="W/m²"
    icon="☀️"
    color="#f59e0b"
  />

  <DashboardCard
    title="Rainfall"
    value={rainfall}
    unit="mm"
    icon="🌧️"
    color="#0ea5e9"
  />

  <DashboardCard
    title="Elevation"
    value={elevation}
    unit="m"
    icon="🏔️"
    color="#10b981"
  />

  <DashboardCard
    title="Land Area"
    value={landArea}
    unit="Acres"
    icon="📐"
    color="#8b5cf6"
  />
</div>
</div>
</div>
{prediction && (
  <div
    style={{
      background: "#ffffff",
      padding: "25px",
      borderRadius: "20px",
      marginTop: "20px",
      marginBottom: "20px",
      boxShadow: "0 10px 25px rgba(0,0,0,.08)",
      textAlign: "center",
    }}
  >
    <h2 style={{ color: "#0f766e", marginBottom: "20px" }}>
      🤖 AI Site Suitability Analysis
    </h2>

    <h1
      style={{
        fontSize: "60px",
        color: "#16a34a",
        margin: "15px 0",
      }}
    >
      {score}%
    </h1>

    <progress
      value={score}
      max="100"
      style={{
        width: "100%",
        height: "20px",
      }}
    />

    <h3 style={{ marginTop: "20px" }}>
      Prediction:
      <span
        style={{
          color: prediction === "Suitable" ? "green" : "red",
        }}
      >
        {" "}{prediction}
      </span>
    </h3>

    <h3>{rating}</h3>
  </div>
)}
<button
  onClick={() =>
    navigate("/report", {
      state: {
        siteName,
        latitude,
        longitude,
        location,
        taluk,
        district,
        stateName,
        country,
        landArea,
        elevation,
        temperature,
        windSpeed,
        rainfall,
        solarRadiation,
        infrastructure,
        ownership,
        prediction,
      },
    })
  }
  style={{
    background: "#16a34a",
    color: "white",
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  }}
>
📄 Generate Resource Report
</button>
<br /><br />

      <input
        placeholder="Project ID"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
      />

      <br /><br />

      <button onClick={createSite}>
        Create Site
      </button>

      <hr />
      <AnalyticsCharts
      temperature={temperature}
      windSpeed={windSpeed}
      rainfall={rainfall}
      solarRadiation={solarRadiation}
      elevation={elevation}
      landArea={landArea}
      />

<br />
      <h2>Existing Sites</h2>

      {sites.length === 0 ? (
        <p>No Sites Found</p>
      ) : (
        sites.map((site) => (
          <div
            key={site.id}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              marginBottom: "15px",
              borderRadius: "12px",
            }}
          >
            {editingSiteId === site.id ? (
  <>
    <input
      value={editSiteName}
      onChange={(e) => setEditSiteName(e.target.value)}
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "10px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    />

    <button
      onClick={updateSite}
      style={{
        background: "#16a34a",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        marginRight: "10px",
      }}
    >
      💾 Save
    </button>

    <button
      onClick={() => setEditingSiteId(null)}
      style={{
        background: "#6b7280",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Cancel
    </button>
  </>
) : (
  <h3>{site.site_name}</h3>
)}

<p><strong>Latitude:</strong> {site.latitude}</p>

<p><strong>Longitude:</strong> {site.longitude}</p>

<p><strong>Land Area:</strong> {site.land_area}</p>

<p><strong>Elevation:</strong> {site.elevation}</p>

<p><strong>Infrastructure:</strong> {site.infrastructure}</p>

<p><strong>Ownership:</strong> {site.land_ownership}</p>

<p><strong>Project ID:</strong> {site.project_id}</p>

<div style={{ marginTop: "15px" }}>
  <button
    onClick={() => editSite(site)}
    style={{
      background: "#2563eb",
      color: "white",
      border: "none",
      padding: "8px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      marginRight: "10px",
    }}
  >
    ✏ Edit
  </button>

  <button
    onClick={() => deleteSite(site.id)}
    style={{
      background: "#dc2626",
      color: "white",
      border: "none",
      padding: "8px 14px",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    🗑 Delete
  </button>
</div>

            
          </div>
        ))
      )}
    </div>
  );
}