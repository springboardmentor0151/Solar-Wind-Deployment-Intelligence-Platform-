import axiosClient from "./axiosClient.js";

export const getSiteResourceAssessment = (siteId) =>
  axiosClient
    .get(`/resource-assessment/sites/${siteId}`)
    .then((r) => r.data);
