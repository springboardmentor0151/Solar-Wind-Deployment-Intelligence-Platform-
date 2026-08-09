import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";

const SitesContext = createContext(null);

export function SitesProvider({ children }) {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/sites");
      setSites(res.data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else setSites([]);
  }, [user, refresh]);

  const toggleSelected = useCallback((siteId) => {
    setSelectedSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  }, []);

  return (
    <SitesContext.Provider value={{ sites, loading, refresh, selectedSiteIds, toggleSelected, setSelectedSiteIds }}>
      {children}
    </SitesContext.Provider>
  );
}

export function useSites() {
  return useContext(SitesContext);
}
