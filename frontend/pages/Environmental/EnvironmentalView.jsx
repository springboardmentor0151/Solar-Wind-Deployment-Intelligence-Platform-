import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, RefreshCw, Compass, Shield, AlertTriangle, CheckCircle, X } from 'lucide-react';
import EnvironmentalCards from '../../components/EnvironmentalCards/EnvironmentalCards';

export default function EnvironmentalView() {
  const [lat, setLat] = useState("27.539");
  const [lon, setLon] = useState("71.918");
  const [isQuerying, setIsQuerying] = useState(false);
  const [envData, setEnvData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [toast, setToast] = useState(null); // { message: "", type: "success" | "error" }

  const presets = [
    { name: "Bhadla Desert (India)", lat: "27.539", lon: "71.918" },
    { name: "Muppandal Wind (India)", lat: "8.258", lon: "77.535" },
    { name: "Kurnool Solar (India)", lat: "15.828", lon: "78.037" }
  ];

  const handleQuery = async (overrideLat, overrideLon) => {
    const qLat = overrideLat || lat;
    const qLon = overrideLon || lon;
    setIsQuerying(true);
    setToast(null);
    
    let attempt = 0;
    const maxAttempts = 2;
    let success = false;
    
    while (attempt < maxAttempts && !success) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [envRes, geoRes] = await Promise.all([
          axios.get(`/api/environment?latitude=${qLat}&longitude=${qLon}`, { headers }),
          axios.post(`/api/predict/site`, {
            latitude: parseFloat(qLat),
            longitude: parseFloat(qLon),
            land_area: 10.0,
            land_ownership: "Lease",
            project_type: "solar"
          }, { headers })
        ]);
        
        if (!envRes.data) {
          throw new Error("No environment data returned");
        }
        
        setEnvData(envRes.data);
        
        // Safely extract geo details
        let details = {};
        if (geoRes.data) {
          if (geoRes.data.details_json) {
            try {
              details = typeof geoRes.data.details_json === 'string'
                ? JSON.parse(geoRes.data.details_json)
                : geoRes.data.details_json;
            } catch (pe) {
              details = geoRes.data;
            }
          } else {
            details = geoRes.data;
          }
        }
        
        setGeoData({
          city: details.location?.city || details.location?.district || details.city || "Phalodi",
          state: details.location?.state || details.state || "Rajasthan",
          country: details.location?.country || details.country || "India",
          land_type: details.environmental?.soil_bearing_capacity || details.environmental_data?.land_use || "Sandy Arid"
        });
        
        setToast({ message: "GIS Datasets Loaded Successfully!", type: "success" });
        setTimeout(() => setToast(null), 4000);
        success = true;
      } catch (e) {
        attempt++;
        console.error(`Attempt ${attempt} failed:`, e);
        if (attempt >= maxAttempts) {
          setToast({ message: "Unable to load GIS data. Connection refused or API failure.", type: "error" });
          setEnvData(null);
          setGeoData(null);
        }
      }
    }
    setIsQuerying(false);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center space-x-3 transition-all duration-300 animate-slide-in ${
          toast.type === "success" 
            ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300" 
            : "bg-rose-950/90 border-rose-500/30 text-rose-355"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-bold leading-normal">{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="bg-[#111827]/80 p-5 rounded-xl border border-slate-800 glass">
        <h2 className="text-xl font-bold text-slate-100 flex items-center">
          <Compass className="w-5 h-5 text-emerald-400 mr-2 animate-spin" />
          Environmental Intelligence Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Query GIS grids, NASA solar databases, and Open-Meteo meteorological logs dynamically.
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 border border-slate-850 space-y-4 md:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Siting Coordinates</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full text-xs font-bold rounded-lg py-1.5 px-3 bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full text-xs font-bold rounded-lg py-1.5 px-3 bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            
            <button
              onClick={() => handleQuery()}
              disabled={isQuerying}
              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow"
            >
              {isQuerying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading GIS...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Fetch Environmental Logs</span>
                </>
              )}
            </button>
          </div>

          {/* Presets */}
          <div className="pt-2 border-t border-slate-900/60">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Preset Nodes</span>
            <div className="space-y-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLat(p.lat);
                    setLon(p.lon);
                    handleQuery(p.lat, p.lon);
                  }}
                  className="w-full text-left text-[11px] font-bold text-slate-300 py-1.5 px-2 bg-slate-950/40 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-lg transition-all flex items-center space-x-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Administrative boundaries Info / Fallback UI */}
        <div className="glass-card p-5 border border-slate-850 md:col-span-2 flex flex-col justify-center space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">GIS Geocoding Context</h3>
          
          {geoData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
              <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">District/City</span><span className="text-slate-100 font-bold">{geoData.city}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">State/Region</span><span className="text-slate-100 font-bold">{geoData.state}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Country</span><span className="text-slate-100 font-bold">{geoData.country}</span></div>
              </div>
              <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Elevation height</span><span className="text-slate-100 font-bold font-mono">{envData?.elevation} m</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Soil Condition</span><span className="text-slate-100 font-bold">{geoData.land_type}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Terrain Aspect</span><span className="text-slate-100 font-bold font-mono">{envData?.land_slope}° aspect</span></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 animate-bounce" />
              <span className="text-xs text-slate-400 italic">
                Provide latitude/longitude values or select a preset coordinates node above to load administrative boundaries.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cards List */}
      {envData ? (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Meteorological and Spatial Parameters</h3>
          <EnvironmentalCards data={envData} />
        </div>
      ) : (
        toast && toast.type === "error" && (
          <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-xl text-center space-y-2">
            <h4 className="text-sm font-bold text-rose-400">Unable to load GIS data</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              We encountered a connection issue fetching solar radiation and spatial models. Please verify the backend service is active or retry using another preset coordinates node.
            </p>
          </div>
        )
      )}
    </div>
  );
}
