import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Layers, MapPin, Plus, Shield, ShieldAlert, Cpu, Sparkles, Navigation, Map } from 'lucide-react';

export default function MapView({ user, projects, onSiteCreated }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);
  const layersGroup = useRef(null);

  // Form states
  const [selectedCoords, setSelectedCoords] = useState({ lat: 22.9734, lon: 78.6569 }); // Center of India
  const [siteName, setSiteName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectType, setProjectType] = useState('solar');
  const [landArea, setLandArea] = useState(100);
  const [landOwnership, setLandOwnership] = useState('Public BLM Lease');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Overlay Toggles
  const [activeOverlays, setActiveOverlays] = useState({
    solar: false,
    wind: false,
    protected: true,
    grid: false,
  });

  // Predefined geographic presets to jump to
  const presets = [
    { name: "Bhadla Solar Park, RJ", lat: 27.539, lon: 71.918, zoom: 10 },
    { name: "Muppandal Wind Farm, TN", lat: 8.261, lon: 77.551, zoom: 10 },
    { name: "Khavda RE Park, GJ", lat: 23.83, lon: 69.72, zoom: 9 },
    { name: "Leh Mountain Solar, LA", lat: 34.15, lon: 77.58, zoom: 9 },
    { name: "Anantapur Solar Hub, AP", lat: 14.68, lon: 77.60, zoom: 9 }
  ];

  // Initialize Leaflet Map
  useEffect(() => {
    // Standard Leaflet import check
    if (!window.L || mapInstance.current) return;

    const L = window.L;

    // Create Leaflet Map instance
    const map = L.map(mapRef.current).setView([22.9734, 78.6569], 5);
    mapInstance.current = map;

    // Add Dark Matter Tile Layer (CARTO)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Set up layer groups
    markersGroup.current = L.layerGroup().addTo(map);
    layersGroup.current = L.layerGroup().addTo(map);

    // Map Click Listener
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateSelectedLocation(lat, lng);
    });

    // Default marker
    updateSelectedLocation(22.9734, 78.6569);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update marker position and local coordinates
  const updateSelectedLocation = (lat, lon) => {
    const latitude = parseFloat(lat.toFixed(4));
    const longitude = parseFloat(lon.toFixed(4));
    setSelectedCoords({ lat: latitude, lon: longitude });

    if (!window.L || !mapInstance.current) return;
    const L = window.L;

    // Clear previous markers
    markersGroup.current.clearLayers();

    // Create glowing custom pin
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_#3b82f6] animate-ping"></div>
             <div class="w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white absolute top-[1px] left-[1px]"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    L.marker([latitude, longitude], { icon: customIcon }).addTo(markersGroup.current);
  };

  // Redraw overlays when layers states change
  useEffect(() => {
    if (!window.L || !mapInstance.current) return;
    const L = window.L;

    layersGroup.current.clearLayers();

    // Draw Protected Zones (Red circles)
    if (activeOverlays.protected) {
      const protectedCenters = [
        { lat: 26.8, lon: 70.9, name: "Desert National Park (Rajasthan)" },
        { lat: 21.1, lon: 70.8, name: "Gir Forest National Park (Gujarat)" },
        { lat: 11.5, lon: 76.6, name: "Mudumalai Biosphere Reserve (Tamil Nadu)" },
        { lat: 33.9, lon: 77.3, name: "Hemis National Park (Ladakh)" }
      ];

      protectedCenters.forEach(center => {
        L.circle([center.lat, center.lon], {
          color: '#ef4444',
          fillColor: '#f87171',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(layersGroup.current)
          .bindTooltip(center.name, { sticky: true, className: 'bg-slate-900 border-rose-500 text-rose-400 font-semibold' });
      });
    }

    // Draw Mock Grid Lines (Transmission powerlines across India)
    if (activeOverlays.grid) {
      const lines = [
        [[8.0, 77.5], [34.0, 77.5]], // North-South Corridor
        [[22.0, 68.0], [22.0, 88.0]], // East-West Corridor
        [[27.5, 71.9], [22.0, 72.0]], // Rajasthan to Gujarat Grid
        [[13.0, 77.6], [8.3, 77.6]]   // Southern Hub Grid
      ];

      lines.forEach(pts => {
        L.polyline(pts, {
          color: '#eab308',
          weight: 1.5,
          opacity: 0.6,
          dashArray: '5, 8'
        }).addTo(layersGroup.current)
          .bindTooltip("Power Grid Corporation 765kV HVDC Line", { sticky: true });
      });
    }

    // Draw Solar Irradiance Heatmap Overlay across India
    if (activeOverlays.solar) {
      for (let lat = 8; lat <= 36; lat += 4) {
        for (let lon = 68; lon <= 88; lon += 4) {
          const ghi = (lat > 22 && lat < 28 && lon < 75) ? 6.2 : 5.2;
          const opacity = (ghi - 4) / 3.5 * 0.22;
          L.rectangle([[lat, lon], [lat + 3.5, lon + 3.5]], {
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: opacity,
            weight: 0
          }).addTo(layersGroup.current);
        }
      }
    }

    // Draw Wind Speed Heatmap Overlay across India
    if (activeOverlays.wind) {
      for (let lat = 8; lat <= 36; lat += 4) {
        for (let lon = 68; lon <= 88; lon += 4) {
          const isWindy = (lat < 12 && lon < 79) || (lat > 20 && lat < 24 && lon < 72);
          const opacity = isWindy ? 0.25 : 0.05;
          L.rectangle([[lat, lon], [lat + 3.5, lon + 3.5]], {
            color: '#38bdf8',
            fillColor: '#0284c7',
            fillOpacity: opacity,
            weight: 0
          }).addTo(layersGroup.current);
        }
      }
    }

  }, [activeOverlays]);

  // Helper functions for math inside overlay creation
  const abs = Math.abs;
  const sin = Math.sin;

  // Jump to preset location
  const jumpTo = (preset) => {
    updateSelectedLocation(preset.lat, preset.lon);
    if (mapInstance.current) {
      mapInstance.current.setView([preset.lat, preset.lon], preset.zoom);
    }
  };

  // Run Real-time Environmental Assessment (Calls backend endpoint backend calculates values, returns immediately)
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      // Simulate backend delay slightly for immersion
      await new Promise(r => setTimeout(r, 900));
      
      const token = localStorage.getItem('token');
      // Create a temporary mock project if projects list is empty, or use -1 to just trigger calculations
      // We will create the site inside a project later, this is just direct analysis
      const tempSitePayload = {
        name: "Temporary Analysis Node",
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lon,
        project_id: projects[0]?.id || 1,
        land_area: landArea,
        land_ownership: landOwnership
      };
      
      const res = await axios.post(`/api/sites?project_type=${projectType}`, tempSitePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const details = JSON.parse(res.data.details_json);
      setAnalysisResult(details);
    } catch (e) {
      console.error(e);
      alert("Error analyzing coordinates. Ensure your backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save the site officially to the project
  const handleSaveSite = async (e) => {
    e.preventDefault();
    if (!siteName) {
      alert("Please enter a site name.");
      return;
    }
    if (!projectId) {
      alert("Please select a project.");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const sitePayload = {
        name: siteName,
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lon,
        project_id: parseInt(projectId),
        land_area: parseFloat(landArea),
        land_ownership: landOwnership
      };
      
      const res = await axios.post(`/api/sites?project_type=${projectType}`, sitePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`Site "${siteName}" successfully added to project!`);
      setSiteName('');
      setAnalysisResult(null);
      if (onSiteCreated) onSiteCreated();
    } catch (err) {
      console.error(err);
      alert("Failed to save site. Double check inputs.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-80px)] overflow-hidden">
      {/* Map Column */}
      <div className="lg:col-span-2 flex flex-col space-y-4 h-full relative">
        <div className="flex justify-between items-center bg-[#111827]/80 p-4 rounded-xl border border-slate-800/80 glass">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center">
              <Map className="w-5 h-5 text-emerald-400 mr-2" />
              GIS Geospatial Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select coordinates on the map or select a quick-preset region.
            </p>
          </div>
          
          {/* Preset Buttons */}
          <div className="flex space-x-2 overflow-x-auto max-w-sm py-1">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => jumpTo(preset)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/80 transition-all flex items-center space-x-1"
              >
                <Navigation className="w-3 h-3 rotate-45" />
                <span>{preset.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas wrapper */}
        <div className="relative flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div ref={mapRef} className="w-full h-full min-h-[400px]"></div>
          
          {/* Floating Layers controller */}
          <div className="absolute top-4 right-4 z-[1000] bg-[#0f172a]/90 border border-slate-800 rounded-xl p-3 shadow-2xl w-48 glass">
            <h3 className="text-xs font-bold text-slate-300 flex items-center mb-2.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              GIS Overlays
            </h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={activeOverlays.solar}
                  onChange={() => setActiveOverlays({ ...activeOverlays, solar: !activeOverlays.solar })}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 mr-1.5"></span>
                  Solar Irradiance
                </span>
              </label>
              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={activeOverlays.wind}
                  onChange={() => setActiveOverlays({ ...activeOverlays, wind: !activeOverlays.wind })}
                  className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500"
                />
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 mr-1.5"></span>
                  Wind Velocity Grid
                </span>
              </label>
              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={activeOverlays.grid}
                  onChange={() => setActiveOverlays({ ...activeOverlays, grid: !activeOverlays.grid })}
                  className="rounded border-slate-700 bg-slate-800 text-yellow-500 focus:ring-yellow-500"
                />
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 mr-1.5"></span>
                  Transmission Lines
                </span>
              </label>
              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={activeOverlays.protected}
                  onChange={() => setActiveOverlays({ ...activeOverlays, protected: !activeOverlays.protected })}
                  className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500"
                />
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 mr-1.5"></span>
                  Protected Reserves
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs & Analysis Result Column */}
      <div className="bg-[#111827]/80 p-6 rounded-xl border border-slate-800/80 flex flex-col h-full overflow-y-auto glass shadow-2xl space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center">
            <Cpu className="w-5 h-5 text-indigo-400 mr-2 animate-pulse" />
            Deployment Config
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure site specifications and trigger AI estimations.
          </p>
        </div>

        {/* Selected Coordinates info */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex justify-between text-xs font-semibold">
          <div>
            <span className="text-slate-500 block mb-0.5 uppercase tracking-wider text-[10px]">Latitude</span>
            <span className="text-blue-400 flex items-center font-mono">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {selectedCoords.lat}° N
            </span>
          </div>
          <div className="text-right border-l border-slate-800 pl-4">
            <span className="text-slate-500 block mb-0.5 uppercase tracking-wider text-[10px]">Longitude</span>
            <span className="text-blue-400 flex items-center font-mono">
              {selectedCoords.lon}° E
            </span>
          </div>
        </div>

        {/* Interactive settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['solar', 'wind', 'hybrid'].map((type) => (
                <button
                  key={type}
                  onClick={() => setProjectType(type)}
                  className={`py-2 rounded-lg text-xs font-bold capitalize transition-all border ${
                    projectType === type
                      ? 'bg-blue-600/30 border-blue-500 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Land Area (Ha)</label>
              <input
                type="number"
                value={landArea}
                onChange={(e) => setLandArea(Math.max(1, e.target.value))}
                className="w-full rounded-lg py-2 px-3 text-xs glass-input font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ownership Model</label>
              <select
                value={landOwnership}
                onChange={(e) => setLandOwnership(e.target.value)}
                className="w-full rounded-lg py-2 px-3 text-xs glass-input font-bold"
              >
                <option value="Public BLM Lease">Public BLM Lease</option>
                <option value="Private Agricultural Lease">Private Lease (Agri)</option>
                <option value="Private Commercial Lease">Private Lease (Comm)</option>
                <option value="Federal Freehold">Federal Freehold</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{isAnalyzing ? "Computing GIS Models..." : "Run AI Resource Assessment"}</span>
          </button>
        </div>

        {/* Live Analysis output */}
        {analysisResult && (
          <div className="flex-1 border border-slate-800 rounded-xl bg-slate-900/60 p-4 space-y-4 animate-fade-in">
            {/* Suitability score badge */}
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Suitability Output</h4>
                <span className="text-[10px] text-slate-500 font-semibold">Model-calculated ranking</span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-extrabold px-2.5 py-1 rounded-full ${
                  analysisResult.suitability.category === 'Excellent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  analysisResult.suitability.category === 'Highly Suitable' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
                  analysisResult.suitability.category === 'Moderately Suitable' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {analysisResult.suitability.scores.overall} / 100 ({analysisResult.suitability.category})
                </span>
              </div>
            </div>

            {/* Environmental factor results */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
              <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800/40">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Solar Irradiance</span>
                <span className="text-xs font-bold text-amber-400">{analysisResult.environmental.solar_irradiance} kWh/m²/day</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800/40">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Wind Velocity</span>
                <span className="text-xs font-bold text-sky-400">{analysisResult.wind_prediction.average_wind_speed} m/s (hub)</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800/40">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Terrain Slope</span>
                <span className="text-xs font-bold text-slate-300">{analysisResult.environmental.land_slope}°</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800/40">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Grid Proximity</span>
                <span className="text-xs font-bold text-yellow-400">{analysisResult.infrastructure.distance_to_transmission} km</span>
              </div>
            </div>

            {/* Optimization Recommendation summary */}
            <div className="bg-slate-950/60 p-3.5 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended Solution: {analysisResult.optimization.recommended_technology}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {analysisResult.optimization.reasoning}
              </p>
              <div className="text-[11px] font-bold text-slate-300 border-t border-slate-800/80 pt-2 flex justify-between">
                <span>Optimized Cap: {analysisResult.optimization.technology_split}</span>
                <span className="text-emerald-400">Est CAPEX: ${analysisResult.optimization.economic_estimates.estimated_capex_million_usd}M</span>
              </div>
            </div>

            {/* Register form */}
            {user.role !== 'manager' && (
              <form onSubmit={handleSaveSite} className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                  <Plus className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Save Site to Project
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Enter site name..."
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="rounded-lg py-2 px-3 text-xs glass-input font-bold placeholder-slate-600"
                  />
                  <select
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="rounded-lg py-2 px-3 text-xs glass-input font-bold"
                  >
                    <option value="">Select Project...</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1"
                >
                  <span>Confirm Registration</span>
                </button>
              </form>
            )}
            
            {/* Warning messages */}
            {analysisResult.infrastructure.in_protected_zone && (
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-2.5 flex items-start space-x-2 text-[10px] text-rose-400">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>Environmental Risk:</strong> Coordinates lie within a protected ecological area. Site registration is blocked or highly restricted.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
