import { useEffect, useState } from "react";
import {
  HiOutlineMapPin,
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineGlobeAsiaAustralia,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
} from "react-icons/hi2";

import DashboardLayout from "../components/layout/DashboardLayout";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import LocationMap from "../components/LocationMap/LocationMap";

import { getProjects } from "../services/projectService";
import { createSite, updateSite } from "../services/siteService";
import { runSiteAnalysis } from "../services/siteAnalysisService";
import { createReport } from "../services/reportService";

import { computeSuitability } from "../utils/suitability";

import { useAuth } from "../Authentication/AuthContext";
import { useToast } from "../context/ToastContext";
import ResourceAssessmentReport from "./ResourceAssessmentReport";
import AnalysisDashboard from "../components/analysis/AnalysisDashboard";
import LoadingOverlay from "../components/ui/LoadingOverlay";

// Wind Potential Prediction — simple prototype-level formulas, frontend-only.
// No backend or existing state involved; purely derived from
// analysisResult.environmentalData.windSpeed at render time.
const WIND_AIR_DENSITY = 1.225; // kg/m3
const WIND_ROTOR_AREA = 10; // m2
const WIND_POWER_COEFFICIENT = 0.40;
const WIND_TURBINE_EFFICIENCY = 35; // %

function calculateWindPrediction(windSpeed) {
  if (windSpeed === null || windSpeed === undefined || Number.isNaN(windSpeed)) {
    return null;
  }

  const windPowerDensity = 0.5 * WIND_AIR_DENSITY * Math.pow(windSpeed, 3);

  const estimatedPower = windPowerDensity * WIND_ROTOR_AREA * WIND_POWER_COEFFICIENT;

  const dailyEnergy = (estimatedPower * 24) / 1000;

  const annualEnergy = dailyEnergy * 365;

  // NOTE: matches the formula requested — not the textbook (rated-power-based)
  // capacity factor definition, kept as-is for consistency with spec.
  const capacityFactor = (dailyEnergy / 24) * 100;

  let recommendedTurbine = "Not Recommended";

  if (windSpeed > 8) {
    recommendedTurbine = "Utility Scale Turbine";
  } else if (windSpeed > 6) {
    recommendedTurbine = "Medium Wind Turbine";
  } else if (windSpeed >= 4) {
    recommendedTurbine = "Small Wind Turbine";
  }

  return {
    windSpeed,
    windPowerDensity,
    dailyEnergy,
    annualEnergy,
    capacityFactor,
    turbineEfficiency: WIND_TURBINE_EFFICIENCY,
    recommendedTurbine,
  };
}

function formatWindMetric(value, decimals = 2) {
  return value === null || value === undefined ? "--" : value.toFixed(decimals);
}

