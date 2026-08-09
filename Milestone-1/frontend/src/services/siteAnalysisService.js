// Calls the Python (FastAPI) backend's combined site-analysis endpoint.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Runs the combined environmental + terrain + GIS analysis for a site.
 *
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.siteId
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @returns {Promise<Object>} the backend's SiteAnalysisResponse shape:
 *   { success, environmentalData, terrainData, gisData, sources, errors }
 */
export const runSiteAnalysis = async ({ projectId, siteId, latitude, longitude }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/site-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, siteId, latitude, longitude }),
    });
  } catch (networkError) {
    // fetch() throws (not a rejected response) when the backend is down,
    // unreachable, or blocked by CORS — this is the "backend unavailable"
    // case, distinct from a normal 4xx/5xx API error below.
    console.error("Site analysis network error:", networkError);
    throw new Error(
      `Couldn't reach the analysis backend at ${API_BASE_URL}. Make sure the FastAPI server is running.`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    throw new Error("The backend returned an unreadable response.");
  }

  if (!response.ok) {
    // FastAPI's error responses (validation errors, 500s) come back as
    // { success: false, error: "..." } — surface that message to the caller.
    throw new Error(data?.error || `Site analysis request failed (HTTP ${response.status}).`);
  }

  return data;
};
