import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, RefreshCw, Zap, Award, CheckCircle } from 'lucide-react';
import { SitingBarChart } from '../../components/Charts/ResourceCharts';

export default function HybridPredictionView() {
  const [lat, setLat] = useState("27.539");
  const [lon, setLon] = useState("71.918");
  const [area, setArea] = useState("10.0");
  const [isQuerying, setIsQuerying] = useState(false);
  const [recData, setRecData] = useState(null);

  const presets = [
    { name: "Bhadla Desert (India) - Solar Node", lat: "27.539", lon: "71.918", area: "10.0" },
    { name: "Muppandal Gap (India) - Wind Node", lat: "8.258", lon: "77.535", area: "20.0" },
    { name: "Kurnool (India) - Hybrid Node", lat: "15.828", lon: "78.037", area: "15.0" }
  ];

  const handleQuery = async (overrideLat, overrideLon, overrideArea) => {
    const qLat = overrideLat || lat;
    const qLon = overrideLon || lon;
    const qArea = overrideArea || area;
    setIsQuerying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/predict/hybrid`,
        {
          solar_irradiance: 5.2, // fallback values, computed on backend
          wind_speed: 4.8,
          temperature: 25.0,
          cloud_cover: 30.0,
          rainfall: 800.0,
          land_slope: 2.0,
          elevation: 100.0,
          distance_to_transmission: 2.0,
          distance_to_road: 0.5,
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
                    setArea(p.area);
                    handleQuery(p.lat, p.lon, p.area);
                  }}
                  className="w-full text-left text-[11px] font-bold text-slate-300 py-1.5 px-2 bg-slate-950/40 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-lg transition-all flex items-center space-x-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Decider Output */}
        <div className="md:col-span-2 space-y-6">
          {recData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Recommendation results card */}
              <div className="glass-card p-5 border border-slate-850 space-y-4 flex flex-col justify-between sm:col-span-2">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Decider Recommendation</h3>
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

                <div className="flex items-start space-x-2.5 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-slate-300 leading-normal font-semibold">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Optimal Solution Selection:</strong> Based on multi-criteria analysis of resource profiles and environmental parameters at these coordinates, our Random Forest estimator selected a **{recData.recommended_technology}** deployment as the highest return configuration.
                  </span>
                </div>
              </div>

              {/* Bar Chart Siting profiles */}
              <div className="glass-card p-5 border border-slate-850 sm:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Feasibility Vector Breakdown</h3>
                <SitingBarChart 
                  solarScore={recData.solar_score} 
                  windScore={recData.wind_score} 
                  envScore={recData.environmental_score} 
                />
              </div>

            </div>
          ) : (
            <div className="glass-card p-8 border border-slate-850 text-center text-slate-550 italic text-xs flex flex-col items-center justify-center space-y-2 py-16">
              <Zap className="w-8 h-8 text-emerald-400 animate-pulse" />
              <span>Query technology feasibility decider by coordinates or selecting a preset node.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
