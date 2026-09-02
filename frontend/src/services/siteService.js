import api from "../api/api";

// Get all sites
export const getSites = async () => {
  const response = await api.get("/sites/");
  return response.data;
};

// Get one site
export const getSite = async (siteId) => {
  const response = await api.get(`/sites/${siteId}`);
  return response.data;
};

// Create site
export const createSite = async (site) => {
  const response = await api.post("/sites/", site);
  return response.data;
};

// Update site
export const updateSite = async (siteId, site) => {
  const response = await api.put(`/sites/${siteId}`, site);
  return response.data;
};

// Delete site
export const deleteSite = async (siteId) => {
  const response = await api.delete(`/sites/${siteId}`);
  return response.data;
};