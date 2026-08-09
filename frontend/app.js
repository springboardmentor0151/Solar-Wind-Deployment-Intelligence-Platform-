const API_BASE = "http://localhost:8000";

let state = {
  token: localStorage.getItem("swdi_token") || null,
  user: JSON.parse(localStorage.getItem("swdi_user") || "null"),
};


async function api(path, { method = "GET", body, auth = true, query } = {}) {
  let url = API_BASE + path;
  if (query) url += "?" + new URLSearchParams(query).toString();

  const headers = { "Content-Type": "application/json" };
  if (auth && state.token) headers["Authorization"] = "Bearer " + state.token;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
   
    throw new Error(
      "Can't reach the backend server. Make sure it's running at " + API_BASE +
      " (check your backend terminal is still open and shows 'Application startup complete')."
    );
  }

  if (!res.ok) {
    let detail = "Request failed";
    try {
      const errJson = await res.json();
      if (Array.isArray(errJson.detail)) {
        
        detail = errJson.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
      } else if (typeof errJson.detail === "string") {
        detail = errJson.detail;
      } else if (errJson.detail) {
        detail = JSON.stringify(errJson.detail);
      }
    } catch (e) {}
    throw new Error(detail);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}


const authView = document.getElementById("auth-view");
const appView = document.getElementById("app-view");
const authError = document.getElementById("auth-error");

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab + "-form").classList.add("active");
    authError.textContent = "";
  });
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      auth: false,
      body: {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
      },
    });
    onAuthSuccess(data);
  } catch (err) {
    authError.textContent = err.message;
  }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  try {
    const data = await api("/api/auth/register", {
      method: "POST",
      auth: false,
      body: {
        full_name: document.getElementById("reg-name").value,
        email: document.getElementById("reg-email").value,
        password: document.getElementById("reg-password").value,
        role: document.getElementById("reg-role").value,
      },
    });
    onAuthSuccess(data);
  } catch (err) {
    authError.textContent = err.message;
  }
});

function onAuthSuccess(data) {
  state.token = data.access_token;
  state.user = { full_name: data.full_name, role: data.role };
  localStorage.setItem("swdi_token", state.token);
  localStorage.setItem("swdi_user", JSON.stringify(state.user));
  showApp();
}

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("swdi_token");
  localStorage.removeItem("swdi_user");
  state = { token: null, user: null };
  appView.classList.add("hidden");
  authView.classList.remove("hidden");
});

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("view-" + btn.dataset.view).classList.add("active");
    if (btn.dataset.view === "dashboard") loadDashboard();
    if (btn.dataset.view === "projects") loadProjects();
    if (btn.dataset.view === "sites") loadSitesTable();
    if (btn.dataset.view === "new-site") { initSiteMap(); populateProjectDropdown(); }
  });
});

function showApp() {
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  document.getElementById("user-name").textContent = state.user.full_name;
  document.getElementById("user-role").textContent = state.user.role;
  loadDashboard();
}

function categoryClass(cat) {
  return {
    "Excellent": "excellent",
    "Highly Suitable": "highly",
    "Moderately Suitable": "moderate",
    "Low Suitability": "low",
    "Unsuitable": "unsuitable",
  }[cat] || "moderate";
}

