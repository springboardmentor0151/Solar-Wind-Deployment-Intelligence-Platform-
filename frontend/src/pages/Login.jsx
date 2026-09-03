import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import AuthCard from "../components/AuthCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState } = useForm();

  const onSubmit = async (values) => {
    setError("");
    try {
      await login(values);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to sign in.");
    }
  };

  return (
    <AuthCard title="Login" subtitle="Access project planning, GIS workflows, and deployment intelligence." footerText="New to the platform?" footerLink="/register" footerLabel="Create account">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="block"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span><input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-ocean-500 dark:border-slate-700 dark:bg-slate-950" type="email" {...register("email", { required: true })} /></label>
        <label className="block"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</span><input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-ocean-500 dark:border-slate-700 dark:bg-slate-950" type="password" {...register("password", { required: true })} /></label>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="w-full rounded-lg bg-canopy-600 px-4 py-3 font-semibold text-white transition hover:bg-canopy-700 disabled:opacity-60" disabled={formState.isSubmitting}>{formState.isSubmitting ? "Signing in..." : "Login"}</button>
      </form>
    </AuthCard>
  );
}
