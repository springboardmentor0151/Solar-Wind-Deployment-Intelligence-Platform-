import axiosClient from "./axiosClient";

// GET /gis/sites  (Admin, GISAnalyst, ProjectManager, RenewableEnergyPlanner)
export const getGisSites = () =>
  axiosClient.get("/gis/sites").then((r) => r.data);

// GET /gis/sites/{site_id}
export const getGisSite = (siteId) =>
  axiosClient.get(`/gis/sites/${siteId}`).then((r) => r.data);

// GET /gis/projects/{project_id}/sites
export const getGisProjectSites = (projectId) =>
  axiosClient.get(`/gis/projects/${projectId}/sites`).then((r) => r.data);

// GET /gis/bbox
export const getGisBoundingBox = () =>
  axiosClient.get("/gis/bbox").then((r) => r.data);

// GET /gis/summary
export const getGisSummary = () =>
  axiosClient.get("/gis/summary").then((r) => r.data);

// GET /gis/config
export const getGisMapConfig = () =>
  axiosClient.get("/gis/config").then((r) => r.data);

// GET /gis/enrich  (Admin, GISAnalyst, ProjectManager, RenewableEnergyPlanner)
// query params depend on backend contract (e.g. lat/lng) — pass through.
export const enrichCoordinates = (params) =>
  axiosClient.get("/gis/enrich", { params }).then((r) => r.data);


/**
 * Reverse-geocode a latitude/longitude into a human-readable region.
 * This is intentionally called only after the analyst clicks "Analyze location".
 * Nominatim is used for place-name lookup; the authoritative GIS/environmental
 * values still come from the Phase-7 backend.
 */
export const reverseGeocode = async ({ latitude, longitude }) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "10",
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to determine the selected region.");
  }

  const data = await response.json();
  const address = data?.address || {};

  const locality =
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.suburb ||
    address.county ||
    "";

  const region = [locality, address.state, address.country]
    .filter(Boolean)
    .join(", ");

  return {
    region,
    displayName: data?.display_name || region,
    address,
  };
};
