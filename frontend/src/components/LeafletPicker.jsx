import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;background:#10b981;border:3px solid white;border-radius:999px;box-shadow:0 8px 20px rgba(15,23,42,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

export default function LeafletPicker({ location, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    map.on("click", (event) => {
      onSelect({ latitude: Number(event.latlng.lat.toFixed(6)), longitude: Number(event.latlng.lng.toFixed(6)) });
    });
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
  }, [onSelect]);

  useEffect(() => {
    if (!mapRef.current || !location?.latitude || !location?.longitude) return;
    const point = [location.latitude, location.longitude];
    if (!markerRef.current) markerRef.current = L.marker(point, { icon: markerIcon }).addTo(mapRef.current);
    else markerRef.current.setLatLng(point);
    mapRef.current.setView(point, Math.max(mapRef.current.getZoom(), 9));
  }, [location]);

  return <div ref={containerRef} className="h-[420px] w-full rounded-lg border border-slate-200 dark:border-slate-800" />;
}
