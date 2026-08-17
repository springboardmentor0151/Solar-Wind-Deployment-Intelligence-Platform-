import axiosClient from "./axiosClient";

// GET /profile -> UserProfileResponse
export const getProfile = () =>
  axiosClient.get("/profile").then((r) => r.data);

// PUT /profile  { full_name } -> UserProfileResponse
export const updateProfile = (payload) =>
  axiosClient.put("/profile", payload).then((r) => r.data);
