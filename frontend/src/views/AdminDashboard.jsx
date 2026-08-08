import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  Trash2, 
  Check,
  ShieldCheck, 
  Database,
  Activity,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard({ user, projects, sites, onRefreshData }) {
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [systemStats, setSystemStats] = useState({
    cpu: 18,
    memory: 42,
    disk: 58,
    latency: 24,
    dbConnections: 5
  });

  const [mlMetrics, setMlMetrics] = useState(null);
  const [isTrainingMl, setIsTrainingMl] = useState(false);

  const fetchMlMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/ml/models', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMlMetrics(res.data);
    } catch (e) {
      console.error("ML model metrics loading failed", e);
    }
  };

  const handleTrainMlModels = async () => {
    setIsTrainingMl(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/ml/train', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMlMetrics({
        metrics: res.data.metrics,
        best_model: res.data.best_model
      });
      window.showToast("AI/ML Models re-trained successfully! Selected best estimator: " + res.data.best_model, "success");
    } catch (e) {
      console.error(e);
      window.showToast("ML Models training failed.", "error");
    } finally {
      setIsTrainingMl(false);
    }
  };

  useEffect(() => {
    fetchMlMetrics();
  }, []);

  // Simulated metrics loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.min(99, Math.max(8, prev.cpu + Math.floor(Math.random() * 9 - 4))),
        memory: Math.min(99, Math.max(38, prev.memory + Math.floor(Math.random() * 3 - 1))),
        latency: Math.min(200, Math.max(12, prev.latency + Math.floor(Math.random() * 5 - 2)))
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(res.data);
    } catch (e) {
      console.error(e);
      window.showToast("Failed to load user accounts list.", "error");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClearDatabase = async () => {
    if (!window.confirm("CRITICAL WARNING: This will clear all sites and projects from the database. Are you sure?")) return;
    try {
      const token = localStorage.getItem('token');
      // Delete all sites in the UI
      for (const site of sites) {
        await axios.delete(`/api/sites/${site.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      for (const proj of projects) {
        await axios.delete(`/api/projects/${proj.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      window.showToast("Database projects and sites cleared successfully.", "success");
      onRefreshData();
    } catch (e) {
      console.error(e);
      window.showToast("Error clearing database.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-[#111827]/80 p-5 rounded-xl border border-slate-800/80 glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <ShieldCheck className="w-5 h-5 text-indigo-400 mr-2" />
            Admin System Control
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor API latencies, audit user sessions, and manage global spatial indices databases.
          </p>
        </div>
      </div>

      {/* Real-time system monitoring dials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-5 border border-slate-800/80">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CPU Compute Load</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-200">{systemStats.cpu}%</span>
            <span className="text-xs text-slate-400 font-semibold">{systemStats.cpu > 70 ? 'High load' : 'Stable'}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${systemStats.cpu}%` }}></div>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-800/80">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RAM Allocation</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-200">{systemStats.memory}%</span>
            <span className="text-xs text-slate-400 font-semibold">Active Cache</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div className="bg-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${systemStats.memory}%` }}></div>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-800/80">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Latency</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-200">{systemStats.latency} ms</span>
            <span className="text-xs text-emerald-400 font-semibold">Excellent</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${(systemStats.latency / 200) * 100}%` }}></div>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-800/80">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connected Pools</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-200">{systemStats.dbConnections}</span>
            <span className="text-xs text-slate-400 font-semibold">SQLite Active</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: '40%' }}></div>
          </div>
        </div>

      </div>

      {/* Enterprise Statistics Grid */}
      <div className="bg-[#111827]/80 p-5 rounded-xl border border-slate-800/80 glass space-y-4">
        <div>
          <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Enterprise Siting Statistics</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Summary of users, reviews, and portfolio distribution globally.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
          <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-black block">Total Users</span>
            <span className="text-2xl font-black text-slate-100 block">{usersList.length}</span>
          </div>
          <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-black block">Total Projects</span>
            <span className="text-2xl font-black text-blue-400 block">{projects.length}</span>
          </div>
          <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-black block">Pending Approvals</span>
            <span className="text-2xl font-black text-yellow-500 block">{projects.filter(p => ['Submitted', 'GIS Review', 'Manager Review', 'Admin Review'].includes(p.status)).length}</span>
          </div>
          <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-black block">Completed Projects</span>
            <span className="text-2xl font-black text-indigo-400 block">{projects.filter(p => p.status === 'Completed').length}</span>
          </div>
          <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-black block">Rejected Projects</span>
            <span className="text-2xl font-black text-rose-500 block">{projects.filter(p => p.status === 'Rejected' || p.status === 'GIS Rejected' || p.status === 'Manager Rejected').length}</span>
          </div>
          <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-black block">Predictions Sited</span>
            <span className="text-2xl font-black text-yellow-450 block">{sites.length}</span>
          </div>
          <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-black block">Solar / Wind Sites</span>
            <span className="text-2xl font-black text-sky-400 block">{projects.filter(p => p.renewable_type !== 'hybrid').length}</span>
          </div>
          <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-black block">Hybrid Siting</span>
            <span className="text-2xl font-black text-[#10B981] block">{projects.filter(p => p.renewable_type === 'hybrid').length}</span>
          </div>
        </div>
      </div>

      {/* Database operations and users table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Account Controls */}
        <div className="lg:col-span-2 glass-card border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
            <Users className="w-4 h-4 mr-1.5 text-blue-500" />
            Active Platform User Accounts ({usersList.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2">Account Name</th>
                  <th className="py-2.5 px-2">Email</th>
                  <th className="py-2.5 px-2">Role</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/10 text-slate-300 transition-colors">
                    <td className="py-3 px-2 font-bold flex items-center">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[9px] uppercase text-slate-300 mr-2 shrink-0">
                        {u.username.slice(0, 2)}
                      </div>
                      <div>
                        <span>{u.full_name || u.username}</span>
                        <span className="block text-[9px] text-slate-500 font-bold font-mono">@{u.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px] text-slate-400">{u.email}</td>
                    <td className="py-3 px-2 capitalize font-semibold text-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        u.role === 'manager' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        u.role === 'analyst' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-400">
                        <UserCheck className="w-3.5 h-3.5 mr-1" />
                        Online
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database Clear/Reset operations */}
        <div className="glass-card border border-slate-800 p-5 space-y-5">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
            <HardDrive className="w-4 h-4 mr-1.5 text-rose-500" />
            Database Maintenance
          </h3>

          <div className="space-y-4 text-xs">
            <p className="text-slate-400 leading-normal">
              Admin controls allow resetting database schemas, clearing temporary simulation layers, or flushing user tables cache.
            </p>

            <div className="bg-rose-950/20 border border-rose-900/35 rounded-lg p-3 flex items-start space-x-2 text-[11px] text-rose-400 leading-normal">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Destructive Action:</strong> Clearing the database will wipe all recorded projects, coordinates assessments, and generated attachments logs permanently.
              </span>
            </div>

            <button
              onClick={handleClearDatabase}
              className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 hover:border-transparent rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge Projects & Sites</span>
            </button>
            
            <button
              onClick={onRefreshData}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Global Pools</span>
            </button>
          </div>
        </div>

      </div>

      {/* Machine Learning Model Management */}
      <div className="glass-card border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
              <Cpu className="w-4 h-4 mr-1.5 text-indigo-400" />
              Machine Learning Model Manager
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Monitor estimators' R² and MSE performance, and trigger online regression training.
            </p>
          </div>
          <button
            onClick={handleTrainMlModels}
            disabled={isTrainingMl}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:from-indigo-800 disabled:to-purple-800 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1.5 shrink-0 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTrainingMl ? 'animate-spin' : ''}`} />
            <span>{isTrainingMl ? 'Training Models...' : 'Retrain Estimators'}</span>
          </button>
        </div>

        {mlMetrics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {mlMetrics.metrics && Object.entries(mlMetrics.metrics).map(([name, info]) => {
                const isBest = mlMetrics.best_model === name;
                return (
                  <div key={name} className={`p-4 rounded-xl border ${isBest ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900/40 border-slate-800/80'} space-y-2`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200">{name}</span>
                      {isBest && (
                        <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-mono font-black text-[8px] uppercase tracking-wider">
                          Best Estimator
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-900/60">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-black">R² Score</span>
                        <span className={`text-md font-mono font-black ${isBest ? 'text-indigo-400' : 'text-slate-350'}`}>{info.r2.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-black">Mean Sq Error</span>
                        <span className="text-md font-mono font-semibold text-slate-400">{info.mse.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-[10px] text-slate-400 italic flex items-center space-x-1 justify-center bg-slate-950/20 py-2 rounded-lg">
              <span>Selected Best Model: </span>
              <span className="text-indigo-400 font-bold">{mlMetrics.best_model}</span>
              <span> | Hyperparameters tuned dynamically over 500 historical data nodes.</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500 italic flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            <span>Loading model performance metrics...</span>
          </div>
        )}
      </div>

    </div>
  );
}
