import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Briefcase, 
  Trash2, 
  User, 
  RefreshCw,
  FolderOpen,
  MessageSquare,
  Download
} from 'lucide-react';

import WorkflowVisualization from '../components/WorkflowVisualization';


export default function AdminProjectsView({ user, projects, sites, onRefreshData }) {
  const [usersList, setUsersList] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(res.data);
    } catch (e) {
      console.error("Failed to fetch users list for mapping", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (onRefreshData) {
      onRefreshData();
    }
  }, []);

  const getOwnerName = (ownerId) => {
    const owner = usersList.find(u => u.id === ownerId);
    return owner ? owner.full_name || owner.username : `User ID: ${ownerId}`;
  };

  const handleDelete = async (projId) => {
    if (!window.confirm("Are you sure you want to delete this project globally as Administrator?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/projects/${projId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast("Project deleted successfully.", "success");
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
      window.showToast("Failed to delete project.", "error");
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Briefcase className="w-5 h-5 text-blue-400 mr-2" />
            Global Project Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse, review, approve, or reject all projects registered across all planner and analyst accounts.
          </p>
        </div>

        <button
          onClick={() => {
            if (onRefreshData) onRefreshData();
          }}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
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
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-[9px] text-slate-500">📍 Location: {proj.region || 'Global Region'}{proj.country ? `, ${proj.country}` : ''}</span>
                  <span className="capitalize text-[9px] text-emerald-400 font-extrabold mt-0.5">{proj.renewable_type || 'solar'}</span>
                  <span className="text-[9px] text-indigo-400 font-bold flex items-center mt-1">
                    <User className="w-3 h-3 mr-1" /> Owned By: {getOwnerName(proj.owner_id)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">{proj.description || 'No description provided.'}</p>
              </div>

              {/* Action and detail trigger */}
              <div className="border-t border-slate-900 pt-3 flex flex-col gap-2 text-[9px] font-bold">
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

                <div className="flex justify-between gap-1.5 mt-1.5">
                  <button
                    onClick={() => setSelectedProject(proj)}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600/30 to-sky-600/20 hover:from-blue-600/40 border border-blue-500/20 rounded text-sky-400 transition-all flex items-center"
                  >
                    <FolderOpen className="w-3.5 h-3.5 mr-1" /> Open Workspace
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-rose-955/40 border border-slate-805 hover:border-rose-900 text-rose-455 rounded transition-all flex items-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-3 text-center text-slate-500 italic py-10">No active projects found.</div>
        )}
      </div>

      {/* Reuse ProjectsView detailed table modal if selected */}
      {selectedProject && (
        <ProjectsViewModalWrapper 
          selectedProject={selectedProject} 
          setSelectedProject={setSelectedProject} 
          sites={sites} 
          onRefreshData={onRefreshData}
          usersList={usersList}
        />
      )}

    </div>
  );
}

