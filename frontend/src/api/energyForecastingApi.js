import axiosClient from "./axiosClient";

// POST /energy-forecasting/sites/{site_id}
export const forecastSiteEnergy = (siteId) =>
  axiosClient.post(`/energy-forecasting/sites/${siteId}`).then((r) => r.data);