async function loadDashboard() {
  const kpiGrid = document.getElementById("kpi-grid");
  try {
    const s = await api("/api/dashboard/summary");
    kpiGrid.innerHTML = `
      <div class="kpi-card"><div class="kpi-label">Sites Registered</div><div class="kpi-value">${s.total_sites}</div></div>
      <div class="kpi-card"><div class="kpi-label">Avg Deployment Score</div><div class="kpi-value">${s.avg_deployment_score}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Land Area Assessed</div><div class="kpi-value">${Math.round(s.total_land_area_m2).toLocaleString()} m²</div></div>
      <div class="kpi-card"><div class="kpi-label">Sites With Infrastructure</div><div class="kpi-value">${s.sites_with_infrastructure ?? 0}</div></div>
      <div class="kpi-card"><div class="kpi-label">Regions Covered</div><div class="kpi-value">${s.regions_covered ?? 0}</div></div>
    `;

    const catBars = document.getElementById("category-bars");
    const categories = s.by_category || {};
    if (Object.keys(categories).length === 0) {
      catBars.innerHTML = `<div class="empty-state">No scored sites yet — register one to see the breakdown.</div>`;
    } else {
      const max = Math.max(...Object.values(categories));
      catBars.innerHTML = Object.entries(categories).map(([cat, count]) => `
        <div class="cat-row">
          <div class="cat-label">${cat}</div>
          <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${(count / max) * 100}%"></div></div>
          <div class="cat-count">${count}</div>
        </div>
      `).join("");
    }

    const topList = document.getElementById("top-sites-list");
    if (!s.top_sites || s.top_sites.length === 0) {
      topList.innerHTML = `<div class="empty-state">Nothing ranked yet.</div>`;
    } else {
      topList.innerHTML = s.top_sites.map((site) => `
        <div class="top-site-row">
          <span>${site.project_name} <span class="muted">(${site.recommended_technology} — ${site.investment_priority})</span></span>
          <span class="badge ${categoryClass(site.category)}">${site.score}</span>
        </div>
      `).join("");
    }
  } catch (err) {
    kpiGrid.innerHTML = `<div class="conn-error" style="grid-column: 1 / -1">${err.message}</div>`;
  }
}


let editingSiteId = null; 

document.getElementById("site-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const resultEl = document.getElementById("site-result");
  resultEl.innerHTML = `<div class="empty-state">Running prediction engines…</div>`;

  const projectSelectVal = document.getElementById("s-project").value;
  const body = {
    project_name: document.getElementById("s-name").value,
    region: document.getElementById("s-region").value,
    latitude: parseFloat(document.getElementById("s-lat").value),
    longitude: parseFloat(document.getElementById("s-lon").value),
    land_area_m2: parseFloat(document.getElementById("s-area").value),
    existing_infrastructure: document.getElementById("s-infra").value,
    land_ownership: document.getElementById("s-ownership").value,
    parent_project_id: projectSelectVal ? parseInt(projectSelectVal, 10) : null,
  };

  try {
    const site = editingSiteId
      ? await api(`/api/sites/${editingSiteId}`, { method: "PUT", body })
      : await api("/api/sites", { method: "POST", body });
    renderSiteResult(site);
    exitEditMode();
    loadSitesTable();
  } catch (err) {
    resultEl.innerHTML = `<div class="empty-state" style="color:var(--accent-danger)">${err.message}</div>`;
  }
});

document.getElementById("cancel-edit-btn").addEventListener("click", () => {
  exitEditMode();
  document.getElementById("site-form").reset();
  document.getElementById("s-area").value = "";
  document.getElementById("site-result").innerHTML = "";
});

function enterEditMode(site) {
  editingSiteId = site.id;
  document.getElementById("site-form-heading").textContent = "Edit Site";
  document.getElementById("site-submit-btn").textContent = "Update Site & Re-run Prediction";
  document.getElementById("cancel-edit-btn").classList.remove("hidden");
}

function exitEditMode() {
  editingSiteId = null;
  document.getElementById("site-form-heading").textContent = "Register New Site";
  document.getElementById("site-submit-btn").textContent = "Register Site & Run Resource Prediction";
  document.getElementById("cancel-edit-btn").classList.add("hidden");
}

