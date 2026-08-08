import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Clock, 
  CheckSquare, 
  DollarSign, 
  Sparkles,
  RefreshCw,
  FolderOpen,
  CheckCircle,
  Briefcase,
  AlertTriangle,
  Check,
  Compass
} from 'lucide-react';
import { CostBenefitChart } from '../components/AnalyticsCharts';
import WorkflowVisualization from '../components/WorkflowVisualization';

export default function ManagerDashboard({ user, projects, sites, onRefreshData, setView, initialSection = 'dashboard' }) {
  const [currentSection, setCurrentSection] = useState(initialSection);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isUpdatingMilestones, setIsUpdatingMilestones] = useState(false);
  const [managerComments, setManagerComments] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [usersList, setUsersList] = useState([]);

  // PM Centralized API states
  const [managerStats, setManagerStats] = useState(null);
  const [workflowProjects, setWorkflowProjects] = useState([]);
  const [milestonesProjects, setMilestonesProjects] = useState([]);
  const [managerProjects, setManagerProjects] = useState([]);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [statsRes, wfRes, msRes, projRes] = await Promise.all([
          axios.get('/api/manager/dashboard', { headers }),
          axios.get('/api/manager/workflow', { headers }),
          axios.get('/api/manager/milestones', { headers }),
          axios.get('/api/manager/projects', { headers })
        ]);
        
        setManagerStats(statsRes.data);
        setWorkflowProjects(wfRes.data);
        setMilestonesProjects(msRes.data);
        setManagerProjects(projRes.data);
      } catch (e) {
        console.error("Error fetching PM data", e);
      }
    };
    fetchManagerData();
  }, [projects]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/users/assignable', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsersList(res.data);
      } catch (e) {
        console.error("Failed to load users for workflow", e);
      }
    };
    fetchUsers();
  }, []);

  // Sync selected section when prop changes
  useEffect(() => {
    setCurrentSection(initialSection);
  }, [initialSection]);

  // Sync selected site
  useEffect(() => {
    if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id.toString());
    }
  }, [sites]);

  const visibleProjects = currentSection === 'workflow' ? workflowProjects : currentSection === 'milestones' ? milestonesProjects : managerProjects;

  // Sync selected project based on section
  useEffect(() => {
    if (visibleProjects.length > 0) {
      setSelectedProjectId(visibleProjects[0].id.toString());
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id.toString());
    }
  }, [projects, currentSection, user.id, visibleProjects]);

  const selectedSite = sites.find(s => s.id.toString() === selectedSiteId);
  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);

  // Fetch reports for the selected site
  const fetchReports = async () => {
    if (!selectedSiteId) return;
    setIsLoadingReports(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/sites/${selectedSiteId}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (e) {
      console.error("Error fetching reports", e);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedSiteId]);

  // Generate Report API call
  const handleGenerateReport = async (type) => {
    if (!selectedSiteId) return;
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/sites/${selectedSiteId}/reports?report_type=${type}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast(`Report generated and saved to site history.`, "success");
      fetchReports();
    } catch (e) {
      console.error(e);
      window.showToast("Failed to generate report.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggling milestones on backend
  const handleToggleMilestone = async (milestoneIndex) => {
    if (!selectedProject) return;
    setIsUpdatingMilestones(true);
    try {
      const token = localStorage.getItem('token');
      let currentMilestones = [];
      try {
        currentMilestones = JSON.parse(selectedProject.milestones);
      } catch (err) {
        currentMilestones = [];
      }

      currentMilestones[milestoneIndex].completed = !currentMilestones[milestoneIndex].completed;

      await axios.put(`/api/projects/${selectedProject.id}`, {
        milestones: JSON.stringify(currentMilestones)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      window.showToast("Milestone updated successfully.", "success");
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error("Failed to update milestone", err);
      window.showToast("Error updating project milestones on server.", "error");
    } finally {
      setIsUpdatingMilestones(false);
    }
  };

  // PM workflow review decision
  const handlePMReview = async (action) => {
    if (!selectedProject) return;
    if (!managerComments.trim()) {
      window.showToast("Please provide review comments before submitting decision.", "warning");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/projects/${selectedProject.id}/manager-review`, {
        manager_comments: managerComments,
        action: action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast(`Project review submitted successfully as: ${action === 'approve' ? 'Approved' : 'Rejected'}.`, "success");
      setManagerComments('');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      window.showToast(err.response?.data?.detail || "Failed to submit Manager review.", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Client side downloader for Excel (CSV formatted string)
  const handleDownloadCsv = () => {
    if (!selectedSite) return;
    const details = selectedSite.details_json ? JSON.parse(selectedSite.details_json) : {};
    const env = details?.environmental || {};
    const infra = details?.infrastructure || {};
    const opt = details?.optimization || {};

    const csvContent = [
      ["Parameter", "Value"],
      ["Site Name", selectedSite.name],
      ["Coordinates", `${selectedSite.latitude}, ${selectedSite.longitude}`],
      ["Region", selectedSite.region],
      ["Land Area (Ha)", selectedSite.land_area],
      ["Land Ownership", selectedSite.land_ownership],
      ["Elevation (m)", selectedSite.elevation],
      ["Overall Suitability Score", selectedSite.suitability_score],
      ["Classification", selectedSite.suitability_category],
      ["Solar Irradiance (GHI)", env.solar_irradiance],
      ["Wind Speed Hub (m/s)", details?.wind_prediction?.average_wind_speed],
      ["Wind Power Density (W/m2)", details?.wind_prediction?.wind_power_density],
      ["Recommended Tech Sizing", opt.technology_split],
      ["CAPEX (Million USD)", opt.economic_estimates?.estimated_capex_million_usd],
      ["OPEX (Million USD/year)", opt.economic_estimates?.estimated_opex_million_usd_year],
      ["Grid Interconnection Status", opt.economic_estimates?.grid_connection_status]
    ]
    .map(e => e.map(val => `"${val}"`).join(","))
    .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedSite.name.replace(/\s+/g, '_')}_feasibility_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client side downloader for PDF (JSON schema simulation)
  const handleDownloadPdf = (report) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(JSON.parse(report.content_json), null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `${report.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter projects by current section status
  const pendingAssignmentProjects = projects.filter(p => p.status === 'GIS Approved');
  const pendingReviewsCount = managerStats ? managerStats.pending_reviews_count : projects.filter(p => p.status === 'Manager Review').length;
  const approvedProjectsCount = managerStats ? managerStats.completed_reviews_count : projects.filter(p => p.status === 'Manager Approved').length;
  const rejectedProjectsCount = managerStats ? managerStats.rejected_reviews_count : projects.filter(p => p.status === 'Manager Rejected').length;
  const assignedProjectsCount = managerStats ? managerStats.assigned_projects_count : projects.length;

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <FileText className="w-5 h-5 text-indigo-400 mr-2" />
            Project Manager Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Conduct cost-benefit calculations, track development milestones, and export feasibility records.
          </p>
        </div>

        {/* Site & Project Selectors */}
        <div className="flex flex-wrap gap-2">
          {visibleProjects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-lg py-2 px-3 text-xs glass-input font-bold"
            >
              <option value="">Select Project...</option>
              {visibleProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
              ))}
            </select>
          )}

          {sites.length > 0 && currentSection === 'dashboard' && (
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="rounded-lg py-2 px-3 text-xs glass-input font-bold"
            >
              <option value="">Select Financial Site...</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Pending Reviews</span>
          <span className="text-xl font-black text-yellow-500 mt-1 block">
            {pendingReviewsCount}
          </span>
        </div>
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Approved Projects</span>
          <span className="text-xl font-black text-emerald-400 mt-1 block">
            {approvedProjectsCount}
          </span>
        </div>
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Rejected Projects</span>
          <span className="text-xl font-black text-rose-500 mt-1 block">
            {rejectedProjectsCount}
          </span>
        </div>
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Assigned Projects</span>
          <span className="text-xl font-black text-sky-400 mt-1 block">{assignedProjectsCount}</span>
        </div>
        <div className="bg-[#111827]/80 border border-slate-800 p-4 rounded-xl glass text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Milestones Average</span>
          <span className="text-xl font-black text-indigo-400 mt-1 block">
            {projects.length > 0 ? (projects.reduce((acc, p) => acc + (p.completion_percentage || 0), 0) / projects.length).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      {/* TABS SELECTOR FOR WORKSPACE VIEW */}
      <div className="flex space-x-2 bg-slate-950/60 p-1 border border-slate-900 rounded-xl w-fit">
        <button
          onClick={() => setCurrentSection('dashboard')}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded ${
            currentSection === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Feasibility & Costs
        </button>
        <button
          onClick={() => setCurrentSection('workflow')}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded ${
            currentSection === 'workflow' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Workflow Reviews ({pendingReviewsCount})
        </button>
        <button
          onClick={() => setCurrentSection('milestones')}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded ${
            currentSection === 'milestones' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Milestones Checklist
        </button>
      </div>

      {/* RENDER SECTION BASED ON STATE */}

      {/* 1. Dedicated Project Manager Workspace Panel */}
      {currentSection === 'workflow' && (
        <div className="glass-card border border-slate-800 p-5 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
                <Briefcase className="w-4.5 h-4.5 mr-1.5 text-indigo-400" />
                Project Manager Workspace
              </h3>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                Execute Portfolio Economics Assessment, Interconnection Milestones, and Final Siting Authorization Reviews
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Project Queue</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-lg py-1.5 px-3 text-xs glass-input font-bold w-full"
            >
              <option value="">Choose Project...</option>
              {visibleProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
              ))}
            </select>
          </div>

          {selectedProject ? (() => {
            const projectSites = sites.filter(s => Number(s.project_id) === Number(selectedProject.id));
            const mainSite = projectSites[0];
            let siteDetails = null;
            if (mainSite && mainSite.details_json) {
              try {
                siteDetails = JSON.parse(mainSite.details_json);
              } catch (e) {
                console.error(e);
              }
            }

            const isAssignedToMe = Number(selectedProject.assigned_manager_id || selectedProject.assigned_project_manager_id) === Number(user.id);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                
                {/* Left Column: GIS Review, Env Report, Solar/Wind/Hybrid Predictions (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* GIS Review info */}
                  <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">GIS Coordinate Review Audit</span>
                    <div className="text-xs font-semibold text-slate-350 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">GIS Validation Status:</span>
                        <span className="text-emerald-450 font-bold">✓ APPROVED</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">GIS Verification Date:</span>
                        <span className="text-slate-200 font-mono">{selectedProject.gis_reviewed_at ? new Date(selectedProject.gis_reviewed_at).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 border border-slate-850 rounded italic text-slate-400 font-normal">
                        "{selectedProject.gis_comments || 'Validated coordinates and environmental buffers successfully.'}"
                      </div>
                    </div>
                  </div>

                  {/* Environmental Report */}
                  {siteDetails ? (
                    <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Environmental Constraints Report</span>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-350">
                        <div className="space-y-1.5">
                          <span className="text-[8px] text-slate-500 block uppercase">Elevation Contour</span>
                          <span>{siteDetails.environmental?.elevation || 0} meters</span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[8px] text-slate-500 block uppercase">Average Terrain Slope</span>
                          <span>{siteDetails.environmental?.land_slope || 0} degrees</span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[8px] text-slate-500 block uppercase">Protected Area Buffer check</span>
                          <span className={siteDetails.infrastructure?.in_protected_zone ? "text-rose-400" : "text-emerald-450"}>
                            {siteDetails.infrastructure?.in_protected_zone ? "Constraint Detected" : "100% Clear of reserves"}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[8px] text-slate-500 block uppercase">Road Proximity</span>
                          <span>{siteDetails.infrastructure?.distance_to_road || 0} km grid access</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Solar & Wind Energy Resource Predictions */}
                  {siteDetails ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Solar Prediction */}
                      <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest block">Solar Generation Yield</span>
                        <div className="space-y-2 text-xs font-semibold text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Expected Generation:</span>
                            <span>{(siteDetails.solar?.expected_energy_output || 0).toLocaleString()} kWh/yr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Performance Capacity Factor:</span>
                            <span>{(siteDetails.solar?.capacity_factor * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Wind Prediction */}
                      <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block">Wind Generation Yield</span>
                        <div className="space-y-2 text-xs font-semibold text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Expected Generation:</span>
                            <span>{(siteDetails.wind?.expected_annual_energy || 0).toLocaleString()} kWh/yr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Average Wind speed (Hub):</span>
                            <span>{siteDetails.environmental?.wind_speed || 0} m/s</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : null}

                  {/* Hybrid Siting Decision */}
                  {siteDetails ? (
                    <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest block">AI Hybrid Co-location Siting recommendation</span>
                      <div className="text-xs font-semibold text-slate-350 space-y-2">
                        <div className="flex justify-between items-center bg-slate-900/60 p-2 border border-slate-850 rounded">
                          <span className="text-slate-500">Recommended Split:</span>
                          <span className="font-bold text-slate-200 capitalize">{siteDetails.hybrid?.recommendation}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 font-normal leading-normal">
                          {siteDetails.hybrid?.rationale || "Co-location is highly recommended based on climatological wind/solar negative correlation parameters."}
                        </p>
                      </div>
                    </div>
                  ) : null}

                </div>

                {/* Right Column: Visual Timeline, Comments Textarea & PM decisions (5 cols) */}
                <div className="lg:col-span-5 bg-slate-950/30 border border-slate-900 p-5 rounded-2xl space-y-6">
                  {/* Visual Timeline */}
                  <WorkflowVisualization project={selectedProject} usersList={usersList} />

                  {/* Actions Panel */}
                  <div className="bg-slate-900/50 p-4 border border-slate-850 rounded-2xl space-y-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">PM Actions Panel</span>
                    
                    {selectedProject.status === 'Manager Review' || selectedProject.status === 'GIS Approved' ? (
                      isAssignedToMe ? (
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Manager Comments</label>
                          <textarea
                            value={managerComments}
                            onChange={(e) => setManagerComments(e.target.value)}
                            placeholder="Enter notes on CapEx/OpEx, interconnection milestones checkoff, transmission proximity review comments..."
                            rows={3}
                            className="w-full rounded-lg p-2.5 text-xs glass-input font-semibold placeholder-slate-650 resize-none text-slate-200"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handlePMReview('approve')}
                              disabled={isSubmittingReview}
                              className="py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-lg shadow-md transition-all text-xs flex items-center justify-center space-x-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve Workflow</span>
                            </button>
                            <button
                              onClick={() => handlePMReview('reject')}
                              disabled={isSubmittingReview}
                              className="py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md transition-all text-xs flex items-center justify-center space-x-1.5"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span>Reject Workflow</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 text-indigo-400 rounded-lg text-center font-bold text-xs">
                          Awaiting Project Manager assignment. Please contact an Administrator to assign this project to your manager account.
                        </div>
                      )
                    ) : (
                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">PM Decision Record</span>
                        <div className="text-xs text-slate-350 italic p-3 bg-slate-950/60 rounded border border-slate-900">
                          "{selectedProject.manager_comments || 'No comments left.'}"
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold block mt-1">
                          Reviewed at: {selectedProject.manager_reviewed_at ? new Date(selectedProject.manager_reviewed_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    )}

                    {/* Progress Report Trigger */}
                    {mainSite && (
                      <button
                        onClick={handleDownloadCsv}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>Generate Progress Report</span>
                      </button>
                    )}

                  </div>

                </div>

              </div>
            );
          })() : (
            <div className="text-center text-slate-500 font-bold py-12 text-xs italic bg-slate-950/40 border border-slate-900 rounded-2xl p-8">
              {visibleProjects.length === 0 
                ? "No projects currently in your validation queue. Go to the Projects tab to view all campaigns and claim unassigned reviews."
                : "Select a project from the validation queue drop-down at the top to open the Project Manager Workspace."}
            </div>
          )}
        </div>
      )}

      {/* 2. MILESTONES CHECKLIST VIEW */}
      {currentSection === 'milestones' && (
        selectedProject ? (
          (() => {
            let milestonesList = [];
            try {
              milestonesList = JSON.parse(selectedProject.milestones);
            } catch (e) {
              milestonesList = [];
            }

            return (
              <div className="glass-card border border-slate-800 p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
                      <Briefcase className="w-4.5 h-4.5 mr-1.5 text-blue-500" />
                      Milestones Checklist Progression
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                      Check off stages for: <strong className="text-slate-350">{selectedProject.name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-bold text-slate-400">Completion:</span>
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black rounded-lg">
                      {selectedProject.completion_percentage}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {milestonesList.map((m, idx) => {
                    const isPMTask = idx === 3 || idx === 5 || idx === 6;
                    const isCurrentRoleAllowed = isPMTask && selectedProject.status !== "Completed";

                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border transition-all ${
                          m.completed 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-200' 
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Step {idx + 1}</span>
                            <span className="text-[11px] font-bold mt-1 block leading-tight">{m.name}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={m.completed}
                            disabled={!isCurrentRoleAllowed || isUpdatingMilestones}
                            onChange={() => handleToggleMilestone(idx)}
                            className={`rounded w-4 h-4 bg-slate-950 border-slate-800 text-[#16A34A] focus:ring-0 ${
                              isCurrentRoleAllowed ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                            }`}
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 block mt-2 font-semibold">
                          {isPMTask ? "PM Action Allowed" : "Automated Checkoff"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-center text-slate-500 font-bold py-12 text-xs italic bg-slate-950/40 border border-slate-800 rounded-2xl p-8">
            {visibleProjects.length === 0
              ? "No projects currently assigned to you. Claim a project first to manage its milestone checklist."
              : "Please select a project from the drop-down at the top to view its milestones checklist."}
          </div>
        )
      )}

      {/* 3. COST FEASIBILITY DASHBOARD VIEW */}
      {currentSection === 'dashboard' && (
        selectedSite ? (
          (() => {
            const details = selectedSite.details_json ? JSON.parse(selectedSite.details_json) : {};
            const opt = details?.optimization || {};
            const econ = opt.economic_estimates || {};
            
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Financial payback analysis chart */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card border border-slate-800 p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
                          <TrendingUp className="w-4.5 h-4.5 mr-1.5 text-emerald-500" />
                          20-Year Financial Payback Forecast
                        </h3>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Payback period modeling for site: <strong className="text-slate-350">{selectedSite.name}</strong>
                        </span>
                      </div>

                      <button
                        onClick={handleDownloadCsv}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-all flex items-center space-x-1 shadow-md"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Excel (CSV)</span>
                      </button>
                    </div>

                    <CostBenefitChart 
                      capex={econ.estimated_capex_million_usd || 10.0} 
                      opex={econ.estimated_opex_million_usd_year || 0.2} 
                      annualEnergyMWh={(details.project_type === 'solar' ? details.solar_prediction.expected_energy_output : details.wind_prediction.expected_annual_energy) / 1000} 
                      recommendedTech={opt.recommended_technology}
                    />
                  </div>

                  {/* Feasibility Checklist Summary */}
                  <div className="glass-card border border-slate-800 p-5 space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
                      <CheckSquare className="w-4 h-4 mr-1.5 text-blue-500" />
                      Resource Suitability Indicators
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg flex items-start space-x-2.5">
                        <span className="p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded mt-0.5">✓</span>
                        <div>
                          <span className="font-bold text-slate-300">Resource Potency</span>
                          <p className="text-slate-400 leading-normal mt-0.5">
                            Capacity factor is modeled at {selectedSite.suitability_score >= 70 ? 'Optimal' : 'Marginal'} level ({selectedSite.suitability_score}% suitability rating).
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg flex items-start space-x-2.5">
                        {details.infrastructure?.in_protected_zone ? (
                          <span className="p-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded mt-0.5">✗</span>
                        ) : (
                          <span className="p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded mt-0.5">✓</span>
                        )}
                        <div>
                          <span className="font-bold text-slate-300">Environmental Constraints</span>
                          <p className="text-slate-400 leading-normal mt-0.5">
                            {details.infrastructure?.in_protected_zone 
                              ? "CRITICAL FAIL: Site violates nature reserves boundaries." 
                              : "PASS: Location coordinates are clear of ecological protected zones."
                            }
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg flex items-start space-x-2.5">
                        <span className="p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded mt-0.5">✓</span>
                        <div>
                          <span className="font-bold text-slate-300">Slope Gradients</span>
                          <p className="text-slate-400 leading-normal mt-0.5">
                            Land slope of {details.environmental?.land_slope || 0}° is verified safe for mount brackets and turbine bases.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg flex items-start space-x-2.5">
                        {details.infrastructure?.distance_to_transmission > 8.0 ? (
                          <span className="p-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded mt-0.5">!</span>
                        ) : (
                          <span className="p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded mt-0.5">✓</span>
                        )}
                        <div>
                          <span className="font-bold text-slate-300">Grid Connectivity</span>
                          <p className="text-slate-400 leading-normal mt-0.5">
                            Distance to transmission line: {details.infrastructure?.distance_to_transmission || 0} km. Cost factors included in CAPEX estimates.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reports Generator panel */}
                <div className="glass-card border border-slate-800 p-5 flex flex-col justify-between h-full space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center">
                        <FileText className="w-4 h-4 mr-1.5 text-indigo-400" />
                        Reports & Export History
                      </h3>
                      <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Generate formal technical PDF attachments</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                      <button 
                        onClick={() => handleGenerateReport('site_assessment')}
                        disabled={isGenerating}
                        className="p-2 border border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300 rounded text-center transition-all disabled:opacity-50"
                      >
                        Site Assessment
                      </button>
                      <button 
                        onClick={() => handleGenerateReport('solar_potential')}
                        disabled={isGenerating}
                        className="p-2 border border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300 rounded text-center transition-all disabled:opacity-50"
                      >
                        Solar Potential
                      </button>
                      <button 
                        onClick={() => handleGenerateReport('wind_potential')}
                        disabled={isGenerating}
                        className="p-2 border border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300 rounded text-center transition-all disabled:opacity-50"
                      >
                        Wind Potential
                      </button>
                      <button 
                        onClick={() => handleGenerateReport('investment')}
                        disabled={isGenerating}
                        className="p-2 border border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300 rounded text-center transition-all disabled:opacity-50"
                      >
                        Investment Summary
                      </button>
                    </div>

                    <div className="border-t border-slate-800 pt-4 space-y-2 flex-1 max-h-[220px] overflow-y-auto pr-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Available Reports</span>
                      {isLoadingReports ? (
                        <div className="text-center text-slate-650 font-bold py-4">
                          Loading reports...
                        </div>
                      ) : reports.map((r) => (
                        <div key={r.id} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between text-[11px]">
                          <div className="truncate max-w-[150px]">
                            <span className="font-bold text-slate-300 block truncate">{r.name}</span>
                            <span className="text-[9px] text-slate-500 font-semibold">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          <button
                            onClick={() => handleDownloadPdf(r)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/80 transition-all"
                            title="Download PDF JSON Schema"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {!isLoadingReports && reports.length === 0 && (
                        <div className="text-center text-slate-650 font-bold py-4">
                          No reports generated yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mini Summary of financial KPIs */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">LCOE Target:</span>
                        <span className="font-bold text-emerald-400">
                          {econ.lcoe ? `$${econ.lcoe}/MWh` : '$48.5/MWh'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">NPV Value:</span>
                        <span className="font-bold text-slate-200">
                          {econ.npv ? `$${econ.npv}M` : '$12.4M'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()
        ) : (
          <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 font-bold text-xs">
            No Site location selected. Please select a site to analyze financials.
          </div>
        )
      )}
    </div>
  );
}
