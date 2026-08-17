import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as authApi from "../api/authApi";
import {
  TOKEN_STORAGE_KEY,
  extractErrorMessage,
  registerUnauthorizedHandler,
} from "../api/axiosClient";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(
    (options = {}) => {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      if (!options.silent) {
        navigate("/login", { replace: true });
      }
    },
    [navigate]
  );

  // Bootstrap: if a token exists, resolve the current user via /auth/me.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .getCurrentUser()
      .then((current) => setUser(current))
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Any 401 from the API layer forces a silent logout + redirect.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  const login = useCallback(async (credentials) => {
    const { access_token } = await authApi.login(credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
    const current = await authApi.getCurrentUser();
    setUser(current);
    return current;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const current = await authApi.getCurrentUser();
      setUser(current);
      return current;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
