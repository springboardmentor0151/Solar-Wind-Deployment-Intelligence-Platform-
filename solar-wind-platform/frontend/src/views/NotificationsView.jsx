import React from 'react';
import axios from 'axios';
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  Wind, 
  Sun, 
  ShieldAlert, 
  Info,
  Clock
} from 'lucide-react';

export default function NotificationsView({ notifications, projects = [], onRefreshData }) {
  
  const handleMarkRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/notifications/${notifId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast("All notifications marked as read.", "success");
      onRefreshData();
    } catch (err) {
      console.error(err);
      window.showToast("Failed to mark notifications as read.", "error");
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'weather':
        return <Wind className="w-4 h-4 text-sky-400" />;
      case 'risk':
        return <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />;
      case 'suitability':
        return <Sun className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getNotifBg = (type, isRead) => {
    if (isRead) return 'bg-slate-900/20 border-slate-800/40 opacity-70';
    switch (type) {
      case 'risk':
        return 'bg-rose-950/20 border-rose-800/40';
      case 'weather':
        return 'bg-sky-950/20 border-sky-800/40';
      case 'suitability':
        return 'bg-amber-950/20 border-amber-800/40';
      default:
        return 'bg-slate-900/60 border-slate-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#111827]/80 p-5 rounded-xl border border-slate-800/80 glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Bell className="w-5 h-5 text-purple-400 mr-2" />
            Platform Alert Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time warnings, constraint violations, and critical weather notifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold transition-all flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 font-bold font-sans">
            No project notifications available.
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 font-bold font-sans">
            Alert inbox is empty. Notifications are triggered when you register sites with terrain or climate hazards.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between ${getNotifBg(notif.type, notif.is_read)}`}
            >
              <div className="flex items-start space-x-3 text-xs">
                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded mt-0.5 shrink-0">
                  {getNotifIcon(notif.type)}
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-200 leading-normal block">{notif.message}</span>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(notif.created_at).toLocaleTimeString()} - {new Date(notif.created_at).toLocaleDateString()}</span>
                    <span className="capitalize px-1.5 py-0.25 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold">
                      {notif.type}
                    </span>
                  </div>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded transition-all shrink-0 ml-4"
                  title="Mark Read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
