import { useState } from "react";
import { FiBell, FiKey, FiLock, FiLogOut, FiMoon, FiSun, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const [notifications, setNotifications] = useState(true);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setDark(document.documentElement.classList.contains("dark"));
  };
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold text-canopy-700">Settings</p><h2 className="mt-2 text-3xl font-bold">Account & Preferences</h2></div>
      <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><FiUser /> Profile</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3"><div><dt className="text-sm text-slate-500">Name</dt><dd className="mt-1 font-semibold">{user?.full_name}</dd></div><div><dt className="text-sm text-slate-500">Email</dt><dd className="mt-1 font-semibold">{user?.email}</dd></div><div><dt className="text-sm text-slate-500">Role</dt><dd className="mt-1 font-semibold">{user?.role}</dd></div></dl>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h3 className="flex items-center gap-2 text-lg font-semibold"><FiLock /> Password</h3><div className="mt-4 space-y-3"><input className="w-full rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" type="password" placeholder="Current password" /><input className="w-full rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" type="password" placeholder="New password" /><button className="rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white dark:bg-white dark:text-slate-950">Update Password</button></div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h3 className="flex items-center gap-2 text-lg font-semibold"><FiBell /> Notifications</h3><label className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-950"><span className="font-medium">Project and report updates</span><input className="h-5 w-5" type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} /></label></div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h3 className="flex items-center gap-2 text-lg font-semibold"><FiKey /> API Keys</h3><input className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" placeholder="OpenWeather, NASA POWER, or enterprise GIS key" /><button className="mt-3 rounded-lg border border-slate-300 px-4 py-3 font-semibold dark:border-slate-700">Save API Key</button></div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h3 className="text-lg font-semibold">Theme</h3><button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-3 font-semibold dark:border-slate-700" onClick={toggleTheme}>{dark ? <FiSun /> : <FiMoon />}{dark ? "Light Theme" : "Dark Theme"}</button></div>
      </section>
      <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white" onClick={handleLogout}><FiLogOut />Logout</button>
    </div>
  );
}
