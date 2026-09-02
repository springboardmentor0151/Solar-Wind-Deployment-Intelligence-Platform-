import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";

import { useState } from "react";
import { analyzeLocation } from "../services/locationService";


function LocationMarker({ setResult }) {

  const [position, setPosition] = useState([
    23.1815,
    79.9864,
  ]);

  const [loading, setLoading] = useState(false);

  useMapEvents({

    async click(e) {

      if (loading) {
        return;
      }

      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      console.log(
        "Map clicked:",
        lat,
        lng
      );

      setPosition([
        lat,
        lng,
      ]);

      setLoading(true);

      try {

        console.log(
          "Sending analysis request..."
        );

        const response = await analyzeLocation(
          lat,
          lng
        );

        console.log(
          "Analysis response:",
          response
        );

        setResult(response);

        localStorage.setItem(
          "latestAnalysis",
          JSON.stringify(response)
        );

      } catch (error) {

        console.error(
          "Location analysis failed:",
          error
        );

        alert(
          "Unable to analyze this location. Check the backend terminal."
        );

      } finally {

        setLoading(false);

      }
    },

  });


  return (

    <Marker position={position}>

      <Popup>

        <div>

          <strong>
            Selected Location
          </strong>

          <br />

          Latitude:{" "}
          {position[0].toFixed(5)}

          <br />

          Longitude:{" "}
          {position[1].toFixed(5)}

          {loading && (

            <>
              <br />
              <br />

              <strong>
                Analyzing location...
              </strong>
            </>

          )}

        </div>

      </Popup>

    </Marker>

  );
}


function MapView({ setResult }) {

  return (

    <div
      style={{
        height: "500px",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >

      <MapContainer
        center={[
          23.1815,
          79.9864,
        ]}
        zoom={6}
        style={{
          height: "100%",
          width: "100%",
        }}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker
          setResult={setResult}
        />

      </MapContainer>

    </div>

  );
}


export default MapView;