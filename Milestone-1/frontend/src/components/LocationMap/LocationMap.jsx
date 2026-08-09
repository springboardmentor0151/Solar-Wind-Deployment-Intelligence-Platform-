import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  ScaleControl,
  ZoomControl,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LocationMap.css";

import MapClickHandler from "./MapClickHandler";
import MapFlyTo from "./MapFlyTo";
import LocationSearchBar from "./LocationSearchBar";
import { reverseGeocode } from "../../services/geocodingService";

const defaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

export default function LocationMap({
  onLocationSelect,
  initialLatitude,
  initialLongitude,
  height = "500px",
}) {
  const initialPosition =
    initialLatitude != null &&
    initialLongitude != null
      ? {
          latitude: initialLatitude,
          longitude: initialLongitude,
        }
      : null;

  const [position, setPosition] =
    useState(initialPosition);

  const [address, setAddress] =
    useState(null);

  const [flyTarget, setFlyTarget] =
    useState(initialPosition);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const resolveLocation = async (
    latitude,
    longitude
  ) => {
    setLoading(true);
    setError("");

    setPosition({
      latitude,
      longitude,
    });

    try {
      const result =
        await reverseGeocode(
          latitude,
          longitude
        );

      setAddress(result);

      onLocationSelect?.({
        latitude,
        longitude,
        ...result,
      });
    } catch (err) {
      console.error(err);

      setError(
        "Unable to resolve address."
      );

      setAddress(null);

      onLocationSelect?.({
        latitude,
        longitude,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (
    lat,
    lng
  ) => {
    resolveLocation(lat, lng);
  };

  const handlePlaceSelect = (
    place
  ) => {
    setFlyTarget(place);

    resolveLocation(
      place.latitude,
      place.longitude
    );
  };
  return (
  <div className="location-map-wrapper">

    <div className="mb-4">
      <LocationSearchBar
        onPlaceSelect={handlePlaceSelect}
      />
    </div>

    <div
      className="location-map-container rounded-2xl overflow-hidden shadow-lg border border-slate-200"
      style={{ height }}
    >

      <MapContainer
        center={
          initialPosition
            ? [
                initialPosition.latitude,
                initialPosition.longitude,
              ]
            : DEFAULT_CENTER
        }
        zoom={
          initialPosition
            ? 10
            : DEFAULT_ZOOM
        }
        style={{
          height: "100%",
          width: "100%",
        }}
        zoomControl={false}
        scrollWheelZoom
      >

        <ZoomControl position="topright" />

        <ScaleControl position="bottomleft" />

        <LayersControl position="topright">

          {/* Street */}

          <LayersControl.BaseLayer
            checked
            name="Street Map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {/* Satellite */}

          <LayersControl.BaseLayer
            name="Satellite"
          >
            <TileLayer
              attribution="Tiles © Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          {/* Terrain */}

          <LayersControl.BaseLayer
            name="Terrain"
          >
            <TileLayer
              attribution="© OpenTopoMap"
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

        </LayersControl>

        <MapClickHandler
          onMapClick={handleMapClick}
        />

        <MapFlyTo
          target={flyTarget}
        />

        {position && (

          <Marker
            position={[
              position.latitude,
              position.longitude,
            ]}
            icon={defaultIcon}
          >

            <Popup>

              <div className="min-w-[220px] space-y-2">

                <h3 className="font-bold text-lg text-blue-700">
                  Selected Location
                </h3>

                <div>
                  <strong>Latitude:</strong>{" "}
                  {position.latitude.toFixed(6)}
                </div>

                <div>
                  <strong>Longitude:</strong>{" "}
                  {position.longitude.toFixed(6)}
                </div>

                <div>
                  <strong>Country:</strong>{" "}
                  {address?.country || "-"}
                </div>

                <div>
                  <strong>State:</strong>{" "}
                  {address?.state || "-"}
                </div>

                <div>
                  <strong>District:</strong>{" "}
                  {address?.district || "-"}
                </div>

                <div>
                  <strong>City:</strong>{" "}
                  {address?.city || "-"}
                </div>

                {address?.displayName && (
                  <div className="text-xs text-slate-600 pt-2 border-t">
                    {address.displayName}
                  </div>
                )}

              </div>

            </Popup>

          </Marker>

        )}

      </MapContainer>

    </div>
        {/* Location Details */}

    <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

      <h3 className="text-xl font-bold text-slate-800 mb-4">
        Selected Location Details
      </h3>

      {loading && (
        <div className="flex items-center gap-3 text-blue-600">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Resolving address...</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-600">
          {error}
        </div>
      )}

      {!loading && position && (

        <>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">Latitude</p>
              <p className="font-semibold">
                {position.latitude.toFixed(6)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">Longitude</p>
              <p className="font-semibold">
                {position.longitude.toFixed(6)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">Country</p>
              <p className="font-semibold">
                {address?.country || "--"}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">State</p>
              <p className="font-semibold">
                {address?.state || "--"}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">District</p>
              <p className="font-semibold">
                {address?.district || "--"}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">City / Village</p>
              <p className="font-semibold">
                {address?.city || "--"}
              </p>
            </div>

          </div>

          {address?.displayName && (

            <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 p-4">

              <p className="text-xs text-slate-500 mb-2">
                Complete Address
              </p>

              <p className="text-slate-700">
                {address.displayName}
              </p>

            </div>

          )}

          <div className="mt-6 flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(
                  `${position.latitude}, ${position.longitude}`
                )
              }
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
            >
              Copy Coordinates
            </button>

            <button
              type="button"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps?q=${position.latitude},${position.longitude}`,
                  "_blank"
                )
              }
              className="px-5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-medium transition"
            >
              Open in Google Maps
            </button>

          </div>

        </>

      )}

      {!loading && !position && (

        <div className="text-center py-10 text-slate-500">

          <p className="text-lg font-medium">
            No location selected
          </p>

          <p className="mt-2">
            Search for a place or click anywhere on the map.
          </p>

        </div>

      )}

    </div>

  </div>
);
}