import axiosClient from "./axiosClient";

export const getProjectDeployments = (projectId) =>
  axiosClient.get(`/deployments/projects/${projectId}`).then((r) => r.data);

export const createDeployment = (projectId, payload) =>
  axiosClient.post(`/deployments/projects/${projectId}`, payload).then((r) => r.data);

export const updateDeploymentStatus = (deploymentId, payload) =>
  axiosClient.put(`/deployments/${deploymentId}/status`, payload).then((r) => r.data);
