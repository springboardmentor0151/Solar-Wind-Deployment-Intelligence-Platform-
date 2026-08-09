import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CATEGORY_STYLE = {
  Excellent: { text: "text-moss-800", ring: "#166534" },
  "Highly Suitable": { text: "text-moss-600", ring: "#2f9c48" },
  "Moderately Suitable": { text: "text-sun", ring: "#e0a52c" },
  "Low Suitability": { text: "text-clay", ring: "#c9702f" },
  Unsuitable: { text: "text-rust", ring: "#c04a3d" },
};

function ScoreGauge({ score, category }) {
  const style = CATEGORY_STYLE[category] || { text: "text-ink", ring: "#166534" };
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative w-40 h-40 shrink-0">
      <svg viewBox="0 0 120 120" className="w-40 h-40 -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8df" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke={style.ring} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold">{score}</span>
        <span className={`text-[11px] font-medium ${style.text} text-center px-3 leading-tight mt-0.5`}>
          {category}
        </span>
      </div>
    </div>
  );
}

function SubScoreBar({ label, value, weight }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-ink/60">{label}</span>
        <span className="font-mono text-ink/40">weight {Math.round(weight * 100)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
          <div className="h-full bg-moss-600 rounded-full" style={{ width: `${value}%` }} />
        </div>
        <span className="font-mono text-xs font-semibold w-8 text-right">{value}</span>
      </div>
    </div>
  );
}

export default function AnalysisPanel({ analysis, siteName, children }) {
  const { solar_result: solar, wind_result: wind, suitability_result: suit, forecast_result: forecast, geographic_data: geo, data_sources } = analysis;

  const monthlyIrr = MONTHS.map((m, i) => ({ month: m, value: solar.monthly_irradiance[i] }));
  const monthlyWind = MONTHS.map((m, i) => ({ month: m, value: wind.monthly_wind_speed[i] }));

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <p className="label-eyebrow mb-1">Site Intelligence</p>
            <h2 className="font-display text-xl font-semibold">{siteName}</h2>
          </div>
          {children && <div>{children}</div>}
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <ScoreGauge score={suit.overall_score} category={suit.category} />
          <div className="flex-1 w-full space-y-3">
            <SubScoreBar label="Renewable Resource" value={suit.sub_scores.resource} weight={suit.weights.resource} />
            <SubScoreBar label="Geographic Suitability" value={suit.sub_scores.geographic} weight={suit.weights.geographic} />
            <SubScoreBar label="Infrastructure Accessibility" value={suit.sub_scores.infrastructure} weight={suit.weights.infrastructure} />
            <SubScoreBar label="Environmental Impact" value={suit.sub_scores.environmental} weight={suit.weights.environmental} />
            <SubScoreBar label="Economic Feasibility" value={suit.sub_scores.economic} weight={suit.weights.economic} />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink/50">Recommended technology:</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-moss-50 text-moss-700 border border-moss-200">
            {suit.recommended_technology.recommendation}
          </span>
          <span className="text-xs text-ink/40">— {suit.recommended_technology.rationale}</span>
        </div>
        {data_sources?.length > 0 && (
          <p className="text-[11px] text-ink/35 mt-3 font-mono">Data sources: {data_sources.join(" · ")}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-sun" />
            <p className="label-eyebrow">Solar Potential</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Metric label="Annual Irradiance" value={solar.annual_irradiance_kwh_m2_day} unit="kWh/m²/day" />
            <Metric label="Peak Sun Hours" value={solar.peak_sun_hours} unit="hrs/day" />
            <Metric label="Capacity Factor" value={solar.capacity_factor_pct} unit="%" />
            <Metric label="Expected Output" value={fmt(solar.expected_output_total_mwh_year)} unit="MWh/MW-yr" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthlyIrr}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8df" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#7a8a7c" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#7a8a7c" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8df" }} />
              <Line type="monotone" dataKey="value" stroke="#e0a52c" strokeWidth={2} dot={{ r: 2 }} name="kWh/m²/day" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-sky" />
            <p className="label-eyebrow">Wind Potential</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Metric label="Avg Wind Speed" value={wind.avg_wind_speed_ms} unit="m/s" />
            <Metric label="Power Density" value={wind.wind_power_density_w_m2} unit="W/m²" />
            <Metric label="Capacity Factor" value={wind.capacity_factor_pct} unit="%" />
            <Metric label="Expected Output" value={fmt(wind.expected_output_total_mwh_year)} unit="MWh/MW-yr" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthlyWind}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8df" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#7a8a7c" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#7a8a7c" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8df" }} />
              <Line type="monotone" dataKey="value" stroke="#3a7ca5" strokeWidth={2} dot={{ r: 2 }} name="m/s" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-ink/40 mt-2">{wind.turbine_suitability_class}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <p className="label-eyebrow mb-4">Terrain &amp; Site Attributes</p>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Elevation" value={geo.elevation_m} unit="m" />
            <Metric label="Land Slope" value={geo.land_slope_pct} unit="%" />
            <Metric label="Vegetation Index (NDVI)" value={geo.vegetation_index} unit="" />
            <Metric label="Distance to Road" value={geo.infrastructure.distance_to_road_km} unit="km" />
            <Metric label="Distance to Substation" value={geo.infrastructure.distance_to_substation_km} unit="km" />
            <Metric label="Distance to Transmission" value={geo.infrastructure.distance_to_transmission_line_km} unit="km" />
          </div>
        </div>

        <div className="card p-6">
          <p className="label-eyebrow mb-4">Investment Snapshot ({forecast.technology})</p>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Capacity" value={forecast.capacity_mw} unit="MW" />
            <Metric label="Est. CAPEX" value={`$${fmt(forecast.estimated_capex_usd)}`} unit="" />
            <Metric label="Annual OPEX" value={`$${fmt(forecast.estimated_annual_opex_usd)}`} unit="" />
            <Metric label="Simple Payback" value={forecast.simple_payback_years} unit="yrs" />
            <Metric label="25-yr Net Revenue" value={`$${fmt(forecast.lifetime_net_revenue_usd)}`} unit="" />
            <Metric label="Homes Powered (est.)" value={fmt(forecast.homes_powered_estimate)} unit="" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, unit }) {
  return (
    <div>
      <p className="text-[11px] text-ink/45">{label}</p>
      <p className="font-mono text-lg font-semibold">
        {value} <span className="text-xs font-sans text-ink/40">{unit}</span>
      </p>
    </div>
  );
}

function fmt(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}
