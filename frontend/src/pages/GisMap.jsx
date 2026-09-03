import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiFilter, FiRefreshCw } from "react-icons/fi";

import { getGisSites } from "../api/projects.js";

const levelColors = {
  High: "#16a34a",
  Medium: "#eab308",
  Low: "#f97316",
  Unsuitable: "#dc2626",
  "No data": "#64748b"
};

const makeIcon = (level, type) => L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:${type === "Wind" ? "4px" : "999px"};background:${levelColors[level] || "#64748b"};border:3px solid white;box-shadow:0 8px 18px rgba(15,23,42,.35)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const popupHtml = (site) => `
  <div style="min-width:240px;font-size:13px;line-height:1.45">
    <strong>${site.name}</strong><br />
    ${site.project_type} - ${site.suitability_level}<br />
    Lat/Lng: ${site.latitude}, ${site.longitude}<br />
    Suitability: ${site.suitability_score ?? "N/A"}%<br />
    Solar/Wind: ${site.solar_score ?? "N/A"}% / ${site.wind_score ?? "N/A"}%<br />
    Technology: ${site.recommended_technology}<br />
    Capacity: ${site.capacity_mw} MW<br />
    Generation: ${site.annual_energy_output ? Math.round(site.annual_energy_output).toLocaleString() : "N/A"} MWh/year<br />
    ROI: ${site.roi_estimate ?? "N/A"}%<br />
    Wind speed: ${site.environmental_information.wind_speed ?? "N/A"} m/s<br />
    Solar irradiance: ${site.environmental_information.solar_irradiance ?? "N/A"} kWh/m2/day
  </div>
`;

export default function GisMap() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [sites, setSites] = useState([]);
  const [error, setError] = useState("");
  const [level, setLevel] = useState("All");
  const [technology, setTechnology] = useState("All");

  useEffect(() => {
    getGisSites()
      .then((data) => setSites(data.sites || []))
      .catch(() => {
        setError("Unable to load GIS sites. Please try again.");
        setSites([]);
      });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
  }, []);

  const filtered = useMemo(() => sites.filter((site) => {
    const matchesLevel = level === "All" || site.suitability_level === level;
    const matchesTechnology = technology === "All" || site.project_type === technology;
    return matchesLevel && matchesTechnology;
  }), [level, sites, technology]);

  const resetMap = () => {
    if (!mapRef.current) return;
    if (!filtered.length) {
      mapRef.current.setView([20.5937, 78.9629], 5);
      return;
    }
    const bounds = L.latLngBounds(filtered.map((site) => [site.latitude, site.longitude]));
    mapRef.current.fitBounds(bounds.pad(0.25));
  };

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();
    filtered.forEach((site) => {
      L.marker([site.latitude, site.longitude], { icon: makeIcon(site.suitability_level, site.project_type) })
        .bindPopup(popupHtml(site))
        .addTo(layerRef.current);
    });
    resetMap();
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-canopy-700">GIS Visualization</p>
        <h2 className="mt-2 text-3xl font-bold">Analyzed Site Map</h2>
      </div>

      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <FiFilter className="text-slate-500" />
        <select className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={level} onChange={(event) => setLevel(event.target.value)}>
          <option>All</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
          <option>Unsuitable</option>
          <option>No data</option>
        </select>
        <select className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={technology} onChange={(event) => setTechnology(event.target.value)}>
          <option>All</option>
          <option>Solar</option>
          <option>Wind</option>
          <option>Hybrid</option>
        </select>
        <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700" onClick={resetMap}>
          <FiRefreshCw /> Reset Map
        </button>
        <div className="ml-auto flex flex-wrap gap-3 text-xs text-slate-500">
          {Object.entries(levelColors).map(([name, color]) => <span key={name} className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />{name}</span>)}
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div ref={containerRef} className="h-[620px] w-full" />
        {!filtered.length && <p className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">No site analyses available.</p>}
      </section>
    </div>
  );
}
