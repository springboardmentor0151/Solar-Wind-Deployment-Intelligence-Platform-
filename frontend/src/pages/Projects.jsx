import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiCheckCircle, FiCpu, FiSave, FiSun, FiWind, FiZap } from "react-icons/fi";

import { fetchEnvironment, getProjects, reverseGeocode, runPredictions, saveProject } from "../api/projects.js";
import ChartsPanel from "../components/ChartsPanel.jsx";
import LeafletPicker from "../components/LeafletPicker.jsx";
import MetricCard from "../components/MetricCard.jsx";

const envLabels = {
  solar_irradiance: "Solar Irradiance",
  wind_speed: "Wind Speed",
  wind_direction: "Wind Direction",
  temperature: "Temperature",
  humidity: "Humidity",
  rainfall: "Rainfall",
  cloud_cover: "Cloud Cover",
  elevation: "Elevation",
  land_slope: "Land Slope",
  vegetation_index: "Vegetation Index",
  nearby_roads_km: "Nearby Roads",
  nearby_substations_km: "Nearby Substations",
  nearby_transmission_lines_km: "Transmission Lines"
};

const units = {
  solar_irradiance: "kWh/m2/day",
  wind_speed: "m/s",
  wind_direction: "deg",
  temperature: "C",
  humidity: "%",
  rainfall: "mm",
  cloud_cover: "%",
  elevation: "m",
  land_slope: "deg",
  vegetation_index: "NDVI",
  nearby_roads_km: "km",
  nearby_substations_km: "km",
  nearby_transmission_lines_km: "km"
};

