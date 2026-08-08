import api from "./api";

// ==========================
// Get All Sites
// ==========================
export const getSites = async () => {
  const response = await api.get("/sites/");
  return response.data;
};

// ==========================
// Create Site
// ==========================
export const createSite = async (site) => {
  const response = await api.post("/sites/", site);
  return response.data;
};

// ==========================
// Update Site
// ==========================
export const updateSite = async (id, site) => {
  const response = await api.put(`/sites/${id}`, site);
  return response.data;
};

// ==========================
// Delete Site
// ==========================
export const deleteSite = async (id) => {
  const response = await api.delete(`/sites/${id}`);
  return response.data;
};