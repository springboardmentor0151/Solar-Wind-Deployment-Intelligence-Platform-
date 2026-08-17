import axiosClient from "./axiosClient";

// POST /suitability/sites/{site_id}/evaluate
export const evaluateSiteSuitability = (siteId) =>
  axiosClient.post(`/suitability/sites/${siteId}/evaluate`).then((r) => r.data);
