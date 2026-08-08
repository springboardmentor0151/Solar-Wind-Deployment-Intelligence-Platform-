import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";

import {
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaDatabase,
  FaLocationArrow,
} from "react-icons/fa";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function GISMap() {
  const { siteId } = useParams();
  const [sites, setSites] = useState([]);

  const [selectedPosition, setSelectedPosition] = useState([
    20.5937,
    78.9629,
  ]);

  const [selectedSite, setSelectedSite] = useState(null);
  

   useEffect(() => {
  const loadSite = async () => {
    try {
      const response = await api.get(`/sites/${siteId}`);

      const site = response.data;

      setSites([site]); // convert single site into an array

      setSelectedSite(site);

      setSelectedPosition([
        parseFloat(site.latitude),
        parseFloat(site.longitude),
      ]);

    } catch (err) {
      console.error(err);
    }
  };

  loadSite();
}, [siteId]);
 
  console.log("Current sites state:", sites);
  const saveLocation = async () => {
    if (!selectedSite) {
      alert("Please select a site first.");
      return;
    }

    try {
      await api.put(`/sites/${selectedSite.id}`, {
        name: selectedSite.name,
        latitude: selectedPosition[0],
        longitude: selectedPosition[1],
      });

      alert("Location updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update location.");
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen">
        <div className="p-8">

          <PageHeader
            title="🗺️ GIS Site Management"
            subtitle="Visualize renewable energy sites and update their locations."
          />

          {/* KPI Cards */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            <StatCard
              icon={<FaDatabase className="text-blue-600" />}
              title="Total Sites"
              value={sites.length}
            />

            <StatCard
              icon={<FaMapMarkedAlt className="text-green-600" />}
              title="Map Status"
              value="Active"
            />

            <StatCard
              icon={<FaLocationArrow className="text-red-500" />}
              title="Selected Site"
              value={selectedSite ? selectedSite.name : "None"}
            />

          </div>

          {/* Map */}

          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">

            <div className="p-5 border-b">

              <h2 className="text-xl font-bold text-slate-800">
                Renewable Energy Sites
              </h2>

            </div>
    <MapContainer
  center={selectedPosition}
  zoom={13}
  style={{ height: "600px", width: "100%" }}
>
  <TileLayer
    attribution="&copy; OpenStreetMap contributors"
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  {sites &&
    sites.map((site) => {
      // Convert coordinates to numbers
      const lat = parseFloat(site.latitude);
      const lng = parseFloat(site.longitude);

      // Skip invalid coordinates
      if (isNaN(lat) || isNaN(lng)) return null;

      return (
        <Marker
          key={site.id}
          position={[lat, lng]}
          draggable
          eventHandlers={{
            click: () => {
              setSelectedSite(site);
              setSelectedPosition([lat, lng]);
            },

            dragend: (e) => {
              const pos = e.target.getLatLng();

              setSelectedSite(site);

              setSelectedPosition([
                pos.lat,
                pos.lng,
              ]);
            },
          }}
        >
          <Popup>
            <div>
              <strong>{site.name}</strong>
              <br />
              Latitude: {lat}
              <br />
              Longitude: {lng}
              <br />
              Project ID: {site.project_id}
            </div>
          </Popup>
        </Marker>
      );
    })}
</MapContainer>

          </div>

          {/* Location Details */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-white rounded-2xl shadow-md p-6">

              <h2 className="text-xl font-bold mb-6 text-slate-800">
                Selected Coordinates
              </h2>

              <div className="space-y-4">

                <div className="flex justify-between">

                  <span className="font-medium">
                    Latitude
                  </span>

                  <span>
                    {selectedPosition[0].toFixed(6)}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="font-medium">
                    Longitude
                  </span>

                  <span>
                    {selectedPosition[1].toFixed(6)}
                  </span>

                </div>

                {selectedSite && (

                  <div className="flex justify-between">

                    <span className="font-medium">
                      Site
                    </span>

                    <span>
                      {selectedSite.name}
                    </span>

                  </div>

                )}

              </div>

              <div className="mt-8">

                <PrimaryButton
                  text="Save Location"
                  onClick={saveLocation}
                />

              </div>

            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">

              <h2 className="text-xl font-bold mb-6 text-slate-800">
                Site Information
              </h2>

              {selectedSite ? (

                <div className="space-y-4">

                  <p>
                    <strong>Name:</strong> {selectedSite.name}
                  </p>

                  <p>
                    <strong>Project ID:</strong>{" "}
                    {selectedSite.project_id}
                  </p>

                  <p>
                    <strong>Latitude:</strong>{" "}
                    {selectedPosition[0].toFixed(6)}
                  </p>

                  <p>
                    <strong>Longitude:</strong>{" "}
                    {selectedPosition[1].toFixed(6)}
                  </p>

                </div>

              ) : (

                <div className="text-center py-10 text-gray-500">

                  <FaMapMarkerAlt className="text-5xl mx-auto mb-4 text-gray-300" />

                  <p>Select a marker on the map to view details.</p>

                </div>

              )}

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default GISMap;