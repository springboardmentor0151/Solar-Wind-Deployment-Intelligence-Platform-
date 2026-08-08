import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Layers, 
  Activity, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function GisDashboard({ user, projects, setView }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/gis/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (e) {
        console.error("Failed to load GIS dashboard stats", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [projects]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-450">
        <Activity className="w-6 h-6 animate-spin mr-2 text-emerald-400" />
        <span>Loading GIS Dashboard Overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Layers className="w-5 h-5 text-emerald-400 mr-2" />
            GIS Analyst Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Perform terrain slopes, proximity constraints checks, and integrate environmental vector layers.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Pending Reviews</span>
          <span className="text-xl font-black text-yellow-500 mt-1 block">
            {stats?.pending_reviews_count || 0}
          </span>
        </div>
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Completed Reviews</span>
          <span className="text-xl font-black text-emerald-400 mt-1 block">
            {stats?.approved_reviews_count || 0}
          </span>
        </div>
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Rejected Reviews</span>
          <span className="text-xl font-black text-rose-500 mt-1 block">
            {stats?.rejected_reviews_count || 0}
          </span>
        </div>
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Average Review Time</span>
          <span className="text-xl font-black text-sky-400 mt-1 block">
            {stats?.average_review_time || "2.4 Hours"}
          </span>
        </div>
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Assigned Sites</span>
          <span className="text-xl font-black text-indigo-400 mt-1 block">
            {stats?.assigned_sites_count || 0}
          </span>
        </div>
      </div>

      {/* Main Grid: Activities & Assigned Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Assigned Projects */}
        <div className="glass-card border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
            <TrendingUp className="w-4 h-4 mr-1.5 text-blue-500" />
            Latest Assigned Campaigns
          </h3>
          
          <div className="space-y-3">
            {stats?.latest_assigned_projects?.map(p => (
              <div key={p.id} className="flex justify-between items-center text-xs font-semibold p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                <div>
                  <span className="text-slate-200 font-bold block">{p.name}</span>
                  <span className="text-[10px] text-slate-550 block mt-0.5">
                    Assigned: {p.assignment_date ? new Date(p.assignment_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  p.status.includes('Approved') || p.status.includes('Review') ? 'bg-emerald-500/10 text-emerald-450' : 
                  p.status.includes('Rejected') ? 'bg-rose-500/10 text-rose-400' : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
            {!stats?.latest_assigned_projects?.length && (
              <p className="text-xs text-slate-500 italic text-center py-4">No campaigns assigned yet.</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="glass-card border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
            <Activity className="w-4 h-4 mr-1.5 text-blue-500" />
            Recent Action Logs
          </h3>
          
          <div className="space-y-3">
            {stats?.recent_activities?.map(act => (
              <div key={act.id} className="text-xs p-3 bg-slate-900/60 rounded-xl border border-slate-850 space-y-1">
                <p className="text-slate-300 font-semibold leading-normal">{act.message}</p>
                <span className="text-[9px] font-bold text-slate-555 block">
                  {new Date(act.created_at).toLocaleString()}
                </span>
              </div>
            ))}
            {!stats?.recent_activities?.length && (
              <p className="text-xs text-slate-500 italic text-center py-4">No recent action logs found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action buttons */}
      <div className="glass-card border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
          <FileText className="w-4 h-4 mr-1.5 text-blue-500" />
          GIS Analyst Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setView('gis-reviews')}
            className="p-4 bg-slate-950/60 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-700 rounded-2xl text-left transition-all group flex justify-between items-center"
          >
            <div>
              <span className="text-xs font-bold text-slate-200 block group-hover:text-blue-400">Launch GIS Reviews validation queue</span>
              <p className="text-[10px] text-slate-500 mt-1">Review coordinates, slopes, rainfall constraints, and finalize decisions.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => setView('assigned-sites')}
            className="p-4 bg-slate-950/60 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-700 rounded-2xl text-left transition-all group flex justify-between items-center"
          >
            <div>
              <span className="text-xs font-bold text-slate-200 block group-hover:text-blue-400">Open Assigned Locations Map</span>
              <p className="text-[10px] text-slate-500 mt-1">Visualize vector boundaries on Leaflet interactive overlay.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
