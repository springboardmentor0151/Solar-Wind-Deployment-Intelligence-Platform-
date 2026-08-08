import React from 'react';
import GeoEnergyLogo from './GeoEnergyLogo';
import { 
  Home,
  Globe,
  Briefcase,
  TrendingUp, 
  FileText, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  Users,
  MapPin,
  History,
  Compass,
  Sun,
  Wind,
  Activity
} from 'lucide-react';

export default function Sidebar({ currentView, setView, user, onLogout, unreadCount }) {
  
  const role = user ? user.role : 'planner';
  
  let navItems = [];
  if (role === 'admin') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'admin-projects', label: 'Projects', icon: Briefcase },
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'logs', label: 'Audit Logs', icon: History },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  } else if (role === 'analyst') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'gis-reviews', label: 'GIS Reviews', icon: Briefcase },
      { id: 'assigned-sites', label: 'Assigned Sites', icon: MapPin },
      { id: 'map', label: 'Map Validation', icon: Globe },
      { id: 'environmental', label: 'Environmental Review', icon: Compass },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  } else if (role === 'manager') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'projects', label: 'Projects', icon: Briefcase },
      { id: 'workflow', label: 'Workflow', icon: Activity },
      { id: 'milestones', label: 'Milestones', icon: Compass },
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  } else { // planner
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'projects', label: 'My Projects', icon: Briefcase },
      { id: 'map', label: 'GIS Map', icon: Globe },
      { id: 'environmental', label: 'Environmental Analysis', icon: Compass },
      { id: 'solar_prediction', label: 'Solar Prediction', icon: Sun },
      { id: 'wind_prediction', label: 'Wind Prediction', icon: Wind },
      { id: 'hybrid_prediction', label: 'Hybrid Prediction', icon: Activity },
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  }

  return (
    <aside className="w-64 bg-[#0f172a]/95 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 justify-between glass">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <GeoEnergyLogo type="full" size="normal" />
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-6">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
            Core Navigation
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600/20 to-sky-600/10 border-l-2 border-blue-500 text-blue-400 font-extrabold' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-355'
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-500 text-white rounded-full min-w-5 text-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User profile and logout at bottom */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-850 flex items-center justify-center text-slate-300 font-bold border border-slate-700 uppercase">
            {user.username.slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-200 truncate leading-tight">
              {user.full_name || user.username}
            </h4>
            <span className="text-[10px] text-slate-500 capitalize leading-none font-semibold">
              {user.role} Account
            </span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/45 hover:text-rose-455 border border-slate-700/60 text-slate-300 text-xs font-semibold transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
