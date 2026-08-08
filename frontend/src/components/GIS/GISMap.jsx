import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { getSites } from "../../services/siteService";
import { getEnvironmentData } from "../../services/environmentService";

import {
  calculateSolarScore,
  calculateWindScore,
} from "../../utils/predictionEngine";

// Fix Leaflet marker icons
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

  const [sites, setSites] = useState([]);
  const [environment, setEnvironment] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    try {

      const siteData = await getSites();
      const envData = await getEnvironmentData();

      setSites(siteData);
      setEnvironment(envData);

    } catch (err) {

      console.error("Failed to load GIS data", err);

    }

  };

  return (

    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      style={{
        height: "600px",
        width: "100%",
        borderRadius: "18px",
      }}
    >

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {sites.map((site) => {

        const env = environment.find(
          (e) => e.site_id === site.id
        );

        const solarScore = env
          ? calculateSolarScore(env)
          : 0;

        const windScore = env
          ? calculateWindScore(env)
          : 0;

        let recommendation = "No Environmental Data";

        if (env) {

          if (solarScore >= 85) {
            recommendation = "⭐⭐⭐⭐⭐ Excellent Solar Site";
          } else if (solarScore >= 70) {
            recommendation = "⭐⭐⭐⭐ Very Good Solar Site";
          } else if (solarScore >= 50) {
            recommendation = "⭐⭐⭐ Moderate Solar Site";
          } else {
            recommendation = "⭐⭐ Poor Solar Site";
          }

        }

        return (

          <Marker
            key={site.id}
            position={[
              site.latitude,
              site.longitude,
            ]}
          >

            <Popup>

              <h3>{site.site_name}</h3>

              <p>
                <strong>Area:</strong> {site.area} Acres
              </p>

              <p>
                <strong>Project ID:</strong> {site.project_id}
              </p>

              <hr />

              {env ? (
                <>

                  <p>🌡 Temperature: {env.temperature} °C</p>

                  <p>💨 Wind Speed: {env.wind_speed} km/h</p>

                  <p>☀ Solar Irradiance: {env.solar_irradiance}</p>

                  <p>💧 Humidity: {env.humidity}%</p>

                  <p>🌧 Rainfall: {env.rainfall} mm</p>

                  <p>⚖ Air Pressure: {env.air_pressure} hPa</p>

                  <hr />

                  <p>
                    <strong>☀ Solar Score:</strong>{" "}
                    {solarScore}%
                  </p>

                  <p>
                    <strong>💨 Wind Score:</strong>{" "}
                    {windScore}%
                  </p>

                  <hr />

                  <p>
                    <strong>Recommendation:</strong>
                  </p>

                  <p>{recommendation}</p>

                </>
              ) : (
                <p>No Environmental Data Available</p>
              )}

            </Popup>

          </Marker>

        );

      })}

    </MapContainer>

  );

}

export default GISMap;