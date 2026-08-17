import axiosClient from "./axiosClient";

// POST /deployment-optimization/sites/{site_id}
export const optimizeSiteDeployment = (siteId) =>
  axiosClient
    .post(`/deployment-optimization/sites/${siteId}`)
    .then((r) => r.data);