export default function SiteAnalysis() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [siteName, setSiteName] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [locationDetails, setLocationDetails] = useState(null);

  const [savedSiteId, setSavedSiteId] = useState(null);

  const [notes, setNotes] = useState("");

  const [analysisResult, setAnalysisResult] = useState(null);

  const [suitability, setSuitability] = useState(null);

  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState("");

  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoadingProjects(true);

      const data = await getProjects();

      setProjects(data);
    } catch (error) {
      showToast("Unable to load projects", "error");
    } finally {
      setLoadingProjects(false);
    }
  }

  function resetForm() {
    setSiteName("");
    setLatitude("");
    setLongitude("");
    setLocationDetails(null);
    setSavedSiteId(null);
    setAnalysisResult(null);
    setSuitability(null);
    setNotes("");
    setProgress("");
  }

  function handleProjectChange(id) {
    setSelectedProjectId(id);
    resetForm();
  }

  function handleLocationSelect(location) {
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    setLocationDetails(location);

    setAnalysisResult(null);
    setSuitability(null);
  }

  function validate() {
    if (!selectedProjectId) {
      showToast("Select Project", "error");
      return false;
    }

    if (!siteName.trim()) {
      showToast("Enter Site Name", "error");
      return false;
    }

    if (latitude === "" || longitude === "") {
      showToast("Select location on map", "error");
      return false;
    }

    return true;
  }

  async function persistSite() {
    const payload = {
      projectId: selectedProjectId,
      siteName: siteName.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      createdBy: currentUser?.email,
      locationDetails,
    };

    if (savedSiteId) {
      await updateSite(savedSiteId, payload);
      return savedSiteId;
    }

    const id = await createSite(payload);

    setSavedSiteId(id);

    return id;
  }
  
  const waitForUI = () =>
  new Promise((resolve) => setTimeout(resolve, 1000));

  async function handleRunAnalysis(e) {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      setAnalysisResult(null);

      setSuitability(null);

      setProgress("Saving Site...");
      setProgressPercent(10);
      await waitForUI();

      const siteId = await persistSite();

      const project = projects.find(
        (item) => item.id === selectedProjectId
      );

      setProgress("Collecting Environmental Data...");
      setProgressPercent(35);
      await waitForUI();

      const result = await runSiteAnalysis({
        projectId: selectedProjectId,
        siteId,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      setAnalysisResult(result);

      setProgress("Calculating Suitability...");
      setProgressPercent(60);
      await waitForUI();

      const suitabilityResult = computeSuitability(
        project.energyType,
        result.environmentalData,
        result.terrainData,
        result.gisData
      );

      setSuitability(suitabilityResult);

      setProgress("Generating Report...");
      setProgressPercent(85);
      await waitForUI();

      await createReport({
        type: "site-analysis",

        projectId: selectedProjectId,

        projectName: project.projectName,

        siteId,

        siteName,

        latitude: Number(latitude),

        longitude: Number(longitude),

        notes,

        createdBy: currentUser?.email,

        locationDetails,

        status: result.success
          ? "Analysis Complete"
          : "Partial Analysis",

        environmentalData: result.environmentalData,

        terrainData: result.terrainData,

        gisData: result.gisData,

        suitabilitySummary: suitabilityResult,

        sources: result.sources,

        errors: result.errors,
      });

      setProgress("Completed");
      setProgressPercent(100);
      await waitForUI();

      showToast("Analysis Completed");
    } catch (error) {

      showToast(error.message, "error");
    } finally {
      setTimeout(() => {
      setLoading(false);
      setProgressPercent(0);
    }, 800);
}
  }

    const windPrediction = calculateWindPrediction(
    analysisResult?.environmentalData?.windSpeed
    );

    if (analysisResult && !analysisResult.windPrediction) {
    analysisResult.windPrediction = windPrediction;
    }

  const hasLocation =
    latitude !== "" && longitude !== "";
    return (
  <DashboardLayout>
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Header */}

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Renewable Energy Site Analysis
        </h1>

        <p className="mt-2 text-slate-600">
          Select a project, choose any location on the map, and perform
          environmental, terrain and GIS analysis.
        </p>
      </div>

      {loadingProjects ? (
        <Loader label="Loading Projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={HiOutlineMapPin}
          title="No Projects Found"
          message="Create a project before starting analysis."
        />
      ) : (
        <>
          {/* Project */}

          <div className="bg-white rounded-3xl shadow-md p-6 mb-6">

            <label className="block font-semibold text-slate-700 mb-2">
              Project
            </label>

            <select
              value={selectedProjectId}
              onChange={(e) =>
                handleProjectChange(e.target.value)
              }
              className="w-full border rounded-xl p-3"
            >
              <option value="">
                Select Project
              </option>

              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.projectName}
                  {" "}
                  (
                  {project.energyType}
                  )
                </option>
              ))}
            </select>
          </div>

          {selectedProjectId && (
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Left */}

              <div className="lg:col-span-2">

                <div className="bg-white rounded-3xl shadow-md overflow-hidden">

                  <div className="p-6 border-b">

                    <h2 className="text-2xl font-bold flex items-center gap-2">

                      <HiOutlineGlobeAsiaAustralia className="text-blue-600"/>

                      Select Analysis Location

                    </h2>

                    <p className="text-slate-500 mt-2">

                      Search any city or click anywhere on the map.

                    </p>

                  </div>

                  <div className="p-5">

                    <LocationMap
                      onLocationSelect={handleLocationSelect}
                      initialLatitude={
                        hasLocation
                          ? Number(latitude)
                          : undefined
                      }
                      initialLongitude={
                        hasLocation
                          ? Number(longitude)
                          : undefined
                      }
                    />

                  </div>

                </div>

              </div>

              {/* Right */}

              <div>

                <div className="bg-white rounded-3xl shadow-md p-6">

                  <h2 className="text-xl font-bold mb-5">
                    Site Details
                  </h2>

                  <label className="block font-medium mb-2">
                    Site Name
                  </label>

                  <input
                    value={siteName}
                    onChange={(e) =>
                      setSiteName(e.target.value)
                    }
                    className="w-full border rounded-xl p-3 mb-5"
                    placeholder="Enter Site Name"
                  />

                  <div className="space-y-4">

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs text-slate-500">
                        Latitude
                      </p>

                      <p className="font-semibold">
                        {hasLocation
                          ? Number(latitude).toFixed(6)
                          : "--"}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs text-slate-500">
                        Longitude
                      </p>

                      <p className="font-semibold">
                        {hasLocation
                          ? Number(longitude).toFixed(6)
                          : "--"}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs text-slate-500">
                        State
                      </p>

                      <p className="font-semibold">
                        {locationDetails?.state || "--"}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs text-slate-500">
                        Country
                      </p>

                      <p className="font-semibold">
                        {locationDetails?.country || "--"}
                      </p>

                    </div>

                  </div>

                  {locationDetails?.displayName && (

                    <div className="mt-5 rounded-xl bg-blue-50 p-4">

                      <p className="text-xs text-slate-500">
                        Full Address
                      </p>

                      <p className="text-sm mt-2">
                        {locationDetails.displayName}
                      </p>

                    </div>

                  )}

                </div>

                <div className="bg-white rounded-3xl shadow-md p-6 mt-6">

                  <label className="block font-semibold mb-3">
                    Notes
                  </label>

                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) =>
                      setNotes(e.target.value)
                    }
                    className="w-full border rounded-xl p-3"
                    placeholder="Optional notes..."
                  />

                  <button
                    onClick={handleRunAnalysis}
                    disabled={loading}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition"
                  >
                    {loading
                      ? "Running Analysis..."
                      : "Run Analysis"}
                  </button>

                  {loading && (

                    <div className="mt-6">

                      <div className="flex items-center gap-3">

                        <HiOutlineArrowPath className="animate-spin text-blue-600"/>

                        <span className="text-sm">

                          {progress}

                        </span>

                      </div>

                    </div>

                  )}

                </div>

              </div>

            </div>
          )}
        </>
      )}

      {/* Results Panel */}
      {/* ======================= RESULTS ======================= */}

