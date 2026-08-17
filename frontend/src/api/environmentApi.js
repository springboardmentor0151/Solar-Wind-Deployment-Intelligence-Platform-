import axiosClient from "./axiosClient";

// GET /environment/sites/{site_id}
export const getSiteEnvironment = (siteId) =>
  axiosClient.get(`/environment/sites/${siteId}`).then((r) => r.data);

// GET /environment/projects/{project_id}
export const getProjectEnvironment = (projectId) =>
  axiosClient.get(`/environment/projects/${projectId}`).then((r) => r.data);
