import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SitesProvider } from "./context/SitesContext";
import AppShell from "./components/AppShell";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import SiteList from "./pages/SiteList";
import SiteDetail from "./pages/SiteDetail";
import Compare from "./pages/Compare";
import Reports from "./pages/Reports";
import CapacityPlanner from "./pages/CapacityPlanner";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-sm text-ink/40">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <SitesProvider>
      <AppShell>{children}</AppShell>
    </SitesProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/explore" element={<Protected><Explore /></Protected>} />
          <Route path="/sites" element={<Protected><SiteList /></Protected>} />
          <Route path="/sites/:siteId" element={<Protected><SiteDetail /></Protected>} />
          <Route path="/compare" element={<Protected><Compare /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="/planner" element={<Protected><CapacityPlanner /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
