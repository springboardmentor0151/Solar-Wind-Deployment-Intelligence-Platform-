import { lazy, Suspense } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Landing = lazy(() => import("../pages/Landing"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Projects = lazy(() => import("../pages/Projects"));
const Sites = lazy(() => import("../pages/Sites"));
const Profile = lazy(() => import("../pages/Profile"));
const ChangePassword = lazy(() => import("../pages/ChangePassword"));
const Analysis = lazy(() => import("../pages/Analysis"));

import AppLayout from "../layouts/AppLayout";
import Spinner from "../components/ui/Spinner";

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("access_token");

    return token ? children : <Navigate to="/login" replace />;
}

function PageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-night-950">
            <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400">
                    <Spinner size={32} className="text-white" />
                </div>
                <p className="text-sm text-slate-400 animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
}

function AppRoutes() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>

                    {/* Landing */}
                    <Route path="/" element={<Landing />} />

                    <Route
                        path="/login"
                        element={
                            localStorage.getItem("access_token")
                                ? <Navigate to="/dashboard" replace />
                                : <Login />
                        }
                    />

                    <Route
                        path="/register"
                        element={
                            localStorage.getItem("access_token")
                                ? <Navigate to="/dashboard" replace />
                                : <Register />
                        }
                    />

                    {/* Dashboard */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Dashboard />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

{/* Projects */}
                    <Route
                        path="/projects"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Projects />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Sites */}
                    <Route
                        path="/sites"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Sites />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Analysis */}
                    <Route
                        path="/analysis"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Analysis />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Profile */}
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Profile />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

{/* Change Password */}
                    <Route
                        path="/change-password"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <ChangePassword />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default AppRoutes;
