import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useEffect } from "react";


// ========================================
// FIX LEAFLET MARKER ICON
// ========================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// ========================================
// MAP CLICK HANDLER
// ========================================

function MapClickHandler({ selectLocation }) {
  useMapEvents({
    click(event) {
      if (selectLocation) {
        const { lat, lng } = event.latlng;

        selectLocation(lat, lng);
      }
    },
  });

  return null;
}


// ========================================
// MAP CENTER CONTROLLER
// ========================================

function MapCenter({ latitude, longitude, zoom = 13 }) {
  const map = useMap();

  useEffect(() => {
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      latitude !== null &&
      longitude !== null
    ) {
      map.setView(
        [Number(latitude), Number(longitude)],
        zoom,
        {
          animate: true,
        }
      );
    }
  }, [latitude, longitude, zoom, map]);

  return null;
}


// ========================================
// SITES MAP
// ========================================

function SitesMap({
  sites = [],
  selectLocation,
  selectedLocation,
  singleSite = null,
}) {

  const defaultCenter = [20.5937, 78.9629];


  // ========================================
  // SINGLE SITE MODE
  // ========================================

  if (singleSite) {

    const latitude = Number(singleSite.latitude);
    const longitude = Number(singleSite.longitude);

    return (
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "300px",
          borderRadius: "12px",
        }}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        <MapCenter
          latitude={latitude}
          longitude={longitude}
          zoom={13}
        />


        <Marker
          position={[
            latitude,
            longitude,
          ]}
        >

          <Popup>

            <strong>
              📍{" "}
              {singleSite.location_name ||
                `Site #${singleSite.id}`}
            </strong>

            <br />

            Site #{singleSite.id}

            <br />

            Latitude:{" "}
            {latitude.toFixed(5)}

            <br />

            Longitude:{" "}
            {longitude.toFixed(5)}

            <br />

            Solar:{" "}
            {singleSite.solar_score}/100

            <br />

            Wind:{" "}
            {singleSite.wind_score}/100

          </Popup>

        </Marker>

      </MapContainer>
    );
  }


  // ========================================
  // LOCATION SELECTION MODE
  // ========================================

  const center =
    selectedLocation?.latitude !== undefined &&
    selectedLocation?.longitude !== undefined
      ? [
          Number(selectedLocation.latitude),
          Number(selectedLocation.longitude),
        ]
      : sites.length > 0
      ? [
          Number(sites[0].latitude),
          Number(sites[0].longitude),
        ]
      : defaultCenter;


  return (
    <MapContainer
      center={center}
      zoom={5}
      scrollWheelZoom={true}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "12px",
      }}
    >

      {/* MAP TILES */}

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />


      {/* CLICK MAP TO SELECT */}

      {selectLocation && (
        <MapClickHandler
          selectLocation={selectLocation}
        />
      )}


      {/* MOVE MAP TO SELECTED LOCATION */}

      {selectedLocation &&
        selectedLocation.latitude !== undefined &&
        selectedLocation.longitude !== undefined && (

          <MapCenter
            latitude={selectedLocation.latitude}
            longitude={selectedLocation.longitude}
            zoom={13}
          />
        )}


      {/* SELECTED LOCATION MARKER */}

      {selectedLocation &&
        selectedLocation.latitude !== undefined &&
        selectedLocation.longitude !== undefined && (

          <Marker
            position={[
              Number(selectedLocation.latitude),
              Number(selectedLocation.longitude),
            ]}
          >

            <Popup>

              <strong>
                📍 Selected Site
              </strong>

              <br />

              {selectedLocation.locationName ||
                "Selected Location"}

              <br />

              Latitude:{" "}
              {Number(
                selectedLocation.latitude
              ).toFixed(5)}

              <br />

              Longitude:{" "}
              {Number(
                selectedLocation.longitude
              ).toFixed(5)}

            </Popup>

          </Marker>
        )}


      {/* EXISTING SITE MARKERS */}

      {sites.map((site) => {

        if (
          site.latitude === undefined ||
          site.longitude === undefined
        ) {
          return null;
        }

        return (
          <Marker
            key={site.id}
            position={[
              Number(site.latitude),
              Number(site.longitude),
            ]}
          >

            <Popup>

              <strong>
                📍{" "}
                {site.location_name ||
                  `Site #${site.id}`}
              </strong>

              <br />

              Site #{site.id}

              <br />

              Latitude:{" "}
              {Number(
                site.latitude
              ).toFixed(5)}

              <br />

              Longitude:{" "}
              {Number(
                site.longitude
              ).toFixed(5)}

              <br />

              Solar:{" "}
              {site.solar_score}/100

              <br />

              Wind:{" "}
              {site.wind_score}/100

            </Popup>

          </Marker>
        );
      })}

    </MapContainer>
  );
}

export default SitesMap;