function renderSiteResult(site) {
  const resultEl = document.getElementById("site-result");
  const p = site.environmental_profile;
  const sc = site.score;
  const fc = site.forecast;
  const dp = site.deployment;

  resultEl.innerHTML = `
    ${sc ? `
    <div class="score-hero">
      <div class="score-ring">${sc.overall_deployment_score}</div>
      <div class="score-hero-text">
        <h3>${site.project_name}</h3>
        <div class="cat">${sc.suitability_category} — ${sc.investment_priority}</div>
        <div class="tech">${site.region || "Region not specified"} — Recommended: ${sc.recommended_technology}</div>
      </div>
    </div>

    <div class="factor-bars">
      <h3 style="margin-bottom:16px">Weighted Suitability Breakdown</h3>
      ${factorRow("Renewable Resource Availability (35%)", sc.renewable_resource_score)}
      ${factorRow("Geographic Suitability (25%)", sc.geographic_suitability_score)}
      ${factorRow("Infrastructure Accessibility (15%)", sc.infrastructure_accessibility_score)}
      ${factorRow("Environmental Impact (15%)", sc.environmental_impact_score)}
      ${factorRow("Economic Feasibility (10%)", sc.economic_feasibility_score)}
    </div>
    ` : `
    <div class="score-hero">
      <div class="score-hero-text" style="width:100%">
        <h3>${site.project_name}</h3>
        <div class="tech">${site.region || "Region not specified"} — ${site.latitude}, ${site.longitude}</div>
      </div>
    </div>
    `}

    <div class="metrics-grid">
      <div class="metric-card">
        <h4>Environmental Profile</h4>
        ${metricRow("Elevation", p.elevation_m + " m")}
        ${metricRow("Land slope", p.land_slope_deg + "°")}
        ${metricRow("Land cover type", p.land_cover_type)}
        ${metricRow("Distance to road", p.distance_to_road_km + " km")}
        ${metricRow("Distance to transmission", p.distance_to_transmission_km + " km")}
        ${metricRow("Land ownership", p.land_ownership)}
        ${metricRow("Existing infrastructure", site.existing_infrastructure || "None reported")}
      </div>
      <div class="metric-card">
        <h4>Solar Resource Assessment</h4>
        ${metricRow("Annual irradiance", site.solar.annual_irradiance_kwh_m2 + " kWh/m²")}
        ${metricRow("Peak sun hours", site.solar.peak_sun_hours + " h/day")}
        ${metricRow("Capacity factor", site.solar.capacity_factor_pct + "%")}
        ${metricRow("Expected output", Math.round(site.solar.expected_energy_output_kwh_year).toLocaleString() + " kWh/yr")}
      </div>
      <div class="metric-card">
        <h4>Wind Resource Assessment</h4>
        ${metricRow("Avg wind speed", site.wind.average_wind_speed_ms + " m/s")}
        ${metricRow("Prevailing wind direction", p.wind_direction_compass + (p.wind_direction_deg !== null ? " (" + p.wind_direction_deg + "°)" : ""))}
        ${metricRow("Power density", site.wind.wind_power_density_w_m2 + " W/m²")}
        ${metricRow("Capacity factor", site.wind.capacity_factor_pct + "%")}
        ${metricRow("Expected output", Math.round(site.wind.expected_annual_energy_production_kwh).toLocaleString() + " kWh/yr")}
      </div>
      ${fc ? `
      <div class="metric-card">
        <h4>Energy Forecast</h4>
        ${metricRow("Recommended tech output", Math.round(fc.annual_output_kwh).toLocaleString() + " kWh/yr")}
        ${metricRow("Homes powered (equivalent)", fc.homes_powered_equivalent.toLocaleString())}
      </div>
      ` : ""}
      ${dp ? `
      <div class="metric-card">
        <h4>Deployment Optimization</h4>
        ${metricRow("Recommended technology", dp.recommended_technology)}
        ${metricRow("Estimated installed capacity", Math.round(dp.estimated_installed_capacity_kw).toLocaleString() + " kW")}
        ${metricRow("Capacity if land/turbines doubled", Math.round(dp.expanded_capacity_kw).toLocaleString() + " kW")}
      </div>
      ` : ""}
    </div>
    ${fc ? `
    <div class="panel">
      <h3>Seasonal Generation Forecast</h3>
      ${Object.entries(fc.seasonal_output_kwh).map(([q, kwh]) => metricRow(q, Math.round(kwh).toLocaleString() + " kWh")).join("")}
    </div>
    ` : ""}

    ${p.data_sources ? `
    <div class="panel">
      <h3>Data Sources</h3>
      ${Object.entries(p.data_sources).map(([label, source]) => metricRow(label, source)).join("")}
    </div>
    ` : ""}

    <div class="export-row">
      <button onclick="exportReport(${site.id}, 'pdf')">Export Resource Report (PDF)</button>
      <button onclick="exportReport(${site.id}, 'json')">Export Resource Report (JSON)</button>
      <button onclick="exportReport(${site.id}, 'csv')">Export Resource Report (CSV)</button>
    </div>
  `;
  loadDashboard();
}

function factorRow(label, value) {
  return `
    <div class="factor-row">
      <div class="flabel"><span>${label}</span><span>${value}</span></div>
      <div class="factor-track"><div class="factor-fill" style="width:${value}%"></div></div>
    </div>
  `;
}

function metricRow(label, value) {
  return `<div class="metric-row"><span>${label}</span><span>${value}</span></div>`;
}

