import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sun } from "lucide-react";

const ROLES = [
  {
    value: "renewable_energy_planner",
    label: "Renewable Energy Planner",
    blurb: "Explore sites, review suitability scores, and plan deployments.",
  },
  {
    value: "gis_analyst",
    label: "GIS Analyst",
    blurb: "Terrain, environmental data, and geospatial site comparisons.",
  },
  {
    value: "project_manager",
    label: "Project Manager",
    blurb: "Track project status, feasibility, timelines, and cost-benefit.",
  },
  {
    value: "administrator",
    label: "Administrator",
    blurb: "Manage users and monitor platform-wide data and analytics.",
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "renewable_energy_planner",
    organization: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-moss-700 flex items-center justify-center">
            <Sun size={19} className="text-moss-100" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-2xl tracking-tight">Renewsite</span>
        </div>

        <div className="card p-7">
          <h1 className="font-display text-xl font-semibold mb-1">Create your workspace</h1>
          <p className="text-sm text-ink/50 mb-6">Start analyzing deployment sites in minutes.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label-eyebrow block mb-1.5">Full name</label>
              <input required className="input-field" value={form.full_name}
                     onChange={(e) => update("full_name", e.target.value)} placeholder="Jiya Darshini" />
            </div>
            <div>
              <label className="label-eyebrow block mb-1.5">Email</label>
              <input type="email" required className="input-field" value={form.email}
                     onChange={(e) => update("email", e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <label className="label-eyebrow block mb-1.5">Password</label>
              <input type="password" required minLength={6} className="input-field" value={form.password}
                     onChange={(e) => update("password", e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="label-eyebrow block mb-1.5">Role</label>
              <select className="input-field" value={form.role} onChange={(e) => update("role", e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <p className="text-xs text-ink/45 mt-1.5">
                {ROLES.find((r) => r.value === form.role)?.blurb}
              </p>
            </div>
            <div>
              <label className="label-eyebrow block mb-1.5">Organization (optional)</label>
              <input className="input-field" value={form.organization}
                     onChange={(e) => update("organization", e.target.value)} placeholder="Acme Renewables" />
            </div>
            {error && <p className="text-sm text-rust">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink/50 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-moss-700 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
