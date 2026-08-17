import axiosClient from "./axiosClient";

// POST /investment-recommendation/sites/{site_id}
export const evaluateSiteInvestment = (siteId) =>
  axiosClient
    .post(`/investment-recommendation/sites/${siteId}`)
    .then((r) => r.data);
