import axiosClient from "./axiosClient";

export const getAdminOverview = () =>
  axiosClient.get("/admin/overview").then((r) => r.data);

export const getAdminUsers = () =>
  axiosClient.get("/admin/users").then((r) => r.data);

export const getAdminRoles = () =>
  axiosClient.get("/admin/roles").then((r) => r.data);

export const updateUserRole = (userId, roleId) =>
  axiosClient
    .patch(`/admin/users/${userId}/role`, { role_id: roleId })
    .then((r) => r.data);

export const updateUserStatus = (userId, isActive) =>
  axiosClient
    .patch(`/admin/users/${userId}/status`, { is_active: isActive })
    .then((r) => r.data);

export const getAdminDataSources = () =>
  axiosClient.get("/admin/data-sources").then((r) => r.data);

export const getAdminSystemHealth = () =>
  axiosClient.get("/admin/system-health").then((r) => r.data);
