import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  Eye, 
  History, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Sun,
  Wind,
  Layers2,
  DollarSign
} from 'lucide-react';

export default function ReportsView({ user, projects, sites, setView }) {
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [activeReportType, setActiveReportType] = useState('executive_summary');
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    // Load download history from localStorage
    const savedHistory = localStorage.getItem('reports_download_history');
    if (savedHistory) {
      try {
        setHistoryList(JSON.parse(savedHistory));
      } catch (e) {
        setHistoryList([]);
      }
    }
  }, []);

  // Pre-select first site
  useEffect(() => {
    if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id.toString());
    }
  }, [sites]);

  const selectedSite = sites.find(s => s.id.toString() === selectedSiteId);
  const parentProject = selectedSite 
    ? projects.find(p => Number(p.id) === Number(selectedSite.project_id)) 
    : null;

  const canDownload = () => {
    if (!user || !parentProject) return false;
    return (
      user.role === 'admin' || 
      Number(parentProject.owner_id) === Number(user.id) ||
      Number(parentProject.assigned_analyst_id) === Number(user.id) ||
      Number(parentProject.assigned_gis_analyst_id) === Number(user.id) ||
      Number(parentProject.assigned_manager_id) === Number(user.id) ||
      Number(parentProject.assigned_project_manager_id) === Number(user.id)
    );
  };

  const handleDownload = async (format) => {
    if (!selectedSite) return;
    try {
      const token = localStorage.getItem('token');
      const url = `/api/sites/${selectedSite.id}/download/${format}?report_type=${activeReportType}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      let mimeType = 'text/html';
      let extension = 'html';
      if (format === 'excel') {
        mimeType = 'text/csv';
        extension = 'csv';
      } else if (format === 'csv') {
        mimeType = 'text/csv';
        extension = 'csv';
      }
      
      const blob = new Blob([response.data], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const filename = `feasibility_${activeReportType}_site_${selectedSite.id}.${extension}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Add to history list
      const newHistoryItem = {
        id: Date.now(),
        siteName: selectedSite.name,
        reportType: activeReportType,
        format: format.toUpperCase(),
        timestamp: new Date().toLocaleString()
      };
      const updatedHistory = [newHistoryItem, ...historyList].slice(0, 15);
      setHistoryList(updatedHistory);
      localStorage.setItem('reports_download_history', JSON.stringify(updatedHistory));
      
      window.showToast(`Report downloaded successfully!`, "success");
    } catch (e) {
      console.error(e);
      window.showToast("Failed to download report.", "error");
    }
  };

  // Safe JSON Details parsing
  let details = {};
  if (selectedSite && selectedSite.details_json) {
    try {
      details = typeof selectedSite.details_json === 'string'
        ? JSON.parse(selectedSite.details_json)
        : selectedSite.details_json;
    } catch (err) {
      details = {};
    }
  }

  // Pre-defined Report Types list
  const reportTypes = [
    { key: 'executive_summary', label: 'Executive Summary', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { key: 'site_assessment', label: 'Site Assessment', icon: <Layers className="w-4 h-4 text-indigo-400" /> },
    { key: 'solar_report', label: 'Solar Report', icon: <Sun className="w-4 h-4 text-yellow-500" /> },
    { key: 'wind_report', label: 'Wind Report', icon: <Wind className="w-4 h-4 text-sky-400" /> },
    { key: 'hybrid_report', label: 'Hybrid Report', icon: <Layers2 className="w-4 h-4 text-teal-400" /> },
    { key: 'environmental_report', label: 'Environmental Report', icon: <ShieldAlert className="w-4 h-4 text-emerald-400" /> },
    { key: 'financial_feasibility', label: 'Financial Feasibility', icon: <DollarSign className="w-4 h-4 text-[#10B981]" /> }
  ];

  if (sites.length === 0) {
    return (
      <div className="space-y-6 text-slate-100 font-sans">
        <div className="bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass">
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <FileText className="w-5 h-5 text-[#0EA5E9] mr-2" />
            Feasibility Reports Export Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export fully parameterized GIS data, meteorological profiles, and economic forecasts for offline reviews.
          </p>
        </div>

        <div className="bg-[#111827]/80 border border-slate-800 p-12 rounded-2xl glass text-center flex flex-col items-center justify-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-slate-500 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">No GIS Sites Registered</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-normal">
            Create a project and register coordinate locations on the map first to generate feasibility reports.
          </p>
          <button
            onClick={() => setView('projects')}
            className="px-5 py-2.5 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-md font-sans"
          >
            Create New Project
          </button>
        </div>
      </div>
    );
  }

  // Pre-calculated or mock fallbacks for live preview
  const env = details.environmental || {};
  const infra = details.infrastructure || {};
  const solar = details.solar_prediction || {};
  const wind = details.wind_prediction || {};
  const suit = details.suitability || {};
  const scores = suit.scores || {};
  const opt = details.optimization || {};
  const econ = opt.economic_estimates || {};

  const lcoe = econ.lcoe_dollar_kwh || 0.045;
  const npv = econ.npv_million_usd || 12.4;
  const roi = econ.expected_roi_pct || 18.2;
  const irr = econ.irr_percent || 14.8;
  const payback = econ.payback_years || 6.5;
  const capex = econ.estimated_capex_million_usd || 15.0;
  const opex = econ.estimated_opex_million_usd_year || 0.45;
  const annual_rev = econ.annual_revenue_million_usd || 2.8;

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Banner */}
      <div className="bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass">
        <h2 className="text-xl font-bold text-slate-100 flex items-center">
          <FileText className="w-5 h-5 text-[#0EA5E9] mr-2" />
          Feasibility Reports Export Center
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Export fully parameterized GIS data, meteorological profiles, and economic forecasts for offline reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Site Select card */}
          <div className="bg-[#111827]/80 p-5 border border-slate-800 rounded-2xl glass space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Select GIS Site Node</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#0EA5E9] transition-all"
            >
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name} (Score: {s.suitability_score}%)</option>
              ))}
            </select>
            {selectedSite && (
              <div className="text-[10px] text-slate-500 space-y-1 mt-2">
                <div>Coords: <span className="font-mono text-slate-400">{selectedSite.latitude.toFixed(4)}°N, {selectedSite.longitude.toFixed(4)}°E</span></div>
                <div>Region: <span className="text-slate-400">{selectedSite.region || 'Global'}</span></div>
                <div>Project: <span className="text-slate-400 font-bold">{parentProject?.name || 'Loading...'}</span></div>
              </div>
            )}
          </div>

          {/* Report Category card */}
          <div className="bg-[#111827]/80 p-5 border border-slate-800 rounded-2xl glass space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Report Document Type</label>
            <div className="flex flex-col gap-1.5">
              {reportTypes.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveReportType(item.key)}
                  className={`px-3 py-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                    activeReportType === item.key
                      ? 'bg-slate-900 border-[#0EA5E9] text-white'
                      : 'bg-slate-950/40 border-slate-900 hover:border-slate-850 text-slate-450 hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Report Preview & Download Details */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Export and Preview Controls Card */}
          <div className="bg-[#111827]/80 p-6 border border-slate-800 rounded-2xl glass space-y-6">
            
            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-4 gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-200 flex items-center">
                  <Eye className="w-4.5 h-4.5 text-[#0EA5E9] mr-2" />
                  Live Preview: {reportTypes.find(r => r.key === activeReportType)?.label}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Live content mock compilation based on database site parameters.</p>
              </div>
              
              <div className="flex gap-2">
                {canDownload() ? (
                  <>
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-650/40 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all flex items-center"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> PDF / HTML
                    </button>
                    <button
                      onClick={() => handleDownload('excel')}
                      className="px-3 py-1.5 bg-[#16A34A]/10 hover:bg-[#16A34A]/25 border border-[#16A34A]/20 hover:border-[#16A34A]/40 text-[#16A34A] rounded-lg text-[10px] font-black tracking-wide uppercase transition-all flex items-center"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Excel
                    </button>
                    <button
                      onClick={() => handleDownload('csv')}
                      className="px-3 py-1.5 bg-sky-600/10 hover:bg-sky-650/20 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all flex items-center"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Raw CSV
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-650 italic">Download access restricted to assigned project roles.</span>
                )}
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="bg-slate-950/80 border border-slate-900 p-6 rounded-2xl font-sans text-slate-300 min-h-[250px] space-y-6 select-text overflow-x-auto">
              
              {/* Common Report Header */}
              <div className="border-b border-slate-900 pb-4 flex justify-between items-start text-xs">
                <div>
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">GeoEnergy AI Platform Document</span>
                  <span className="text-sm font-black text-slate-100 block">{selectedSite.name} - Siting Assessment</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Coordinates: {selectedSite.latitude.toFixed(4)}°N, {selectedSite.longitude.toFixed(4)}°E</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 block">Score: {selectedSite.suitability_score}%</span>
                  <span className="text-[9px] text-slate-500 block font-black uppercase tracking-wider">{selectedSite.suitability_category}</span>
                </div>
              </div>

              {/* SECTION: Executive Summary */}
              {activeReportType === 'executive_summary' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-900/60 p-4 border border-slate-850 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">AI Decision Summary Recommendation</span>
                    <p className="text-slate-300 leading-relaxed font-semibold">
                      "{opt.reasoning || 'The coordinates provide optimal desert irradiance and flat layout contours. Recommended for utility solar arrays.'}"
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                      <span className="text-slate-500 block mb-1">Recommended Technology:</span>
                      <span className="text-sky-400 font-bold">{opt.recommended_technology || 'Utility Solar PV'}</span>
                    </div>
                    <div className="bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                      <span className="text-slate-500 block mb-1">Capacity Layout:</span>
                      <span className="text-emerald-400 font-bold">{opt.recommended_capacity_mw || 15} MW</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: Site Assessment */}
              {activeReportType === 'site_assessment' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-2 bg-slate-900/20 p-4 border border-slate-900 rounded-xl">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">GIS Profile</span>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Region:</span><span>{selectedSite.region || 'Global'}</span></div>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Country:</span><span>{details.location?.country || 'India'}</span></div>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">State:</span><span>{details.location?.state || 'Rajasthan'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">District:</span><span>{details.location?.district || 'Jodhpur'}</span></div>
                  </div>
                  <div className="space-y-2 bg-slate-900/20 p-4 border border-slate-900 rounded-xl">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Physical Profile</span>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Area (Hectares):</span><span>{selectedSite.land_area || '15'}</span></div>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Land Ownership:</span><span>{selectedSite.land_ownership || 'Lease'}</span></div>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Elevation:</span><span>{env.elevation || 220} m</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Terrain Type:</span><span>{env.terrain_type || 'Sandy Desert Plain'}</span></div>
                  </div>
                </div>
              )}

              {/* SECTION: Solar Report */}
              {activeReportType === 'solar_report' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Annual GHI</span>
                      <span className="text-sm font-black text-yellow-400 block mt-1">{env.solar_irradiance || 5.2} kWh/m²/d</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Capacity Factor</span>
                      <span className="text-sm font-black text-slate-200 block mt-1">{solar.capacity_factor ? `${(solar.capacity_factor * 100).toFixed(1)}%` : '25.8%'}</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Tilt Angle</span>
                      <span className="text-sm font-black text-slate-200 block mt-1">{solar.tilt_angle || 27}°</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Solar Score</span>
                      <span className="text-sm font-black text-yellow-400 block mt-1">{scores.solar || 82}%</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/20 p-4 border border-slate-900 rounded-xl space-y-2 font-semibold">
                    <div className="flex justify-between border-b border-slate-900 pb-1"><span className="text-slate-500">Est. Annual Energy Output:</span><span className="text-emerald-400 font-mono">{Math.round(solar.expected_energy_output || 1680000).toLocaleString()} kWh</span></div>
                    <div className="flex justify-between border-b border-slate-900 pb-1"><span className="text-slate-500">Panel Tech Recommendation:</span><span>{solar.recommended_solar_panel_type || 'Monocrystalline Silicon'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Estimated Modules Required:</span><span>{solar.estimated_number_of_panels ? Math.round(solar.estimated_number_of_panels).toLocaleString() : '32,500'}</span></div>
                  </div>
                </div>
              )}

              {/* SECTION: Wind Report */}
              {activeReportType === 'wind_report' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Avg velocity</span>
                      <span className="text-sm font-black text-sky-400 block mt-1">{wind.average_wind_speed || 3.8} m/s</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Capacity Factor</span>
                      <span className="text-sm font-black text-slate-200 block mt-1">{wind.capacity_factor ? `${(wind.capacity_factor * 100).toFixed(1)}%` : '32.4%'}</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Power Density</span>
                      <span className="text-sm font-black text-slate-200 block mt-1">{wind.wind_power_density || 280} W/m²</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Wind Score</span>
                      <span className="text-sm font-black text-sky-400 block mt-1">{scores.wind || 45}%</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/20 p-4 border border-slate-900 rounded-xl space-y-2 font-semibold">
                    <div className="flex justify-between border-b border-slate-900 pb-1"><span className="text-slate-500">Est. Annual Energy Output:</span><span className="text-emerald-400 font-mono">{Math.round(wind.expected_annual_energy || 2450000).toLocaleString()} kWh</span></div>
                    <div className="flex justify-between border-b border-slate-900 pb-1"><span className="text-slate-500">Turbine Height Recommendation:</span><span>{wind.recommended_turbine_height || 110} meters</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Turbine Model Recommendation:</span><span>{wind.recommended_turbine_model || 'Goldwind GW 2.5MW'}</span></div>
                  </div>
                </div>
              )}

              {/* SECTION: Hybrid Report */}
              {activeReportType === 'hybrid_report' && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="bg-[#111827]/80 p-4 border border-slate-900 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest block">AI Co-Location Design</span>
                    <div className="flex justify-between border-b border-slate-900 pb-1"><span className="text-slate-500">Recommended Plant Type:</span><span className="capitalize">{selectedSite.recommended_plant || 'Hybrid Solar-Wind'}</span></div>
                    <div className="flex justify-between border-b border-slate-900 pb-1"><span className="text-slate-500">Technology Split Ratio:</span><span>{opt.technology_split || '70% Solar / 30% Wind'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Combined Energy Generation:</span><span className="text-emerald-400 font-mono">{Math.round(opt.annual_energy_generation_mwh || 4130).toLocaleString()} MWh/yr</span></div>
                  </div>
                </div>
              )}

              {/* SECTION: Environmental Report */}
              {activeReportType === 'environmental_report' && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-900/20 p-4 border border-slate-900 rounded-xl space-y-2">
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Climatic Environment</span>
                      <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Terrain Slope:</span><span>{env.land_slope || 0.8}°</span></div>
                      <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Vegetation Index (NDVI):</span><span>{env.vegetation_index || 0.12}</span></div>
                      <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Land Cover Class:</span><span>{env.land_cover || 'Barren Desert / Sandy'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Population Density:</span><span className="text-slate-100">{env.population_density || 1.2} per km²</span></div>
                    </div>
                    <div className="bg-slate-900/20 p-4 border border-slate-900 rounded-xl space-y-2">
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Exclusions & Proximities</span>
                      <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Airport Proximity:</span><span className="font-mono">{(infra.distance_to_airport || 22).toFixed(1)} km</span></div>
                      <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Forest Zone Check:</span><span className={infra.in_protected_zone ? 'text-rose-400' : 'text-emerald-400'}>{infra.in_protected_zone ? 'Restricted' : 'Safe / Outside'}</span></div>
                      <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Water Proximity Alert:</span><span>{infra.near_water_bodies ? 'Yes' : 'No'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Flood / Seismic Risk:</span><span>{env.flood_risk || 'Low'} / {env.earthquake_risk || 'Low'}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: Financial Feasibility */}
              {activeReportType === 'financial_feasibility' && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">LCOE</span>
                      <span className="text-sm font-black text-emerald-400 block mt-1">${lcoe.toFixed(4)} / kWh</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">NPV</span>
                      <span className="text-sm font-black text-[#10B981] block mt-1">${npv}M USD</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">IRR</span>
                      <span className="text-sm font-black text-slate-200 block mt-1">{irr}%</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Payback</span>
                      <span className="text-sm font-black text-[#10B981] block mt-1">{payback} Years</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/20 p-4 border border-slate-900 rounded-xl space-y-2">
                    <div className="flex justify-between border-b border-slate-900 pb-1"><span className="text-slate-500">Estimated Project CAPEX:</span><span className="text-slate-250">${capex}M USD</span></div>
                    <div className="flex justify-between border-b border-slate-900 pb-1"><span className="text-slate-500">Estimated annual OPEX:</span><span className="text-slate-250">${opex}M USD/yr</span></div>
                    <div className="flex justify-between border-b border-slate-900 pb-1"><span className="text-slate-500">Annual Project Revenue Yield:</span><span className="text-emerald-400">${annual_rev}M USD/yr</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Estimated Project ROI:</span><span className="text-emerald-400">{roi}%</span></div>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Download History list */}
          <div className="bg-[#111827]/80 p-5 border border-slate-800 rounded-2xl glass space-y-4">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
              <History className="w-4.5 h-4.5 mr-1.5 text-sky-400" />
              Download History Log
            </h3>
            {historyList.length > 0 ? (
              <div className="space-y-2">
                {historyList.map(item => (
                  <div key={item.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex justify-between items-center text-[10px]">
                    <div>
                      <span className="font-bold text-slate-200 block truncate max-w-[150px]">{item.siteName}</span>
                      <span className="text-slate-500 block mt-0.5">📂 {item.reportType.replace('_', ' ').toUpperCase()} ({item.format})</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[9px]">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 italic py-2">
                No recent downloads recorded. Click download above to export documents.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
