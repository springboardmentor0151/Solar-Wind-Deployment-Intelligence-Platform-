import React, { useEffect, useState } from 'react';
import GeoEnergyLogo from './components/GeoEnergyLogo';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import LoginView from './views/LoginView';
import LandingView from './views/LandingView';
import PlannerDashboard from './views/PlannerDashboard';
import GisDashboard from './views/GisDashboard';
import GisReviewsView from './views/GisReviewsView';
import AssignedSitesView from './views/AssignedSitesView';
import ManagerDashboard from './views/ManagerDashboard';
import AdminDashboard from './views/AdminDashboard';
import NotificationsView from './views/NotificationsView';
import SelectLocationView from './views/SelectLocationView';
import ProjectsView from './views/ProjectsView';
import AnalyticsView from './views/AnalyticsView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import ProfileView from './views/ProfileView';
import UserManagementView from './views/UserManagementView';
import AdminProjectsView from './views/AdminProjectsView';
import AdminSitesView from './views/AdminSitesView';
import ActivityLogsView from './views/ActivityLogsView';
import AccessDeniedView from './views/AccessDeniedView';
import CompleteProfileView from './views/CompleteProfileView';
import ProjectDetailsView from './views/ProjectDetailsView';
import ResetPasswordView from './views/ResetPasswordView';
import EnvironmentalView from './pages/Environmental/EnvironmentalView';
import SolarPredictionView from './pages/SolarPrediction/SolarPredictionView';
import WindPredictionView from './pages/WindPrediction/WindPredictionView';
import HybridPredictionView from './pages/HybridPrediction/HybridPredictionView';
import { Shield, Sparkles, User } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setViewInternal] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Toast Notification System
  const [toasts, setToasts] = useState([]);
  
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    window.showToast = showToast;
    return () => {
      delete window.showToast;
    };
  }, []);

  const setView = (viewName, projId = null) => {
    setViewInternal(viewName);
    if (projId !== null) {
      setSelectedProjectId(projId);
    }
  };
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // URL Path Routing State (New flow)
  const [path, setPath] = useState(window.location.pathname);

  // Popstate listener to support browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Custom navigation trigger
  const navigate = (newPath) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  // Redirect handling rules (New flow)
  useEffect(() => {
    if (isInitializing) return;

    if (user) {
      if (user.is_onboarded === false) {
        if (path !== '/complete-profile') {
          navigate('/complete-profile');
        }
      } else {
        // Logged in and onboarded users automatically redirect to /dashboard
        if (path === '/' || path === '/login' || path === '/register' || path === '/complete-profile') {
          navigate('/dashboard');
        }
      }
    } else {
      // Unauthenticated users trying to access dashboard or complete-profile redirect to /login
      if (path === '/dashboard' || path === '/complete-profile') {
        navigate('/login');
      }
    }
  }, [user, path, isInitializing]);

  // Authenticate user on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          setView('dashboard');
        } catch (e) {
          console.error("Token invalid, signing out");
          handleLogout();
        }
      }
      setIsInitializing(false);
    };
    checkAuth();
  }, []);

  // Fetch all projects, sites, and notifications
  const refreshData = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [projRes, siteRes, notifRes] = await Promise.all([
        axios.get('/api/projects', { headers }),
        axios.get('/api/sites', { headers }),
        axios.get('/api/notifications', { headers })
      ]);
      
      setProjects(projRes.data);
      setSites(siteRes.data);
      setNotifications(notifRes.data);
    } catch (e) {
      console.error("Failed to sync pools data", e);
    }
  };

  // Sync data whenever user logs in or is verified
  useEffect(() => {
    if (user) {
      refreshData();
      // Poll data every 5 seconds silently
      const interval = setInterval(refreshData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    console.log("[GOOGLE AUTH DEBUG] handleLoginSuccess called. userData.is_onboarded:", userData?.is_onboarded);
    if (userData && userData.is_onboarded === false) {
      setView('complete-profile');
      navigate('/complete-profile');
    } else {
      setView('dashboard');
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error("Logout request failed", e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setUser(null);
    setProjects([]);
    setSites([]);
    setNotifications([]);
    navigate('/'); // Route back to landing page on logout
    window.showToast("You have been logged out successfully.", "success");
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <GeoEnergyLogo type="icon" className="w-16 h-16 animate-pulse" />
          <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Initializing GeoEnergy AI...</span>
        </div>
      </div>
    );
  }

  // --- Render logic based on path and user authentication state ---

  // Landing Page: /
  if (path === '/' && !user) {
    return <LandingView navigate={navigate} />;
  }

  // Login Page: /login
  if (path === '/login' && !user) {
    return <LoginView initialIsLogin={true} onLoginSuccess={handleLoginSuccess} navigate={navigate} />;
  }

  // Register Page: /register
  if (path === '/register' && !user) {
    return <LoginView initialIsLogin={false} onLoginSuccess={handleLoginSuccess} navigate={navigate} />;
  }

  // Reset Password Page: /reset-password
  if (path.startsWith('/reset-password') && !user) {
    return <ResetPasswordView navigate={navigate} />;
  }

  // Fallback for unauthenticated paths
  if (!user) {
    return <LandingView navigate={navigate} />;
  }

  // Force onboarding if logged in but not onboarded (safeguard)
  if (user && user.is_onboarded === false) {
    return <CompleteProfileView user={user} onOnboardingSuccess={handleLoginSuccess} navigate={navigate} />;
  }

  // Dashboard Page: /dashboard (renders sidebar and sub-views switcher)
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const roleAllowedViews = {
    admin: ['dashboard', 'users', 'admin-projects', 'reports', 'analytics', 'logs', 'notifications', 'settings', 'profile', 'project-details'],
    planner: ['dashboard', 'projects', 'map', 'environmental', 'solar_prediction', 'wind_prediction', 'hybrid_prediction', 'reports', 'notifications', 'profile', 'project-details'],
    analyst: ['dashboard', 'gis-reviews', 'assigned-sites', 'map', 'environmental', 'notifications', 'profile', 'project-details'],
    manager: ['dashboard', 'projects', 'workflow', 'milestones', 'reports', 'notifications', 'profile', 'project-details']
  };
  const isAccessDenied = user && !roleAllowedViews[user.role]?.includes(currentView);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        user={user} 
        onLogout={handleLogout} 
        unreadCount={unreadCount}
      />

      {/* Main Panel Content wrapper */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0f172a]/60 backdrop-blur-md px-8 flex justify-between items-center z-20 sticky top-0">
          <div className="flex items-center space-x-3">
            <GeoEnergyLogo type="icon" className="w-6 h-6 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">GeoEnergy AI System Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800/60 border border-slate-700/60 rounded-full text-xs font-bold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="capitalize">{user.role} Portal</span>
            </div>
          </div>
        </header>

        {/* View Switcher Container */}
        <main className="flex-1 p-8 overflow-y-auto">
          {isAccessDenied ? (
            <AccessDeniedView setView={setView} />
          ) : (
            <>
              {currentView === 'dashboard' && (
                user.role === 'admin' ? (
                  <AdminDashboard 
                    user={user} 
                    projects={projects} 
                    sites={sites} 
                    onRefreshData={refreshData} 
                  />
                ) : user.role === 'analyst' ? (
                  <GisDashboard 
                    user={user} 
                    projects={projects} 
                    setView={setView}
                  />
                ) : user.role === 'manager' ? (
                  <ManagerDashboard 
                    user={user} 
                    projects={projects} 
                    sites={sites} 
                    onRefreshData={refreshData} 
                    setView={setView}
                  />
                ) : (
                  <PlannerDashboard 
                    user={user} 
                    projects={projects} 
                    sites={sites} 
                    onRefreshData={refreshData} 
                    setView={setView}
                  />
                )
              )}

              {currentView === 'gis-reviews' && (
                <GisReviewsView 
                  user={user} 
                  projects={projects}
                  onRefreshData={refreshData}
                />
              )}

              {currentView === 'assigned-sites' && (
                <AssignedSitesView 
                  user={user} 
                  projects={projects}
                />
              )}

              {currentView === 'workflow' && (
                <ManagerDashboard 
                  user={user} 
                  projects={projects} 
                  sites={sites} 
                  onRefreshData={refreshData} 
                  setView={setView}
                  initialSection="workflow"
                />
              )}

              {currentView === 'milestones' && (
                <ManagerDashboard 
                  user={user} 
                  projects={projects} 
                  sites={sites} 
                  onRefreshData={refreshData} 
                  setView={setView}
                  initialSection="milestones"
                />
              )}

              {currentView === 'users' && (
                <UserManagementView user={user} />
              )}

              {currentView === 'admin-projects' && (
                <AdminProjectsView
                  user={user}
                  projects={projects}
                  sites={sites}
                  onRefreshData={refreshData}
                />
              )}

              {currentView === 'admin-sites' && (
                <AdminSitesView
                  user={user}
                  projects={projects}
                  sites={sites}
                  onRefreshData={refreshData}
                />
              )}

              {currentView === 'logs' && (
                <ActivityLogsView user={user} />
              )}

              {currentView === 'map' && (
                <SelectLocationView 
                  user={user}
                  projects={projects}
                  sites={sites}
                  onSiteCreated={refreshData}
                />
              )}

              {currentView === 'projects' && (
                <ProjectsView
                  user={user}
                  projects={projects}
                  sites={sites}
                  onRefreshData={refreshData}
                  setView={setView}
                />
              )}

              {currentView === 'environmental' && (
                <EnvironmentalView setView={setView} />
              )}

              {currentView === 'solar_prediction' && (
                <SolarPredictionView setView={setView} />
              )}

              {currentView === 'wind_prediction' && (
                <WindPredictionView setView={setView} />
              )}

              {currentView === 'hybrid_prediction' && (
                <HybridPredictionView setView={setView} />
              )}

              {currentView === 'analytics' && (
                <AnalyticsView
                  projects={projects}
                  sites={sites}
                />
              )}

              {currentView === 'reports' && (
                <ReportsView
                  user={user}
                  projects={projects}
                  sites={sites}
                  setView={setView}
                />
              )}

              {currentView === 'settings' && (
                <SettingsView
                  user={user}
                />
              )}

              {currentView === 'profile' && (
                <ProfileView
                  user={user}
                  setUser={setUser}
                />
              )}

              {currentView === 'notifications' && (
                <NotificationsView 
                  notifications={notifications} 
                  projects={projects}
                  onRefreshData={refreshData} 
                />
              )}

              {currentView === 'project-details' && (
                <ProjectDetailsView
                  projectId={selectedProjectId}
                  user={user}
                  sites={sites}
                  setView={setView}
                  onRefreshData={refreshData}
                />
              )}

              {/* Fallback support for existing role routing checks */}
              {currentView === 'gis' && (
                <GisDashboard 
                  user={user} 
                  projects={projects} 
                  sites={sites} 
                  onRefreshData={refreshData} 
                />
              )}

              {currentView === 'manager' && (
                <ManagerDashboard 
                  user={user} 
                  projects={projects} 
                  sites={sites} 
                />
              )}

              {currentView === 'admin' && (
                <AdminDashboard 
                  user={user} 
                  projects={projects} 
                  sites={sites} 
                  onRefreshData={refreshData} 
                />
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Toast Notifications Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          let bg = 'bg-slate-900/95 border-slate-800 text-slate-100';
          let border = 'border-l-4';
          let icon = 'ℹ';
          
          if (toast.type === 'success') {
            bg = 'bg-[#0f172a]/95 border-[#10B981] text-[#e2e8f0]';
            border = 'border-l-4 border-l-[#10B981] border-slate-800';
            icon = '✔';
          } else if (toast.type === 'error') {
            bg = 'bg-[#0f172a]/95 border-[#EF4444] text-[#e2e8f0]';
            border = 'border-l-4 border-l-[#EF4444] border-slate-800';
            icon = '✖';
          } else if (toast.type === 'warning') {
            bg = 'bg-[#0f172a]/95 border-[#F59E0B] text-[#e2e8f0]';
            border = 'border-l-4 border-l-[#F59E0B] border-slate-800';
            icon = '⚠';
          } else if (toast.type === 'info') {
            bg = 'bg-[#0f172a]/95 border-[#3B82F6] text-[#e2e8f0]';
            border = 'border-l-4 border-l-[#3B82F6] border-slate-800';
            icon = 'ℹ';
          }
          
          return (
            <div
              key={toast.id}
              className={`p-4 rounded-xl border shadow-2xl glass flex items-center gap-3 transition-all duration-300 pointer-events-auto transform translate-y-0 opacity-100 ${bg} ${border}`}
              style={{
                animation: 'slide-in 0.3s ease-out forwards'
              }}
            >
              <span className="text-sm font-bold shrink-0">{icon}</span>
              <div className="text-xs font-semibold leading-normal flex-1">{toast.message}</div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-500 hover:text-slate-350 text-xs font-bold font-sans ml-2"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
