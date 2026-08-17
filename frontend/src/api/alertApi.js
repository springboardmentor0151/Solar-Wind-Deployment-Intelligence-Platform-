import axiosClient from "./axiosClient";

// POST /alerts/sites/{siteId}/evaluate
export const evaluateSiteAlerts = (siteId) =>
  axiosClient.post(`/alerts/sites/${siteId}/evaluate`).then((r) => r.data);
