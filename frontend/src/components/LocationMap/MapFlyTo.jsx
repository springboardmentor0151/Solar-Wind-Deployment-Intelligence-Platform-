import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Must be rendered as a child of <MapContainer>. Whenever `target` changes
// (a new search result was selected), smoothly flies the map there.
export default function MapFlyTo({ target, zoom = 12 }) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.latitude, target.longitude], zoom, { duration: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return null;
}
