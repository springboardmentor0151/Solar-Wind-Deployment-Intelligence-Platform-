import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import * as turf from "@turf/turf";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ChangeView({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([Number(latitude), Number(longitude)], 17);
    }
  }, [latitude, longitude, map]);

  return null;
}

function MapEvents({
  setPoints,
  setLatitude,
  setLongitude,
  getLocationDetails,
  getWeatherDetails,
}) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      setLatitude(lat.toFixed(6));
      setLongitude(lon.toFixed(6));

      getLocationDetails(lat.toFixed(6), lon.toFixed(6));
      getWeatherDetails(lat.toFixed(6), lon.toFixed(6));

      setPoints((prev) => {
        const updated = [...prev, [lon, lat]];
        console.log("Polygon Points:", updated);
        return updated;
      });
    },
  });

  return null;
}

export default function MapPicker({
  latitude,
  longitude,
  setLatitude,
  setLongitude,
  getLocationDetails,
  getWeatherDetails,
  setLandArea,
}) {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (points.length >= 3) {
      try {
        const polygon = turf.polygon([
          [...points, points[0]],
        ]);

        const areaSqMeters = turf.area(polygon);
        const acres = areaSqMeters / 4046.85642;

        console.log("Area (sq.m):", areaSqMeters);
        console.log("Area (acres):", acres);

        setLandArea(acres.toFixed(2));
      } catch (err) {
        console.log(err);
      }
    }
  }, [points, setLandArea]);

  return (
    <>
      <MapContainer
        center={[13.3409, 77.101]}
        zoom={15}
        style={{
          height: "450px",
          width: "100%",
          borderRadius: "12px",
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeView
          latitude={latitude}
          longitude={longitude}
        />

        <MapEvents
          setPoints={setPoints}
          setLatitude={setLatitude}
          setLongitude={setLongitude}
          getLocationDetails={getLocationDetails}
          getWeatherDetails={getWeatherDetails}
        />

        {latitude && longitude && (
          <Marker
            position={[
              Number(latitude),
              Number(longitude),
            ]}
          />
        )}

        {points.length >= 3 && (
          <Polygon
            positions={points.map(([lon, lat]) => [
              lat,
              lon,
            ])}
            pathOptions={{
              color: "blue",
              fillColor: "lightblue",
              fillOpacity: 0.4,
            }}
          />
        )}
      </MapContainer>

      <br />

      <button
        onClick={() => {
          setPoints([]);
          setLandArea("");
        }}
      >
        Clear Selected Area
      </button>

      <p>
        Click around the land boundary to draw a polygon.
      </p>
    </>
  );
}