import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, RefreshCw, Sun, Info, Sliders, ChevronDown } from 'lucide-react';

export default function SolarPredictionView({ setView }) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [area, setArea] = useState("10.0");
  const [isQuerying, setIsQuerying] = useState(false);
  const [solarData, setSolarData] = useState(null);

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
        `/api/predict/solar`,
        {
          latitude: parseFloat(qLat),
          longitude: parseFloat(qLon),
          land_area: parseFloat(qArea)
        },
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
            <Sun className="w-5 h-5 text-yellow-400 mr-2 animate-pulse" />
            Solar Resource Prediction Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate solar panel feasibility assessments, row spacing shadow corridors, and cell temperatures.
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
          <Sun className="w-5 h-5 text-yellow-400 mr-2 animate-pulse" />
          Solar Resource Prediction Hub
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulate solar panel feasibility assessments, row spacing shadow corridors, and cell temperatures.
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
                  <span>Run Feasibility Assessment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prediction Results Dashboard */}
        <div className="md:col-span-2 space-y-6">
          {solarData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
              
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
                  <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="text-slate-500">Solar Irradiance:</span><span className="text-yellow-400 font-mono">{solarData.peak_sun_hours} kWh/m²/day</span></div>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                    <span className="text-[10px] text-slate-500 uppercase font-black block font-sans">Daily Yield</span>
                    <span className="text-lg font-black text-yellow-400 mt-1 block">{Math.round(solarData.expected_daily_energy_kwh).toLocaleString()} kWh</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                    <span className="text-[10px] text-slate-500 uppercase font-black block font-sans">Monthly Yield</span>
                    <span className="text-lg font-black text-amber-500 mt-1 block">{Math.round(solarData.expected_monthly_energy_kwh / 1000).toLocaleString()} MWh</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                    <span className="text-lg font-black text-[#10B981] block">{Math.round(solarData.expected_annual_energy_kwh / 1000).toLocaleString()} MWh</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black mt-1 block font-sans">Annual Yield</span>
                  </div>
                </div>
              </div>

              {/* Land Allocation Table (No Charts) */}
              <div className="glass-card p-5 border border-slate-850 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Land Allocation</h3>
                  <p className="text-[11px] text-slate-500 leading-normal mt-2">
                    Setbacks representation: 20% area reserves are allocated automatically for access roads, electrical inverters spacing, and fence line setbacks.
                  </p>
                </div>
                <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl space-y-2 text-xs font-semibold text-slate-300">
                  <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Total Survey Area:</span><span className="text-slate-100 font-mono">{parseFloat(area).toFixed(1)} Ha</span></div>
                  <div className="flex justify-between border-b border-slate-950 pb-1.5"><span className="text-slate-500">Usable Footprint (80%):</span><span className="text-emerald-400 font-mono">{solarData.usable_area_hectares.toFixed(1)} Ha</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Setbacks & Buffers (20%):</span><span className="text-rose-400 font-mono">{(parseFloat(area) - solarData.usable_area_hectares).toFixed(1)} Ha</span></div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-8 border border-slate-850 text-center text-slate-550 italic text-xs flex flex-col items-center justify-center space-y-2 py-16">
              <Sun className="w-8 h-8 text-yellow-500 animate-bounce shrink-0" />
              <span>Waiting for location selection.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
