import axiosClient from "./axiosClient";

// POST /auth/register  { full_name, email, password, role_id } -> UserResponse
export const register = (payload) =>
  axiosClient.post("/auth/register", payload).then((r) => r.data);

// POST /auth/login  { email, password } -> { access_token, token_type }
export const login = (payload) =>
  axiosClient.post("/auth/login", payload).then((r) => r.data);

// GET /auth/me -> UserResponse { id, full_name, email, is_active, role }
export const getCurrentUser = () =>
  axiosClient.get("/auth/me").then((r) => r.data);

// GET /auth/admin  (Admin only) -> { message, user, role }
export const getAdminDashboard = () =>
  axiosClient.get("/auth/admin").then((r) => r.data);