{analysisResult && (
  <div className="mt-10 space-y-8">

    <div className="flex items-center gap-3">

      <HiOutlineChartBar className="text-3xl text-blue-600"/>

      <div>

        <h2 className="text-3xl font-bold text-slate-900">
          Analysis Dashboard
        </h2>

        <p className="text-slate-500">
          Environmental, Terrain & GIS Statistics
        </p>

      </div>

    </div>

    {/* Metric Cards */}

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-6 text-white shadow-lg">

        <p className="text-sm opacity-90">
          Solar Irradiance
        </p>

        <h3 className="text-3xl font-bold mt-2">
          {analysisResult.environmentalData?.solarIrradiance ?? "--"}
        </h3>

        <p className="text-sm mt-1">
          kWh/m²/day
        </p>

      </div>

      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg">

        <p className="text-sm">
          Temperature
        </p>

        <h3 className="text-3xl font-bold mt-2">
          {analysisResult.environmentalData?.temperature ?? "--"}
        </h3>

        <p className="text-sm">
          °C
        </p>

      </div>

      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg">

        <p className="text-sm">
          Wind Speed
        </p>

        <h3 className="text-3xl font-bold mt-2">
          {analysisResult.environmentalData?.windSpeed ?? "--"}
        </h3>

        <p className="text-sm">
          m/s
        </p>

      </div>

      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg">

        <p className="text-sm">
          Elevation
        </p>

        <h3 className="text-3xl font-bold mt-2">
          {analysisResult.terrainData?.elevation ?? "--"}
        </h3>

        <p className="text-sm">
          meters
        </p>

      </div>

    </div>

    {/* GIS */}

    <div className="grid lg:grid-cols-2 gap-6">

      <div className="bg-white rounded-3xl shadow-md p-6">

        <h3 className="text-xl font-bold mb-5">
          GIS Information
        </h3>

        <div className="space-y-4">

          <div className="flex justify-between">

            <span>Roads Nearby</span>

            <span className="font-bold">
              {analysisResult.gisData?.roadCount ?? 0}
            </span>

          </div>

          <div className="flex justify-between">

            <span>Power Infrastructure</span>

            <span className="font-bold">
              {analysisResult.gisData?.powerInfrastructureCount ?? 0}
            </span>

          </div>

          <div className="flex justify-between">

            <span>Water Bodies</span>

            <span className="font-bold">
              {analysisResult.gisData?.waterBodyCount ?? 0}
            </span>

          </div>

          <div className="flex justify-between">

            <span>Buildings</span>

            <span className="font-bold">
              {analysisResult.gisData?.buildingCount ?? 0}
            </span>

          </div>

        </div>

      </div>

      {/* Data Sources */}

      <div className="bg-white rounded-3xl shadow-md p-6">

        <h3 className="text-xl font-bold mb-5">
          Data Sources
        </h3>

        <div className="flex flex-wrap gap-3">

          {Object.entries(
            analysisResult.sources || {}
          ).map(([source, status]) => (

            <div
              key={source}
              className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2

              ${
                status === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >

              {status === "success" ? (

                <HiOutlineCheckCircle/>

              ) : (

                <HiOutlineMapPin/>

              )}

              {source}

            </div>

          ))}

        </div>

        {analysisResult.errors &&
          Object.keys(
            analysisResult.errors
          ).length > 0 && (

          <div className="mt-6 bg-red-50 rounded-2xl p-5">

            <h4 className="font-bold text-red-700 mb-2">
              Errors
            </h4>

            <ul className="list-disc pl-5 space-y-2">

              {Object.values(
                analysisResult.errors
              ).map((err, index) => (

                <li key={index}>
                  {err}
                </li>

              ))}

            </ul>

          </div>

        )}

      </div>

    </div>

    {/* Land Use */}

    {analysisResult.gisData?.landUse?.length > 0 && (

      <div className="bg-white rounded-3xl shadow-md p-6">

        <h3 className="text-xl font-bold mb-5">
          Land Use Classification
        </h3>

        <div className="flex flex-wrap gap-3">

          {analysisResult.gisData.landUse.map((land) => (

            <span
              key={land}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold"
            >
              {land}
            </span>

          ))}

        </div>

      </div>

    )}

  </div>
)}

{/* ======================= SOLAR PREDICTION ======================= */}

{analysisResult?.solarPrediction && (
  <div className="mt-10">

    <div className="bg-white rounded-3xl shadow-md p-6">

      <h2 className="text-3xl font-bold mb-6">
        ☀ Solar Potential Prediction
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-yellow-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Annual Irradiance
          </p>

          <h3 className="text-3xl font-bold">
            {analysisResult.solarPrediction.annualIrradiance}
          </h3>

          <p>kWh/m²/day</p>
        </div>

        <div className="bg-orange-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Peak Sun Hours
          </p>

          <h3 className="text-3xl font-bold">
            {analysisResult.solarPrediction.peakSunHours}
          </h3>

          <p>hrs/day</p>
        </div>

        <div className="bg-green-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Daily Energy
          </p>

          <h3 className="text-3xl font-bold">
            {analysisResult.solarPrediction.dailyEnergyOutput}
          </h3>

          <p>kWh</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Annual Energy
          </p>

          <h3 className="text-3xl font-bold">
            {analysisResult.solarPrediction.annualEnergyOutput}
          </h3>

          <p>kWh/year</p>
        </div>

        <div className="bg-purple-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Capacity Factor
          </p>

          <h3 className="text-3xl font-bold">
            {analysisResult.solarPrediction.capacityFactor}%
          </h3>
        </div>

        <div className="bg-cyan-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Performance Ratio
          </p>

          <h3 className="text-3xl font-bold">
            {analysisResult.solarPrediction.performanceRatio}
          </h3>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Panel Efficiency
          </p>

          <h3 className="text-3xl font-bold">
            {analysisResult.solarPrediction.panelEfficiency}%
          </h3>
        </div>

        <div className="bg-emerald-100 rounded-2xl p-5">

          <p className="text-sm text-gray-500">
            Solar Potential
          </p>

          <h3 className="text-3xl font-bold text-green-700">
            {analysisResult.solarPrediction.solarPotential}
          </h3>

        </div>

      </div>

    </div>

  </div>
)}
{/* ======================= WIND PREDICTION ======================= */}

{analysisResult && (
  <div className="mt-10">

    <div className="bg-white rounded-3xl shadow-md p-6">

      <h2 className="text-3xl font-bold mb-6">
        🌬 Wind Potential Prediction
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-sky-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Wind Speed
          </p>

          <h3 className="text-3xl font-bold">
            {formatWindMetric(windPrediction?.windSpeed)}
          </h3>

          <p>m/s</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Wind Power Density
          </p>

          <h3 className="text-3xl font-bold">
            {formatWindMetric(windPrediction?.windPowerDensity)}
          </h3>

          <p>W/m²</p>
        </div>

        <div className="bg-green-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Daily Energy
          </p>

          <h3 className="text-3xl font-bold">
            {formatWindMetric(windPrediction?.dailyEnergy)}
          </h3>

          <p>kWh</p>
        </div>

        <div className="bg-purple-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Annual Energy
          </p>

          <h3 className="text-3xl font-bold">
            {formatWindMetric(windPrediction?.annualEnergy, 0)}
          </h3>

          <p>kWh/year</p>
        </div>

        <div className="bg-orange-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Capacity Factor
          </p>

          <h3 className="text-3xl font-bold">
            {formatWindMetric(windPrediction?.capacityFactor)}%
          </h3>
        </div>

        <div className="bg-cyan-50 rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Turbine Efficiency
          </p>

          <h3 className="text-3xl font-bold">
            {formatWindMetric(windPrediction?.turbineEfficiency, 0)}%
          </h3>
        </div>

        <div className="bg-emerald-100 rounded-2xl p-5">

          <p className="text-sm text-gray-500">
            Recommended Turbine
          </p>

          <h3 className="text-3xl font-bold text-green-700">
            {windPrediction?.recommendedTurbine || "--"}
          </h3>

        </div>

      </div>

    </div>

  </div>
)}
{/* ======================= SUITABILITY ======================= */}

{suitability && (
  <div className="mt-10">

    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-8">

        <div className="flex items-center gap-3">

          <HiOutlineSparkles className="text-4xl" />

          <div>

            <h2 className="text-3xl font-bold">
              Suitability Assessment
            </h2>

            <p className="opacity-90 mt-1">
              Rule-based Renewable Energy Evaluation
            </p>

          </div>

        </div>

      </div>

      <div className="p-8">

        {/* Score */}

        <div className="grid lg:grid-cols-3 gap-8">

          <div className="text-center">

            <div className="w-40 h-40 rounded-full border-[12px] border-blue-500 flex items-center justify-center mx-auto">

              <div>

                <h1 className="text-5xl font-bold text-slate-900">
                  {suitability.score}
                </h1>

                <p className="text-slate-500">
                  / {suitability.maxScore}
                </p>

              </div>

            </div>

            <h3 className="mt-6 text-2xl font-bold">

              {suitability.level}

            </h3>

          </div>

          {/* Progress */}

          <div className="lg:col-span-2">

            <div>

              <div className="flex justify-between mb-2">

                <span className="font-semibold">
                  Overall Score
                </span>

                <span className="font-semibold">
                  {Math.round(
                    (suitability.score /
                      suitability.maxScore) *
                      100
                  )}
                  %
                </span>

              </div>

              <div className="h-5 rounded-full bg-slate-200 overflow-hidden">

                <div
                  className={`h-full transition-all duration-700

                  ${
                    suitability.level === "High Potential"
                      ? "bg-green-500"

                      : suitability.level ===
                        "Moderate Potential"

                      ? "bg-yellow-500"

                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${
                      (suitability.score /
                        suitability.maxScore) *
                      100
                    }%`,
                  }}
                />

              </div>

            </div>

            {/* Recommendation */}

            <div className="mt-8 rounded-2xl bg-slate-50 p-6">

              <h4 className="font-bold text-xl mb-4">

                Recommendation

              </h4>

              {suitability.level ===
              "High Potential" ? (

                <p className="text-green-700">

                  Excellent renewable energy site.
                  Environmental conditions, terrain
                  and GIS infrastructure indicate
                  strong feasibility for deployment.

                </p>

              ) : suitability.level ===
                "Moderate Potential" ? (

                <p className="text-yellow-700">

                  The location is suitable but
                  additional feasibility studies are
                  recommended before installation.

                </p>

              ) : (

                <p className="text-red-700">

                  This location has low renewable
                  energy potential. Consider
                  evaluating nearby alternative
                  locations.

                </p>

              )}

            </div>

          </div>

        </div>

        {/* Reasons */}

        <div className="mt-10">

          <h3 className="text-2xl font-bold mb-6">

            Analysis Summary

          </h3>

          <div className="grid md:grid-cols-2 gap-4">

            {suitability.reasons.map(
              (reason, index) => (

                <div
                  key={index}
                  className="rounded-2xl bg-blue-50 border border-blue-100 p-5 flex gap-4"
                >

                  <HiOutlineCheckCircle
                    className="text-blue-600 mt-1"
                    size={22}
                  />

                  <span className="text-slate-700">

                    {reason}

                  </span>

                </div>

              )
            )}

          </div>

        </div>

        {/* Disclaimer */}

        <div className="mt-10 rounded-2xl bg-amber-50 border border-amber-200 p-6">

          <h4 className="font-semibold text-amber-800">

            Note

          </h4>

          <p className="text-amber-700 mt-2 leading-7">

            This suitability score is generated
            using a transparent rule-based scoring
            model derived from environmental,
            terrain and GIS datasets.

            It is intended to support preliminary
            site screening and should be followed
            by detailed engineering and financial
            feasibility studies before project
            implementation.

          </p>

        </div>

      </div>

    </div>

  </div>
)}

{/* Resource Assessment Report */}

{analysisResult && suitability && (
  <ResourceAssessmentReport
    analysisResult={analysisResult}
    suitability={suitability}
    locationDetails={locationDetails}
    siteName={siteName}
    project={
      projects.find(
        (p) => p.id === selectedProjectId
      )
    }
  />
)}

{/* ======================= AI ANALYSIS ======================= */}

{analysisResult && suitability && (
  <AnalysisDashboard
    analysisResult={{
      ...analysisResult,
      windPrediction,
    }}
    suitability={suitability}
  />
)}

</div>
{loading && (
  <LoadingOverlay
    progress={progress}
    percent={progressPercent}
  />
)}
</DashboardLayout>
);
}