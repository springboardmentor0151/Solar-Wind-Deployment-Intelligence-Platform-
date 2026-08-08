import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, RefreshCw, Wind, Sliders, Navigation } from 'lucide-react';

export default function WindPredictionView({ setView }) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [area, setArea] = useState("20.0");
  const [isQuerying, setIsQuerying] = useState(false);
  const [windData, setWindData] = useState(null);

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
        `/api/predict/wind`,
        {
          latitude: parseFloat(qLat),
          longitude: parseFloat(qLon),
          land_area: parseFloat(qArea)
        },
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
            <Wind className="w-5 h-5 text-sky-450 mr-2 animate-pulse" />
            Wind Resource Feasibility Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Predict hub-height wind shear gradients, power densities, turbulence intensity, and turbine counts.
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
          <Wind className="w-5 h-5 text-sky-450 mr-2 animate-bounce" />
          Wind Resource Feasibility Hub
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Predict hub-height wind shear gradients, power densities, turbulence intensity, and turbine counts.
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

      {/* Controls */}
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
        </div>

        {/* Prediction Results */}
        <div className="md:col-span-2 space-y-6">
          {windData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
              
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
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Prevailing Direction:</span><span className="text-slate-200 font-mono">{windData.wind_direction}° N/E</span></div>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                    <span className="text-[10px] text-slate-500 uppercase font-black block font-sans">Daily Yield</span>
                    <span className="text-lg font-black text-sky-400 mt-1 block">{Math.round(windData.expected_daily_energy_kwh).toLocaleString()} kWh</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                    <span className="text-[10px] text-slate-500 uppercase font-black block font-sans">Monthly Yield</span>
                    <span className="text-lg font-black text-indigo-400 mt-1 block">{Math.round(windData.expected_monthly_energy_kwh / 1000).toLocaleString()} MWh</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                    <span className="text-lg font-black text-[#10B981] block">{Math.round(windData.expected_annual_energy_kwh / 1000).toLocaleString()} MWh</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black mt-1 block font-sans">Annual Yield</span>
                  </div>
                </div>
              </div>

              {/* Wind Rose Table Grid representation */}
              <div className="glass-card p-5 border border-slate-850 sm:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Wind Direction Frequency Distribution (Wind Rose Data Grid)</h3>
                  <Navigation className="w-4 h-4 text-sky-400" />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-300">
                  {windData.wind_rose?.map((wr, idx) => (
                    <div key={idx} className="bg-slate-950/40 p-2.5 border border-slate-900 rounded-xl text-center hover:border-slate-800 transition-colors">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold font-sans">{wr.sector} Direction</span>
                      <span className="text-sm font-black text-sky-400 block mt-0.5">{wr.frequency}% Frequency</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-8 border border-slate-850 text-center text-slate-550 italic text-xs flex flex-col items-center justify-center space-y-2 py-16">
              <Wind className="w-8 h-8 text-sky-500 animate-spin shrink-0" />
              <span>Waiting for location selection.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
