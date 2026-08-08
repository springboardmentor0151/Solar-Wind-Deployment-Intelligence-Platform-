import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, RefreshCw, Wind, Sliders, Navigation } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function WindPredictionView() {
  const [lat, setLat] = useState("8.258");
  const [lon, setLon] = useState("77.535");
  const [area, setArea] = useState("20.0");
  const [isQuerying, setIsQuerying] = useState(false);
  const [windData, setWindData] = useState(null);

  const presets = [
    { name: "Muppandal Wind Farm, TN", lat: "8.258", lon: "77.535", area: "20.0" },
    { name: "Jaisalmer Wind Park, RJ", lat: "26.915", lon: "70.908", area: "35.0" },
    { name: "Kurnool Wind Hills, AP", lat: "15.828", lon: "78.037", area: "25.0" }
  ];

  const handleQuery = async (overrideLat, overrideLon, overrideArea) => {
    const qLat = overrideLat || lat;
    const qLon = overrideLon || lon;
    const qArea = overrideArea || area;
    setIsQuerying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `/api/wind?latitude=${qLat}&longitude=${qLon}&land_area=${qArea}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWindData(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to compute wind resource predictions.");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#111827]/80 p-5 rounded-xl border border-slate-800 glass">
        <h2 className="text-xl font-bold text-slate-100 flex items-center">
          <Wind className="w-5 h-5 text-sky-450 mr-2 animate-bounce" />
          Wind Resource Feasibility Hub
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Predict hub-height wind shear gradients, power densities, turbulence intensity, and turbine counts.
        </p>
      </div>

      {/* Controls & Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 border border-slate-850 space-y-4 md:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355 flex items-center">
            <Sliders className="w-4 h-4 text-sky-450 mr-1.5" />
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
              className="w-full py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow"
            >
              {isQuerying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Run Wind Assessment</span>
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
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prediction Results */}
        <div className="md:col-span-2 space-y-6">
          {windData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Suitability score meter */}
              <div className="glass-card p-5 border border-slate-850 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Wind Suitability Index</h3>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-black text-sky-400">{windData.wind_suitability_score}%</span>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase truncate max-w-[130px]">{windData.recommended_turbine_model}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Hub height average speed</span>
                    <span className="text-emerald-400">{windData.average_wind_speed} m/s</span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-950 border border-slate-800">
                    <div style={{ width: `${(windData.average_wind_speed / 15) * 100}%` }} className="flex flex-col justify-center bg-emerald-500"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Wind Capacity Factor (CF)</span>
                    <span className="text-sky-400">{windData.capacity_factor}%</span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-950 border border-slate-800">
                    <div style={{ width: `${windData.capacity_factor * 2}%` }} className="flex flex-col justify-center bg-sky-500"></div>
                  </div>
                </div>
              </div>

              {/* Turbine Sizing */}
              <div className="glass-card p-5 border border-slate-850 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Turbine Layout Calculations</h3>
                <div className="space-y-2.5 text-xs font-semibold text-slate-300">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Hub Height / Diameter:</span><span className="text-slate-200 font-mono">{windData.recommended_turbine_height}m / {windData.rotor_diameter}m</span></div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Power Density (WPD):</span><span className="text-slate-200 font-mono">{windData.wind_power_density} W/m²</span></div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Turbines Count Sized:</span><span className="text-emerald-400 font-bold font-mono">{windData.number_of_turbines} units</span></div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Total Wind Capacity:</span><span className="text-sky-400 font-black font-mono">{(windData.installed_capacity_kw / 1000).toFixed(1)} MW</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Spacing Footprint:</span><span className="text-slate-250 font-mono font-bold truncate max-w-[130px]">{Math.round(windData.spacing_area_m2).toLocaleString()} m²</span></div>
                </div>
              </div>

              {/* Yield Prediction */}
              <div className="glass-card p-5 border border-slate-850 sm:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Predicted Yield Generation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black block">Daily Yield</span>
                    <span className="text-lg font-black text-sky-400 font-mono mt-1 block">{Math.round(windData.expected_daily_energy_kwh).toLocaleString()} kWh</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black block">Monthly Yield</span>
                    <span className="text-lg font-black text-indigo-400 font-mono mt-1 block">{Math.round(windData.expected_monthly_energy_kwh / 1000).toLocaleString()} MWh</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                    <span className="text-lg font-black text-[#10B981] font-mono block">{Math.round(windData.expected_annual_energy_kwh / 1000).toLocaleString()} MWh</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black mt-1 block">Annual Yield</span>
                  </div>
                </div>
              </div>

              {/* Wind Rose chart representation */}
              <div className="glass-card p-5 border border-slate-850 sm:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Wind Direction Frequency Distribution (Wind Rose)</h3>
                  <Navigation className="w-4 h-4 text-sky-400" />
                </div>
                
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={windData.wind_rose} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="sector" stroke="#64748b" style={{ fontSize: 9 }} />
                      <YAxis stroke="#64748b" style={{ fontSize: 9 }} suffix="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 10 }} />
                      <Area type="monotone" dataKey="frequency" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.25} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-8 border border-slate-850 text-center text-slate-550 italic text-xs flex flex-col items-center justify-center space-y-2 py-16">
              <Wind className="w-8 h-8 text-sky-500 animate-spin" />
              <span>Query feasibility calculations by coordinates or selecting a preset node.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
