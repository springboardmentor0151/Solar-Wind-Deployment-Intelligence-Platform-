import api from "./api";

// ==========================
// Get All Projects
// ==========================
export const getProjects = async () => {
  const response = await api.get("/projects/");
  return response.data;
};

// ==========================
// Create Project
// ==========================
export const createProject = async (project) => {
  const response = await api.post("/projects/", project);
  return response.data;
};

// ==========================
// Update Project
// ==========================
export const updateProject = async (id, project) => {
  const response = await api.put(`/projects/${id}`, project);
  return response.data;
};

// ==========================
// Delete Project
// ==========================
export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};