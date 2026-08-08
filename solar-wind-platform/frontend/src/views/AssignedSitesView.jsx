import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  MapPin, 
  Compass, 
  Layers, 
  Activity, 
  Map, 
  Wind, 
  Sun,
  Database,
  CloudRain
} from 'lucide-react';

export default function AssignedSitesView({ user, projects }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/gis/sites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSites(res.data);
      if (res.data.length > 0) {
        setSelectedSiteId(res.data[0].id);
      }
    } catch (e) {
      console.error("Failed to load assigned sites", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [projects]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (loading || !window.L || mapInstance.current || !mapRef.current) return;

    const L = window.L;

    // Create Map
    const map = L.map(mapRef.current).setView([22.9734, 78.6569], 5);
    mapInstance.current = map;

    // Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    markersGroup.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading]);

  // Sync Markers
  useEffect(() => {
    if (!mapInstance.current || !markersGroup.current || !window.L) return;

    const L = window.L;
    markersGroup.current.clearLayers();

    sites.forEach(site => {
      const isSelected = site.id === selectedSiteId;
      const markerColor = isSelected ? '#3B82F6' : '#10B981';
      
      const marker = L.marker([site.latitude, site.longitude], {
        icon: L.divIcon({
          className: 'custom-marker-gis',
          html: `<div style="background-color: ${markerColor};" class="w-6 h-6 rounded-full border border-white flex items-center justify-center text-white font-bold text-[9px] shadow-lg transition-all">${site.name.slice(0,2).toUpperCase()}</div>`,
          iconSize: [24, 24]
        })
      });

      marker.on('click', () => {
        setSelectedSiteId(site.id);
        mapInstance.current.setView([site.latitude, site.longitude], 10);
      });

      marker.addTo(markersGroup.current);
    });

    // Fit map to markers bounds if multiple
    if (sites.length > 0) {
      const bounds = L.latLngBounds(sites.map(s => [s.latitude, s.longitude]));
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }, [sites, selectedSiteId]);

  const selectedSite = sites.find(s => s.id === selectedSiteId);
  const details = selectedSite?.details_json ? JSON.parse(selectedSite.details_json) : {};
  const env = details?.environmental || {};
  const infra = details?.infrastructure || {};

  const handleSelectCard = (site) => {
    setSelectedSiteId(site.id);
    if (mapInstance.current) {
      mapInstance.current.setView([site.latitude, site.longitude], 12);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-450">
        <Activity className="w-6 h-6 animate-spin mr-2 text-emerald-400" />
        <span>Loading Geographical Sites Workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Map className="w-5 h-5 text-emerald-400 mr-2" />
            Assigned Locations GIS Viewer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Display and verify vector location details of solar, wind, and hybrid sites.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Interactive Map (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-slate-800/60 bg-[#0f172a]/80 backdrop-blur-md flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center">
                <Compass className="w-4 h-4 mr-1 text-emerald-400 animate-spin-slow" />
                Copernicus Geographical Site Vectors Map
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                Total Sites: {sites.length}
              </span>
            </div>
            
            <div ref={mapRef} className="h-[450px] w-full bg-[#0a0f1d] z-10"></div>
          </div>

          {/* Sited Grid Nodes List */}
          <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-3">
            <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest block">Select Site to Pan</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
              {sites.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectCard(s)}
                  className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                    s.id === selectedSiteId 
                      ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                      : 'bg-slate-900/60 border-slate-850 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="block truncate font-bold">{s.name}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{s.latitude.toFixed(3)}°N, {s.longitude.toFixed(3)}°E</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Site Details Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedSite ? (
            <div className="glass-card border border-slate-800 p-5 space-y-5">
              <div>
                <span className="text-[9px] text-[#0EA5E9] font-black uppercase tracking-widest block">Geospatial Site Details</span>
                <h3 className="text-base font-bold text-slate-100 mt-1">{selectedSite.name}</h3>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Campaign: {selectedSite.project_name}</span>
              </div>

              {/* Geographical Coordinates */}
              <div className="bg-slate-950/50 p-4 border border-slate-900 rounded-2xl grid grid-cols-2 gap-3 text-xs font-semibold text-slate-300">
                <div>
                  <span className="text-[8px] text-slate-550 uppercase tracking-wider block">Latitude</span>
                  <span className="font-mono text-slate-200">{selectedSite.latitude.toFixed(6)}°N</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-555 uppercase tracking-wider block">Longitude</span>
                  <span className="font-mono text-slate-200">{selectedSite.longitude.toFixed(6)}°E</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-555 uppercase tracking-wider block">State</span>
                  <span>{selectedSite.state || 'Rajasthan'}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-555 uppercase tracking-wider block">District</span>
                  <span>{selectedSite.district || 'Jodhpur'}</span>
                </div>
              </div>

              {/* Environmental Constraints parameters */}
              <div className="space-y-3">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">GIS Slope & Environmental Constraints</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-350">
                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                    <span className="text-[8.5px] text-slate-500 uppercase tracking-wider block">Elevation</span>
                    <strong className="text-slate-100 block mt-1">{selectedSite.elevation || 220} m</strong>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                    <span className="text-[8.5px] text-slate-500 uppercase tracking-wider block">Terrain Land Slope</span>
                    <strong className="text-slate-100 block mt-1">{env.land_slope || 2.5}°</strong>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                    <span className="text-[8.5px] text-slate-500 uppercase tracking-wider block">Land Use Classification</span>
                    <strong className="text-slate-100 block mt-1 capitalize">{selectedSite.land_ownership || 'Public BLM Lease'}</strong>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                    <span className="text-[8.5px] text-slate-500 uppercase tracking-wider block">Flood Risk Assessment</span>
                    <strong className="text-slate-100 block mt-1">
                      {env.rainfall > 180 ? 'High Risk' : env.rainfall > 100 ? 'Moderate Risk' : 'Low Risk'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                    <span className="text-[8.5px] text-slate-500 uppercase tracking-wider block">Protected Zone Distance</span>
                    <strong className="text-slate-100 block mt-1">
                      {infra.in_protected_zone ? 'Inside Area (0 km)' : '> 12.5 km'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                    <span className="text-[8.5px] text-slate-500 uppercase tracking-wider block">Airport Buffer Distance</span>
                    <strong className="text-slate-100 block mt-1">{infra.airport_distance || '18.2 km'}</strong>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl col-span-2 flex justify-between items-center">
                    <div>
                      <span className="text-[8.5px] text-slate-500 uppercase tracking-wider block">Water Resource Availability</span>
                      <strong className="text-slate-100 block mt-0.5">{env.rainfall ? `${env.rainfall} mm Rainfall` : 'Moderate'}</strong>
                    </div>
                    <CloudRain className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Weather resource metrics */}
              <div className="space-y-3">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Copernicus Climatological Yields</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[8.5px] text-slate-550 uppercase block">Solar Irradiance (GHI)</span>
                      <span className="text-yellow-500 font-black text-sm block mt-1">{env.solar_irradiance || 215} W/m²</span>
                    </div>
                    <Sun className="w-5 h-5 text-yellow-500 animate-spin-slow" />
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[8.5px] text-slate-550 block">Wind Speed (100m)</span>
                      <span className="text-sky-400 font-black text-sm block mt-1">{env.wind_speed || 6.2} m/s</span>
                    </div>
                    <Wind className="w-5 h-5 text-sky-400" />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card border border-slate-800 p-8 text-center text-slate-550 italic font-bold text-xs">
              No assigned locations sites found.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
