import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  MapPin, 
  Trash2, 
  Edit3, 
  Briefcase, 
  RefreshCw, 
  ExternalLink,
  Compass,
  Calendar
} from 'lucide-react';

export default function AdminSitesView({ user, projects, sites, onRefreshData }) {
  const [editingSite, setEditingSite] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLandArea, setEditLandArea] = useState(0);
  const [editLandOwnership, setEditLandOwnership] = useState('');

  useEffect(() => {
    if (onRefreshData) {
      onRefreshData();
    }
  }, []);

  const getProjectName = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    return proj ? proj.name : `Project ID: ${projectId}`;
  };

  const handleEditSite = (site) => {
    setEditingSite(site);
    setEditName(site.name);
    setEditLandArea(site.land_area || 0);
    setEditLandOwnership(site.land_ownership || 'Public');
  };

  const handleUpdateSite = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/sites/${editingSite.id}`, {
        name: editName,
        land_area: editLandArea,
        land_ownership: editLandOwnership
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast("Site details updated successfully.", "success");
      setEditingSite(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
      window.showToast("Failed to update site details.", "error");
    }
  };

  const handleDeleteSite = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete site "${name}"? This will remove all resource records.`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/sites/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast("Site deleted successfully.", "success");
      onRefreshData();
    } catch (err) {
      console.error(err);
      window.showToast("Failed to delete site.", "error");
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <MapPin className="w-5 h-5 text-emerald-400 mr-2 animate-bounce" />
            Global Site Locations Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit, update, or remove persistent siting records and geographical layers platform-wide.
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

      {/* Sites Listing Table */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-6 glass space-y-4">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Persistent Locations Database ({sites.length})</span>
        <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950/60">
          <table className="w-full text-left border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-900/50 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Site Siting Details</th>
                <th className="p-3">Project Workspace</th>
                <th className="p-3">Geographic Region</th>
                <th className="p-3">Scores</th>
                <th className="p-3">Configuration Sizing</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-semibold text-slate-350">
              {sites.map(s => {
                const dt = s.analysis_date || s.created_at;
                const displayDate = dt ? new Date(dt).toLocaleDateString() : 'N/A';
                
                return (
                  <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-3 font-bold text-slate-100">
                      <span className="block">{s.name}</span>
                      <span className="text-[8.5px] font-mono text-slate-500">{s.latitude.toFixed(4)}°N, {s.longitude.toFixed(4)}°E</span>
                    </td>
                    <td className="p-3 font-bold text-indigo-400">
                      <span className="flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        {getProjectName(s.project_id)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-450 leading-tight">
                      <span className="block text-slate-200">{s.district || s.region || 'District Grid'}</span>
                      <span className="block text-[9.5px] text-slate-500">{s.state || 'State Zone'}, {s.country || 'Global'}</span>
                    </td>
                    <td className="p-3">
                      <strong className="text-emerald-400 text-xs block">{s.suitability_score}%</strong>
                      <span className="text-[9px] text-slate-500 block uppercase font-black">{s.suitability_category || 'Excellent'}</span>
                    </td>
                    <td className="p-3 text-slate-400">
                      <span className="text-[#0EA5E9] font-black block flex items-center font-bold">
                        {s.recommended_plant || 'Solar PV System'}
                      </span>
                      <span className="text-[9px] text-slate-500 block flex items-center mt-0.5">
                        <Calendar className="w-3 h-3 mr-1" />
                        {displayDate}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditSite(s)}
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-blue-500/20 text-slate-450 hover:text-sky-400 rounded-lg transition-all"
                          title="Edit Site Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSite(s.id, s.name)}
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-rose-500/20 text-slate-455 hover:text-rose-455 rounded-lg transition-all"
                          title="Delete Site"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sites.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-650 italic">No persistent sites registered on the system.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT SITE MODAL */}
      {editingSite && (
        <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full glass space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Edit Siting Config Details
              </h3>
              <button onClick={() => setEditingSite(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleUpdateSite} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Site Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Land Area (Hectares)</label>
                <input
                  type="number"
                  required
                  value={editLandArea}
                  onChange={(e) => setEditLandArea(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Ownership Category</label>
                <select
                  value={editLandOwnership}
                  onChange={(e) => setEditLandOwnership(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                >
                  <option value="Public BLM Lease">Public BLM Lease</option>
                  <option value="Private Lease">Private Lease</option>
                  <option value="Federal Freehold">Federal Freehold</option>
                  <option value="State Government Lease">State Government Lease</option>
                  <option value="Private Agricultural Lease">Private Agricultural Lease</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-lg font-bold transition-all shadow"
              >
                Save Siting Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
