import axiosClient from "./axiosClient";

// POST /renewable-recommendation/sites/{site_id}
export const recommendSiteTechnology = (siteId) =>
  axiosClient
    .post(`/renewable-recommendation/sites/${siteId}`)
    .then((r) => r.data);
