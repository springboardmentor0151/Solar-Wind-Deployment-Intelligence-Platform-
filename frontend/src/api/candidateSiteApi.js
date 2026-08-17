import axiosClient from "./axiosClient";

// Planner: evaluate a site and submit it for PM review.
export const createCandidateSite = (siteId) =>
  axiosClient.post(`/candidate-sites/sites/${siteId}`).then((r) => r.data);

// Planner / PM: currently returns candidates pending PM review.
export const getPendingCandidateSites = () =>
  axiosClient.get("/candidate-sites").then((r) => r.data);

// PM: approve or reject a pending candidate.
export const reviewCandidateSite = (candidateId, payload) =>
  axiosClient.put(`/candidate-sites/${candidateId}/review`, payload).then((r) => r.data);

// PM: create a project from an approved candidate.
export const createProjectFromCandidate = (candidateId, payload) =>
  axiosClient.post(`/candidate-sites/${candidateId}/project`, payload).then((r) => r.data);
