import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { 
  Compass, 
  Search, 
  MapPin, 
  Sun, 
  Wind, 
  TrendingUp, 
  Cpu, 
  AlertCircle, 
  Check, 
  FileText, 
  Layers, 
  Activity, 
  Download, 
  Database,
  ArrowRight,
  Shield,
  HelpCircle,
  Clock,
  DollarSign,
  Cloud,
  Home,
  CheckCircle,
  XCircle,
  Trees,
  RefreshCw,
  History,
  Bell,
  User,
  Moon,
  ChevronRight,
  Calendar,
  Briefcase,
  Layers as LayersIcon,
  HelpCircle as HelpIcon,
  Sparkles,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import 'leaflet/dist/leaflet.css';
import GeoEnergyLogo from '../components/GeoEnergyLogo';

const GLOBAL_PRESETS = [
  { name: "Bhadla Solar Park, India", lat: 27.539, lon: 71.918, zoom: 9 },
  { name: "Mojave Desert Solar, USA", lat: 35.01, lon: -117.55, zoom: 9 },
  { name: "Gansu Wind Farm, China", lat: 40.5, lon: 95.8, zoom: 8 },
  { name: "Hornsdale Wind, Australia", lat: -33.05, lon: 138.6, zoom: 9 },
  { name: "Ouarzazate Solar, Morocco", lat: 30.99, lon: -6.86, zoom: 9 }
];

export default function SelectLocationView({ user, projects, sites = [], onSiteCreated }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const activeMarkerInstance = useRef(null);
  const layersGroup = useRef(null);
  const savedMarkersGroup = useRef(null);

  // States
  const [selectedCoords, setSelectedCoords] = useState({ lat: 27.539, lon: 71.918 }); // Bhadla initially
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Navigation Mode: 'explore' or 'analysis'
  const [mapMode, setMapMode] = useState('explore');

  // Overlay Toggles (for Exploration Mode)
  const [activeOverlays, setActiveOverlays] = useState({
    solar: false,
    wind: false,
    protected: true,
    grid: false,
  });

  // Sizing inputs
  const [siteName, setSiteName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectType, setProjectType] = useState('solar');
  const [landArea, setLandArea] = useState(150);
  const [landOwnership, setLandOwnership] = useState('Public BLM Lease');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Progressive disclosure active tab for analysis output
  const [analysisTab, setAnalysisTab] = useState('summary');

  // Confirmation dialog state
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Milestone 1: UX states for Save Site without project
  const [showNoProjectsModal, setShowNoProjectsModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  
  // Project creation form states
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projCountry, setProjCountry] = useState('');
  const [projRegion, setProjRegion] = useState('');
  const [projType, setProjType] = useState('solar');

  // Saved History State
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('site_analysis_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Loaded Analysis
  const [report, setReport] = useState(null);
  const [spacingOverride, setSpacingOverride] = useState(null);
  const [tiltOverride, setTiltOverride] = useState(null);
  const [setbackOverride, setSetbackOverride] = useState(null);

  useEffect(() => {
    setSpacingOverride(null);
    setTiltOverride(null);
    setSetbackOverride(null);
  }, [report?.latitude, report?.longitude]);

  const [mapReady, setMapReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Mutable settings ref to bypass stale closures
  const activeSettingsRef = useRef({ projectType, landArea, landOwnership });
  
  useEffect(() => {
    activeSettingsRef.current = { projectType, landArea, landOwnership };
  }, [projectType, landArea, landOwnership]);

  // Poll for Leaflet availability
  useEffect(() => {
    if (window.L) {
      setMapReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.L) {
        setMapReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Clear temporary location if user changes selected project
  useEffect(() => {
    setReport(null);
    setSuccessMessage('');
  }, [projectId]);

  // Search places using Nominatim
  const triggerSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&accept-language=en`);
      const data = await response.json();
      setSearchResults(data);
    } catch (e) {
      console.error("Search error", e);
    }
  };

  // Run full coordinate assessment (does NOT save in the DB yet)
  const runAnalysis = async (lat, lon, presetName = null) => {
    setIsAnalyzing(true);
    setReport(null);
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      
      // Pull latest parameters from mutable ref
      const currentParams = activeSettingsRef.current;
      
      const payload = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        project_type: currentParams.projectType,
        land_area: parseFloat(currentParams.landArea),
        land_ownership: currentParams.landOwnership
      };
      
      const res = await axios.post(`/api/analyze-location`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const resData = res.data;
      let details = {};
      if (resData.details_json) {
        try {
          details = typeof resData.details_json === 'string'
            ? JSON.parse(resData.details_json)
            : resData.details_json;
        } catch (pe) {
          details = resData;
        }
      } else {
        details = resData || {};
      }
      
      const reportData = {
        ...details,
        id: null, // Marks it as temporary (not saved yet)
        name: presetName || `Temporary Analysis Node`,
        latitude: resData.latitude,
        longitude: resData.longitude,
        land_area: resData.land_area,
        land_ownership: resData.land_ownership,
        suitability_score: resData.suitability_score,
        suitability_category: resData.suitability_category
      };
      
      setReport(reportData);

      // Persist Selected Location fields for synchronization across views
      const cityName = details.location?.city || details.location?.district || details.city || "Temporary Analysis Node";
      const districtName = details.location?.district || details.location?.city || details.city || "N/A";
      const villageVal = details.location?.village || details.location?.town || details.location?.suburb || details.location?.hamlet || "N/A";
      localStorage.setItem('selected_latitude', resData.latitude.toString());
      localStorage.setItem('selected_longitude', resData.longitude.toString());
      localStorage.setItem('selected_location', presetName || cityName);
      localStorage.setItem('selected_district', districtName);
      localStorage.setItem('selected_state', details.location?.state || details.state || "N/A");
      localStorage.setItem('selected_country', details.location?.country || details.country || "N/A");
      localStorage.setItem('selected_village', villageVal);
      localStorage.setItem('selected_elevation', (details.environmental?.elevation || details.elevation || 0).toString());
      localStorage.setItem('selected_land_area', resData.land_area.toString());

      // Add to analysis history (as unsaved/temporary log)
      setHistory(prev => {
        const item = {
          name: reportData.name,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          score: resData.suitability_score,
          category: resData.suitability_category,
          plant: details.optimization?.recommended_technology,
          timestamp: new Date().toLocaleTimeString(),
          isSaved: false
        };
        const filtered = prev.filter(h => Math.abs(h.lat - lat) > 0.001 || Math.abs(h.lon - lon) > 0.001);
        const updated = [item, ...filtered].slice(0, 10);
        localStorage.setItem('site_analysis_history', JSON.stringify(updated));
        return updated;
      });
      
    } catch (err) {
      console.error(err);
      window.showToast("Analysis failed. Make sure coordinates are valid and backend service is online.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save the site officially to the project
  const handleConfirmSave = async () => {
    if (!projectId) {
      window.showToast("Please select a project before saving.", "warning");
      setShowSaveConfirm(false);
      return;
    }
    setIsAnalyzing(true);
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      const savePayload = {
        name: siteName || `Site (${report.latitude.toFixed(2)}, ${report.longitude.toFixed(2)})`,
        latitude: report.latitude,
        longitude: report.longitude,
        land_area: report.land_area,
        land_ownership: report.land_ownership,
        project_type: projectType
      };
      
      const res = await axios.post(`/api/projects/${projectId}/sites`, savePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const savedData = res.data;
      
      setReport(prev => ({
        ...prev,
        id: savedData.id,
        name: savedData.name
      }));
      
      setHistory(prev => {
        const updated = prev.map(h => {
          if (Math.abs(h.lat - savedData.latitude) < 0.001 && Math.abs(h.lon - savedData.longitude) < 0.001) {
            return { ...h, name: savedData.name, isSaved: true };
          }
          return h;
        });
        localStorage.setItem('site_analysis_history', JSON.stringify(updated));
        return updated;
      });
      
      window.showToast("Site saved successfully.", "success");
      setSuccessMessage("Site saved successfully.");
      setSiteName('');
      if (onSiteCreated) onSiteCreated();
      
      // Return to explorer mode
      setMapMode('explore');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message || "Unknown error occurred.";
      window.showToast(`Failed to save site: ${errMsg}`, "error");
    } finally {
      setIsAnalyzing(false);
      setShowSaveConfirm(false);
    }
  };

  // Milestone 1: Intercept save if projects list is empty
  const handleSaveSiteClick = () => {
    if (projects.length === 0) {
      setShowNoProjectsModal(true);
    } else {
      setShowSaveConfirm(true);
    }
  };

  const handleCreateProjectInline = async (e) => {
    e.preventDefault();
    if (!projName) return;
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/projects', {
        name: projName,
        description: projDesc,
        country: projCountry,
        region: projRegion,
        renewable_type: projType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjectId(res.data.id.toString());
      if (onSiteCreated) onSiteCreated();
      
      setShowAddProjectModal(false);
      setShowSaveConfirm(true);
      
      setProjName('');
      setProjDesc('');
      setProjCountry('');
      setProjRegion('');
      setProjType('solar');
    } catch (err) {
      console.error(err);
      window.showToast("Failed to create project", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapReady || mapInstance.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [selectedCoords.lat, selectedCoords.lon],
      zoom: 6,
      zoomControl: false
    });

    mapInstance.current = map;

    // Dark GIS map tile layers
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layersGroup.current = L.layerGroup().addTo(map);
    savedMarkersGroup.current = L.layerGroup().addTo(map);

    // Map Click Handlers (Fires globally, activates analysis mode)
    map.on('click', (e) => {
      console.log("Leaflet map canvas clicked at:", e.latlng);
      
      const { lat, lng } = e.latlng;
      const roundedLat = parseFloat(lat.toFixed(4));
      const roundedLon = parseFloat(lng.toFixed(4));
      
      // Save coordinates immediately to synchronize views
      localStorage.setItem('selected_latitude', roundedLat.toString());
      localStorage.setItem('selected_longitude', roundedLon.toString());
      localStorage.setItem('selected_location', 'Temporary Analysis Node');
      localStorage.setItem('selected_district', 'N/A');
      localStorage.setItem('selected_state', 'N/A');
      localStorage.setItem('selected_country', 'N/A');
      localStorage.setItem('selected_village', 'N/A');

      setSelectedCoords({ lat: roundedLat, lon: roundedLon });
      
      // Toggle mode state immediately
      setMapMode('analysis');
      
      // Run the calculations
      runAnalysis(roundedLat, roundedLon);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapReady]);

  // Keep track of mapRef dataset mode so Leaflet listener reads correct state
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.dataset.mode = mapMode;
    }
  }, [mapMode]);

  // Redraw overlays and saved location pins when layers state changes
  useEffect(() => {
    if (!window.L || !mapInstance.current) return;
    const L = window.L;

    layersGroup.current.clearLayers();

    // Draw Protected Zones (Red circles)
    if (activeOverlays.protected) {
      const protectedCenters = [
        { lat: 26.8, lon: 70.9, name: "Desert Biosphere Reserve" },
        { lat: 21.1, lon: 70.8, name: "Gir Forest Ecological Reserve" },
        { lat: 11.5, lon: 76.6, name: "Mudumalai Forest Zone" },
        { lat: 33.9, lon: 77.3, name: "Hemis Mountain Reserve" }
      ];

      protectedCenters.forEach(center => {
        L.circle([center.lat, center.lon], {
          color: '#ef4444',
          fillColor: '#f87171',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(layersGroup.current)
          .bindTooltip(center.name, { sticky: true });
      });
    }

    // Draw Mock Grid Lines (Yellow lines)
    if (activeOverlays.grid) {
      const lines = [
        [[8.0, 77.5], [34.0, 77.5]],
        [[22.0, 68.0], [22.0, 88.0]],
        [[27.5, 71.9], [22.0, 72.0]]
      ];

      lines.forEach(pts => {
        L.polyline(pts, {
          color: '#f59e0b',
          weight: 1.5,
          opacity: 0.6,
          dashArray: '5, 8'
        }).addTo(layersGroup.current)
          .bindTooltip("765kV Grid Linkage Line", { sticky: true });
      });
    }

    // Solar overlay (orange grid)
    if (activeOverlays.solar) {
      for (let lat = 10; lat <= 30; lat += 5) {
        for (let lon = 70; lon <= 85; lon += 5) {
          L.rectangle([[lat, lon], [lat + 4.5, lon + 4.5]], {
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.08,
            weight: 0
          }).addTo(layersGroup.current);
        }
      }
    }

    // Wind overlay (blue grid)
    if (activeOverlays.wind) {
      for (let lat = 10; lat <= 30; lat += 5) {
        for (let lon = 70; lon <= 85; lon += 5) {
          L.rectangle([[lat, lon], [lat + 4.5, lon + 4.5]], {
            color: '#0ea5e9',
            fillColor: '#0ea5e9',
            fillOpacity: 0.08,
            weight: 0
          }).addTo(layersGroup.current);
        }
      }
    }
  }, [activeOverlays]);

  // Redraw saved locations pins on the map (Exploration Mode feature)
  useEffect(() => {
    if (!window.L || !mapInstance.current) return;
    const L = window.L;

    savedMarkersGroup.current.clearLayers();

    sites.forEach(s => {
      const pinHtml = `
        <div class="relative">
          <div class="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_8px_#10b981]"></div>
        </div>
      `;

      const marker = L.marker([s.latitude, s.longitude], {
        icon: L.divIcon({
          className: 'saved-pin',
          html: pinHtml,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })
      }).addTo(savedMarkersGroup.current);

      marker.bindPopup(`
        <div style="font-family: sans-serif; color: #f1f5f9; background: #0f172a; padding: 6px; border-radius: 4px; font-size: 10px;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #10b981;">${s.name}</h4>
          <div>Score: <strong>${s.suitability_score}%</strong></div>
          <div>Coords: ${s.latitude.toFixed(2)}°, ${s.longitude.toFixed(2)}°</div>
        </div>
      `);
    });
  }, [sites, mapReady]);

  // Handle active marker placement in analysis mode
  useEffect(() => {
    if (!mapInstance.current || !window.L || mapMode !== 'analysis') return;
    const L = window.L;

    if (activeMarkerInstance.current) {
      mapInstance.current.removeLayer(activeMarkerInstance.current);
    }

    const suitabilityText = report ? `${report.suitability_score}/100 (${report.suitability_category})` : 'Analyzing...';
    const recPlant = report ? report.optimization?.recommended_technology : 'Analyzing...';

    const popupHtml = `
      <div style="font-family: inherit; color: #f1f5f9; background: #0f172a; padding: 8px; border-radius: 6px; font-size: 11px; line-height: 1.4; min-width: 170px;">
        <h4 style="margin: 0 0 5px 0; font-size: 11px; color: #16A34A; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 3px;">
          Target GIS Node
        </h4>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding: 2px 0;">
          <span style="color: #94a3b8;">Latitude:</span>
          <span style="font-weight: bold; font-family: monospace;">${selectedCoords.lat.toFixed(4)}°N</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding: 2px 0;">
          <span style="color: #94a3b8;">Longitude:</span>
          <span style="font-weight: bold; font-family: monospace;">${selectedCoords.lon.toFixed(4)}°E</span>
        </div>
        ${report ? `
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding: 2px 0;">
            <span style="color: #94a3b8;">Score:</span>
            <span style="font-weight: bold; color: #16A34A;">${suitabilityText}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 2px 0;">
            <span style="color: #94a3b8;">Plant:</span>
            <span style="font-weight: bold; color: #0EA5E9;">${recPlant}</span>
          </div>
        ` : `<div style="text-align: center; color: #64748b; font-style: italic; margin-top: 4px;">Analyzing...</div>`}
      </div>
    `;

    const marker = L.marker([selectedCoords.lat, selectedCoords.lon], {
      icon: L.divIcon({
        className: 'bg-[#16A34A] w-4 h-4 rounded-full border-2 border-white shadow-[0_0_12px_#16A34A] animate-ping'
      })
    }).addTo(mapInstance.current)
      .bindPopup(popupHtml, { closeButton: false });

    activeMarkerInstance.current = marker;
    marker.openPopup();
  }, [selectedCoords, report, mapMode]);

  const jumpToLocation = (lat, lon, zoom = 8) => {
    const roundedLat = parseFloat(lat);
    const roundedLon = parseFloat(lon);
    
    // Save coordinates immediately to synchronize views
    localStorage.setItem('selected_latitude', roundedLat.toString());
    localStorage.setItem('selected_longitude', roundedLon.toString());
    localStorage.setItem('selected_location', 'Temporary Analysis Node');
    localStorage.setItem('selected_district', 'N/A');
    localStorage.setItem('selected_state', 'N/A');
    localStorage.setItem('selected_country', 'N/A');
    localStorage.setItem('selected_village', 'N/A');

    setSelectedCoords({ lat: roundedLat, lon: roundedLon });
    if (mapInstance.current) {
      mapInstance.current.setView([roundedLat, roundedLon], zoom);
    }
    setSearchResults([]);
    setSearchQuery('');
    setMapMode('analysis');
    runAnalysis(roundedLat, roundedLon);
  };

  const getSuitabilityIndicator = (cat) => {
    if (cat === "Excellent" || cat === "Very Good" || cat === "Highly Suitable") {
      return <span className="text-emerald-400 font-extrabold flex items-center">🟢 Excellent</span>;
    } else if (cat === "Good" || cat === "Moderate" || cat === "Moderately Suitable") {
      return <span className="text-amber-400 font-extrabold flex items-center">🟡 Moderate</span>;
    } else {
      return <span className="text-rose-400 font-extrabold flex items-center">🔴 Unsuitable</span>;
    }
  };

  // Math datasets for charts
  const getYieldChartData = () => {
    if (!report) return [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const solarForecast = report.solar_prediction?.seasonal_forecast || [];
    const windForecast = report.wind_prediction?.seasonal_forecast || [];
    const tempVal = report.environmental?.temperature || 25;
    
    return months.map((m, idx) => {
      const sYield = (solarForecast[idx]?.energy || 0) / 1000; 
      const wYield = (windForecast[idx]?.energy || 0) / 1000; 
      const tDev = -5.0 * Math.cos(2 * Math.PI * (idx / 11)) + tempVal;
      const rainDev = Math.max(0, 40 * Math.sin(Math.PI * (idx / 11)) * (report.environmental?.rainfall > 200 ? 2 : 0.5));
      
      return {
        month: m,
        SolarYield: Math.round(sYield),
        WindYield: Math.round(wYield),
        TotalYield: Math.round(sYield + wYield),
        Temperature: parseFloat(tDev.toFixed(1)),
        Rainfall: Math.round(rainDev)
      };
    });
  };

  const getDecayChartData = () => {
    if (!report) return [];
    const solarBase = (report.solar_prediction?.expected_energy_output || 0) / 1000;
    const windBase = (report.wind_prediction?.expected_annual_energy || 0) / 1000;
    
    const years = Array.from({ length: 25 }, (_, i) => i + 1);
    return years.map(yr => {
      const sDecay = solarBase * Math.pow(1 - 0.008, yr);
      const wDecay = windBase * Math.pow(1 - 0.004, yr);
      return {
        year: `Yr ${yr}`,
        Solar: Math.round(sDecay),
        Wind: Math.round(wDecay),
        Total: Math.round(sDecay + wDecay)
      };
    });
  };

  const getScoresChartData = () => {
    if (!report || !report.suitability?.scores) return [];
    const s = report.suitability.scores;
    return [
      { name: 'Solar', Score: s.solar },
      { name: 'Wind', Score: s.wind },
      { name: 'Land', Score: s.land },
      { name: 'Weather', Score: s.weather },
      { name: 'Infra', Score: s.infrastructure },
      { name: 'Env', Score: s.environmental },
      { name: 'Econ', Score: s.economic }
    ];
  };

  const getProjectDistributionData = () => {
    return projects.map(p => {
      const pSites = history.filter(h => h.isSaved && h.name.includes(p.name));
      return {
        name: p.name,
        value: pSites.length || 1
      };
    });
  };

  const yieldData = getYieldChartData();
  const decayData = getDecayChartData();
  const scoresData = getScoresChartData();
  const projDistData = getProjectDistributionData();
  const COLORS = ['#16A34A', '#0EA5E9', '#F59E0B', '#818cf8'];

  // Global Sizing KPIs
  const calculateGlobalKPIs = () => {
    const totalP = projects.length;
    const totalS = history.filter(h => h.isSaved).length || 2;
    let solarC = 1;
    let windC = 1;
    let hybridC = 0;
    let totalScore = report?.suitability_score || 85;
    let totalEnergy = report?.optimization?.annual_energy_generation_mwh || 4500;
    let totalCapex = report?.optimization?.economic_estimates?.estimated_capex_million_usd || 12.5;

    return {
      totalProjects: totalP,
      totalSites: totalS,
      solarSites: solarC,
      windSites: windC,
      hybridSites: hybridC,
      suitability: totalScore,
      annualEnergy: totalEnergy,
      capex: totalCapex
    };
  };

  const kpis = calculateGlobalKPIs();

  return (
    <div className="space-y-6 text-slate-100 font-sans selection:bg-[#16A34A]/30">
      
      {/* Top Header */}
      <header className="h-20 border-b border-slate-800/80 bg-[#0f172a]/90 backdrop-blur-md px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
        <GeoEnergyLogo type="full" size="normal" />

        {/* Nominatim address search */}
        <form onSubmit={triggerSearch} className="flex gap-2 relative max-w-sm w-full hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search global country, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-semibold placeholder-slate-600 w-full"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 top-11 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl w-full max-h-60 overflow-y-auto z-[9999] divide-y divide-slate-900">
                {searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => jumpToLocation(res.lat, res.lon)}
                    className="p-2.5 hover:bg-slate-950 cursor-pointer text-[11px] text-slate-300 transition-colors"
                  >
                    <span className="font-bold block truncate">{res.display_name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">Lat: {parseFloat(res.lat).toFixed(4)} | Lon: {parseFloat(res.lon).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            Locate
          </button>
        </form>

        <div className="flex items-center space-x-5">
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F59E0B]"></span>
          </button>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Moon className="w-5 h-5 text-[#0EA5E9]" />
          </button>

          <div className="flex items-center space-x-2.5 border-l border-slate-800 pl-5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#16A34A] to-[#0EA5E9] flex items-center justify-center text-white font-bold text-xs uppercase">
              {user.username.slice(0, 2)}
            </div>
            <div className="hidden xl:block">
              <span className="block text-xs font-extrabold text-slate-200">{user.full_name || user.username}</span>
              <span className="block text-[9px] text-slate-500 capitalize">{user.role} Portal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Map & Preset hotkeys (Col span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Leaflet Map projection wrapper */}
          <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl overflow-hidden glass shadow-2xl space-y-3 p-4">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="flex items-center">
                <MapPin className="w-4 h-4 text-[#16A34A] mr-1" /> 
                {mapMode === 'explore' ? '🌍 Geospatial Explorer Map (Exploration Mode)' : '⚡ Sizing Calculations Map (Click to Assess)'}
              </span>
              <span className="font-mono text-[10px]">{selectedCoords.lat.toFixed(4)}°N, {selectedCoords.lon.toFixed(4)}°E</span>
            </div>
            
            {/* Map Canvas */}
            <div className="relative h-[320px] md:h-[500px] bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden">
              <div ref={mapRef} className="w-full h-full"></div>

              {/* Floating Layers controller (Visible in explore mode) */}
              {mapMode === 'explore' && (
                <div className="absolute top-4 right-4 z-[1000] bg-[#0f172a]/95 border border-slate-800 rounded-xl p-3.5 shadow-2xl w-48 glass text-xs font-semibold space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center">
                    <LayersIcon className="w-3.5 h-3.5 text-[#0EA5E9] mr-1.5" />
                    GIS Layers
                  </span>
                  
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={activeOverlays.solar}
                      onChange={() => setActiveOverlays({ ...activeOverlays, solar: !activeOverlays.solar })}
                      className="rounded bg-slate-950 border-slate-800 text-[#F59E0B] focus:ring-0"
                    />
                    <span>Solar PV Heatmap</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={activeOverlays.wind}
                      onChange={() => setActiveOverlays({ ...activeOverlays, wind: !activeOverlays.wind })}
                      className="rounded bg-slate-950 border-slate-800 text-[#0ea5e9] focus:ring-0"
                    />
                    <span>Wind Velocity Grid</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={activeOverlays.grid}
                      onChange={() => setActiveOverlays({ ...activeOverlays, grid: !activeOverlays.grid })}
                      className="rounded bg-slate-950 border-slate-800 text-[#F59E0B] focus:ring-0"
                    />
                    <span>Transmission Lines</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={activeOverlays.protected}
                      onChange={() => setActiveOverlays({ ...activeOverlays, protected: !activeOverlays.protected })}
                      className="rounded bg-slate-950 border-slate-800 text-rose-500 focus:ring-0"
                    />
                    <span>Protected Reserves</span>
                  </label>
                </div>
              )}
            </div>

            {/* Hotspots */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2 gap-4 text-[10px] font-semibold text-slate-400 border-t border-slate-900">
              <div className="flex items-center space-x-2">
                <span>Hotspots:</span>
                <div className="flex flex-wrap gap-1.5">
                  {GLOBAL_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => jumpToLocation(preset.lat, preset.lon, preset.zoom)}
                      className="px-2 py-0.5 text-[9px] font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded transition-all"
                    >
                      📍 {preset.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seasonal Resource Yield Forecast Matrix */}
          {mapMode === 'analysis' && report && (
            <div className="bg-[#111827]/80 p-5 rounded-2xl border border-slate-800 glass space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Seasonal Resource Yield Forecast Matrix</h4>
                <span className="text-[10px] text-slate-400 font-semibold font-mono">12-Month Siting Forecast</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3 text-right">Solar Yield (MWh)</th>
                      <th className="py-2.5 px-3 text-right">Wind Yield (MWh)</th>
                      <th className="py-2.5 px-3 text-right">Avg Temp (°C)</th>
                      <th className="py-2.5 px-3 text-right">Precipitation (mm)</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {yieldData.map((y, idx) => (
                      <tr key={idx} className="border-b border-slate-900 hover:bg-slate-950/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-100 font-bold">{y.month}</td>
                        <td className="py-2.5 px-3 text-right text-yellow-400 font-mono">{Math.round(y.SolarYield).toLocaleString()} MWh</td>
                        <td className="py-2.5 px-3 text-right text-sky-400 font-mono">{Math.round(y.WindYield).toLocaleString()} MWh</td>
                        <td className="py-2.5 px-3 text-right text-slate-350 font-mono">{y.Temperature.toFixed(1)}°C</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-mono">{y.Rainfall.toFixed(1)} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Mode Split Switcher and Sidebar panels (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Mode toggle header */}
          <div className="bg-[#111827]/80 p-5 border border-slate-800 rounded-2xl glass space-y-3.5">
            <div>
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Geospatial Options</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Toggle map selection states or trigger location feasibility scoring.</p>
            </div>

            {/* Split Switcher */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMapMode('explore');
                  setReport(null);
                }}
                className={`py-2 rounded-xl border text-center transition-all flex items-center justify-center space-x-1.5 ${
                  mapMode === 'explore'
                    ? 'bg-[#0ea5e9]/10 border-[#0ea5e9] text-sky-400'
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Explorer Map</span>
              </button>
              
              <button
                type="button"
                onClick={() => setMapMode('analysis')}
                className={`py-2 rounded-xl border text-center transition-all flex items-center justify-center space-x-1.5 ${
                  mapMode === 'analysis'
                    ? 'bg-[#16A34A]/10 border-[#16A34A] text-emerald-400'
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span>Analyze Site</span>
              </button>
            </div>
          </div>

          {/* EXPLORE MODE PANEL */}
          {mapMode === 'explore' && (
            <div className="bg-[#111827]/80 p-5 border border-slate-800 rounded-2xl glass space-y-4 animate-fade-in">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Geospatial Explorer</span>
                <p className="text-[10.5px] text-slate-400 leading-normal mt-1">
                  This pane acts as a global renewable energy explorer dashboard. Hover over visual overlays, click on saved green site pins to load metadata popups, or search for countries using address inputs.
                </p>
              </div>

              {/* Saved Locations list */}
              <div className="space-y-2 border-t border-slate-900 pt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Saved Site Indexes ({sites.length}):</span>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {sites.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => jumpToLocation(s.latitude, s.longitude, 9)}
                      className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl hover:border-blue-500 transition-all cursor-pointer flex justify-between items-center text-[10.5px] font-semibold"
                    >
                      <div>
                        <span className="text-slate-200 block truncate max-w-[120px]">{s.name}</span>
                        <span className="text-[8.5px] text-slate-500 block font-mono">{s.latitude.toFixed(2)}°, {s.longitude.toFixed(2)}°</span>
                      </div>
                      <span className="text-emerald-400 font-extrabold">{s.suitability_score}%</span>
                    </div>
                  ))}
                  {sites.length === 0 && (
                    <span className="text-[10px] text-slate-600 italic">No saved sites in database.</span>
                  )}
                </div>
              </div>

              {/* Start analysis button */}
              <button
                type="button"
                onClick={() => setMapMode('analysis')}
                className="w-full py-2.5 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1"
              >
                <Compass className="w-4 h-4 mr-1 text-[#F59E0B] animate-spin-slow" />
                <span>Analyze New Location</span>
              </button>
            </div>
          )}

          {/* ANALYSIS MODE SIDEBAR CONFIG */}
          {mapMode === 'analysis' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Stepper Inputs widget */}
              <div className="bg-[#111827]/80 p-5 border border-slate-800 rounded-2xl glass space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
                    <Briefcase className="w-4 h-4 text-[#16A34A] mr-1.5" />
                    Setup Guide Checklist
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Click coordinates on map to analyze resource split parameters.</p>
                </div>

                {/* Stepper */}
                <div className="space-y-3 text-[11px] font-semibold text-slate-400">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${projectId ? 'bg-[#16A34A] text-white' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>1</div>
                    <span>Select active project folder</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px] font-black">2</div>
                    <span>Choose technology preference</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px] font-black">3</div>
                    <span>Define target land size</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${report ? 'bg-[#16A34A] text-white' : 'bg-slate-900 border border-slate-800 text-slate-500 animate-pulse'}`}>4</div>
                    <span>Click coordinates on the world map</span>
                  </div>
                </div>

                {/* Select Target Project */}
                <div className="space-y-1.5 border-t border-slate-900 pt-3">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Project</label>
                  <select
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 text-xs glass-input font-bold"
                  >
                    <option value="">Select Project Folder...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Technology Preference */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Technology Preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['solar', 'wind', 'hybrid'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setProjectType(type)}
                        className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                          projectType === type
                            ? 'bg-[#16A34A]/20 border-[#16A34A] text-emerald-400'
                            : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-850'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizing Area */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Land Size (Ha)</label>
                    <input
                      type="number"
                      value={landArea}
                      onChange={(e) => setLandArea(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full rounded-lg py-1.5 px-3 text-xs glass-input font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Land Model</label>
                    <select
                      value={landOwnership}
                      onChange={(e) => setLandOwnership(e.target.value)}
                      className="w-full rounded-lg py-1.5 px-3 text-xs glass-input font-bold"
                    >
                      <option value="Public BLM Lease">Public BLM Lease</option>
                      <option value="Private Lease">Private Lease</option>
                      <option value="Federal Freehold">Federal Freehold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* REPORT DETAILS PANEL */}
              {isAnalyzing ? (
                <div className="bg-[#111827]/80 border border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center space-y-3 glass animate-pulse">
                  <RefreshCw className="w-8 h-8 text-[#0EA5E9] animate-spin" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Querying GIS Datasets...</span>
                </div>
              ) : report ? (
                <div className="bg-[#111827]/80 p-5 border border-slate-800 rounded-2xl glass space-y-4">
                  
                  {/* Tab selectors */}
                  <div className="grid grid-cols-4 gap-1 border-b border-slate-900 pb-2">
                    {[
                      { id: 'summary', label: 'Summary' },
                      { id: 'sizing', label: 'Sizing' },
                      { id: 'solar', label: 'Solar' },
                      { id: 'wind', label: 'Wind' },
                      { id: 'ml', label: 'AI/ML' },
                      { id: 'econ', label: 'Finance' },
                      { id: 'weather', label: 'Climate' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAnalysisTab(tab.id)}
                        className={`py-1.5 rounded text-[8.5px] font-black uppercase tracking-wider text-center border transition-all ${
                          analysisTab === tab.id
                            ? 'bg-[#16A34A]/20 border-[#16A34A] text-emerald-400'
                            : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Summary tab */}
                  {/* Summary tab - Site Feasibility Report */}
                  {analysisTab === 'summary' && (
                    <div className="space-y-4 animate-fade-in text-xs font-semibold text-slate-300">
                      
                      {/* Siting Header */}
                      <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Feasibility Study Node</span>
                          <span className="text-sm font-black text-slate-100 block truncate max-w-[170px]">
                            {report.location?.district || report.location?.state || 'Global Coordinates'}
                          </span>
                          <span className="text-[9.5px] text-slate-500 block font-mono mt-0.5">{report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-emerald-400 block">{report.suitability_score}%</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black">{report.suitability_category}</span>
                        </div>
                      </div>

                      {/* 1. Location Details */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Location Details</span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-3 border border-slate-900 rounded-xl">
                          <div className="flex justify-between"><span className="text-slate-500">Latitude:</span><span className="text-slate-200 font-mono">{report.latitude.toFixed(4)}°</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Longitude:</span><span className="text-slate-200 font-mono">{report.longitude.toFixed(4)}°</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">District:</span><span className="text-slate-200 truncate max-w-[70px]">{report.location?.district || "N/A"}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">State:</span><span className="text-slate-200 truncate max-w-[70px]">{report.location?.state || "N/A"}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Country:</span><span className="text-slate-200 truncate max-w-[70px]">{report.location?.country || "India"}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Elevation:</span><span className="text-slate-250 font-mono">{report.environmental?.elevation || 220} m</span></div>
                        </div>
                      </div>

                      {/* 2. Environmental Information */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Environmental Constraints</span>
                        <div className="grid grid-cols-1 gap-1.5 bg-slate-950/40 p-3 border border-slate-900 rounded-xl text-[10.5px]">
                          <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Land Classification:</span><span className="text-slate-200">{report.environmental?.land_cover || "Sandy Desert / Scrub"}</span></div>
                          <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Terrain Type:</span><span className="text-slate-200">{report.environmental?.terrain_type || "Flat Plain"}</span></div>
                          <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Soil Condition:</span><span className="text-slate-200">{report.environmental?.land_cover?.includes("Desert") ? "Arid Sandy (Low Bearing)" : "Clay Loam"}</span></div>
                          <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Nearby Water Bodies:</span><span className="text-slate-200">{report.infrastructure?.near_water_bodies ? "Yes (Proximity Alert)" : "No (Clear)"}</span></div>
                          <div className="flex justify-between border-b border-slate-900/60 pb-1"><span className="text-slate-500">Protected Forest:</span><span className={`font-bold ${report.infrastructure?.in_protected_zone ? 'text-rose-400' : 'text-emerald-400'}`}>{report.infrastructure?.in_protected_zone ? "Restricted (Forest Zone)" : "Safe (Outside)"}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Airport Restriction:</span><span className={`font-bold ${(report.infrastructure?.distance_to_airport || 20) < 15.0 ? 'text-rose-400' : 'text-emerald-400'}`}>{(report.infrastructure?.distance_to_airport || 20) < 15.0 ? "Restricted (Airport Buffer)" : "Safe (Clear)"}</span></div>
                        </div>
                      </div>

                      {/* 3. Weather Information */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest block">Meteorological Weather</span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-3 border border-slate-900 rounded-xl">
                          <div className="flex justify-between"><span className="text-slate-500">Temp:</span><span className="text-slate-200 font-mono">{report.environmental?.temperature}°C</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Humidity:</span><span className="text-slate-200 font-mono">{report.environmental?.humidity || 22}%</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Pressure:</span><span className="text-slate-250 font-mono">{report.environmental?.pressure || 1008} hPa</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Wind Speed:</span><span className="text-slate-200 font-mono">{report.wind_prediction?.average_wind_speed || 3.8} m/s</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Wind Dir:</span><span className="text-slate-200 font-mono">{report.environmental?.wind_direction || 240}°</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Cloud Cover:</span><span className="text-slate-250 font-mono">{report.environmental?.cloud_cover || 12}%</span></div>
                          <div className="flex justify-between"><span className="text-slate-200 font-mono">Rainfall:</span><span className="text-slate-200 font-mono">{report.environmental?.rainfall || 0} mm</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Condition:</span><span className="text-emerald-400 truncate max-w-[65px]">{(report.environmental?.cloud_cover || 12) < 25 ? "Clear Sunny" : "Partly Cloudy"}</span></div>
                        </div>
                      </div>

                      {/* 4. Solar Information */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest block">Solar Radiation Potential</span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-3 border border-slate-900 rounded-xl">
                          <div className="flex justify-between"><span className="text-slate-500">Irradiance GHI:</span><span className="text-yellow-400 font-mono">{report.environmental?.solar_irradiance || 5.2}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Peak Sun Hrs:</span><span className="text-slate-200 font-mono">{report.environmental?.solar_irradiance || 5.2} hrs</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Solar Score:</span><span className="text-yellow-400 font-bold">{report.suitability?.scores?.solar || 82}%</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Est. Annual Energy:</span><span className="text-emerald-400 font-mono font-bold truncate max-w-[70px]">{Math.round(report.solar_prediction?.expected_energy_output || 1680000).toLocaleString()} kWh</span></div>
                        </div>
                      </div>

                      {/* 5. Wind Information */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest block">Wind Energy Potential</span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-3 border border-slate-900 rounded-xl">
                          <div className="flex justify-between"><span className="text-slate-500">Avg Velocity:</span><span className="text-sky-400 font-mono">{report.wind_prediction?.average_wind_speed || 3.8} m/s</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Power Density:</span><span className="text-slate-200 font-mono">{report.wind_prediction?.wind_power_density || 280} W/m²</span></div>
                          <div className="flex justify-between" style={{ gridColumn: 'span 2' }}><span className="text-slate-500">Wind Siting Score / Suitability:</span><span className="text-sky-400 font-bold">{report.suitability?.scores?.wind || 45}% Suitability</span></div>
                        </div>
                      </div>

                      {/* Final Recommendation Rationale */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 space-y-1">
                        <span className="text-[9px] font-black text-[#16A34A] uppercase tracking-widest block">Feasibility Recommendation</span>
                        <p className="text-[10px] text-slate-350 leading-relaxed font-bold">
                          "{report.optimization?.reasoning || 'Recommended for utility-scale deployment.'}"
                        </p>
                      </div>

                    </div>
                  )}

                  {/* Sizing Tab */}
                  {analysisTab === 'sizing' && (
                    <div className="space-y-3 animate-fade-in text-xs font-semibold text-slate-300">
                      <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider block">Dynamic Plant Design Layout</span>
                      
                      {/* Sliders override controls */}
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl space-y-3 text-[10px]">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-500">Row Spacing Corridor:</span>
                            <span className="text-sky-400 font-mono font-bold">
                              {spacingOverride !== null ? spacingOverride : (report.solar_prediction?.row_spacing || 4.5)} m
                            </span>
                          </div>
                          <input
                            type="range"
                            min="2.0"
                            max="8.0"
                            step="0.1"
                            value={spacingOverride !== null ? spacingOverride : (report.solar_prediction?.row_spacing || 4.5)}
                            onChange={(e) => setSpacingOverride(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-sky-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-500">Optimal Tilt Angle:</span>
                            <span className="text-emerald-400 font-mono font-bold">
                              {tiltOverride !== null ? tiltOverride : (report.solar_prediction?.tilt_angle || 15)}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="45"
                            step="1"
                            value={tiltOverride !== null ? tiltOverride : (report.solar_prediction?.tilt_angle || 15)}
                            onChange={(e) => setTiltOverride(parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-500">Setbacks & Safety Buffer:</span>
                            <span className="text-amber-500 font-mono font-bold">
                              {setbackOverride !== null ? setbackOverride : Math.round((1 - (report.solar_prediction?.usable_area_hectares || report.land_area * 0.8) / report.land_area) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            step="1"
                            value={setbackOverride !== null ? setbackOverride : Math.round((1 - (report.solar_prediction?.usable_area_hectares || report.land_area * 0.8) / report.land_area) * 100)}
                            onChange={(e) => setSetbackOverride(parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                      </div>

                      {/* Dynamic design values */}
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 space-y-2 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Available Land Area:</span>
                          <span className="text-slate-200">{report.land_area} Ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Usable Footprint:</span>
                          <span className="text-slate-200">
                            {spacingOverride === null && setbackOverride === null ? (report.solar_prediction?.usable_area_hectares || report.land_area * 0.8) : (report.land_area * (1 - (setbackOverride !== null ? setbackOverride : 20) / 100)).toFixed(2)} Ha
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Installed Modules Count:</span>
                          <span className="text-emerald-400 font-bold">
                            {spacingOverride === null && setbackOverride === null ? report.solar_prediction?.estimated_number_of_panels : Math.floor((report.land_area * (1 - (setbackOverride !== null ? setbackOverride : 20) / 100) * 10000) / (2.2 * 1.1 + (spacingOverride !== null ? spacingOverride : 4.5) * 1.1))} Panels
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Peak Sized Generation Capacity:</span>
                          <span className="text-[#0EA5E9] font-black">
                            {spacingOverride === null && setbackOverride === null ? report.optimization?.recommended_capacity_mw : (Math.floor((report.land_area * (1 - (setbackOverride !== null ? setbackOverride : 20) / 100) * 10000) / (2.2 * 1.1 + (spacingOverride !== null ? spacingOverride : 4.5) * 1.1)) * 0.55 / 1000).toFixed(2)} MW
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Orientation Direction:</span>
                          <span className="text-slate-200 font-mono">{report.solar_prediction?.orientation || (report.latitude >= 0 ? "South Facing" : "North Facing")}</span>
                        </div>
                      </div>

                      {/* Engineering Formulas drawer */}
                      <details className="mt-2 text-[9px] border border-slate-900 bg-slate-950/40 rounded-lg p-2 font-mono text-slate-500">
                        <summary className="cursor-pointer font-bold select-none text-slate-400">View Layout Formulas</summary>
                        <div className="mt-1.5 space-y-1.5 text-slate-400">
                          <div><strong>Usable Area:</strong> <span className="text-sky-300">A_usable = A_total * (1 - Setbacks)</span></div>
                          <div><strong>Row Spacing:</strong> <span className="text-sky-300">S = H * (cos(theta) + sin(theta)/tan(alpha_solstice))</span></div>
                          <div><strong>Installed Capacity:</strong> <span className="text-sky-300">P_DC = N_modules * 550W</span></div>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Solar Tab */}
                  {analysisTab === 'solar' && (
                    <div className="space-y-3 animate-fade-in text-xs font-semibold text-slate-300">
                      <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-wider block">Solar Resource Physics Model</span>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 space-y-2 text-[10px]">
                        <div className="flex justify-between"><span className="text-slate-500">Global Horizontal Irradiance (GHI):</span><span className="text-slate-200 font-mono">{report.environmental?.solar_irradiance} kWh/m²/day</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Direct Normal Irradiance (DNI):</span><span className="text-slate-200 font-mono">{report.environmental?.dni || 'N/A'} kWh/m²/day</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Diffuse Horizontal Irradiance (DHI):</span><span className="text-slate-200 font-mono">{report.environmental?.dhi || 'N/A'} kWh/m²/day</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Clearness index:</span><span className="text-slate-200 font-mono">{(1.0 - (report.environmental?.cloud_cover / 100) * 0.7).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Peak Sun Hours (PSH):</span><span className="text-slate-200 font-mono">{report.solar_prediction?.peak_sun_hours} hrs/day</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Performance Ratio (PR):</span><span className="text-[#10B981] font-bold">{report.solar_prediction?.performance_ratio}%</span></div>
                        <div className="flex justify-between border-t border-slate-900 pt-1.5"><span className="text-slate-500">Expected Annual Energy:</span><span className="text-yellow-400 font-mono font-bold">{(report.solar_prediction?.expected_energy_output / 1000).toFixed(1)} MWh</span></div>
                      </div>

                      {/* Technical Losses breakdown */}
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Estimated System Losses</span>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 space-y-1.5 text-[10px]">
                        <div className="flex justify-between"><span className="text-slate-500">Temperature cell loss:</span><span className="text-rose-400 font-mono">-{report.solar_prediction?.temp_loss || 4.2}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Soiling / Dust loss:</span><span className="text-amber-500 font-mono">-{report.solar_prediction?.dust_loss || 3.1}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Atmospheric Shading loss:</span><span className="text-amber-500 font-mono">-{report.solar_prediction?.shading_loss || 1.8}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Wiring mismatch loss:</span><span className="text-slate-400 font-mono">-3.0%</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Inverter loss:</span><span className="text-slate-400 font-mono">-2.0%</span></div>
                      </div>

                      <details className="mt-2 text-[9px] border border-slate-900 bg-slate-950/40 rounded-lg p-2 font-mono text-slate-500">
                        <summary className="cursor-pointer font-bold select-none text-slate-400">View Physics Formulas</summary>
                        <div className="mt-1.5 space-y-1.5 text-slate-400">
                          <div><strong>Cell Temperature:</strong> <span className="text-sky-300">T_cell = T_amb + GHI * ((NOCT - 20) / 800)</span></div>
                          <div><strong>Temperature Loss:</strong> <span className="text-sky-300">L_T = max(0, T_cell - 25) * 0.38%</span></div>
                          <div><strong>Annual Energy:</strong> <span className="text-sky-300">E = P_DC * PSH * 365 * PR</span></div>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Wind Tab */}
                  {analysisTab === 'wind' && (
                    <div className="space-y-3 animate-fade-in text-xs font-semibold text-slate-350">
                      <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider block">Aerodynamic Wind Potential</span>
                      
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 space-y-2 text-[10px] text-slate-300">
                        <div className="flex justify-between"><span className="text-slate-500">Turbine Hub Height:</span><span className="text-slate-200 font-mono">{report.wind_prediction?.recommended_turbine_height} m</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Rotor Diameter / Area:</span><span className="text-slate-200 font-mono">{report.wind_prediction?.rotor_diameter}m / {report.wind_prediction?.rotor_area} m²</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Wind Power Density (WPD):</span><span className="text-slate-200 font-mono">{report.wind_prediction?.wind_power_density} W/m²</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Turbulence Intensity:</span><span className="text-rose-400 font-mono">{report.wind_prediction?.turbulence_intensity}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Turbine Model:</span><span className="text-sky-400 font-mono font-bold truncate max-w-[150px]">{report.wind_prediction?.recommended_turbine_model}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Capacity Factor (CF):</span><span className="text-emerald-400 font-bold">{report.wind_prediction?.capacity_factor}%</span></div>
                        <div className="flex justify-between border-t border-slate-900 pt-1.5"><span className="text-slate-500">Expected Annual Energy:</span><span className="text-sky-400 font-mono font-bold">{(report.wind_prediction?.expected_annual_energy / 1000).toFixed(1)} MWh</span></div>
                      </div>

                      {/* Speed bounds */}
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Turbine Cut-In / Rated / Cut-Out Speeds</span>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 flex justify-between text-[10px] text-slate-300">
                        <div className="text-center"><span className="text-slate-500 block">Cut-In</span><span className="font-mono font-bold">{report.wind_prediction?.cut_in_speed || 3.0} m/s</span></div>
                        <div className="text-center"><span className="text-slate-500 block">Rated</span><span className="font-mono font-bold text-sky-400">{report.wind_prediction?.rated_speed || 11.5} m/s</span></div>
                        <div className="text-center"><span className="text-slate-500 block">Cut-Out</span><span className="font-mono font-bold text-rose-400">{report.wind_prediction?.cut_out_speed || 25.0} m/s</span></div>
                      </div>

                      <details className="mt-2 text-[9px] border border-slate-900 bg-slate-950/40 rounded-lg p-2 font-mono text-slate-500">
                        <summary className="cursor-pointer font-bold select-none text-slate-400">View Wind Formulas</summary>
                        <div className="mt-1.5 space-y-1.5 text-slate-400">
                          <div><strong>Wind Shear:</strong> <span className="text-sky-300">V_hub = V_10m * (H_hub / 10)^alpha</span></div>
                          <div><strong>Wind Power Density:</strong> <span className="text-sky-300">WPD = 0.5 * rho * V_hub^3</span></div>
                          <div><strong>Rotor Area:</strong> <span className="text-sky-300">A = pi * (D / 2)^2</span></div>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* AI & Explainability Tab */}
                  {analysisTab === 'ml' && (
                    <div className="space-y-3 animate-fade-in text-xs font-semibold text-slate-350">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Explainable AI (SHAP Feature Attributions)</span>
                      
                      {/* SHAP Explanations list */}
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 space-y-1 text-[10px] text-slate-300 leading-relaxed font-bold">
                        {report.ml_predictions?.explanations?.slice(0, 5).map((exp, idx) => (
                          <div key={idx} className="flex items-start space-x-1">
                            <span className={exp.includes("increased") ? "text-emerald-400" : "text-rose-400"}>•</span>
                            <span>{exp}</span>
                          </div>
                        ))}
                      </div>

                      {/* Multi-model comparative table */}
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Machine Learning Algorithm Comparison</span>
                      <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/50">
                        <table className="w-full text-left border-collapse text-[10px] text-slate-300">
                          <thead>
                            <tr className="bg-slate-900 text-slate-450 uppercase text-[8px] tracking-wider border-b border-slate-900">
                              <th className="p-2">Model</th>
                              <th className="p-2 text-center">Score</th>
                              <th className="p-2 text-center">Gen (MWh)</th>
                              <th className="p-2 text-center">ROI (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.ml_predictions?.comparisons && Object.entries(report.ml_predictions.comparisons).map(([name, metrics]) => (
                              <tr key={name} className={`border-b border-slate-900/40 ${report.ml_predictions.active_model === name ? "bg-indigo-500/10 font-bold" : ""}`}>
                                <td className="p-2">{name}</td>
                                <td className="p-2 text-center font-mono">{metrics.suitability}%</td>
                                <td className="p-2 text-center font-mono">{Math.round(metrics.annual_energy_mwh)}</td>
                                <td className="p-2 text-center font-mono text-emerald-400">{metrics.roi_percent}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="text-[9px] text-slate-500 italic text-center">
                        Active model selection: <span className="text-indigo-400 font-bold">{report.ml_predictions?.active_model || 'Random Forest'}</span>
                      </div>
                    </div>
                  )}

                  {/* Financials Tab */}
                  {analysisTab === 'econ' && (
                    <div className="space-y-3 animate-fade-in text-xs font-semibold text-slate-350">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Financial NPV, IRR, and LCOE Model</span>
                      
                      {/* Financial Metrics Cards */}
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 space-y-2 text-[10px] text-slate-300">
                        <div className="flex justify-between"><span className="text-slate-500">Capital Expenditure (CAPEX):</span><span className="text-slate-200 font-mono font-bold">${report.optimization?.economic_estimates?.estimated_capex_million_usd}M</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Operation & Maintenance (OPEX):</span><span className="text-slate-200 font-mono">${report.optimization?.economic_estimates?.estimated_opex_million_usd_year}M / year</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Levelized Cost of Energy (LCOE):</span><span className="text-yellow-400 font-mono font-bold">${report.optimization?.economic_estimates?.lcoe_dollar_kwh || '0.045'}/kWh</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Net Present Value (NPV @8%):</span><span className="text-emerald-400 font-mono font-bold">${report.optimization?.economic_estimates?.npv_million_usd || '2.4'}M</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Internal Rate of Return (IRR):</span><span className="text-[#0EA5E9] font-mono font-black">{report.optimization?.economic_estimates?.irr_percent || '12.5'}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Project Payback Period:</span><span className="text-slate-200 font-mono">{report.optimization?.economic_estimates?.payback_years} Years</span></div>
                        <div className="flex justify-between border-t border-slate-900 pt-1.5"><span className="text-slate-500">Projected 25-Year Cumulative Revenue:</span><span className="text-emerald-400 font-mono font-bold">${report.optimization?.economic_estimates?.revenue_25yr_million_usd || '45.8'}M</span></div>
                      </div>

                      <details className="mt-2 text-[9px] border border-slate-900 bg-slate-950/40 rounded-lg p-2 font-mono text-slate-500">
                        <summary className="cursor-pointer font-bold select-none text-slate-400">View Investment Formulas</summary>
                        <div className="mt-1.5 space-y-1.5 text-slate-400">
                          <div><strong>NPV:</strong> <span className="text-sky-300">NPV = -CAPEX + Sum_t=1..25 (CF_t / (1 + r)^t)</span></div>
                          <div><strong>LCOE:</strong> <span className="text-sky-300">LCOE = (CAPEX + Sum (OPEX_t/(1+r)^t)) / Sum (E_t/(1+r)^t)</span></div>
                          <div><strong>IRR:</strong> <span className="text-sky-300">Discount rate r where NPV = 0</span></div>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Weather Tab */}
                  {analysisTab === 'weather' && (
                    <div className="space-y-3 animate-fade-in text-xs font-semibold text-slate-350">
                      <span className="text-[9px] font-bold text-[#0EA5E9] uppercase tracking-wider block">Climate Parameters</span>
                      <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-900 space-y-2 text-[10px] text-slate-300">
                        <div className="flex justify-between"><span className="text-slate-500">Temperature</span><span className="text-slate-200 font-mono">{report.environmental?.temperature}°C</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Relative Humidity</span><span className="text-slate-200 font-mono">{report.environmental?.humidity}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Barometric Pressure</span><span className="text-slate-200 font-mono">{report.environmental?.pressure} hPa</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Annual Rainfall</span><span className="text-slate-200 font-mono">{report.environmental?.rainfall} mm</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Cloud Cover</span><span className="text-slate-200 font-mono">{report.environmental?.cloud_cover}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Average Hub Wind Speed</span><span className="text-slate-200 font-mono">{report.wind_prediction?.average_wind_speed} m/s</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Topography Aspect:</span><span className="text-slate-200 font-mono">{report.environmental?.aspect || 180}° (Facing South)</span></div>
                      </div>
                    </div>
                  )}

                  {/* Actions Block */}
                  <div className="border-t border-slate-900 pt-3.5 space-y-2">
                    <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest block mb-1">What would you like to do?</span>
                    
                    <input
                      type="text"
                      placeholder="Enter site location name..."
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full rounded-lg py-1.5 px-3 text-xs glass-input font-bold placeholder-slate-700 mb-2"
                    />
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveSiteClick}
                        className="flex-1 py-2 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow animate-pulse"
                      >
                        Save Site to Project
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReport(null);
                          setSelectedCoords({ lat: 27.539, lon: 71.918 });
                        }}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-bold transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-[#111827]/80 p-5 border border-slate-855 rounded-2xl glass text-center text-slate-500 italic text-[11px] flex flex-col items-center justify-center py-10 space-y-2">
                  <MapPin className="w-5 h-5 text-emerald-400 animate-bounce" />
                  <span>Click anywhere on the world map grid to trigger AI Siting algorithms.</span>
                </div>
              )}

              {/* Exit Analysis Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMapMode('explore');
                  setReport(null);
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-405 hover:text-slate-205 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span>Exit Analysis Mode</span>
              </button>

            </div>
          )}

        </div>

      </div>

      {/* CONFIRMATION SAVE SITE DIALOG MODAL */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-[#070a13]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full glass space-y-4">
            <div className="flex items-center space-x-2 text-[#16A34A]">
              <Shield className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Save Site location</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Do you want to save this analyzed location to the selected project? This will create a persistent entry in database.
            </p>
            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveConfirm(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white rounded-lg text-xs font-bold transition-all shadow"
              >
                Save Site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone 1 UX: NO PROJECTS FOUND DIALOG */}
      {showNoProjectsModal && (
        <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full glass space-y-4 text-center text-xs">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">No projects found.</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              You must initialize a project portfolio directory before saving site locations. Would you like to create one now?
            </p>
            <div className="flex justify-center space-x-2.5 pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowNoProjectsModal(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNoProjectsModal(false);
                  setShowAddProjectModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white rounded-lg transition-all shadow"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone 1 UX: INLINE CREATE PROJECT MODAL */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full glass space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center">
                <FolderPlus className="w-4 h-4 mr-1.5 text-[#16A34A]" />
                Create Project Directory
              </h3>
              <button onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCreateProjectInline} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Desert Solar Phase I"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Renewable Type</label>
                  <select
                    value={projType}
                    onChange={(e) => setProjType(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                  >
                    <option value="solar">Solar PV</option>
                    <option value="wind">Wind Farm</option>
                    <option value="hybrid">Hybrid Solar + Wind</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={projCountry}
                    onChange={(e) => setProjCountry(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajasthan"
                    value={projRegion}
                    onChange={(e) => setProjRegion(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Description</label>
                <textarea
                  rows="3"
                  placeholder="Summarize project scope details..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-semibold placeholder-slate-700"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white rounded-lg font-bold transition-all shadow"
              >
                Create Project & Save Site
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