async function exportReport(id, fmt) {
  if (fmt === "json") {
    const data = await api(`/api/sites/${id}/resource-report`, { query: { fmt: "json" } });
    downloadBlob(JSON.stringify(data, null, 2), `site_${id}_resource_report.json`, "application/json");
    return;
  }

  const extensionByFmt = { csv: "csv", pdf: "pdf" };
  const res = await fetch(`${API_BASE}/api/sites/${id}/resource-report?fmt=${fmt}`, {
    headers: { Authorization: "Bearer " + state.token },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `site_${id}_resource_report.${extensionByFmt[fmt]}`;
  a.click();
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
}

let viewingProjectId = null; 
let projectsCache = []; 

document.getElementById("project-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/api/projects", {
      method: "POST",
      body: {
        name: document.getElementById("p-name").value,
        description: document.getElementById("p-description").value,
      },
    });
    document.getElementById("project-form").reset();
    loadProjects();
  } catch (err) {
    alert(err.message);
  }
});

async function loadProjects() {
  const listEl = document.getElementById("projects-list");
  listEl.innerHTML = `<div class="empty-state">Loading…</div>`;
  try {
    const projects = await api("/api/projects");
    projectsCache = projects;
    if (projects.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No projects yet — create one above, or just keep registering standalone sites without a project.</div>`;
      return;
    }
    listEl.innerHTML = projects.map((p) => `
      <div class="project-card">
        <div class="project-card-info">
          <div class="project-code">${p.project_code}</div>
          <div class="project-name">${p.name}</div>
          ${p.description ? `<div class="project-desc">${p.description}</div>` : ""}
          <div class="project-meta">${p.site_count} site${p.site_count === 1 ? "" : "s"} — created ${new Date(p.created_at).toLocaleDateString()}</div>
        </div>
        <div class="project-card-actions">
          <button onclick="viewProjectSites(${p.id})">View Sites</button>
          <button class="danger-btn" onclick="deleteProject(${p.id}, '${p.name.replace(/'/g, "\\'")}')">Delete</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

async function deleteProject(id, name) {
  if (!confirm(`Delete project "${name}" and ALL sites inside it? This can't be undone.`)) return;
  try {
    await api(`/api/projects/${id}`, { method: "DELETE" });
    loadProjects();
    loadDashboard();
  } catch (err) {
    alert(err.message);
  }
}

function viewProjectSites(projectId) {
  viewingProjectId = projectId;
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelector('[data-view="sites"]').classList.add("active");
  document.getElementById("view-sites").classList.add("active");
  loadSitesTable();
}

document.getElementById("clear-site-filter-btn").addEventListener("click", () => {
  viewingProjectId = null;
  loadSitesTable();
});

async function populateProjectDropdown() {
  try {
    const projects = await api("/api/projects");
    projectsCache = projects;
    const select = document.getElementById("s-project");
    const currentVal = select.value;
    select.innerHTML = `<option value="">No Project (standalone site)</option>` +
      projects.map((p) => `<option value="${p.id}">${p.project_code} — ${p.name}</option>`).join("");
    select.value = currentVal;
  } catch (err) {
    
  }
}

function projectLabelFor(site) {
  if (!site.parent_project_id) return "—";
  const p = projectsCache.find((pr) => pr.id === site.parent_project_id);
  return p ? p.project_code : `#${site.parent_project_id}`;
}

async function loadSitesTable() {
  const tbody = document.getElementById("sites-table-body");
  const banner = document.getElementById("site-filter-banner");
  const clearBtn = document.getElementById("clear-site-filter-btn");
  tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Loading…</td></tr>`;

  if (!projectsCache.length) {
    try { projectsCache = await api("/api/projects"); } catch (e) {}
  }

  if (viewingProjectId) {
    const p = projectsCache.find((pr) => pr.id === viewingProjectId);
    banner.innerHTML = `<div class="filter-banner">Showing sites in project: <strong>${p ? p.project_code + " — " + p.name : "#" + viewingProjectId}</strong></div>`;
    clearBtn.classList.remove("hidden");
  } else {
    banner.innerHTML = "";
    clearBtn.classList.add("hidden");
  }

  try {
    const sites = await api("/api/sites", { query: viewingProjectId ? { project_id: viewingProjectId } : undefined });
    if (sites.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No sites ${viewingProjectId ? "in this project" : "registered"} yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = sites.map((site) => `
      <tr>
        <td>${site.project_name}</td>
        <td>${projectLabelFor(site)}</td>
        <td>${site.region || "—"}</td>
        <td class="score">${site.score ? site.score.overall_deployment_score : "—"}</td>
        <td>${site.score ? `<span class="badge ${categoryClass(site.score.suitability_category)}">${site.score.suitability_category}</span>` : "—"}</td>
        <td>${site.score ? site.score.recommended_technology : "—"}</td>
        <td>${new Date(site.created_at).toLocaleDateString()}</td>
        <td>
          <button class="link-btn" onclick='editSite(${site.id})'>Edit</button>
          <button class="link-btn link-btn-danger" onclick='deleteSite(${site.id})'>Delete</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${err.message}</td></tr>`;
  }
}

async function editSite(id) {
  const site = await api(`/api/sites/${id}`);
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelector('[data-view="new-site"]').classList.add("active");
  document.getElementById("view-new-site").classList.add("active");

  initSiteMap();
  setMapPin(site.latitude, site.longitude);
  await populateProjectDropdown();
  document.getElementById("s-project").value = site.parent_project_id || "";

  document.getElementById("s-name").value = site.project_name;
  document.getElementById("s-region").value = site.region || "";
  document.getElementById("s-lat").value = site.latitude;
  document.getElementById("s-lon").value = site.longitude;
  document.getElementById("s-area").value = site.land_area_m2; 
  document.getElementById("s-infra").value = site.existing_infrastructure || "";
  document.getElementById("s-ownership").value = site.land_ownership || "Private";

  enterEditMode(site);
  document.getElementById("site-result").innerHTML = "";
}

async function deleteSite(id) {
  if (!confirm("Delete this site? This can't be undone.")) return;
  try {
    await api(`/api/sites/${id}`, { method: "DELETE" });
    loadSitesTable();
    loadDashboard();
  } catch (err) {
    alert(err.message);
  }
}

let siteMap = null;
let siteMarker = null;
let drawnItems = null;
const DEFAULT_MAP_CENTER = [22.9734, 78.6569]; 

function initSiteMap() {
  const mapEl = document.getElementById("site-map");
  if (!mapEl) return;

  if (!siteMap) {
    siteMap = L.map(mapEl).setView(DEFAULT_MAP_CENTER, 5);
    
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19,
      }
    ).addTo(siteMap);

    siteMap.on("click", (e) => {
      setMapPin(e.latlng.lat, e.latlng.lng);
    });

   
    drawnItems = new L.FeatureGroup();
    siteMap.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        rectangle: { shapeOptions: { color: "#34D399" } },
        polygon: false,
        polyline: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: false,
    });
    siteMap.addControl(drawControl);

    siteMap.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers(); 
      drawnItems.addLayer(e.layer);
      updateAreaFromLayer(e.layer);
    });
  } else {
   
    setTimeout(() => siteMap.invalidateSize(), 100);
  }
}

function updateAreaFromLayer(layer) {
  const bounds = layer.getBounds();
  const area = rectangleAreaM2(bounds);
  document.getElementById("s-area").value = Math.round(area);
}

function rectangleAreaM2(bounds) {
  const north = bounds.getNorth(), south = bounds.getSouth();
  const east = bounds.getEast(), west = bounds.getWest();
  const latMid = (north + south) / 2;
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos((latMid * Math.PI) / 180);
  const height = Math.abs(north - south) * metersPerDegLat;
  const width = Math.abs(east - west) * metersPerDegLon;
  return width * height;
}

function setMapPin(lat, lon) {
  if (!siteMap) return;
  lat = parseFloat(lat);
  lon = parseFloat(lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return;

  if (!siteMarker) {
    siteMarker = L.marker([lat, lon], { draggable: true }).addTo(siteMap);
    siteMarker.on("dragend", () => {
      const pos = siteMarker.getLatLng();
      document.getElementById("s-lat").value = pos.lat;
      document.getElementById("s-lon").value = pos.lng;
      setDefaultBoundary(pos.lat, pos.lng);
      suggestInfrastructure(pos.lat, pos.lng);
    });
  } else {
    siteMarker.setLatLng([lat, lon]);
  }

  siteMap.setView([lat, lon], 13);
  document.getElementById("s-lat").value = lat;
  document.getElementById("s-lon").value = lon;
  setDefaultBoundary(lat, lon);
  suggestInfrastructure(lat, lon);
}

async function suggestInfrastructure(lat, lon) {
  try {
    const result = await api("/api/infrastructure-suggestion", {
      query: { latitude: lat, longitude: lon },
    });
    document.getElementById("s-infra").value = result.suggested_infrastructure || "";
  } catch (err) {
    
  }
}


function setDefaultBoundary(lat, lon) {
  if (!drawnItems) return;
  const delta = 0.0015; 
  const bounds = L.latLngBounds(
    [lat - delta, lon - delta],
    [lat + delta, lon + delta]
  );
  drawnItems.clearLayers();
  const rect = L.rectangle(bounds, { color: "#34D399" }).addTo(drawnItems);
  updateAreaFromLayer(rect);
}


function syncMapFromManualCoords() {
  const latVal = parseFloat(document.getElementById("s-lat").value);
  const lonVal = parseFloat(document.getElementById("s-lon").value);
  if (!Number.isNaN(latVal) && !Number.isNaN(lonVal) && siteMap) {
    setMapPin(latVal, lonVal);
  }
}
document.getElementById("s-lat").addEventListener("change", syncMapFromManualCoords);
document.getElementById("s-lon").addEventListener("change", syncMapFromManualCoords);

document.getElementById("locate-btn").addEventListener("click", async () => {
  const query = document.getElementById("s-region").value.trim();
  const btn = document.getElementById("locate-btn");
  if (!query) {
    alert("Type a region or place name first (e.g. \"Jodhpur, Rajasthan\").");
    return;
  }

  const originalLabel = btn.textContent;
  btn.textContent = "Searching…";
  btn.disabled = true;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
    );
    const results = await res.json();
    if (!results.length) {
      alert("Couldn't find that location — try a more specific name (city + state/country).");
      return;
    }
    setMapPin(results[0].lat, results[0].lon);
  } catch (err) {
    alert("Location search failed — check your internet connection and try again.");
  } finally {
    btn.textContent = originalLabel;
    btn.disabled = false;
  }
});

const regionInput = document.getElementById("s-region");
const suggestionsBox = document.getElementById("region-suggestions");
let suggestDebounceTimer = null;
let suggestAbortController = null;

regionInput.addEventListener("input", () => {
  const query = regionInput.value.trim();
  clearTimeout(suggestDebounceTimer);

  if (query.length < 3) {
    hideSuggestions();
    return;
  }

  suggestDebounceTimer = setTimeout(() => fetchSuggestions(query), 400);
});

regionInput.addEventListener("focus", () => {
  if (suggestionsBox.children.length > 0) suggestionsBox.classList.remove("hidden");
});

document.addEventListener("click", (e) => {
  if (!suggestionsBox.contains(e.target) && e.target !== regionInput) {
    hideSuggestions();
  }
});

async function fetchSuggestions(query) {
  if (suggestAbortController) suggestAbortController.abort();
  suggestAbortController = new AbortController();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`,
      { signal: suggestAbortController.signal }
    );
    const results = await res.json();
    renderSuggestions(results);
  } catch (err) {
    if (err.name !== "AbortError") hideSuggestions();
  }
}

function renderSuggestions(results) {
  if (!results.length) {
    suggestionsBox.innerHTML = `<div class="suggestion-empty">No matching places found</div>`;
    suggestionsBox.classList.remove("hidden");
    return;
  }

  suggestionsBox.innerHTML = results.map((r, i) => `
    <div class="suggestion-item" data-index="${i}">${escapeHtml(r.display_name)}</div>
  `).join("");

  suggestionsBox.querySelectorAll(".suggestion-item").forEach((el) => {
    el.addEventListener("click", () => {
      const r = results[parseInt(el.dataset.index, 10)];
      regionInput.value = r.display_name;
      setMapPin(r.lat, r.lon);
      hideSuggestions();
    });
  });

  suggestionsBox.classList.remove("hidden");
}

function hideSuggestions() {
  suggestionsBox.classList.add("hidden");
  suggestionsBox.innerHTML = "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

if (state.token && state.user) {
  showApp();
}
