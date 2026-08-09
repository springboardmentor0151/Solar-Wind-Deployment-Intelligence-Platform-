import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import CreateProject from "./pages/CreateProject";
import SiteAnalysis from "./pages/SiteAnalysis";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

import { AuthProvider } from "./Authentication/AuthContext";
import ProtectedRoute from "./Authentication/ProtectedRoute";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />

            <Route path="/projects" element={
              <ProtectedRoute><Projects /></ProtectedRoute>
            } />

            <Route path="/projects/:id" element={
              <ProtectedRoute><ProjectDetails /></ProtectedRoute>
            } />

            <Route path="/create-project" element={
              <ProtectedRoute allowedRoles={["analyst"]}><CreateProject /></ProtectedRoute>
            } />

            <Route path="/analysis" element={
              <ProtectedRoute allowedRoles={["analyst"]}><SiteAnalysis /></ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute><Reports /></ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
