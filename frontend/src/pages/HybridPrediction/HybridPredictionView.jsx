import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, RefreshCw, Zap, Award, CheckCircle } from 'lucide-react';

export default function HybridPredictionView({ setView }) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [area, setArea] = useState("10.0");
  const [isQuerying, setIsQuerying] = useState(false);
  const [recData, setRecData] = useState(null);

  const [locationName, setLocationName] = useState(localStorage.getItem('selected_location') || 'N/A');
  const [district, setDistrict] = useState(localStorage.getItem('selected_district') || 'N/A');
  const [stateName, setStateName] = useState(localStorage.getItem('selected_state') || 'N/A');
  const [country, setCountry] = useState(localStorage.getItem('selected_country') || 'N/A');

  const handleQuery = async (overrideLat, overrideLon, overrideArea) => {
    const qLat = overrideLat || lat;
    const qLon = overrideLon || lon;
    const qArea = overrideArea || area;
    if (!qLat || !qLon) return;
    
    setIsQuerying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/predict/hybrid`,
        {
          latitude: parseFloat(qLat),
          longitude: parseFloat(qLon),
          land_area: parseFloat(qArea)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Let's call /api/predict/site as well to get true lat/lon predictions!
      const trueRes = await axios.post(
        `/api/predict/site`,
        {
          latitude: parseFloat(qLat),
          longitude: parseFloat(qLon),
          land_area: parseFloat(qArea),
          land_ownership: "Lease",
          project_type: "hybrid"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const details = trueRes.data.hybrid_recommendation;
      setRecData({
        solar_score: details.solar_score,
        wind_score: details.wind_score,
        environmental_score: details.environmental_score,
        recommended_technology: details.recommended_technology,
        confidence_score: details.confidence_score
      });
    } catch (e) {
      console.error(e);
      alert("Failed to query hybrid recommendations.");
    } finally {
      setIsQuerying(false);
    }
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
      handleQuery(savedLat, savedLon, area);
    }
  }, []);

  // Empty state check
  if (!lat || !lon) {
    return (
      <div className="space-y-6 text-slate-100 font-sans">
        {/* Banner */}
        <div className="bg-[#111827]/80 p-5 rounded-xl border border-slate-800 glass">
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Zap className="w-5 h-5 text-emerald-450 mr-2 animate-pulse" />
            Hybrid Technology Siting Decider
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Perform multi-criteria vector comparison across solar, wind, and environmental features.
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
      {/* Banner */}
      <div className="bg-[#111827]/80 p-5 rounded-xl border border-slate-800 glass">
        <h2 className="text-xl font-bold text-slate-100 flex items-center">
          <Zap className="w-5 h-5 text-emerald-400 mr-2 animate-bounce" />
          Hybrid Technology Siting Decider
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Perform multi-criteria vector comparison across solar, wind, and environmental features.
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
          <span className="text-[10px] text-slate-500 uppercase block font-bold">District / State</span>
          <span className="text-slate-100 font-bold">{district}, {stateName}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-bold">Country</span>
          <span className="text-slate-100 font-bold">{country}</span>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 border border-slate-850 space-y-4 md:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355">Siting Parameters</h3>
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
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Total land Area (Ha)</label>
              <input
                type="number"
                step="0.1"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full text-xs font-bold rounded-lg py-1.5 px-3 bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            
            <button
              onClick={() => handleQuery()}
              disabled={isQuerying}
              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow"
            >
              {isQuerying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading recommendation...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Fetch AI Recommendation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Decider Output */}
        <div className="md:col-span-2 space-y-6">
          {recData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
                            {/* Recommendation results card */}
              <div className="glass-card p-5 border border-slate-850 space-y-4 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Decider Recommendation</h3>
                    <h4 className="text-2xl font-black text-emerald-400 mt-1 flex items-center">
                      <Award className="w-6 h-6 mr-1.5 text-yellow-400 shrink-0" />
                      {recData.recommended_technology}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-indigo-400 font-mono block">{recData.confidence_score}%</span>
                    <span className="text-[9px] text-slate-500 uppercase font-black">AI Siting Confidence</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-slate-350 leading-normal font-semibold rounded-xl">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Optimal Solution Selection:</strong> Based on resource profiles and environmental parameters at these coordinates, our Random Forest estimator selected a **{recData.recommended_technology}** configuration.
                  </span>
                </div>
              </div>

              {/* Siting Decision Coordinates */}
              <div className="glass-card p-5 border border-slate-850 space-y-4 flex flex-col justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Siting Decision Coordinates</h3>
                
                <div className="space-y-2 text-xs font-semibold text-slate-300">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Hybrid Siting Score:</span>
                    <span className="text-indigo-400 font-bold font-mono">{Math.round((recData.solar_score + recData.wind_score) / 2)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Overall Suitability Score:</span>
                    <span className="text-emerald-400 font-bold font-mono">{Math.round(recData.solar_score * 0.4 + recData.wind_score * 0.4 + recData.environmental_score * 0.2)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Recommended Tech:</span>
                    <span className="text-slate-200">{recData.recommended_technology}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Final Site Decision:</span>
                    <span className="text-yellow-450 font-bold">{Math.round(recData.solar_score * 0.4 + recData.wind_score * 0.4 + recData.environmental_score * 0.2) >= 60 ? "Proceed (Approved)" : "Alternate Location (Rejected)"}</span>
                  </div>
                </div>
              </div>

              {/* Feasibility Vector Breakdown (No Charts) */}
              <div className="glass-card p-5 border border-slate-850 sm:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Feasibility Vector Breakdown</h3>
                <div className="space-y-4 font-semibold text-slate-355 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>Solar Resource Feasibility</span>
                      <span className="text-yellow-455">{recData.solar_score}%</span>
                    </div>
                    <div className="overflow-hidden h-2.5 rounded bg-slate-950 border border-slate-800">
                      <div style={{ width: `${recData.solar_score}%` }} className="h-full bg-yellow-500 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>Wind Resource Feasibility</span>
                      <span className="text-sky-455">{recData.wind_score}%</span>
                    </div>
                    <div className="overflow-hidden h-2.5 rounded bg-slate-950 border border-slate-800">
                      <div style={{ width: `${recData.wind_score}%` }} className="h-full bg-sky-500 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>Environmental Siting Safety</span>
                      <span className="text-emerald-455">{recData.environmental_score}%</span>
                    </div>
                    <div className="overflow-hidden h-2.5 rounded bg-slate-950 border border-slate-800">
                      <div style={{ width: `${recData.environmental_score}%` }} className="h-full bg-emerald-500 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-8 border border-slate-850 text-center text-slate-550 italic text-xs flex flex-col items-center justify-center space-y-2 py-16">
              <Zap className="w-8 h-8 text-emerald-400 animate-pulse shrink-0" />
              <span>Waiting for location selection.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
