import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Download, Landmark, Compass, MapPin, 
  ShieldAlert, CheckCircle, Loader2, ArrowLeft,
  Globe, Link, Award, Star, ExternalLink, Activity
} from 'lucide-react';
import WorkflowVisualization from '../components/WorkflowVisualization';

export default function ProjectDetailsView({ projectId, user, sites, setView, onRefreshData }) {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false);

  // Fetch users (assignable users list) for workflow name resolution
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/users/assignable', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsersList(res.data);
      } catch (e) {
        console.error("Failed to load users list", e);
      }
    };
    fetchUsers();
  }, []);

  // Fetch project details by ID
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setErrorMsg("No Project ID specified.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setErrorMsg('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProject(res.data);
      } catch (e) {
        console.error("Failed to fetch project by ID", e);
        setErrorMsg(e.response?.data?.detail || "Invalid Project ID or Project not found.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const getUserName = (userId) => {
    if (!userId) return 'Awaiting Assignment';
    const found = usersList.find(u => Number(u.id) === Number(userId));
    return found ? `${found.full_name || found.username} (@${found.username})` : `User ID: ${userId}`;
  };

  const handleDownload = async (siteId, type) => {
    try {
      const token = localStorage.getItem('token');
      const url = `/api/sites/${siteId}/download/${type}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: type === 'excel' ? 'text/csv' : 'text/html' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `feasibility_report_${siteId}.${type === 'excel' ? 'csv' : 'html'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
      window.showToast("Failed to download report.", "error");
    }
  };

  const handleWorkflowAction = async (actionPath, actionType) => {
    try {
      setIsSubmittingWorkflow(true);
      const token = localStorage.getItem('token');
      const payload = actionPath.includes('submit') ? {} : {
        action: actionType,
        gis_comments: commentText,
        manager_comments: commentText,
        admin_comments: commentText
      };
      
      const res = await axios.post(`/api/projects/${project.id}/${actionPath}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast(`Action successful! Status is now: ${res.data.status}`, "success");
      setProject(res.data);
      setCommentText('');
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error("Project Workflow Action Error:", error.response || error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error.message;
      window.showToast(message, "error");
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  const handleClaimRelease = async (action) => {
    try {
      setIsSubmittingWorkflow(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/projects/${project.id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast(`Project successfully ${action}ed!`, "success");
      setProject(res.data);
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error(`Project ${action} Error:`, error.response || error);
      const message = error?.response?.data?.detail || error.message;
      window.showToast(message, "error");
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  // Helper validation variables
  const canReviewGIS = (u) => u && (u.role === 'analyst' || u.role === 'admin');
  const canApproveWorkflow = (u) => u && (u.role === 'manager' || u.role === 'admin');
  const canApproveProject = (u) => u && u.role === 'admin';
  const canSubmitProject = (u) => u && (u.role === 'planner' || u.role === 'admin');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Siting Workspace...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-12 bg-slate-950/60 border border-slate-900 rounded-3xl p-8 glass text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-200">Unable to Load Project</h3>
          <p className="text-xs text-slate-500 leading-normal">{errorMsg}</p>
        </div>
        <button
          onClick={() => setView('projects')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-all shadow flex items-center justify-center mx-auto space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>
    );
  }

  if (!project) return null;

  // Filter sites for this specific project
  const projectSites = sites.filter(s => Number(s.project_id) === Number(project.id));
  const mainSite = projectSites[0];
  let siteDetails = null;
  if (mainSite && mainSite.details_json) {
    try {
      siteDetails = JSON.parse(mainSite.details_json);
    } catch (e) {
      console.error("Failed to parse site details JSON", e);
    }
  }

  const isGisAssignedToMe = Number(project.assigned_gis_analyst_id || project.assigned_analyst_id) === Number(user.id);
  const isPmAssignedToMe = Number(project.assigned_project_manager_id || project.assigned_manager_id) === Number(user.id);
  const isAdminAssignedToMe = Number(project.assigned_administrator_id) === Number(user.id);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-[#111827]/80 border border-slate-800 p-6 rounded-3xl glass gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView('projects')}
              className="p-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all shadow"
              title="Back to Projects"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest block">Project Detail Workspace</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{project.name}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-slate-450 font-semibold">
            <span>📍 Region: {project.region || 'Global Grid'}</span>
            <span>•</span>
            <span>Type: <strong className="capitalize text-emerald-450">{project.renewable_type || 'solar'}</strong></span>
            <span>•</span>
            <span>Status: <strong className="text-[#0EA5E9]">{project.status || 'Draft'}</strong></span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('projects')}
            className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all shadow"
          >
            Close Workspace
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Siting Analysis, Predictions & Coordinates (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Project Info & Description */}
          <div className="bg-[#111827]/80 border border-slate-800 p-5 rounded-3xl glass space-y-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Description & Scope</span>
            <p className="text-xs text-slate-350 leading-relaxed font-semibold">
              {project.description || 'No description provided for this site selection campaign.'}
            </p>
          </div>

          {/* Sited Coordinates List */}
          <div className="bg-[#111827]/80 border border-slate-800 p-5 rounded-3xl glass space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Sited GIS Coordinates ({projectSites.length})</span>
            <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950/60 max-h-[200px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-900/50 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                    <th className="p-3">Site Name</th>
                    <th className="p-3">Coordinates</th>
                    <th className="p-3">Siting Sizing</th>
                    <th className="p-3">Suitability Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-semibold text-slate-355">
                  {projectSites.map(s => (
                    <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-3 font-bold text-slate-100">{s.name}</td>
                      <td className="p-3 font-mono text-slate-400">
                        {typeof s.latitude === 'number' ? s.latitude.toFixed(4) : s.latitude}°N,{' '}
                        {typeof s.longitude === 'number' ? s.longitude.toFixed(4) : s.longitude}°E
                      </td>
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
              <div className="bg-[#111827]/80 border border-slate-800 p-5 rounded-3xl glass space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Geographic Hazards</span>
                <div className="space-y-2 text-xs font-semibold text-slate-355">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Elevation:</span>
                    <span>{siteDetails?.environmental?.elevation || 'N/A'} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Land Slope:</span>
                    <span>{siteDetails?.environmental?.land_slope || 'N/A'}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Grid Distance:</span>
                    <span>{siteDetails?.infrastructure?.distance_to_transmission?.toFixed(2) || 'N/A'} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Road Distance:</span>
                    <span>{siteDetails?.infrastructure?.distance_to_road?.toFixed(2) || 'N/A'} km</span>
                  </div>
                </div>
              </div>

              {/* Climate and resource values */}
              <div className="bg-[#111827]/80 border border-slate-800 p-5 rounded-3xl glass space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Climate Resources</span>
                <div className="space-y-2 text-xs font-semibold text-slate-355">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Solar GHI:</span>
                    <span>{siteDetails?.environmental?.solar_irradiance || 'N/A'} W/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Wind Speed:</span>
                    <span>{siteDetails?.environmental?.wind_speed || 'N/A'} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cloud Cover:</span>
                    <span>{siteDetails?.environmental?.cloud_cover || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Temperature:</span>
                    <span>{siteDetails?.environmental?.temperature || 'N/A'}°C</span>
                  </div>
                </div>
              </div>

              {/* Power potential calculations */}
              <div className="bg-[#111827]/80 border border-slate-800 p-5 rounded-3xl glass space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Resource Feasibility</span>
                <div className="space-y-2 text-xs font-semibold text-slate-355">
                  <div className="flex justify-between text-yellow-500 font-bold">
                    <span>Solar Cap Factor:</span>
                    <span>{siteDetails?.solar_prediction?.capacity_factor ? `${(siteDetails.solar_prediction.capacity_factor * 100).toFixed(1)}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sky-400 font-bold">
                    <span>Wind Cap Factor:</span>
                    <span>{siteDetails?.wind_prediction?.capacity_factor ? `${(siteDetails.wind_prediction.capacity_factor * 100).toFixed(1)}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-emerald-450 font-bold">
                    <span>Hybrid Siting:</span>
                    <span className="capitalize">{siteDetails?.hybrid_recommendation?.recommendation || 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#111827]/80 border border-slate-800 p-8 rounded-3xl glass text-center text-xs text-slate-500 italic">
              No feasibility resource parameters to display. Siting details will load once coordinates are registered on map.
            </div>
          )}

          {/* Reports Centre */}
          <div className="bg-[#111827]/80 border border-slate-800 p-5 rounded-3xl glass space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Feasibility Report Exports</span>
            {projectSites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectSites.map(s => (
                  <div key={s.id} className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{s.name}</span>
                      <span className="text-[10px] text-slate-500 block">Node feasibility summary</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleDownload(s.id, 'excel')}
                        className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-[#0EA5E9] hover:text-white rounded-lg transition-all"
                        title="Download CSV Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(s.id, 'html')}
                        className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-emerald-400 hover:text-white rounded-lg transition-all"
                        title="Print HTML Report"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 italic py-2">
                No reports available. Grid sites must be registered first.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Timeline, Assignments & Approvals (5 cols) */}
        <div className="lg:col-span-5 bg-[#111827]/80 border border-slate-800 p-5 rounded-3xl glass space-y-6">
          
          {/* Workflow Stage Header */}
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Workflow Configuration</span>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10.5px] font-semibold text-slate-350 bg-slate-950/40 p-3.5 border border-slate-900 rounded-2xl">
              <div>
                <span className="block text-[8px] text-slate-500 uppercase font-black">GIS Analyst</span>
                <span>{getUserName(project.assigned_gis_analyst_id || project.assigned_analyst_id)}</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase font-black">Project Manager</span>
                <span>{getUserName(project.assigned_project_manager_id || project.assigned_manager_id)}</span>
              </div>
              <div className="col-span-2 mt-1.5 pt-1.5 border-t border-slate-900/60">
                <span className="block text-[8px] text-slate-500 uppercase font-black">Administrator Delegated</span>
                <span>{getUserName(project.assigned_administrator_id)}</span>
              </div>
            </div>
          </div>

          {/* Visual Audit Timeline */}
          <WorkflowVisualization project={project} usersList={usersList} />

          {/* Action & Feedback Control Panel */}
          <div className="bg-slate-900/50 p-4 border border-slate-850 rounded-2xl space-y-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Siting Approval Actions</span>
            
            {/* Read-Only completed display */}
            {project.status === 'Completed' && (
              <div className="text-center py-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl">
                <span className="text-xs font-bold text-[#10B981] flex items-center justify-center">
                  ✓ Project Approved & Sited (Read-Only)
                </span>
              </div>
            )}

            {/* Rejected state */}
            {project.status === 'Rejected' && (
              <div className="text-center py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <span className="text-xs font-bold text-rose-500 flex items-center justify-center">
                  ✕ Siting Campaign Rejected by Admin
                </span>
              </div>
            )}

            {/* Planner submits project */}
            {canSubmitProject(user) && ['Draft', 'GIS Rejected', 'Manager Rejected', 'Rejected'].includes(project.status) && (
              <div className="space-y-2">
                <p className="text-[10.5px] text-slate-400 font-semibold leading-normal">
                  By submitting this siting grid, you freeze coordinates modifications and trigger automatic load assignment to a GIS Analyst.
                </p>
                <button
                  onClick={() => handleWorkflowAction('submit', 'submit')}
                  disabled={isSubmittingWorkflow}
                  className="w-full py-2 bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white text-xs font-bold rounded-xl transition-all shadow disabled:opacity-40"
                >
                  {isSubmittingWorkflow ? "Submitting..." : "Submit Campaign for Validation"}
                </button>
              </div>
            )}

            {/* GIS Analyst review workspace */}
            {canReviewGIS(user) && project.status === 'GIS Review' && (
              !project.assigned_analyst_id && !project.assigned_gis_analyst_id ? (
                <div className="space-y-3 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center">
                  <p className="text-xs text-slate-400 font-bold mb-2">This GIS validation is currently unassigned.</p>
                  <button
                    onClick={() => handleClaimRelease('claim')}
                    disabled={isSubmittingWorkflow}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition-all shadow"
                  >
                    Claim Project Review
                  </button>
                </div>
              ) : isGisAssignedToMe ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Provide detailed slope, elevation, and hazard validation notes..."
                    rows="3"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full text-xs font-semibold placeholder-slate-700 bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:border-blue-500/50 text-slate-200"
                  ></textarea>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleWorkflowAction('gis-review', 'approve')}
                      disabled={isSubmittingWorkflow}
                      className="py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                    >
                      Approve Siting
                    </button>
                    <button
                      onClick={() => handleWorkflowAction('gis-review', 'reject')}
                      disabled={isSubmittingWorkflow}
                      className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                    >
                      Reject Siting
                    </button>
                  </div>
                  <button
                    onClick={() => handleClaimRelease('release')}
                    disabled={isSubmittingWorkflow}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-450 hover:text-slate-350 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all mt-1"
                  >
                    Release Review Assignment
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic text-center p-3 bg-slate-950 border border-slate-900 rounded-xl">
                  This coordinate check is assigned to another GIS Analyst.
                </div>
              )
            )}

            {/* Manager review workspace */}
            {canApproveWorkflow(user) && project.status === 'Manager Review' && (
              !project.assigned_manager_id && !project.assigned_project_manager_id ? (
                <div className="space-y-3 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center">
                  <p className="text-xs text-slate-400 font-bold mb-2">This financial/feasibility review is currently unassigned.</p>
                  <button
                    onClick={() => handleClaimRelease('claim')}
                    disabled={isSubmittingWorkflow}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition-all shadow"
                  >
                    Claim Project Review
                  </button>
                </div>
              ) : isPmAssignedToMe ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Provide CAPEX, grid interconnection, and financial review comments..."
                    rows="3"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full text-xs font-semibold placeholder-slate-700 bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:border-blue-500/50 text-slate-200"
                  ></textarea>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleWorkflowAction('manager-review', 'approve')}
                      disabled={isSubmittingWorkflow}
                      className="py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                    >
                      Approve Feasibility
                    </button>
                    <button
                      onClick={() => handleWorkflowAction('manager-review', 'reject')}
                      disabled={isSubmittingWorkflow}
                      className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                    >
                      Reject Feasibility
                    </button>
                  </div>
                  <button
                    onClick={() => handleClaimRelease('release')}
                    disabled={isSubmittingWorkflow}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-450 hover:text-slate-350 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all mt-1"
                  >
                    Release Review Assignment
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic text-center p-3 bg-slate-950 border border-slate-900 rounded-xl">
                  This workflow check is assigned to another Project Manager.
                </div>
              )
            )}

            {/* Admin review workspace */}
            {canApproveProject(user) && project.status === 'Admin Review' && (
              !project.assigned_administrator_id ? (
                <div className="text-[10px] text-slate-500 italic text-center p-3 bg-slate-950 border border-slate-900 rounded-xl">
                  Awaiting administrator assignment from the central dashboard.
                </div>
              ) : isAdminAssignedToMe ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Provide final authorization grid interconnect signoff..."
                    rows="3"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full text-xs font-semibold placeholder-slate-700 bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:border-blue-500/50 text-slate-200"
                  ></textarea>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleWorkflowAction('admin-review', 'approve')}
                      disabled={isSubmittingWorkflow}
                      className="py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                    >
                      Authorize Grid Connection
                    </button>
                    <button
                      onClick={() => handleWorkflowAction('admin-review', 'reject')}
                      disabled={isSubmittingWorkflow}
                      className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                    >
                      Reject Siting
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic text-center p-3 bg-slate-950 border border-slate-900 rounded-xl">
                  This final check is assigned to another Administrator.
                </div>
              )
            )}

            {/* Warning if state doesn't match role yet */}
            {canReviewGIS(user) && project.status !== 'GIS Review' && project.status !== 'Completed' && project.status !== 'Rejected' && (
              <div className="text-[10px] text-[#0EA5E9] font-bold text-center">
                Project status: {project.status} (Review not active)
              </div>
            )}
            {canApproveWorkflow(user) && project.status !== 'Manager Review' && project.status !== 'Completed' && project.status !== 'Rejected' && (
              <div className="text-[10px] text-[#0EA5E9] font-bold text-center">
                Project status: {project.status} (Assessment not active)
              </div>
            )}
            {canApproveProject(user) && project.status !== 'Admin Review' && project.status !== 'Completed' && project.status !== 'Rejected' && (
              <div className="text-[10px] text-[#0EA5E9] font-bold text-center">
                Project status: {project.status} (Approval not active)
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
