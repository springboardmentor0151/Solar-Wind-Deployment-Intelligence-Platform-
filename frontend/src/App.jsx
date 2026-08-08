import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Sites from "./pages/Sites";
import Environmental from "./pages/Environmental";
import Solar from "./pages/Solar";
import Wind from "./pages/Wind";
import Report from "./pages/Report";
import Profile from "./pages/Profile";
import GISMap from "./pages/GISMap";
import SiteSuitability from "./pages/SiteSuitability";
import DeploymentOptimization from "./pages/DeploymentOptimization";
import Forecast from "./pages/Forecast";
import InvestmentRecommendation from "./pages/InvestmentRecommendation";


// NEW PAGE (we'll create this in Step 2)

import ProjectSites from "./pages/ProjectSites";
import SiteDashboard from "./pages/SiteDashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Projects */}
        <Route path="/projects" element={<Projects />} />

        {/* NEW ROUTE */}
        <Route
  path="/projects/:projectId/sites"
  element={<ProjectSites />}

/>
<Route
  path="/sites/:siteId"
  element={<SiteDashboard />}
/>
<Route
    path="/sites/:siteId/gis"
    element={<GISMap />}
/>

<Route
  path="/sites/:siteId/environment"
  element={<Environmental />}
/>
<Route
    path="/sites/:siteId/solar"
    element={<Solar />}
/>
<Route
    path="/sites/:siteId/wind"
    element={<Wind />}
/>
<Route path="/sites/:siteId/forecast" element={<Forecast />} />
<Route
  path="/sites/:siteId/investment"
  element={<InvestmentRecommendation />}
/>
<Route
    path="/sites/:siteId/report"
    element={<Report />}
/>
<Route
    path="/profile"
    element={<Profile />}
/>
       
      </Routes>
    </BrowserRouter>
  );
}

export default App;