export default function Projects() {
  const [location, setLocation] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState({ geo: false, env: false, ai: false, save: false });
  const { register, handleSubmit, watch, formState } = useForm({ defaultValues: { project_type: "Hybrid", capacity_mw: 50 } });
  const projectType = watch("project_type");
  const capacityMw = watch("capacity_mw");

  useEffect(() => { getProjects().then(setProjects).catch(() => setProjects([])); }, []);

  const selectLocation = useCallback(async ({ latitude, longitude }) => {
    setError("");
    setStatus("Reading location and environmental datasets...");
    setLocation({ latitude, longitude, address: "Resolving address..." });
    setEnvironment(null);
    setPrediction(null);
    setBusy({ geo: true, env: true, ai: false, save: false });
    try {
      const [geo, env] = await Promise.all([reverseGeocode(latitude, longitude), fetchEnvironment(latitude, longitude)]);
      setLocation({ latitude, longitude, address: geo.address });
      setEnvironment(env);
      setStatus("Environmental datasets loaded.");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to fetch location datasets.");
    } finally {
      setBusy((current) => ({ ...current, geo: false, env: false }));
    }
  }, []);

  useEffect(() => {
    const capacity = Number(capacityMw);
    if (!environment || !projectType || !capacity || capacity <= 0) return;
    let active = true;
    setBusy((current) => ({ ...current, ai: true }));
    setStatus("Running solar, wind, forecast, and site-score prediction engines...");
    runPredictions({ project_type: projectType, capacity_mw: capacity, environmental_data: environment })
      .then((result) => {
        if (active) {
          setPrediction(result);
          setStatus("Predictions complete.");
        }
      })
      .catch((err) => active && setError(err.response?.data?.detail || "Unable to run predictions."))
      .finally(() => active && setBusy((current) => ({ ...current, ai: false })));
    return () => { active = false; };
  }, [environment, projectType, capacityMw]);

  const canSave = useMemo(() => Boolean(location?.address && environment && prediction), [location, environment, prediction]);

  const onSubmit = async (values) => {
    if (!canSave) {
      setError("Select a map location and wait for predictions before saving.");
      return;
    }
    setBusy((current) => ({ ...current, save: true }));
    setError("");
    try {
      const saved = await saveProject({ ...values, capacity_mw: Number(values.capacity_mw), location, environmental_data: environment, prediction });
      setProjects((current) => [saved, ...current]);
      setStatus("Project saved with environmental data, predictions, forecasts, and report metadata.");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to save project.");
    } finally {
      setBusy((current) => ({ ...current, save: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div><p className="text-sm font-semibold text-canopy-700">Projects</p><h2 className="mt-2 text-3xl font-bold">Create Project</h2></div>
      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
        <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Project Details</h3>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block"><span className="text-sm font-medium text-slate-600 dark:text-slate-300">Project Name</span><input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" {...register("name", { required: true })} /></label>
            <label className="block"><span className="text-sm font-medium text-slate-600 dark:text-slate-300">Project Type</span><select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" {...register("project_type")}><option>Solar</option><option>Wind</option><option>Hybrid</option></select></label>
            <label className="block"><span className="text-sm font-medium text-slate-600 dark:text-slate-300">Region</span><input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" {...register("region", { required: true })} /></label>
            <label className="block"><span className="text-sm font-medium text-slate-600 dark:text-slate-300">Capacity MW</span><input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" type="number" step="0.1" min="0.1" {...register("capacity_mw", { required: true, min: 0.1 })} /></label>
            <label className="block lg:col-span-2"><span className="text-sm font-medium text-slate-600 dark:text-slate-300">Description</span><textarea className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" {...register("description")} /></label>
          </div>
        </section>
        <section className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h3 className="text-lg font-semibold">Interactive Map</h3><div className="mt-5"><LeafletPicker location={location} onSelect={selectLocation} /></div></div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold">Selected Location</h3>
            {location ? <dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Latitude</dt><dd className="font-semibold">{location.latitude}</dd></div><div><dt className="text-slate-500">Longitude</dt><dd className="font-semibold">{location.longitude}</dd></div><div><dt className="text-slate-500">Address</dt><dd className="font-semibold leading-relaxed">{location.address}</dd></div></dl> : <p className="mt-5 text-sm text-slate-500">Click the map to select a deployment site.</p>}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">Automatic Environmental Data</h3>{busy.env && <span className="rounded-full bg-ocean-50 px-3 py-1 text-sm font-semibold text-ocean-700">Fetching datasets...</span>}</div>
          {environment ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(envLabels).map(([key, label]) => <div key={key} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{environment[key]} <span className="text-xs font-medium text-slate-500">{units[key]}</span></p></div>)}</div> : <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}</div>}
        </section>
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">AI Predictions & Inline Results</h3>{busy.ai && <span className="rounded-full bg-canopy-50 px-3 py-1 text-sm font-semibold text-canopy-700">Running AI engines...</span>}</div>
          {prediction ? <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={FiSun} label="Solar Potential" value={`${prediction.solar_potential}%`} tone="text-amber-700 bg-amber-50" /><MetricCard icon={FiWind} label="Wind Potential" value={`${prediction.wind_potential}%`} tone="text-sky-700 bg-sky-50" /><MetricCard icon={FiZap} label="Energy Output" value={`${Math.round(prediction.annual_energy_output).toLocaleString()} MWh`} /><MetricCard icon={FiCheckCircle} label="Suitability Score" value={`${prediction.suitability_score}%`} /><MetricCard icon={FiCpu} label="Investment Score" value={`${prediction.investment_score}%`} /><MetricCard label="Capacity Factor" value={`${prediction.capacity_factor}%`} /><MetricCard label="ROI Estimate" value={`${prediction.roi_estimate}%`} /><MetricCard label="Confidence Score" value={`${prediction.confidence_score}%`} /></div><div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h4 className="font-semibold">Recommendation</h4><p className="mt-3 text-slate-600 dark:text-slate-300">{prediction.deployment_recommendation}</p><p className="mt-2 font-semibold text-canopy-700">{prediction.technology_recommendation}</p></div><ChartsPanel prediction={prediction} /></> : <div className="rounded-lg border border-dashed border-slate-300 p-8 text-slate-500 dark:border-slate-700">Predictions run automatically after project type, capacity, and environmental data are available.</div>}
        </section>
        {status && <p className="rounded-lg bg-canopy-50 px-4 py-3 text-sm font-medium text-canopy-700">{status}</p>}
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        <button className="inline-flex items-center gap-2 rounded-lg bg-canopy-600 px-5 py-3 font-semibold text-white transition hover:bg-canopy-700 disabled:opacity-60" disabled={!canSave || busy.save || formState.isSubmitting}><FiSave />{busy.save ? "Saving Project..." : "Save Project"}</button>
      </form>
      <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h3 className="text-lg font-semibold">Project History</h3><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-slate-500"><tr><th className="py-3">Project</th><th>Type</th><th>Region</th><th>Capacity</th><th>Score</th></tr></thead><tbody>{projects.map((project) => <tr key={project.id} className="border-t border-slate-100 dark:border-slate-800"><td className="py-3 font-semibold">{project.name}</td><td>{project.project_type}</td><td>{project.region}</td><td>{project.capacity_mw} MW</td><td>{project.suitability_score ?? "--"}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
