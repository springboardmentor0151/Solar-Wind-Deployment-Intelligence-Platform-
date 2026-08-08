import api from "./api";

// Get all environmental records
export const getEnvironmentData = async () => {
  const response = await api.get("/environment/");
  return response.data;
};

// Create record
export const createEnvironmentData = async (data) => {
  const response = await api.post("/environment/", data);
  return response.data;
};

// Update record
export const updateEnvironmentData = async (id, data) => {
  const response = await api.put(`/environment/${id}`, data);
  return response.data;
};

// Delete record
export const deleteEnvironmentData = async (id) => {
  const response = await api.delete(`/environment/${id}`);
  return response.data;
};