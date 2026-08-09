import { useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api/client";
import { useSites } from "../context/SitesContext";

const TECH_OPTIONS = ["Solar PV", "Wind", "Hybrid Solar-Wind"];

export default function CapacityPlanner() {
  const { sites } = useSites();
  const [siteId, setSiteId] = useState("");
  const [capacity, setCapacity] = useState(50);
  const [ppaPrice, setPpaPrice] = useState(45);
  const [technology, setTechnology] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPlan() {
    if (!siteId) {
      setError("Choose a site first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({ capacity_mw: capacity, ppa_price: ppaPrice });
      if (technology) params.set("technology", technology);
      const res = await api.post(`/sites/${siteId}/plan?${params.toString()}`);
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not build a plan for this site.");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtUsd = (n) => `$${fmt(n)}`;

  const revenueData = result
    ? result.forecast.cumulative_revenue_usd.map((v, i) => ({ year: `Y${i + 1}`, revenue: v }))
    : [];

  return (
    <div className="p-8 max-w-6xl">
      <p className="label-eyebrow mb-1">Deployment Optimization Engine</p>
      <h1 className="font-display text-3xl font-semibold mb-1">Capacity planner</h1>
      <p className="text-ink/55 mb-6 max-w-2xl">
        Model different installed-capacity, technology, and power-price scenarios for a
        registered site to see how CAPEX, revenue, and payback period shift.
      </p>

      {sites.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink/50 mb-4">Register a site first to plan its capacity.</p>
          <Link to="/explore" className="btn-primary inline-block">Explore deployment locations</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          <div className="card p-5 h-fit space-y-4">
            <div>
              <label className="text-xs text-ink/50 block mb-1">Site</label>
              <select className="input-field" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">Select a site…</option>
                {sites.map((s) => (
                  <option key={s.site.id} value={s.site.id}>{s.site.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/50 block mb-1">Installed capacity (MW)</label>
              <input type="number" min="1" className="input-field" value={capacity}
                     onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-ink/50 block mb-1">PPA price ($/MWh)</label>
              <input type="number" min="1" className="input-field" value={ppaPrice}
                     onChange={(e) => setPpaPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-ink/50 block mb-1">Technology override</label>
              <select className="input-field" value={technology} onChange={(e) => setTechnology(e.target.value)}>
                <option value="">Use recommended</option>
                {TECH_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {error && <p className="text-xs text-rust">{error}</p>}
            <button onClick={runPlan} disabled={loading} className="btn-primary w-full">
              {loading ? "Modeling…" : "Run plan"}
            </button>
          </div>

          <div className="space-y-6">
            {!result ? (
              <div className="card p-10 text-center text-sm text-ink/40">
                Choose a site and run a plan to see projected economics.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Stat label="Technology" value={result.technology} mono={false} />
                  <Stat label="Est. CAPEX" value={fmtUsd(result.forecast.estimated_capex_usd)} />
                  <Stat label="Annual OPEX" value={fmtUsd(result.forecast.estimated_annual_opex_usd)} />
                  <Stat label="Payback" value={`${result.forecast.simple_payback_years} yrs`} />
                </div>

                <div className="card p-6">
                  <p className="label-eyebrow mb-4">25-Year Cumulative Revenue</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2f9c48" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#2f9c48" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8df" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#7a8a7c" }} axisLine={false} tickLine={false} interval={2} />
                      <YAxis tick={{ fontSize: 10, fill: "#7a8a7c" }} axisLine={false} tickLine={false}
                             tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} width={55} />
                      <Tooltip formatter={(v) => fmtUsd(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8df" }} />
                      <Area type="monotone" dataKey="revenue" stroke="#166534" strokeWidth={2} fill="url(#rev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <p className="label-eyebrow mb-4">Financial Summary</p>
                    <div className="space-y-3 text-sm">
                      <Row label="Year 1 output" value={`${fmt(result.forecast.year1_output_mwh)} MWh`} />
                      <Row label="Annual degradation" value={`${result.forecast.annual_degradation_pct}%`} />
                      <Row label="25-yr gross revenue" value={fmtUsd(result.forecast.lifetime_gross_revenue_usd)} />
                      <Row label="25-yr net revenue" value={fmtUsd(result.forecast.lifetime_net_revenue_usd)} highlight />
                      <Row label="Homes powered (est.)" value={fmt(result.forecast.homes_powered_estimate)} />
                    </div>
                  </div>
                  <div className="card p-6">
                    <p className="label-eyebrow mb-4">Site Suitability</p>
                    <div className="space-y-3 text-sm">
                      <Row label="Overall score" value={result.suitability.overall_score} highlight />
                      <Row label="Category" value={result.suitability.category} />
                      <Row label="Resource" value={result.suitability.sub_scores.resource} />
                      <Row label="Infrastructure" value={result.suitability.sub_scores.infrastructure} />
                      <Row label="Economic" value={result.suitability.sub_scores.economic} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] text-ink/45 mb-1">{label}</p>
      <p className="font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink/55">{label}</span>
      <span className={`font-mono font-semibold ${highlight ? "text-moss-700" : ""}`}>{value}</span>
    </div>
  );
}
