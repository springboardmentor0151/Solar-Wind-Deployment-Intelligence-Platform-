import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FolderPlus, 
  MapPin, 
  Layers, 
  Edit3, 
  Trash2, 
  Copy, 
  Layers as LayersIcon,
  ChevronRight,
  Plus,
  Briefcase,
  ExternalLink,
  Calendar,
  Compass,
  Zap,
  Globe
} from 'lucide-react';

import {
  canCreateProject,
  canRunPredictions,
  canSubmitProject,
  canReviewGIS,
  canApproveGIS,
  canApproveWorkflow,
  canUpdateMilestones,
  canApproveProject
} from '../services/permissionService';

import WorkflowVisualization from '../components/WorkflowVisualization';


export default function ProjectsView({ user, projects, sites, onRefreshData, setView }) {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRegion, setNewProjectRegion] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectCountry, setNewProjectCountry] = useState('');
  const [newProjectRenewableType, setNewProjectRenewableType] = useState('solar');
  const [isCreating, setIsCreating] = useState(false);

  // Edit states
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editRenewableType, setEditRenewableType] = useState('solar');

  // Selected project for details view modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/users/assignable', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsersList(res.data);
      } catch (e) {
        console.error("Failed to load users for assignment labels", e);
      }
    };
    fetchUsers();
  }, []);

  const getUserName = (userId) => {
    if (!userId) return 'Awaiting Assignment';
    const found = usersList.find(u => Number(u.id) === Number(userId));
    return found ? `${found.full_name || found.username} (@${found.username})` : `User ID: ${userId}`;
  };

  const handleWorkflowAction = async (actionPath, actionType) => {
    try {
      const token = localStorage.getItem('token');
      const payload = actionPath.includes('submit') ? {} : {
        action: actionType,
        gis_comments: commentText,
        manager_comments: commentText,
        admin_comments: commentText
      };
      
      const res = await axios.post(`/api/projects/${selectedProject.id}/${actionPath}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast(`Action successful! Status is now: ${res.data.status}`, "success");
      setCommentText('');
      setSelectedProject(res.data);
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error("Project Workflow Action Error:", error.response || error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error.message;
      window.showToast(message, "error");
    }
  };

  // Auto-refresh when Projects tab loads
  useEffect(() => {
    if (onRefreshData) {
      onRefreshData();
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectName) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/projects', {
        name: newProjectName,
        region: newProjectRegion,
        description: newProjectDesc,
        country: newProjectCountry,
        renewable_type: newProjectRenewableType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewProjectName('');
      setNewProjectRegion('');
      setNewProjectDesc('');
      setNewProjectCountry('');
      setNewProjectRenewableType('solar');
      setIsCreating(false);
      onRefreshData();
    } catch (e) {
      console.error(e);
      window.showToast("Failed to create project", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/projects/${editingProject.id}`, {
        name: editName,
        region: editRegion,
        description: editDesc,
        country: editCountry,
        renewable_type: editRenewableType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingProject(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
      window.showToast("Failed to update project", "error");
    }
  };

  const handleDelete = async (projId) => {
    if (!window.confirm("Are you sure you want to delete this project and all its associated sites?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/projects/${projId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefreshData();
    } catch (err) {
      console.error("Delete Project Error:", err.response || err);
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to delete project";
      window.showToast(message, "error");
    }
  };

  const handleDuplicate = async (proj) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/projects', {
        name: `${proj.name} (Copy)`,
        region: proj.region || '',
        description: proj.description || '',
        country: proj.country || '',
        renewable_type: proj.renewable_type || 'solar'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Clone sites in project
      const projectSites = sites.filter(s => Number(s.project_id) === Number(proj.id));
      for (const s of projectSites) {
        const details = s.details_json ? JSON.parse(s.details_json) : {};
        await axios.post(`/api/projects/${res.data.id}/sites`, {
          name: `${s.name} (Copy)`,
          latitude: s.latitude,
          longitude: s.longitude,
          land_area: s.land_area,
          land_ownership: s.land_ownership,
          project_type: details.project_type || 'solar'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onRefreshData();
      window.showToast("Project duplicated successfully!", "success");
    } catch (e) {
      console.error(e);
      window.showToast("Failed to duplicate project.", "error");
    }
  };

  const startEdit = (proj) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditRegion(proj.region || '');
    setEditDesc(proj.description || '');
    setEditCountry(proj.country || '');
    setEditRenewableType(proj.renewable_type || 'solar');
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Briefcase className="w-5 h-5 text-[#16A34A] mr-2" />
            Project Directories Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your renewable energy project portfolios and browse registered GIS site locations.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center space-x-1.5"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(proj => {
          const projSites = sites.filter(s => Number(s.project_id) === Number(proj.id));
          
          return (
            <div key={proj.id} className="bg-[#111827]/80 border border-slate-800 p-5 rounded-2xl glass hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-slate-200 truncate max-w-[150px]">{proj.name}</h3>
                  <span className="text-[9px] text-[#0EA5E9] font-mono px-2 py-0.5 bg-[#0ea5e9]/10 rounded-full">{projSites.length} Sites</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-1 text-[9px] text-slate-500">
                  <span>📍 {proj.region || 'Global Region'}{proj.country ? `, ${proj.country}` : ''}</span>
                  <span className="capitalize text-emerald-400 font-bold mt-0.5">{proj.renewable_type || 'solar'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">{proj.description || 'No description provided.'}</p>
              </div>

              {/* Sites list under this project */}
              <div className="border-t border-slate-900 pt-3 space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Registered Sites:</span>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {projSites.map(s => (
                    <div key={s.id} className="flex justify-between items-center text-[10px] text-slate-350 bg-slate-950/40 p-1.5 rounded border border-slate-900">
                      <span className="truncate max-w-[120px] font-bold text-slate-200">{s.name}</span>
                      <span className="text-emerald-400 font-extrabold">{s.suitability_score}%</span>
                    </div>
                  ))}
                  {projSites.length === 0 && (
                    <span className="text-[9px] text-slate-600 italic block">No sites registered.</span>
                  )}
                </div>
              </div>

              {/* Actions row with Status and Submit button */}
              <div className="border-t border-slate-900 pt-3 flex flex-col gap-2.5 text-[9px] font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Status:</span>
                  <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${
                    proj.status === 'Draft' ? 'bg-slate-900 border-slate-700 text-slate-450' :
                    proj.status === 'Submitted' ? 'bg-blue-900/20 border-blue-500/30 text-blue-450' :
                    proj.status === 'Under Review' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-450' :
                    proj.status === 'Approved' ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-450' :
                    proj.status === 'Rejected' ? 'bg-rose-900/20 border-rose-500/30 text-rose-455' :
                    'bg-indigo-900/20 border-indigo-500/30 text-indigo-400'
                  }`}>
                    {proj.status || 'Draft'}
                  </span>
                </div>

                <div className="flex justify-between gap-1.5 mt-1">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setView('project-details', proj.id)}
                      className="px-2 py-1.5 bg-gradient-to-r from-blue-600/30 to-sky-600/20 hover:from-blue-600/40 border border-blue-500/20 rounded text-sky-455 transition-all flex items-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                    </button>
                    {(user.role === 'admin' || proj.status === 'Draft') && (
                      <button
                        onClick={() => startEdit(proj)}
                        className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 transition-all flex items-center"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                      </button>
                    )}
                    {user.role === 'planner' && proj.status === 'Draft' && (
                      <button
                        onClick={async () => {
                          if (!window.confirm("Submit this project for review? You won't be able to edit it after submission.")) return;
                          try {
                            const token = localStorage.getItem('token');
                            await axios.post(`/api/projects/${proj.id}/submit`, {}, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            window.showToast("Project submitted successfully for review!", "success");
                            onRefreshData();
                          } catch (error) {
                            console.error("Project Submit Error:", error.response || error);
                            const message =
                              error?.response?.data?.detail ||
                              error?.response?.data?.message ||
                              error.message;
                            window.showToast(message, "error");
                          }
                        }}
                        className="px-2 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-455 rounded transition-all flex items-center"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                  {!(user.role === 'planner' && (proj.status === 'Approved' || proj.status === 'Completed')) && (
                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="px-2 py-1.5 bg-slate-900 hover:bg-rose-955/40 border border-slate-800 hover:border-rose-900 text-rose-455 rounded transition-all flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-3 text-center text-slate-500 italic py-10">No projects found. Create one to begin.</div>
        )}
      </div>

      {/* PROJECT DETAILS VIEW MODAL (Requirement 6 & 8) */}
      {selectedProject && (() => {
        const projectSites = sites.filter(s => Number(s.project_id) === Number(selectedProject.id));
        const mainSite = projectSites[0];
        let siteDetails = null;
        if (mainSite && mainSite.details_json) {
          try {
            siteDetails = JSON.parse(mainSite.details_json);
          } catch (e) {
            console.error("Failed to parse site details JSON", e);
          }
        }

        const isGisAssignedToMe = Number(selectedProject.assigned_gis_analyst_id || selectedProject.assigned_analyst_id) === Number(user.id);
        const isPmAssignedToMe = Number(selectedProject.assigned_project_manager_id || selectedProject.assigned_manager_id) === Number(user.id);
        const isAdminAssignedToMe = Number(selectedProject.assigned_administrator_id) === Number(user.id);

        return (
          <div className="fixed inset-0 bg-[#070a13]/90 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl max-w-6xl w-full glass space-y-6 my-8">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                <div>
                  <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest block">Project Detail Workspace</span>
                  <h3 className="text-xl font-bold text-slate-100 mt-1">{selectedProject.name}</h3>
                  <div className="flex space-x-4 mt-1.5 text-[10.5px] text-slate-450 font-semibold">
                    <span>📍 Region: {selectedProject.region || 'Global Grid'}</span>
                    <span>•</span>
                    <span>Status: <strong className="text-[#0EA5E9]">{selectedProject.status || 'Draft'}</strong></span>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedProject(null); setCommentText(''); }} 
                  className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all shadow"
                >
                  ✕ Close Workspace
                </button>
              </div>

              {/* Responsive Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Siting Analysis, Predictions & Coordinates (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Project Info & Description */}
                  <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Description & Scope</span>
                    <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                      {selectedProject.description || 'No description provided for this site selection campaign.'}
                    </p>
                  </div>

                  {/* Sited Coordinates List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Sited GIS Coordinates ({projectSites.length})</span>
                    <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950/60 max-h-[160px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="border-b border-slate-850 bg-slate-900/50 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                            <th className="p-3">Site Name</th>
                            <th className="p-3">Coordinates</th>
                            <th className="p-3">Siting Sizing</th>
                            <th className="p-3">Suitability Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-semibold text-slate-300">
                          {projectSites.map(s => (
                            <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                              <td className="p-3 font-bold text-slate-100">{s.name}</td>
                              <td className="p-3 font-mono text-slate-400">{s.latitude.toFixed(4)}°N, {s.longitude.toFixed(4)}°E</td>
                              <td className="p-3 text-slate-400">{s.land_area ? `${s.land_area} ha` : 'N/A'}</td>
                              <td className="p-3 text-[#10B981] font-bold">{s.suitability_score}%</td>
                            </tr>
                          ))}
                          {projectSites.length === 0 && (
                            <tr>
                              <td colSpan="4" className="p-6 text-center text-slate-500 italic">No locations sited yet. Go to GIS map to drop a pin.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Environmental & Weather Metrics */}
                  {siteDetails ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Topographic & GIS constraints */}
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl space-y-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Geographic Hazards</span>
                        <div className="space-y-2 text-xs font-semibold text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Elevation:</span>
                            <span>{siteDetails.environmental.elevation} m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Land Slope:</span>
                            <span>{siteDetails.environmental.land_slope}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Grid Distance:</span>
                            <span>{siteDetails.infrastructure.distance_to_transmission?.toFixed(2)} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Road Distance:</span>
                            <span>{siteDetails.infrastructure.distance_to_road?.toFixed(2)} km</span>
                          </div>
                        </div>
                      </div>

                      {/* Climate and resource values */}
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl space-y-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Climate Resources</span>
                        <div className="space-y-2 text-xs font-semibold text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Solar GHI:</span>
                            <span>{siteDetails.environmental.solar_irradiance} W/m²</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Wind Speed:</span>
                            <span>{siteDetails.environmental.wind_speed} m/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Cloud Cover:</span>
                            <span>{siteDetails.environmental.cloud_cover}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Temperature:</span>
                            <span>{siteDetails.environmental.temperature}°C</span>
                          </div>
                        </div>
                      </div>

                      {/* Power potential calculations */}
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl space-y-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Resource Feasibility</span>
                        <div className="space-y-2 text-xs font-semibold text-slate-300">
                          <div className="flex justify-between text-yellow-500">
                            <span>Solar Cap Factor:</span>
                            <span>{(siteDetails.solar_prediction.capacity_factor * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sky-400">
                            <span>Wind Cap Factor:</span>
                            <span>{(siteDetails.wind_prediction.capacity_factor * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-emerald-450 font-bold">
                            <span>Hybrid Siting:</span>
                            <span className="capitalize">{siteDetails.hybrid_recommendation.recommendation}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-slate-950/40 border border-slate-900 p-8 rounded-2xl text-center text-xs text-slate-500 italic">
                      No feasibility resource parameters to display. Siting details will load once coordinates are registered on map.
                    </div>
                  )}

                </div>

                {/* Right Column: Timeline, Assignments & Approvals (5 cols) */}
                <div className="lg:col-span-5 bg-slate-950/30 border border-slate-900 p-5 rounded-2xl space-y-6">
                  
                  {/* Workflow Stage Header */}
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Workflow Configuration</span>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10.5px] font-semibold text-slate-300">
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-black">GIS Analyst</span>
                        <span>{getUserName(selectedProject.assigned_gis_analyst_id || selectedProject.assigned_analyst_id)}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-black">Project Manager</span>
                        <span>{getUserName(selectedProject.assigned_project_manager_id || selectedProject.assigned_manager_id)}</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="block text-[8px] text-slate-500 uppercase font-black">Administrator Delegated</span>
                        <span>{getUserName(selectedProject.assigned_administrator_id)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Audit Timeline */}
                  <WorkflowVisualization project={selectedProject} usersList={usersList} />

                  {/* Action & Feedback Control Panel */}
                  <div className="bg-slate-900/50 p-4 border border-slate-850 rounded-2xl space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Siting Approval Actions</span>
                    
                    {/* Read-Only completed display */}
                    {selectedProject.status === 'Completed' && (
                      <div className="text-center py-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl">
                        <span className="text-xs font-bold text-[#10B981] flex items-center justify-center">
                          ✓ Project Approved & Sited (Read-Only)
                        </span>
                      </div>
                    )}

                    {/* Rejected state */}
                    {selectedProject.status === 'Rejected' && (
                      <div className="text-center py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                        <span className="text-xs font-bold text-rose-500 flex items-center justify-center">
                          ✕ Siting Campaign Rejected by Admin
                        </span>
                      </div>
                    )}

                    {/* Planner submits project */}
                    {canSubmitProject(user) && ['Draft', 'GIS Rejected', 'Manager Rejected', 'Rejected'].includes(selectedProject.status) && (
                      <div className="space-y-2">
                        <p className="text-[10.5px] text-slate-400 font-semibold leading-normal">
                          By submitting this siting grid, you freeze coordinates modifications and trigger automatic load assignment to a GIS Analyst.
                        </p>
                        <button
                          onClick={() => handleWorkflowAction('submit', 'submit')}
                          className="w-full py-2 bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white text-xs font-bold rounded-xl transition-all shadow"
                        >
                          Submit Campaign for Validation
                        </button>
                      </div>
                    )}

                    {/* GIS Analyst review workspace */}
                    {canReviewGIS(user) && selectedProject.status === 'GIS Review' && isGisAssignedToMe && (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Provide coordinate validation constraints, terrain feedback, flood buffers..."
                          rows="3"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="w-full text-xs font-semibold placeholder-slate-700 bg-slate-950 border border-slate-800 rounded-xl p-2.5"
                        ></textarea>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleWorkflowAction('gis-review', 'approve')}
                            className="py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Approve GIS grid
                          </button>
                          <button
                            onClick={() => handleWorkflowAction('gis-review', 'reject')}
                            className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Reject Siting
                          </button>
                        </div>
                      </div>
                    )}

                    {/* PM review workspace */}
                    {canApproveWorkflow(user) && selectedProject.status === 'Manager Review' && isPmAssignedToMe && (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Provide milestones comments, CAPEX viability feedback, ROI review..."
                          rows="3"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="w-full text-xs font-semibold placeholder-slate-700 bg-slate-950 border border-slate-800 rounded-xl p-2.5"
                        ></textarea>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleWorkflowAction('manager-review', 'approve')}
                            className="py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Approve Feasibility
                          </button>
                          <button
                            onClick={() => handleWorkflowAction('manager-review', 'reject')}
                            className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Reject Feasibility
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Admin review workspace */}
                    {canApproveProject(user) && selectedProject.status === 'Admin Review' && isAdminAssignedToMe && (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Provide final authorization grid interconnect signoff..."
                          rows="3"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="w-full text-xs font-semibold placeholder-slate-700 bg-slate-950 border border-slate-800 rounded-xl p-2.5"
                        ></textarea>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleWorkflowAction('admin-review', 'approve')}
                            className="py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Authorize Grid Connection
                          </button>
                          <button
                            onClick={() => handleWorkflowAction('admin-review', 'reject')}
                            className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Reject Siting Siting
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Warning if assigned to another user */}
                    {selectedProject.status === 'GIS Review' && canReviewGIS(user) && !isGisAssignedToMe && (
                      <div className="text-[10px] text-slate-500 italic text-center">
                        This coordinate check is assigned to another GIS Analyst.
                      </div>
                    )}
                    {selectedProject.status === 'Manager Review' && canApproveWorkflow(user) && !isPmAssignedToMe && (
                      <div className="text-[10px] text-slate-500 italic text-center">
                        This workflow check is assigned to another Project Manager.
                      </div>
                    )}
                    {selectedProject.status === 'Admin Review' && canApproveProject(user) && !isAdminAssignedToMe && (
                      <div className="text-[10px] text-slate-500 italic text-center">
                        This final check is assigned to another Administrator.
                      </div>
                    )}

                    {/* Warning if state doesn't match role yet */}
                    {canReviewGIS(user) && selectedProject.status !== 'GIS Review' && selectedProject.status !== 'Completed' && selectedProject.status !== 'Rejected' && (
                      <div className="text-[10px] text-[#0EA5E9] font-bold text-center">
                        Project status: {selectedProject.status} (Review not active)
                      </div>
                    )}
                    {canApproveWorkflow(user) && selectedProject.status !== 'Manager Review' && selectedProject.status !== 'Completed' && selectedProject.status !== 'Rejected' && (
                      <div className="text-[10px] text-[#0EA5E9] font-bold text-center">
                        Project status: {selectedProject.status} (Assessment not active)
                      </div>
                    )}
                    {canApproveProject(user) && selectedProject.status !== 'Admin Review' && selectedProject.status !== 'Completed' && selectedProject.status !== 'Rejected' && (
                      <div className="text-[10px] text-[#0EA5E9] font-bold text-center">
                        Project status: {selectedProject.status} (Approval not active)
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full glass space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center">
                <FolderPlus className="w-4 h-4 mr-1.5 text-[#16A34A]" />
                Create New Project
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Gujarat Solar Farms"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Renewable Type</label>
                  <select
                    value={newProjectRenewableType}
                    onChange={(e) => setNewProjectRenewableType(e.target.value)}
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
                    value={newProjectCountry}
                    onChange={(e) => setNewProjectCountry(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajasthan"
                    value={newProjectRegion}
                    onChange={(e) => setNewProjectRegion(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Description</label>
                <textarea
                  rows="3"
                  placeholder="Summarize project scope..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-semibold placeholder-slate-700"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white rounded-lg font-bold transition-all shadow"
              >
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full glass space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Edit Project details
              </h3>
              <button onClick={() => setEditingProject(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Renewable Type</label>
                  <select
                    value={editRenewableType}
                    onChange={(e) => setEditRenewableType(e.target.value)}
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
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Region</label>
                  <input
                    type="text"
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Description</label>
                <textarea
                  rows="3"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-semibold"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white rounded-lg font-bold transition-all shadow"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
