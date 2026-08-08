import React, { useState } from 'react';
import { Settings, Eye, Key, Bell, Shield } from 'lucide-react';

export default function SettingsView({ user }) {
  const [theme, setTheme] = useState('dark');
  const [notifAlerts, setNotifAlerts] = useState(true);
  const [apiKey, setApiKey] = useState('pk_live_51MzkGeoEnergyAI2026x92d1a3f019');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Banner */}
      <div className="bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass">
        <h2 className="text-xl font-bold text-slate-100 flex items-center">
          <Settings className="w-5 h-5 text-slate-400 mr-2" />
          Platform Configurations
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust preferences, manage alert feeds, and authenticate developer integrations.
        </p>
      </div>

      <div className="max-w-2xl bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass space-y-6 text-xs font-semibold">
        
        {/* Theme Settings */}
        <div className="space-y-2 pb-4 border-b border-slate-900">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block flex items-center">
            <Eye className="w-3.5 h-3.5 text-blue-400 mr-1.5" /> Appearance
          </span>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-slate-200 block">Dark Mode Theme</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Use low-contrast midnight layout for solar overlays.</span>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded-lg py-1.5 px-3 glass-input font-bold"
            >
              <option value="dark">Midnight Dark (Recommended)</option>
              <option value="light">Solar Light</option>
            </select>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="space-y-2 pb-4 border-b border-slate-900">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block flex items-center">
            <Bell className="w-3.5 h-3.5 text-purple-400 mr-1.5" /> Notifications Alerts
          </span>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-slate-200 block">Feasibility Complete Alerts</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Trigger notification sound and header badge on analysis finishes.</span>
            </div>
            <input
              type="checkbox"
              checked={notifAlerts}
              onChange={() => setNotifAlerts(!notifAlerts)}
              className="rounded bg-slate-950 border-slate-850 text-[#16A34A] focus:ring-0"
            />
          </div>
        </div>

        {/* API Authentication keys */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block flex items-center">
            <Key className="w-3.5 h-3.5 text-amber-400 mr-1.5" /> Developer Integrations
          </span>
          <div className="space-y-2">
            <span className="text-slate-200 block">Platform Secret API Token</span>
            <div className="flex space-x-2">
              <input
                type={showKey ? 'text' : 'password'}
                readOnly
                value={apiKey}
                className="flex-1 rounded-lg py-1.5 px-3 bg-slate-950 border border-slate-900 text-slate-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 transition-all hover:bg-slate-800"
              >
                Reveal Key
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
