import axiosClient from "./axiosClient";

// POST /projects  (Admin, ProjectManager) { name, description?, region } -> ProjectResponse
export const createProject = (payload) =>
  axiosClient.post("/projects", payload).then((r) => r.data);

// GET /projects -> ProjectResponse[]
export const getProjects = () =>
  axiosClient.get("/projects").then((r) => r.data);

// GET /projects/{id} -> ProjectResponse
export const getProject = (projectId) =>
  axiosClient.get(`/projects/${projectId}`).then((r) => r.data);

// PUT /projects/{id}  (Admin, ProjectManager) -> ProjectResponse
export const updateProject = (projectId, payload) =>
  axiosClient.put(`/projects/${projectId}`, payload).then((r) => r.data);

// DELETE /projects/{id}  (Admin only)
export const deleteProject = (projectId) =>
  axiosClient.delete(`/projects/${projectId}`).then((r) => r.data);
