import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  RefreshCw, 
  Info, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Search
} from 'lucide-react';

export default function ActivityLogsView({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Seed high fidelity mock audit logs
  const [logs, setLogs] = useState([
    { id: 1, type: 'audit', event: 'User login successfully', user: 'planner@solarwind.io', ip: '192.168.1.14', time: 'Just Now', status: 'success' },
    { id: 2, type: 'info', event: 'Queried Open-Meteo weather API', user: 'Sarah Chen (analyst)', ip: '10.0.4.150', time: '5 mins ago', status: 'info' },
    { id: 3, type: 'warning', event: 'Ecological protected zone intersection check triggered', user: 'System Agent', ip: 'localhost', time: '12 mins ago', status: 'warning' },
    { id: 4, type: 'audit', event: 'Created project folder "Rajasthan Desert Solar Initiative"', user: 'planner@solarwind.io', ip: '192.168.1.14', time: '30 mins ago', status: 'success' },
    { id: 5, type: 'info', event: 'Altered SQLite schema columns dynamically', user: 'System Migration', ip: 'localhost', time: '1 hour ago', status: 'info' },
    { id: 6, type: 'audit', event: 'Disabled user account "disabled_planner_test"', user: 'System Admin', ip: '192.168.1.2', time: '3 hours ago', status: 'warning' },
    { id: 7, type: 'warning', event: 'JWT Token expired for analyst session', user: 'analyst@solarwind.io', ip: '192.168.1.53', time: '5 hours ago', status: 'warning' },
    { id: 8, type: 'info', event: 'Exported suitability assessment PDF report', user: 'Elena Rostova (manager)', ip: '10.0.1.20', time: '8 hours ago', status: 'success' }
  ]);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear system activity logs? This cannot be undone.")) {
      setLogs([]);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'warning':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
      default:
        return <Info className="w-3.5 h-3.5 text-[#0EA5E9]" />;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <History className="w-5 h-5 text-indigo-400 mr-2" />
            Security & Activity Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of platform configuration updates, API queries, and login attempts.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-rose-950/20 text-slate-400 hover:text-rose-455 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Logs</span>
          </button>
        </div>
      </div>

      {/* Audit Panel */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-6 glass space-y-4">
        
        {/* Search filter bar */}
        <div className="flex items-center space-x-3 bg-slate-950/60 border border-slate-850 px-3 py-1.5 rounded-xl max-w-sm">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter logs by event or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-600 font-semibold"
          />
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950/60">
          <table className="w-full text-left border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-900/50 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Status</th>
                <th className="p-3">Audit Log Event Description</th>
                <th className="p-3">Account Email</th>
                <th className="p-3 font-mono">IP Address</th>
                <th className="p-3 text-right">Event Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-semibold text-slate-350">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-3 shrink-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 border border-slate-850">
                      {getStatusIcon(log.status)}
                    </span>
                  </td>
                  <td className="p-3 text-slate-100 font-bold">
                    {log.event}
                  </td>
                  <td className="p-3 text-[#0EA5E9] font-mono text-[10px]">
                    {log.user}
                  </td>
                  <td className="p-3 font-mono text-slate-500">
                    {log.ip}
                  </td>
                  <td className="p-3 text-right text-slate-500 font-mono flex items-center justify-end space-x-1.5 mt-1.5 border-none">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{log.time}</span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-650 italic">No activity logs matching search term.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
