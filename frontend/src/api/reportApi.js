import axiosClient from "./axiosClient";

// GET /reports/sites/{site_id} -> SiteReportResponse (JSON)
export const getSiteReport = (siteId) =>
  axiosClient.get(`/reports/sites/${siteId}`).then((r) => r.data);

// GET /reports/sites/{site_id}/pdf -> binary stream
export const downloadSiteReportPdf = (siteId) =>
  axiosClient
    .get(`/reports/sites/${siteId}/pdf`, { responseType: "blob" })
    .then((r) => r.data);

// GET /reports/sites/{site_id}/excel -> binary stream
export const downloadSiteReportExcel = (siteId) =>
  axiosClient
    .get(`/reports/sites/${siteId}/excel`, { responseType: "blob" })
    .then((r) => r.data);

// Helper: trigger a browser download for a blob returned by the API above.
export function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// GET /reports/site-comparison?site_ids=1&site_ids=2
export const compareSites = (siteIds) => {
  const params = new URLSearchParams();
  siteIds.forEach((id) => params.append("site_ids", String(id)));
  return axiosClient
    .get(`/reports/site-comparison?${params.toString()}`)
    .then((r) => r.data);
};
