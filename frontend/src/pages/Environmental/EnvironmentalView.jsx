import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, RefreshCw, Compass, Shield, AlertTriangle, CheckCircle, X } from 'lucide-react';
import EnvironmentalCards from '../../components/EnvironmentalCards/EnvironmentalCards';

const getSoilType = (cover) => {
  if (cover === "Dense Forest") return "Loamy Forest Soil";
  if (cover === "Grassland / Agricultural") return "Alluvial Fertile Soil";
  if (cover === "Barren Desert / Sandy") return "Arid Sandy Soil";
  if (cover === "Alpine Tundra / Rocky") return "Rocky Lithic Soil";
  return "Sandy Clay Loam";
};

export default function EnvironmentalView({ setView }) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [envData, setEnvData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [rawDetails, setRawDetails] = useState(null);
  const [toast, setToast] = useState(null); // { message: "", type: "success" | "error" }

  const [locationName, setLocationName] = useState(localStorage.getItem('selected_location') || 'N/A');
  const [district, setDistrict] = useState(localStorage.getItem('selected_district') || 'N/A');
  const [stateName, setStateName] = useState(localStorage.getItem('selected_state') || 'N/A');
  const [country, setCountry] = useState(localStorage.getItem('selected_country') || 'N/A');
  const [village, setVillage] = useState(localStorage.getItem('selected_village') || 'N/A');

  const handleQuery = async (overrideLat, overrideLon) => {
    const qLat = overrideLat || lat;
    const qLon = overrideLon || lon;
    if (!qLat || !qLon) return;
    
    setIsQuerying(true);
    setToast(null);
    
    let attempt = 0;
    const maxAttempts = 3; // Retry up to 3 times
    let success = false;
    
    while (attempt < maxAttempts && !success) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [envRes, geoRes] = await Promise.all([
          axios.post(`/api/predict/environment`, {
            latitude: parseFloat(qLat),
            longitude: parseFloat(qLon)
          }, { headers }),
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
        
        setRawDetails(details);
        
        const cityName = details.location?.city || details.location?.district || details.city || "Phalodi";
        const districtVal = details.location?.district || details.location?.city || details.city || "Phalodi";
        const stateVal = details.location?.state || details.state || "Rajasthan";
        const countryVal = details.location?.country || details.country || "India";
        const villageVal = details.location?.village || details.location?.town || details.location?.suburb || details.location?.hamlet || "N/A";
        const landVal = details.environmental?.soil_bearing_capacity || details.environmental_data?.land_use || "Sandy Arid";

        setGeoData({
          city: cityName,
          state: stateVal,
          country: countryVal,
          land_type: landVal
        });

        setLocationName(cityName);
        setDistrict(districtVal);
        setStateName(stateVal);
        setCountry(countryVal);
        setVillage(villageVal);

        localStorage.setItem('selected_location', cityName);
        localStorage.setItem('selected_district', districtVal);
        localStorage.setItem('selected_state', stateVal);
        localStorage.setItem('selected_country', countryVal);
        localStorage.setItem('selected_village', villageVal);
        
        setToast({ message: "GIS Datasets Loaded Successfully!", type: "success" });
        setTimeout(() => setToast(null), 4000);
        success = true;
      } catch (e) {
        attempt++;
        console.error(`Attempt ${attempt} failed:`, e);
        if (attempt >= maxAttempts) {
          setToast({ message: "GIS data unavailable. Connection refused or API failure.", type: "error" });
          
          setGeoData({
            city: localStorage.getItem('selected_district') || "N/A",
            state: localStorage.getItem('selected_state') || "N/A",
            country: localStorage.getItem('selected_country') || "N/A",
            land_type: "GIS data unavailable"
          });
          
          setRawDetails({
            environmental: { land_cover: "GIS data unavailable", land_slope: 0 },
            infrastructure: { distance_to_airport: 0, distance_to_road: 0 },
            suitability: { scores: { overall: 0 } },
            suitability_score: 0
          });
        }
      }
    }
    setIsQuerying(false);
  };

  useEffect(() => {
    const savedLat = localStorage.getItem('selected_latitude');
    const savedLon = localStorage.getItem('selected_longitude');
    if (savedLat && savedLon) {
      setLat(savedLat);
      setLon(savedLon);
      setLocationName(localStorage.getItem('selected_location') || 'Temporary Analysis Node');
      setDistrict(localStorage.getItem('selected_district') || 'N/A');
      setStateName(localStorage.getItem('selected_state') || 'N/A');
      setCountry(localStorage.getItem('selected_country') || 'N/A');
      setVillage(localStorage.getItem('selected_village') || 'N/A');
      handleQuery(savedLat, savedLon);
    }
  }, []);

  // Empty state check
  if (!lat || !lon) {
    return (
      <div className="space-y-6 text-slate-100 font-sans">
        {/* Banner */}
        <div className="bg-[#111827]/80 p-5 rounded-xl border border-slate-800 glass">
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Compass className="w-5 h-5 text-emerald-400 mr-2 animate-pulse" />
            Environmental Intelligence Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Query GIS grids, NASA solar databases, and Open-Meteo meteorological logs dynamically.
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-[#111827]/80 border border-slate-800 p-12 rounded-2xl glass text-center flex flex-col items-center justify-center space-y-4">
          <MapPin className="w-12 h-12 text-slate-500 animate-pulse animate-bounce" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">No location selected</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-normal">
            Please choose a location from the Geospatial Map.
          </p>
          <button
            onClick={() => setView('map')}
            className="px-5 py-2.5 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-md font-sans"
          >
            Go to Geospatial Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Selected Location HUD */}
      <div className="bg-[#111827]/80 p-4 rounded-xl border border-slate-800 glass grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-semibold text-slate-355 font-sans">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-bold">Selected Location</span>
          <span className="text-slate-100 font-bold">{locationName}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-bold">Latitude</span>
          <span className="text-slate-100 font-mono font-bold">{lat}° N</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-bold">Longitude</span>
          <span className="text-slate-100 font-mono font-bold">{lon}° E</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-bold">District / State / City</span>
          <span className="text-slate-100 font-bold">{district}, {stateName} {village !== "N/A" ? `(${village})` : ""}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-bold">Country</span>
          <span className="text-slate-100 font-bold">{country}</span>
        </div>
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
        </div>        {/* Administrative boundaries Info / Fallback UI */}
        <div className="glass-card p-5 border border-slate-850 md:col-span-2 flex flex-col justify-center space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355">Site Feasibility Report</h3>
          
          {isQuerying ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              <span className="text-xs text-slate-300 font-bold">
                Loading GIS Feasibility Data...
              </span>
            </div>
          ) : geoData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-300 font-sans">
              <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Land Classification</span><span className="text-slate-100 font-bold">{rawDetails?.environmental?.land_cover || "Sandy Desert / Scrub"}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Elevation</span><span className="text-slate-100 font-bold">{rawDetails?.environmental?.elevation ? `${rawDetails.environmental.elevation} m` : "N/A"}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Terrain Slope</span><span className="text-slate-100 font-bold">{rawDetails?.environmental?.land_slope ? `${rawDetails.environmental.land_slope}°` : "N/A"}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Vegetation (NDVI)</span><span className="text-slate-100 font-bold">{rawDetails?.environmental?.vegetation_index ? `${(rawDetails.environmental.vegetation_index * 100).toFixed(0)}%` : "N/A"}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Soil Type</span><span className="text-slate-100 font-bold">{getSoilType(rawDetails?.environmental?.land_cover)}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Flood Risk</span><span className="text-emerald-400 font-bold">{rawDetails?.environmental?.flood_risk || "Low"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Overall Suitability Score</span><span className="text-[#10B981] font-black">{rawDetails?.suitability?.scores?.overall || rawDetails?.suitability_score || 0}%</span></div>
              </div>
              <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Protected Area Status</span><span className={`font-bold ${rawDetails?.infrastructure?.in_protected_zone ? 'text-rose-400' : 'text-emerald-400'}`}>{rawDetails?.infrastructure?.in_protected_zone ? "Restricted (In Protected Zone)" : "Safe (Clear)"}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Construction Allowed</span><span className={`font-bold ${(!rawDetails?.infrastructure?.in_protected_zone && rawDetails?.infrastructure?.distance_to_airport >= 15.0) ? 'text-emerald-400' : 'text-rose-400'}`}>{(!rawDetails?.infrastructure?.in_protected_zone && rawDetails?.infrastructure?.distance_to_airport >= 15.0) ? "Yes" : "No"}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Residential Buffer</span><span className="text-slate-200">{rawDetails?.infrastructure?.distance_to_road ? `${(rawDetails.infrastructure.distance_to_road * 800 + 200).toFixed(0)} m` : "N/A"}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Airport Buffer Check</span><span className={`font-bold ${(rawDetails?.infrastructure?.distance_to_airport < 15.0) ? 'text-rose-400' : 'text-emerald-400'}`}>{(rawDetails?.infrastructure?.distance_to_airport || 0).toFixed(1)} km {(rawDetails?.infrastructure?.distance_to_airport < 15.0) ? "(Restricted)" : "(Clear)"}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Water Body Distance</span><span className="text-slate-200">{rawDetails?.infrastructure?.distance_to_water ? `${rawDetails.infrastructure.distance_to_water.toFixed(1)} km` : "N/A"}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Environmental Restrictions</span><span className="text-slate-200">{rawDetails?.infrastructure?.in_protected_zone ? "Protected zone constraints active" : "No active forest restrictions"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">District Geocoding</span><span className="text-slate-100">{district}, {stateName}</span></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 animate-bounce" />
              <span className="text-xs text-slate-400 italic">
                GIS data unavailable
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cards List */}
      {isQuerying ? (
        <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-xl text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-sky-400 mx-auto animate-spin" />
          <span className="text-xs text-slate-300 block font-bold">Loading Meteorological Logs...</span>
        </div>
      ) : envData ? (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355">Meteorological and Spatial Parameters</h3>
          <EnvironmentalCards data={envData} />
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-xl text-center space-y-2">
          <AlertTriangle className="w-6 h-6 text-slate-550 mx-auto animate-pulse" />
          <span className="text-xs text-slate-400 italic block">GIS data unavailable</span>
        </div>
      )}
    </div>
  );
}
