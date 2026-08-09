import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useSites } from "../context/SitesContext";
import AnalysisPanel from "../components/AnalysisPanel";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PRESETS = [
  { name: "Atacama Desert, Chile", lat: -23.881, lon: -69.0181 },
  { name: "Great Plains, USA", lat: 39.0997, lon: -98.4842 },
  { name: "Rajasthan, India", lat: 27.0238, lon: 74.2179 },
  { name: "North Sea Coast, Denmark", lat: 55.6, lon: 8.1 },
  { name: "Western Australia Outback", lat: -25.0, lon: 122.0 },
  { name: "Patagonia, Argentina", lat: -45.5, lon: -69.5 },
  { name: "Gobi Desert, Mongolia", lat: 43.0, lon: 103.0 },
  { name: "Sahara, Morocco", lat: 27.5, lon: -8.0 },
];

function ClickCatcher({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

export default function Explore() {
  const navigate = useNavigate();
  const { refresh } = useSites();
  const [siteName, setSiteName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [landArea, setLandArea] = useState(150);
  const [status, setStatus] = useState("prospecting");
  const [targetDate, setTargetDate] = useState("");
  const [marker, setMarker] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");

  const handleMapClick = useCallback((latlng) => {
    setLat(latlng.lat.toFixed(4));
    setLon(latlng.lng.toFixed(4));
    setMarker([latlng.lat, latlng.lng]);
  }, []);

  function applyPreset(p) {
    setSiteName(p.name);
    setLat(p.lat.toFixed(4));
    setLon(p.lon.toFixed(4));
    setMarker([p.lat, p.lon]);
  }

  async function analyzeLocation() {
    if (!lat || !lon) {
      setError("Click the map or enter coordinates first.");
      return;
    }
    setError("");
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.post("/sites/analyze", {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        land_area_hectares: parseFloat(landArea) || 100,
      });
      setAnalysis(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not analyze this location. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function registerSite() {
    setRegistering(true);
    setError("");
    try {
      const res = await api.post("/sites", {
        name: siteName || `Site ${lat}, ${lon}`,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        land_area_hectares: parseFloat(landArea) || 100,
        status,
        target_operational_date: targetDate ? new Date(targetDate).toISOString() : null,
      });
      await refresh();
      navigate(`/sites/${res.data.site.id}`);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not register this site.");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="p-8 max-w-[1500px]">
      <p className="label-eyebrow mb-1">Site &amp; Region Management</p>
      <h1 className="font-display text-3xl font-semibold mb-1">Explore deployment locations</h1>
      <p className="text-ink/55 mb-6 max-w-2xl">
        Click anywhere on the map, search coordinates, or try a preset region. Each site is
        analyzed against live solar, wind, terrain, and infrastructure data and scored with the
        deployment suitability model.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="card overflow-hidden h-[520px]">
          <MapContainer center={[20, 10]} zoom={2.2} className="h-full w-full">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />
            <ClickCatcher onClick={handleMapClick} />
            {marker && <Marker position={marker} />}
          </MapContainer>
        </div>

        <div className="card p-5 h-fit">
          <p className="label-eyebrow mb-3">Analyze a Location</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink/50 block mb-1">Site name</label>
              <input className="input-field" placeholder="e.g. Vidarbha Plain Site A"
                     value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-ink/50 block mb-1">Latitude</label>
                <input className="input-field" placeholder="21.15" value={lat}
                       onChange={(e) => setLat(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-ink/50 block mb-1">Longitude</label>
                <input className="input-field" placeholder="79.09" value={lon}
                       onChange={(e) => setLon(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink/50 block mb-1">Land area (hectares)</label>
              <input type="number" className="input-field" value={landArea}
                     onChange={(e) => setLandArea(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-ink/50 block mb-1">Project status</label>
                <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="prospecting">Prospecting</option>
                  <option value="feasibility_study">Feasibility Study</option>
                  <option value="approved">Approved</option>
                  <option value="in_construction">In Construction</option>
                  <option value="operational">Operational</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink/50 block mb-1">Target date</label>
                <input type="date" className="input-field" value={targetDate}
                       onChange={(e) => setTargetDate(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-xs text-rust">{error}</p>}
            <button onClick={analyzeLocation} disabled={loading} className="btn-primary w-full">
              {loading ? "Analyzing…" : "Analyze Location"}
            </button>
            <p className="text-[11px] text-ink/40">
              Tip: click the map to auto-fill coordinates, then hit Analyze.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-line">
            <p className="text-xs text-ink/50 mb-2">Try a preset region</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => applyPreset(p)}
                        className="text-[11px] px-2.5 py-1.5 rounded-full bg-canvas border border-line hover:border-moss-400 hover:text-moss-700 transition-colors">
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {analysis && (
        <div className="mt-6">
          <AnalysisPanel analysis={analysis} siteName={siteName || `${lat}, ${lon}`}>
            <button onClick={registerSite} disabled={registering} className="btn-primary">
              {registering ? "Registering…" : "Register this site"}
            </button>
          </AnalysisPanel>
        </div>
      )}
    </div>
  );
}
