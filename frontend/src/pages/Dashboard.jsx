import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineFolderOpen,
  HiOutlineMapPin,
  HiOutlineDocumentChartBar,
  HiOutlinePlusCircle,
} from "react-icons/hi2";

import { WiDaySunny } from "react-icons/wi";
import { GiWindTurbine } from "react-icons/gi";

import { useAuth } from "../Authentication/AuthContext";
import { getProjects } from "../services/projectService";
import { getSites } from "../services/siteService";
import { getReports } from "../services/reportService";

import DashboardLayout from "../components/layout/DashboardLayout";
import Loader from "../components/ui/Loader";
import ErrorState from "../components/ui/ErrorState";
import SolarTrendChart from "../components/charts/SolarTrendChart";
import WindTrendChart from "../components/charts/WindTrendChart";
import EnergyBarChart from "../components/charts/EnergyBarChart";
import ProjectsPieChart from "../components/charts/ProjectsPieChart";


// =========================
// Quick Actions
// =========================

const analystQuickActions = [
  { label: "Create Project", icon: HiOutlinePlusCircle, path: "/create-project" },
  { label: "Analyze Site", icon: HiOutlineMapPin, path: "/analysis" },
  { label: "Generate Report", icon: HiOutlineDocumentChartBar, path: "/reports" },
];

const viewerQuickActions = [
  { label: "View Projects", icon: HiOutlineFolderOpen, path: "/projects" },
  { label: "View Reports", icon: HiOutlineDocumentChartBar, path: "/reports" },
];

// Format a Firestore Timestamp (or Date) into a friendly relative-ish string
function formatTimestamp(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

export default function Dashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [sitesCount, setSitesCount] = useState(0);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsData, sitesData, reportsData] = await Promise.all([
        getProjects(),
        getSites(),
        getReports(),
      ]);

      setProjects(projectsData);
      setSitesCount(sitesData.length);
      setReports(reportsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Couldn't load your dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = userData?.name || currentUser?.displayName || "User";
  const email = userData?.email || currentUser?.email || "";
  const photoURL = userData?.photoURL || currentUser?.photoURL;
  const role = userData?.role || "viewer";
  const quickActions = role === "analyst" ? analystQuickActions : viewerQuickActions;

  const totalProjects = projects.length;
  const solarProjects = projects.filter((p) => p.energyType === "Solar").length;
  const windProjects = projects.filter((p) => p.energyType === "Wind").length;

  const stats = [
    {
      icon: HiOutlineFolderOpen,
      label: "Total Projects",
      value: totalProjects,
      accent: "text-blue bg-blue/10",
    },
    {
      icon: WiDaySunny,
      label: "Solar Projects",
      value: solarProjects,
      accent: "text-green bg-green/10",
    },
    {
      icon: GiWindTurbine,
      label: "Wind Projects",
      value: windProjects,
      accent: "text-navy bg-navy/10",
    },
    {
      icon: HiOutlineMapPin,
      label: "Total Sites",
      value: sitesCount,
      accent: "text-blue bg-blue/10",
    },
  ];

  const recentProjects = projects.slice(0, 4);

  // Recent Activity: merge recent projects + recent reports, sorted by time
  const recentActivity = [
    ...projects.map((p) => ({
      title: `New project created — ${p.projectName}`,
      meta: `${p.region || "Unknown region"} · ${formatTimestamp(p.createdAt)}`,
      time: p.createdAt,
    })),
    ...reports.map((r) => ({
      title:
        r.type === "site-analysis"
          ? `Site analysis saved — ${r.siteName || "Site"}`
          : `Report generated — ${r.projectName || "Project"}`,
      meta: formatTimestamp(r.createdAt),
      time: r.createdAt,
    })),
  ]
    .sort((a, b) => {
      const aTime = a.time?.toDate ? a.time.toDate().getTime() : 0;
      const bTime = b.time?.toDate ? b.time.toDate().getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 py-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-10">
          <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-green/20 blur-3xl"></div>

          <div className="relative flex items-center justify-between flex-wrap gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {displayName.split(" ")[0]} 👋
              </h1>

              <p className="mt-3 text-white/60 max-w-lg">
                Here's what's happening across your renewable energy projects
                today.
              </p>
            </div>

            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-4 border-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {error && <ErrorState message={error} onRetry={loadDashboardData} />}

        {loading ? (
          <Loader label="Loading your dashboard..." />
        ) : (
          !error && (
            <>
              {/* User Profile + Statistics */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">
                  <h2 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-6">
                    Your Profile
                  </h2>

                  <div className="flex items-center gap-5">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center text-3xl font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {displayName}
                      </h3>
                      <p className="text-slate-500 break-all">{email}</p>
                      <span className="inline-block mt-3 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold capitalize">
                        {role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {stats.map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-extrabold text-slate-900">
                            {item.value}
                          </p>
                          <p className="mt-2 text-slate-500">{item.label}</p>
                        </div>

                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${item.accent}`}
                        >
                          <item.icon />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity + Quick Actions */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-slate-200 p-6">
                  <h2 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-6">
                    Recent Activity
                  </h2>

                  {recentActivity.length === 0 ? (
                    <p className="text-slate-500">
                      No activity yet — create your first project to get
                      started.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {recentActivity.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 border-b border-slate-100 pb-4 last:border-none"
                        >
                          <div className="w-3 h-3 rounded-full bg-green-500 mt-2"></div>
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {item.title}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                              {item.meta}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">
                  <h2 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-6">
                    Quick Actions
                  </h2>

                  <div className="space-y-4">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => navigate(action.path)}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-200 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:shadow-lg group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-white/20 flex items-center justify-center text-2xl transition">
                          <action.icon />
                        </div>
                        <span className="font-semibold">{action.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Recent Projects */}
                  <div className="mt-8">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4">
                      Recent Projects
                    </h3>

                    {recentProjects.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No projects yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {recentProjects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                          >
                            <p className="font-semibold text-slate-900 truncate">
                              {project.projectName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {project.energyType} · {project.region}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )
        )}
        
         {/* Analytics Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <SolarTrendChart />
          <WindTrendChart />
          <EnergyBarChart />
          <ProjectsPieChart />
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 border-t border-slate-200 pt-6">
          <p>
            © 2026{" "}
            <span className="font-semibold">
              Solar & Wind Deployment Intelligence Platform
            </span>
          </p>
          <p>Powered by AI • GIS • Environmental Intelligence</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