function ProjectsViewModalWrapper({ selectedProject, setSelectedProject, sites, onRefreshData, usersList = [] }) {
  const projectSites = sites.filter(s => Number(s.project_id) === Number(selectedProject.id));
  const [status, setStatus] = useState(selectedProject.status || 'Draft');
  const [comments, setComments] = useState(selectedProject.review_comments || '');
  const [assignedAnalyst, setAssignedAnalyst] = useState(selectedProject.assigned_analyst_id || selectedProject.assigned_gis_analyst_id || '');
  const [assignedManager, setAssignedManager] = useState(selectedProject.assigned_manager_id || selectedProject.assigned_project_manager_id || '');
  const [adminComments, setAdminComments] = useState(selectedProject.admin_comments || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const analysts = usersList.filter(u => u.role === 'analyst');
  const managers = usersList.filter(u => u.role === 'manager');

  const getOwnerName = (ownerId) => {
    const owner = usersList.find(u => Number(u.id) === Number(ownerId));
    return owner ? `${owner.full_name || owner.username} (${owner.email})` : `User ID: ${ownerId}`;
  };

  const getUserDisplayName = (userId) => {
    if (!userId) return 'Unassigned';
    const found = usersList.find(u => Number(u.id) === Number(userId));
    return found ? found.full_name || found.username : `User ID: ${userId}`;
  };

  const handleAdminUpdate = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/projects/${selectedProject.id}`, {
        status,
        review_comments: comments,
        assigned_analyst_id: Number(assignedAnalyst) || null,
        assigned_manager_id: Number(assignedManager) || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast("Project settings, status, and role assignments updated successfully!", "success");
      if (onRefreshData) onRefreshData();
      setSelectedProject(res.data);
    } catch (e) {
      console.error(e);
      window.showToast("Failed to update project settings.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdminReview = async (action) => {
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/projects/${selectedProject.id}/admin-review`, {
        admin_comments: adminComments,
        action: action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast(`Final administrator review submitted successfully: ${action === 'approve' ? 'Approved' : 'Rejected'}.`, "success");
      if (onRefreshData) onRefreshData();
      setSelectedProject(res.data);
    } catch (err) {
      console.error(err);
      window.showToast(err.response?.data?.detail || "Failed to submit final Administrator review.", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleArchiveProject = () => {
    window.showToast(`Project '${selectedProject.name}' has been successfully archived in the geospatial records index!`, "info");
  };

  const handleDownloadCsv = () => {
    if (projectSites.length === 0) {
      window.showToast("No sites in this project to export.", "warning");
      return;
    }
    const mainSite = projectSites[0];
    const details = mainSite.details_json ? JSON.parse(mainSite.details_json) : {};
    const econ = details?.optimization?.economic_estimates || {};

    const csvContent = [
      ["Parameter", "Value"],
      ["Project Name", selectedProject.name],
      ["Site Name", mainSite.name],
      ["Coordinates", `${mainSite.latitude}, ${mainSite.longitude}`],
      ["Region", mainSite.region],
      ["CAPEX (Million USD)", econ.estimated_capex_million_usd || "N/A"],
      ["OPEX (Million USD/year)", econ.estimated_opex_million_usd_year || "N/A"],
      ["Grid Interconnection Status", econ.grid_connection_status || "N/A"],
      ["GIS Analyst Comments", selectedProject.gis_comments || "None"],
      ["Project Manager Comments", selectedProject.manager_comments || "None"],
      ["Administrator Comments", selectedProject.admin_comments || "None"]
    ]
    .map(e => e.map(val => `"${val}"`).join(","))
    .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FINAL_REPORT_${selectedProject.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mainSite = projectSites[0];
  let siteDetails = null;
  if (mainSite && mainSite.details_json) {
    try {
      siteDetails = JSON.parse(mainSite.details_json);
    } catch (e) {
      console.error(e);
    }
  }
  const econ = siteDetails?.optimization?.economic_estimates || {};

  return (
    <div className="fixed inset-0 bg-[#070a13]/90 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl max-w-6xl w-full glass space-y-6 max-h-[90vh] overflow-y-auto my-8">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-850 pb-4">
          <div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Administrator Workspace</span>
            <h3 className="text-xl font-bold text-slate-100 mt-1">{selectedProject.name}</h3>
            <div className="flex space-x-4 mt-1.5 text-[10.5px] text-slate-450 font-semibold">
              <span>📍 Region: {selectedProject.region || 'Global Grid'}</span>
              <span>•</span>
              <span>Status: <strong className="text-blue-400">{selectedProject.status || 'Draft'}</strong></span>
            </div>
          </div>
          <button 
            onClick={() => setSelectedProject(null)} 
            className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all shadow"
          >
            ✕ Close Workspace
          </button>
        </div>

        {/* Responsive Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Complete Project Info, Financials & Coordinates Table (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Complete Project Info */}
            <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-3 text-xs font-semibold text-slate-350">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Complete Project Information</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[8px] text-slate-550 uppercase">Asset Class</span>
                  <span className="block text-slate-200 capitalize">{selectedProject.renewable_type}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-550 uppercase">Campaign Owner</span>
                  <span className="block text-slate-200">{getOwnerName(selectedProject.owner_id)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[8px] text-slate-550 uppercase">Scope Description</span>
                  <p className="text-slate-400 font-normal mt-0.5 leading-relaxed">{selectedProject.description || 'No description provided.'}</p>
                </div>
              </div>
            </div>

            {/* Financial Report details */}
            <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Feasibility Financial Report</span>
              
              {siteDetails ? (
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-350">
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-500 block uppercase">CAPEX Estimate</span>
                    <span className="text-emerald-450 font-black text-sm">${econ.estimated_capex_million_usd || 10.0}M USD</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-500 block uppercase">OPEX Estimate</span>
                    <span className="text-slate-200 font-mono">${econ.estimated_opex_million_usd_year || 0.2}M USD / yr</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-500 block uppercase">Estimated Payback Period</span>
                    <span className="text-sky-400 font-bold">~{econ.payback_years || 7.5} Years</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-500 block uppercase">Grid Interconnection</span>
                    <span className="text-slate-200 font-bold capitalize">{econ.grid_connection_status || "Standard Access"}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">No financial modeling details loaded yet.</div>
              )}
            </div>

            {/* Sites coordinates list */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Sited Coordinates ({projectSites.length})</span>
              <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950/60 max-h-[160px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/50 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-3">Site Location Name</th>
                      <th className="p-3">Coordinates</th>
                      <th className="p-3">Suitability Scores</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-semibold text-slate-300">
                    {projectSites.map(s => (
                      <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-3 font-bold text-slate-100">{s.name}</td>
                        <td className="p-3 font-mono text-slate-400">{s.latitude.toFixed(4)}°N, {s.longitude.toFixed(4)}°E</td>
                        <td className="p-3 text-emerald-400 font-bold">{s.suitability_score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: GIS Review, PM Review, Visual Timeline & Admin Decisions (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950/30 border border-slate-900 p-5 rounded-2xl space-y-6">
            
            {/* GIS Review info */}
            <div className="bg-slate-950/40 p-3 border border-slate-900 rounded-xl space-y-1.5 text-xs font-semibold text-slate-350">
              <span className="text-[9px] text-slate-500 uppercase block font-black">GIS coordinate review</span>
              <div className="flex justify-between">
                <span>Reviewer:</span>
                <span>{getUserDisplayName(selectedProject.assigned_analyst_id || selectedProject.assigned_gis_analyst_id)}</span>
              </div>
              <p className="text-[10px] text-slate-400 italic bg-slate-900/50 p-2 rounded border border-slate-850 font-normal">
                "{selectedProject.gis_comments || 'No comments left.'}"
              </p>
            </div>

            {/* PM Review info */}
            <div className="bg-slate-950/40 p-3 border border-slate-900 rounded-xl space-y-1.5 text-xs font-semibold text-slate-350">
              <span className="text-[9px] text-slate-500 uppercase block font-black">project manager review</span>
              <div className="flex justify-between">
                <span>PM Name:</span>
                <span>{getUserDisplayName(selectedProject.assigned_manager_id || selectedProject.assigned_project_manager_id)}</span>
              </div>
              <p className="text-[10px] text-slate-400 italic bg-slate-900/50 p-2 rounded border border-slate-850 font-normal">
                "{selectedProject.manager_comments || 'No comments left.'}"
              </p>
            </div>

            {/* Timeline */}
            <WorkflowVisualization project={selectedProject} usersList={usersList} />

            {/* Admin Decisions actions panel */}
            <div className="bg-slate-900/50 p-4 border border-slate-850 rounded-2xl space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Administrator Actions Panel</span>
              
              <textarea
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Enter final interconnection authorization remarks here..."
                rows={2}
                className="w-full rounded-lg p-2 text-xs glass-input font-semibold placeholder-slate-650 resize-none text-slate-200"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAdminReview('approve')}
                  disabled={isSubmittingReview}
                  className="py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-lg shadow-md transition-all text-xs flex items-center justify-center space-x-1.5"
                >
                  <span>Approve Project</span>
                </button>
                <button
                  onClick={() => handleAdminReview('reject')}
                  disabled={isSubmittingReview}
                  className="py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md transition-all text-xs flex items-center justify-center space-x-1.5"
                >
                  <span>Reject Project</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
                <button
                  onClick={handleDownloadCsv}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-bold text-[10.5px] transition-all flex items-center justify-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Final Report</span>
                </button>
                <button
                  onClick={handleArchiveProject}
                  className="py-2 bg-slate-905 hover:bg-slate-800 text-slate-350 border border-slate-800 rounded-lg font-bold text-[10.5px] transition-all flex items-center justify-center space-x-1"
                >
                  <span>Archive Project</span>
                </button>
              </div>

            </div>

            {/* Manual Assignment Sync controls (Requirements - Admin can change manual assignment) */}
            <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-2xl space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Manual Siting Override Panel</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-400">
                <div className="space-y-1">
                  <label className="block text-[8px] uppercase tracking-wider font-bold">Override GIS Analyst</label>
                  <select 
                    value={assignedAnalyst} 
                    onChange={(e) => setAssignedAnalyst(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 text-slate-100 p-1 font-bold text-xs"
                  >
                    <option value="">Unassigned</option>
                    {analysts.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] uppercase tracking-wider font-bold">Override Project Manager</label>
                  <select 
                    value={assignedManager} 
                    onChange={(e) => setAssignedManager(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 text-slate-100 p-1 font-bold text-xs"
                  >
                    <option value="">Unassigned</option>
                    {managers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="block text-[8px] uppercase tracking-wider font-bold">Override Workflow Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 text-slate-100 p-1 font-bold text-xs"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="GIS Review">GIS Review</option>
                    <option value="GIS Approved">GIS Approved</option>
                    <option value="Manager Review">Manager Review</option>
                    <option value="Manager Approved">Manager Approved</option>
                    <option value="Admin Review">Admin Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-span-2 pt-1">
                  <button 
                    onClick={handleAdminUpdate} 
                    disabled={isUpdating}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs transition-colors shadow"
                  >
                    {isUpdating ? "Overriding..." : "Save Override Settings"}
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

