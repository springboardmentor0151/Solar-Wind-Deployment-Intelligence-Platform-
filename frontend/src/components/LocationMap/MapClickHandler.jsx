import { useMapEvents } from "react-leaflet";

// Must be rendered as a child of <MapContainer> — useMapEvents only works
// inside that context. Renders nothing itself; it just wires up the
// click listener.
export default function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}
