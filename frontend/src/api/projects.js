import api from "./client";

export const getDashboard = async () => (await api.get("/dashboard")).data;
export const getProjects = async () => (await api.get("/projects")).data;
export const saveProject = async (payload) => (await api.post("/projects", payload)).data;
export const getReports = async () => (await api.get("/reports")).data;
export const getReportDetail = async (projectId) => (await api.get(`/reports/${projectId}`)).data;
export const getGisSites = async () => (await api.get("/gis/sites")).data;

export const reverseGeocode = async (latitude, longitude) =>
  (await api.post("/environment/reverse-geocode", { latitude, longitude })).data;

export const fetchEnvironment = async (latitude, longitude) =>
  (await api.post("/environment/fetch", { latitude, longitude })).data;

export const runPredictions = async ({ project_type, capacity_mw, environmental_data }) => {
  const payload = { project_type, capacity_mw: Number(capacity_mw), environmental_data };
  const [solar, wind, site, forecast] = await Promise.all([
    api.post("/prediction/solar", payload),
    api.post("/prediction/wind", payload),
    api.post("/prediction/site-score", payload),
    api.post("/prediction/forecast", payload)
  ]);
  return {
    ...site.data,
    solar_potential: solar.data.solar_potential,
    wind_potential: wind.data.wind_potential,
    forecast: forecast.data.forecast
  };
};

export const downloadReport = async (projectId, type) => {
  const response = await api.post(`/reports/${type}?project_id=${projectId}`, null, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `project-${projectId}-report.${type === "pdf" ? "pdf" : "xlsx"}`;
  link.click();
  window.URL.revokeObjectURL(url);
};
