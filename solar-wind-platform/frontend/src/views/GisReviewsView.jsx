import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Layers, 
  Check, 
  AlertTriangle, 
  Search,
  Eye,
  RefreshCw,
  Compass,
  CheckCircle,
  Briefcase,
  Activity,
  FileText,
  MapPin,
  Map
} from 'lucide-react';
import WorkflowVisualization from '../components/WorkflowVisualization';

export default function GisReviewsView({ user, projects: parentProjects, onRefreshData }) {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [gisComments, setGisComments] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState([]);
  
  // Interactive Validation Checklist Checklist
  const [validationChecks, setValidationChecks] = useState({
    coordinates: false,
    terrain: false,
    waterBodies: false,
    protectedAreas: false,
    airportBuffer: false,
    floodRisk: false
  });

  const fetchReviewsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [projRes, sitesRes, usersRes] = await Promise.all([
        axios.get('/api/gis/reviews', { headers }),
        axios.get('/api/gis/sites', { headers }),
        axios.get('/api/users/assignable', { headers })
      ]);
      
      setProjects(projRes.data);
      setSites(sitesRes.data);
      setUsersList(usersRes.data);
      
      // Auto-select first project if available
      if (projRes.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projRes.data[0].id.toString());
      }
    } catch (e) {
      console.error("Failed to load GIS reviews view data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, [parentProjects]);

  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);

  // Reset checklist when switching projects
  useEffect(() => {
    setValidationChecks({
      coordinates: false,
      terrain: false,
      waterBodies: false,
      protectedAreas: false,
      airportBuffer: false,
      floodRisk: false
    });
    if (selectedProject) {
      setGisComments(selectedProject.gis_comments || '');
    }
  }, [selectedProjectId]);

  const handleGisReview = async (action) => {
    if (!selectedProjectId) return;
    
    // Ensure validations are complete before approving
    if (action === 'approve') {
      const incomplete = Object.entries(validationChecks).filter(([_, val]) => !val);
      if (incomplete.length > 0) {
        window.showToast(`Please perform all validation checks first. Remaining: ${incomplete.map(([k]) => k.replace(/([A-Z])/g, ' $1')).join(', ')}`, "warning");
        return;
      }
    }

    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/projects/${selectedProjectId}/gis-review`,
        { action, gis_comments: gisComments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      window.showToast(`GIS review successfully ${action === 'approve' ? 'approved' : 'rejected'}!`, "success");
      setSelectedProjectId('');
      fetchReviewsData();
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error("GIS review action failed", e);
      const errMsg = e.response?.data?.detail || "Action failed. Please try again.";
      window.showToast(errMsg, "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSaveCommentsOnly = async () => {
    if (!selectedProjectId) return;
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      // Using standard update API to save comments
      await axios.put(
        `/api/projects/${selectedProjectId}`,
        { gis_comments: gisComments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.showToast("GIS comments saved successfully!", "success");
      fetchReviewsData();
    } catch (e) {
      console.error("Failed to save comments only", e);
      window.showToast("Failed to save comments.", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.owner_name && p.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-450">
        <Activity className="w-6 h-6 animate-spin mr-2 text-emerald-400" />
        <span>Loading GIS Validation Queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Briefcase className="w-5 h-5 text-emerald-400 mr-2" />
            GIS Reviews Validation Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze coordinates, terrain slopes, protected buffers, and hydrological flood risk criteria.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-semibold placeholder-slate-650 w-64 text-slate-200"
          />
        </div>
      </div>

      {/* Review Queue Summary Table */}
      <div className="glass-card border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
          <FileText className="w-4 h-4 mr-1.5 text-blue-500" />
          Campaign Reviews Queue ({filteredProjects.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-2">Project Name</th>
                <th className="py-3 px-2">Planner</th>
                <th className="py-3 px-2">Submission Date</th>
                <th className="py-3 px-2">Coordinates Sited</th>
                <th className="py-3 px-2">Current Status</th>
                <th className="py-3 px-2">GIS Comments</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-350">
              {filteredProjects.map((p) => {
                const projectSites = sites.filter(s => Number(s.project_id) === Number(p.id));
                return (
                  <tr key={p.id} className={`hover:bg-slate-800/20 transition-colors ${Number(selectedProjectId) === Number(p.id) ? 'bg-slate-800/30' : ''}`}>
                    <td className="py-3 px-2 text-slate-100 font-bold">{p.name}</td>
                    <td className="py-3 px-2">{p.owner_name || 'System Planner'}</td>
                    <td className="py-3 px-2">{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3 px-2 font-mono text-[10.5px] text-emerald-450">{projectSites.length} Nodes Sited</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-500 font-bold">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 max-w-[200px] truncate text-slate-500 italic">
                      {p.gis_comments || 'No comments'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setSelectedProjectId(p.id.toString())}
                        className="px-3 py-1 bg-blue-600/80 hover:bg-blue-600 text-white font-bold rounded text-[10.5px] transition-all flex items-center justify-center space-x-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open Review</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-550 italic font-bold">
                    No active campaign reviews found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Workspace Panel */}
      {selectedProject ? (() => {
        const projectSites = sites.filter(s => Number(s.project_id) === Number(selectedProject.id));
        const mainSite = projectSites[0];
        let siteDetails = null;
        if (mainSite && mainSite.details_json) {
          try {
            siteDetails = JSON.parse(mainSite.details_json);
          } catch (e) {
            console.error(e);
          }
        }

        const floodRisk = siteDetails?.environmental?.rainfall > 180 ? 'High Risk' : siteDetails?.environmental?.rainfall > 100 ? 'Moderate Risk' : 'Low Risk';
        const floodColor = floodRisk === 'High Risk' ? 'text-rose-400 bg-rose-500/10' : floodRisk === 'Moderate Risk' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-450 bg-emerald-500/10';

        return (
          <div className="glass-card border border-slate-800 p-5 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
                <Layers className="w-4.5 h-4.5 mr-1.5 text-blue-500" />
                GIS Validation Workspace: {selectedProject.name}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Summary and Vector Map contours (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Project Summary */}
                <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl grid grid-cols-2 gap-3 text-xs font-semibold">
                  <div className="col-span-2">
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Project Scope</span>
                    <strong className="text-slate-100 text-sm block mt-0.5">{selectedProject.name}</strong>
                    <p className="text-slate-400 font-normal mt-1 leading-normal">{selectedProject.description || 'No description provided.'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Planner Name</span>
                    <span className="text-slate-300">{selectedProject.owner_name || 'System Planner'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Submission Date</span>
                    <span className="text-slate-300">{selectedProject.submitted_at ? new Date(selectedProject.submitted_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Project Status</span>
                    <span className="text-yellow-500 font-bold uppercase">{selectedProject.status}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Country / Region</span>
                    <span className="text-slate-300">{selectedProject.country || 'Global'}, {selectedProject.region || 'Global Grid'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Renewable Asset Class</span>
                    <span className="text-[#0EA5E9] font-bold capitalize">{selectedProject.renewable_type}</span>
                  </div>
                </div>

                {/* Sited Coordinates List */}
                <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Planner Coordinates List</span>
                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                    {projectSites.map(s => (
                      <div key={s.id} className="flex justify-between items-center text-xs font-semibold p-2 bg-slate-900/60 rounded border border-slate-850">
                        <span className="text-slate-200">{s.name}</span>
                        <span className="font-mono text-slate-400 text-[10.5px]">{s.latitude.toFixed(4)}°N, {s.longitude.toFixed(4)}°E</span>
                      </div>
                    ))}
                    {projectSites.length === 0 && (
                      <span className="text-xs text-slate-500 italic">No coordinates sited yet.</span>
                    )}
                  </div>
                </div>

                {/* Contours Preview */}
                <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Geospatial Vector Map Preview</span>
                  <div className="h-44 rounded-xl border border-slate-800 bg-[#070a13] relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute top-1/4 left-1/3 w-32 h-32 rounded-full border border-slate-800 opacity-20"></div>
                    
                    {projectSites.map((s, index) => {
                      const topPercent = 30 + (index * 20) % 50;
                      const leftPercent = 25 + (index * 25) % 60;
                      return (
                        <div key={s.id} className="absolute flex flex-col items-center group cursor-pointer" style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}>
                          <span className="w-3 h-3 rounded-full bg-[#10B981] border border-white flex items-center justify-center text-[7px] font-black text-white shadow shadow-emerald-500/50 animate-bounce">
                            {index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Validation Checks & Action controls (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950/30 border border-slate-900 p-5 rounded-2xl space-y-6">
                
                {/* Workflow Visualization */}
                <WorkflowVisualization project={selectedProject} usersList={usersList} />

                {/* Validation Checklist UI */}
                <div className="bg-slate-900/55 p-4 border border-slate-850 rounded-2xl space-y-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Verification Checkpoints Checklist</span>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setValidationChecks(prev => ({ ...prev, coordinates: !prev.coordinates }))}
                      className={`flex justify-between items-center p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                        validationChecks.coordinates 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span>1. Validate Coordinates Match Siting Rules</span>
                      <CheckCircle className={`w-4.5 h-4.5 ${validationChecks.coordinates ? 'text-emerald-450' : 'text-slate-700'}`} />
                    </button>

                    <button
                      onClick={() => setValidationChecks(prev => ({ ...prev, terrain: !prev.terrain }))}
                      className={`flex justify-between items-center p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                        validationChecks.terrain 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span>2. Validate Terrain Slopes Height Limits</span>
                      <CheckCircle className={`w-4.5 h-4.5 ${validationChecks.terrain ? 'text-emerald-450' : 'text-slate-700'}`} />
                    </button>

                    <button
                      onClick={() => setValidationChecks(prev => ({ ...prev, waterBodies: !prev.waterBodies }))}
                      className={`flex justify-between items-center p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                        validationChecks.waterBodies 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span>3. Validate Water Bodies Proximity</span>
                      <CheckCircle className={`w-4.5 h-4.5 ${validationChecks.waterBodies ? 'text-emerald-450' : 'text-slate-700'}`} />
                    </button>

                    <button
                      onClick={() => setValidationChecks(prev => ({ ...prev, protectedAreas: !prev.protectedAreas }))}
                      className={`flex justify-between items-center p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                        validationChecks.protectedAreas 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span>4. Validate Protected Buffer Exclusions</span>
                      <CheckCircle className={`w-4.5 h-4.5 ${validationChecks.protectedAreas ? 'text-emerald-450' : 'text-slate-700'}`} />
                    </button>

                    <button
                      onClick={() => setValidationChecks(prev => ({ ...prev, airportBuffer: !prev.airportBuffer }))}
                      className={`flex justify-between items-center p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                        validationChecks.airportBuffer 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span>5. Validate Airport Buffer Range</span>
                      <CheckCircle className={`w-4.5 h-4.5 ${validationChecks.airportBuffer ? 'text-emerald-450' : 'text-slate-700'}`} />
                    </button>

                    <button
                      onClick={() => setValidationChecks(prev => ({ ...prev, floodRisk: !prev.floodRisk }))}
                      className={`flex justify-between items-center p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                        validationChecks.floodRisk 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span>6. Validate Flood Risk Constraints</span>
                      <CheckCircle className={`w-4.5 h-4.5 ${validationChecks.floodRisk ? 'text-emerald-450' : 'text-slate-700'}`} />
                    </button>
                  </div>
                </div>

                {/* Siting validation comments text-area & buttons */}
                <div className="bg-slate-900/50 p-4 border border-slate-850 rounded-2xl space-y-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Review Execution Panel</span>
                  
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add GIS Comments</label>
                    <textarea
                      value={gisComments}
                      onChange={(e) => setGisComments(e.target.value)}
                      placeholder="Provide topographic slopes, protected zones, and environmental remarks..."
                      rows={3}
                      className="w-full rounded-lg p-2.5 text-xs glass-input font-semibold placeholder-slate-650 resize-none text-slate-200"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCommentsOnly}
                        disabled={isSubmittingReview}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg shadow-md transition-all text-xs flex items-center justify-center space-x-1"
                      >
                        Save Comments
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleGisReview('approve')}
                        disabled={isSubmittingReview}
                        className="py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-lg shadow-md transition-all text-xs flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve GIS</span>
                      </button>
                      <button
                        onClick={() => handleGisReview('reject')}
                        disabled={isSubmittingReview}
                        className="py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md transition-all text-xs flex items-center justify-center space-x-1.5"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Reject GIS</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })() : (
        <div className="text-center text-slate-500 font-bold py-10 text-xs italic">
          Select a project from the reviews queue table above to open the GIS Review Workspace.
        </div>
      )}

    </div>
  );
}
