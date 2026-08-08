import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, RefreshCw, Sun, Info, Sliders, ChevronDown } from 'lucide-react';
import { LandPieChart } from '../../components/Charts/ResourceCharts';

export default function SolarPredictionView() {
  const [lat, setLat] = useState("27.539");
  const [lon, setLon] = useState("71.918");
  const [area, setArea] = useState("10.0");
  const [isQuerying, setIsQuerying] = useState(false);
  const [solarData, setSolarData] = useState(null);

  const presets = [
    { name: "Bhadla Solar Park, India", lat: "27.539", lon: "71.918", area: "10.0" },
    { name: "Pavagada Solar Park, India", lat: "14.268", lon: "77.428", area: "25.0" },
    { name: "Kurnool Ultra Solar, India", lat: "15.828", lon: "78.037", area: "15.0" }
  ];

  const handleQuery = async (overrideLat, overrideLon, overrideArea) => {
    const qLat = overrideLat || lat;
    const qLon = overrideLon || lon;
    const qArea = overrideArea || area;
    setIsQuerying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `/api/solar?latitude=${qLat}&longitude=${qLon}&land_area=${qArea}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSolarData(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to compute solar potential predictions.");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#111827]/80 p-5 rounded-xl border border-slate-800 glass">
        <h2 className="text-xl font-bold text-slate-100 flex items-center">
          <Sun className="w-5 h-5 text-yellow-400 mr-2 animate-pulse" />
          Solar Resource Prediction Hub
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulate solar panel feasibility assessments, row spacing shadow corridors, and cell temperatures.
        </p>
      </div>

      {/* Controls & Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 border border-slate-850 space-y-4 md:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355 flex items-center">
            <Sliders className="w-4 h-4 text-sky-400 mr-1.5" />
            Config Siting Params
          </h3>
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
              className="w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow"
            >
              {isQuerying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Run Feasibility Feasibility</span>
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
                  <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prediction Results Dashboard */}
        <div className="md:col-span-2 space-y-6">
          {solarData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Suitability score meter */}
              <div className="glass-card p-5 border border-slate-850 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Siting Suitability Index</h3>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-black text-yellow-400">{solarData.solar_suitability_score}%</span>
                    <span className="text-xs text-slate-400 font-semibold">{solarData.recommended_size}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Performance Ratio (PR)</span>
                    <span className="text-emerald-400">{solarData.performance_ratio}%</span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-950 border border-slate-800">
                    <div style={{ width: `${solarData.performance_ratio}%` }} className="flex flex-col justify-center bg-emerald-500"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Capacity Factor (CF)</span>
                    <span className="text-sky-400">{solarData.capacity_factor}%</span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-950 border border-slate-800">
                    <div style={{ width: `${solarData.capacity_factor * 2}%` }} className="flex flex-col justify-center bg-sky-500"></div>
                  </div>
                </div>
              </div>

              {/* Sizing & Layout Estimates */}
              <div className="glass-card p-5 border border-slate-850 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Layout & Area Calculations</h3>
                <div className="space-y-2.5 text-xs font-semibold text-slate-300">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Optimal Tilt Angle:</span><span className="text-yellow-400 font-mono">{solarData.tilt_angle}°</span></div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Azimuth Orientation:</span><span className="text-slate-200">{solarData.orientation}</span></div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Estimated Panels:</span><span className="text-slate-200 font-mono">{solarData.estimated_number_of_panels} modules</span></div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Installed Capacity:</span><span className="text-sky-400 font-black font-mono">{solarData.installed_capacity_kw / 1000} MW</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Row Spacing Gap:</span><span className="text-slate-200 font-mono">{solarData.row_spacing} m</span></div>
                </div>
              </div>

              {/* Energy Forecast cards */}
              <div className="glass-card p-5 border border-slate-850 sm:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Predicted Yield Generation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black block">Daily Yield</span>
                    <span className="text-lg font-black text-yellow-400 font-mono mt-1 block">{Math.round(solarData.expected_daily_energy_kwh).toLocaleString()} kWh</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black block">Monthly Yield</span>
                    <span className="text-lg font-black text-amber-500 font-mono mt-1 block">{Math.round(solarData.expected_monthly_energy_kwh / 1000).toLocaleString()} MWh</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                    <span className="text-lg font-black text-[#10B981] font-mono block">{Math.round(solarData.expected_annual_energy_kwh / 1000).toLocaleString()} MWh</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black mt-1 block">Annual Yield</span>
                  </div>
                </div>
              </div>

              {/* Pie Chart area setbacks */}
              <div className="glass-card p-5 border border-slate-850 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Land Allocation</h3>
                  <p className="text-[11px] text-slate-500 leading-normal mt-2">
                    Visual representation of footprint setbacks. 20% area reserves are allocated automatically for access roads, electrical inverters spacing, and fence line setbacks.
                  </p>
                </div>
                <LandPieChart landArea={parseFloat(area)} usableArea={solarData.usable_area_hectares} />
              </div>

            </div>
          ) : (
            <div className="glass-card p-8 border border-slate-850 text-center text-slate-550 italic text-xs flex flex-col items-center justify-center space-y-2 py-16">
              <Sun className="w-8 h-8 text-yellow-500 animate-bounce" />
              <span>Query feasibility calculations by coordinates or selecting a preset node.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
