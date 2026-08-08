import React, { useState } from 'react';
import axios from 'axios';
import { 
  FolderPlus, 
  MapPin, 
  Compass, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Zap, 
  Briefcase, 
  Calendar,
  Globe,
  Settings,
  Plus,
  CheckCircle
} from 'lucide-react';

export default function PlannerDashboard({ user, projects, sites, onRefreshData, setView }) {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectCountry, setNewProjectCountry] = useState('');
  const [newProjectRegion, setNewProjectRegion] = useState('');
  const [newProjectRenewableType, setNewProjectRenewableType] = useState('solar');

  // Edit project states
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editRenewableType, setEditRenewableType] = useState('solar');

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/projects', {
        name: newProjectName,
        description: newProjectDesc,
        country: newProjectCountry,
        region: newProjectRegion,
        renewable_type: newProjectRenewableType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      window.showToast("Project created successfully.", "success");
      setIsCreatingProject(false);
      
      // Reset fields
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectCountry('');
      setNewProjectRegion('');
      setNewProjectRenewableType('solar');
      
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      window.showToast("Failed to create project", "error");
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/projects/${editingProject.id}`, {
        name: editName,
        description: editDesc,
        country: editCountry,
        region: editRegion,
        renewable_type: editRenewableType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      window.showToast("Project updated successfully.", "success");
      setEditingProject(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      window.showToast("Failed to update project", "error");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project and all its associated sites?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast("Project deleted successfully.", "success");
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      window.showToast("Failed to delete project", "error");
    }
  };

  const handleDeleteSite = async (id) => {
    if (!window.confirm("Are you sure you want to delete this saved location?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/sites/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast("Location deleted successfully.", "success");
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      window.showToast("Failed to delete site", "error");
    }
  };

  const startEdit = (proj) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditDesc(proj.description || '');
    setEditCountry(proj.country || '');
    setEditRegion(proj.region || '');
    setEditRenewableType(proj.renewable_type || 'solar');
  };

  // Sort projects and sites to show recent first
  const recentProjects = [...projects].sort((a, b) => b.id - a.id).slice(0, 5);
  const recentSites = [...sites].sort((a, b) => b.id - a.id).slice(0, 5);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Compass className="w-5 h-5 text-[#16A34A] mr-2" />
            Planner Control Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, <strong className="text-slate-200">{user.full_name || user.username}</strong>. Here is your renewable deployment overview.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { if (onRefreshData) onRefreshData(); }}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreatingProject(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center space-x-1.5 animate-pulse"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">My Projects</span>
          <span className="text-xl font-black text-slate-200 mt-1 block">{projects.length}</span>
        </div>

        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Drafts</span>
          <span className="text-xl font-black text-slate-400 mt-1 block">
            {projects.filter(p => p.status === 'Draft').length}
          </span>
        </div>

        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Submitted</span>
          <span className="text-xl font-black text-yellow-500 mt-1 block">
            {projects.filter(p => ['Submitted', 'GIS Review', 'Manager Review', 'Admin Review'].includes(p.status)).length}
          </span>
        </div>

        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Approved</span>
          <span className="text-xl font-black text-emerald-450 mt-1 block">
            {projects.filter(p => p.status === 'Completed').length}
          </span>
        </div>

        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Rejected</span>
          <span className="text-xl font-black text-rose-500 mt-1 block">
            {projects.filter(p => p.status === 'Rejected' || p.status === 'GIS Rejected' || p.status === 'Manager Rejected').length}
          </span>
        </div>

        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Saved Sites</span>
          <span className="text-xl font-black text-indigo-400 mt-1 block">{sites.length}</span>
        </div>

      </div>

      {/* Quick Actions Panel */}
      <div className="bg-[#111827]/80 border border-slate-800 p-5 rounded-2xl glass space-y-3">
        <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Quick Actions Workspace</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <button
            onClick={() => setView('map')}
            className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-[#16A34A]/30 rounded-xl transition-all font-bold text-left flex items-center space-x-2"
          >
            <Compass className="w-5 h-5 text-[#16A34A]" />
            <div>
              <span className="block text-slate-200">Siting Map Explorer</span>
              <span className="text-[9.5px] text-slate-500 font-semibold block">Click to analyze new site coordinates</span>
            </div>
          </button>
          
          <button
            onClick={() => setIsCreatingProject(true)}
            className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-[#0EA5E9]/30 rounded-xl transition-all font-bold text-left flex items-center space-x-2"
          >
            <Plus className="w-5 h-5 text-[#0EA5E9]" />
            <div>
              <span className="block text-slate-200">New Project Directory</span>
              <span className="text-[9.5px] text-slate-500 font-semibold block">Initialize new portfolio folder</span>
            </div>
          </button>

          <button
            onClick={() => setView('profile')}
            className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition-all font-bold text-left flex items-center space-x-2"
          >
            <Zap className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="block text-slate-200">Profile Clearance</span>
              <span className="text-[9.5px] text-slate-500 font-semibold block">View active user permissions role</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Projects Table */}
        <div className="bg-[#111827]/80 border border-slate-800 p-5 rounded-2xl glass space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
              <Briefcase className="w-4 h-4 mr-1.5 text-blue-400" />
              Recent Project Folders
            </h3>
            <button onClick={() => setView('projects')} className="text-[9.5px] text-[#0EA5E9] hover:underline font-bold">View All Projects</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-2 px-1">Project Name</th>
                  <th className="py-2 px-1">Type</th>
                  <th className="py-2 px-1">Region</th>
                  <th className="py-2 px-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-semibold text-slate-350">
                {recentProjects.map(proj => (
                  <tr key={proj.id} className="hover:bg-slate-900/20 text-slate-300 transition-colors">
                    <td className="py-2.5 px-1 font-bold text-slate-200">
                      <span className="block">{proj.name}</span>
                      <span className="text-[8.5px] text-slate-500 truncate max-w-[120px] block font-normal">{proj.description || 'No description'}</span>
                    </td>
                    <td className="py-2.5 px-1 capitalize">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        proj.renewable_type === 'wind' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0ea5e9]/20' : 'bg-[#16A34A]/10 text-emerald-400 border border-[#16A34A]/20'
                      }`}>
                        {proj.renewable_type || 'solar'}
                      </span>
                    </td>
                    <td className="py-2.5 px-1 text-slate-400">
                      <span className="block truncate max-w-[100px]">{proj.region || 'Global'}</span>
                      <span className="text-[8px] text-slate-500 block">{proj.country || 'Global'}</span>
                    </td>
                    <td className="py-2.5 px-1 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => startEdit(proj)} className="p-1 bg-slate-900 border border-slate-850 hover:border-blue-500/20 text-slate-400 hover:text-sky-400 rounded transition-all"><Edit3 className="w-3 h-3" /></button>
                        <button onClick={() => handleDeleteProject(proj.id)} className="p-1 bg-slate-900 border border-slate-855 hover:border-rose-500/20 text-slate-450 hover:text-rose-455 rounded transition-all"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 font-semibold space-y-3 font-sans">
                      <div className="text-xs">No projects available.</div>
                      <button
                        onClick={() => setIsCreatingProject(true)}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] text-white text-[10px] font-bold rounded shadow-md inline-flex items-center space-x-1 hover:opacity-90 transition-all font-sans"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Create Project</span>
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sites Table */}
        <div className="bg-[#111827]/80 border border-slate-800 p-5 rounded-2xl glass space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
              <MapPin className="w-4 h-4 mr-1.5 text-emerald-400" />
              Recent Sited Locations
            </h3>
            <button onClick={() => setView('map')} className="text-[9.5px] text-[#0ea5e9] hover:underline font-bold">View Siting Map</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-2 px-1">Location Name</th>
                  <th className="py-2 px-1">Coordinates</th>
                  <th className="py-2 px-1">Land Area</th>
                  <th className="py-2 px-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-semibold text-slate-350">
                {recentSites.map(s => (
                  <tr key={s.id} className="hover:bg-slate-900/20 text-slate-300 transition-colors">
                    <td className="py-2.5 px-1 font-bold text-slate-200">
                      <span className="block truncate max-w-[120px]">{s.name}</span>
                      <span className="text-[8.5px] text-slate-500 block truncate max-w-[120px] font-normal">{s.district || s.region || 'District Grid'}</span>
                    </td>
                    <td className="py-2.5 px-1 font-mono text-slate-400">
                      {s.latitude.toFixed(3)}°N, <br/>{s.longitude.toFixed(3)}°E
                    </td>
                    <td className="py-2.5 px-1 text-slate-400">
                      <span>{s.land_area ? `${s.land_area} Ha` : 'N/A'}</span>
                      <span className="text-[8.5px] text-slate-500 block">{s.elevation ? `${s.elevation}m Elev` : 'N/A'}</span>
                    </td>
                    <td className="py-2.5 px-1 text-right">
                      <button onClick={() => handleDeleteSite(s.id)} className="p-1 bg-slate-900 border border-slate-850 hover:border-rose-500/20 text-slate-400 hover:text-rose-455 rounded transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
                {sites.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-650 italic">No sited locations. Use Siting Map to add pins.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CREATE PROJECT MODAL */}
      {isCreatingProject && (
        <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full glass space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center">
                <FolderPlus className="w-4 h-4 mr-1.5 text-[#16A34A]" />
                Create New Project Portfolio
              </h3>
              <button onClick={() => setIsCreatingProject(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhadla Expansion"
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
                  placeholder="Summarize project scope details..."
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

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full glass space-y-4">
            <div className="flex justify-between items-center border-b border-slate-855 pb-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Edit Project Portfolio details
              </h3>
              <button onClick={() => setEditingProject(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleUpdateProject} className="space-y-4 text-xs">
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
                Save Project Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
