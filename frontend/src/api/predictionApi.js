import axiosClient from "./axiosClient";

// POST /prediction/site/{site_id}
// Preferred endpoint: backend automatically pulls the site's environmental +
// GIS data and runs solar/wind/hybrid ML inference. No body required.
export const predictForSite = (siteId) =>
  axiosClient.post(`/prediction/site/${siteId}`).then((r) => r.data);

// Lower-level endpoints (used for direct/manual ML testing only).
export const predictSolar = (payload) =>
  axiosClient.post("/prediction/solar", payload).then((r) => r.data);

export const predictWind = (payload) =>
  axiosClient.post("/prediction/wind", payload).then((r) => r.data);

export const predictRenewable = (payload) =>
  axiosClient.post("/prediction/renewable", payload).then((r) => r.data);
