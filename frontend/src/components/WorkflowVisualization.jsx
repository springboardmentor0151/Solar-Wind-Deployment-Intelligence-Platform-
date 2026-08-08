import React from 'react';
import { Check, AlertTriangle, Play, Hourglass, Calendar, MessageSquare, User, TrendingUp } from 'lucide-react';

export default function WorkflowVisualization({ project, usersList = [] }) {
  if (!project) return null;

  // Linear stages list
  const stages = [
    { key: 'Draft', label: 'Draft Campaign' },
    { key: 'Submitted', label: 'Submitted' },
    { key: 'GIS Review', label: 'GIS Review' },
    { key: 'GIS Approved', label: 'GIS Approved' },
    { key: 'Manager Review', label: 'Manager Review' },
    { key: 'Manager Approved', label: 'Manager Approved' },
    { key: 'Admin Review', label: 'Administrator Review' },
    { key: 'Completed', label: 'Completed' }
  ];

  const currentStatus = project.status || 'Draft';
  const progress = project.completion_percentage || 0;

  // Map reviewer names
  const getUserName = (userId) => {
    if (!userId) return null;
    const found = usersList.find(u => Number(u.id) === Number(userId));
    return found ? found.full_name || found.username : `User #${userId}`;
  };

  // Helper to determine step status
  const getStepStatus = (stageKey) => {
    // 1. Rejected checks
    if (stageKey === 'GIS Review' && currentStatus === 'GIS Rejected') return 'rejected';
    if (stageKey === 'Manager Review' && currentStatus === 'Manager Rejected') return 'rejected';
    if (stageKey === 'Admin Review' && currentStatus === 'Rejected') return 'rejected';

    // 2. Current checks
    if (stageKey === currentStatus) return 'current';
    if (stageKey === 'Admin Review' && currentStatus === 'Admin Review') return 'current';

    // 3. Completed checks
    const statusOrder = [
      'Draft', 'Submitted', 'GIS Review', 'GIS Approved', 
      'Manager Review', 'Manager Approved', 'Admin Review', 'Completed'
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const stageIndex = statusOrder.indexOf(stageKey);

    if (stageIndex < currentIndex && currentIndex !== -1) {
      return 'completed';
    }

    return 'pending';
  };

  // Resolve step details
  const getStepMeta = (stageKey) => {
    switch (stageKey) {
      case 'Draft':
        return {
          date: project.created_at,
          reviewer: getUserName(project.owner_id) || 'Project Creator',
          comments: 'Campaign sited, coordinates registered.',
        };
      case 'Submitted':
        return {
          date: project.submitted_at,
          reviewer: getUserName(project.owner_id),
          comments: 'Campaign submitted for validation.',
        };
      case 'GIS Review':
        return {
          date: project.gis_reviewed_at,
          reviewer: getUserName(project.assigned_gis_analyst_id || project.assigned_analyst_id),
          comments: project.gis_comments,
        };
      case 'GIS Approved':
        return {
          date: project.gis_approved_at || project.gis_reviewed_at,
          reviewer: getUserName(project.assigned_gis_analyst_id || project.assigned_analyst_id),
          comments: 'GIS validation complete.',
        };
      case 'Manager Review':
        return {
          date: project.manager_reviewed_at,
          reviewer: getUserName(project.assigned_project_manager_id || project.assigned_manager_id),
          comments: project.manager_comments,
        };
      case 'Manager Approved':
        return {
          date: project.manager_approved_at || project.manager_reviewed_at,
          reviewer: getUserName(project.assigned_project_manager_id || project.assigned_manager_id),
          comments: 'Siting cost modeling approved.',
        };
      case 'Admin Review':
        return {
          date: project.admin_reviewed_at || project.completed_at,
          reviewer: getUserName(project.assigned_administrator_id),
          comments: project.admin_comments,
        };
      case 'Completed':
        return {
          date: project.completed_at,
          reviewer: getUserName(project.assigned_administrator_id) || 'System Admin',
          comments: 'Authorized connection complete.',
        };
      default:
        return {};
    }
  };

  return (
    <div className="bg-[#111827]/40 border border-slate-800 p-5 rounded-2xl space-y-4 glass">
      
      {/* Progress Header */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
        <div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Workflow Visualization</span>
          <span className="text-xs font-bold text-slate-200 mt-0.5 block">Siting Lifecycle Stages</span>
        </div>
        <div className="flex items-center space-x-2.5">
          <TrendingUp className="w-4 h-4 text-[#10B981]" />
          <span className="text-[11px] font-bold text-slate-400">Completion:</span>
          <span className="px-2 py-0.5 bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] font-black rounded-lg text-xs font-mono">
            {progress}%
          </span>
        </div>
      </div>

      {/* Vertical Steps */}
      <div className="relative pl-6 space-y-4">
        {/* Continuous timeline line */}
        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-800"></div>

        {stages.map((stage) => {
          const stepStatus = getStepStatus(stage.key);
          const meta = getStepMeta(stage.key);

          // Visual styles mapping
          let iconBg = 'bg-slate-900 border-slate-800 text-slate-600';
          let iconEl = <Hourglass className="w-3 h-3" />;
          let labelColor = 'text-slate-500';
          let borderStyle = 'border-slate-900/40';

          if (stepStatus === 'completed') {
            iconBg = 'bg-[#10B981] border-[#10B981] text-white shadow shadow-emerald-500/20';
            iconEl = <Check className="w-3 h-3" />;
            labelColor = 'text-slate-350';
          } else if (stepStatus === 'current') {
            iconBg = 'bg-[#0EA5E9] border-[#0EA5E9] text-white shadow shadow-sky-500/20 animate-pulse';
            iconEl = <Play className="w-2.5 h-2.5 ml-0.5" />;
            labelColor = 'text-slate-100 font-extrabold';
            borderStyle = 'border-[#0ea5e9]/20 bg-[#0ea5e9]/5';
          } else if (stepStatus === 'rejected') {
            iconBg = 'bg-rose-600 border-rose-600 text-white shadow shadow-rose-500/20';
            iconEl = <AlertTriangle className="w-3 h-3" />;
            labelColor = 'text-rose-400 font-extrabold';
            borderStyle = 'border-rose-900/30 bg-rose-950/10';
          }

          return (
            <div key={stage.key} className="relative flex items-start space-x-3 text-xs">
              
              {/* Step indicator node */}
              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border ${iconBg} z-10`}>
                {iconEl}
              </div>

              {/* Step content card */}
              <div className={`flex-1 p-3 rounded-xl border transition-all ${borderStyle} ${
                stepStatus === 'current' || stepStatus === 'rejected' ? '' : 'bg-slate-900/30'
              }`}>
                
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${labelColor}`}>{stage.label}</span>
                  <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    stepStatus === 'completed' ? 'bg-[#10B981]/10 text-[#10B981]' :
                    stepStatus === 'current' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' :
                    stepStatus === 'rejected' ? 'bg-rose-600/10 text-rose-400' :
                    'bg-slate-900 text-slate-500'
                  }`}>
                    {stepStatus === 'completed' ? 'Completed' :
                     stepStatus === 'current' ? 'Active' :
                     stepStatus === 'rejected' ? 'Rejected' :
                     'Pending'}
                  </span>
                </div>

                {/* Meta details if completed, current, or rejected */}
                {(stepStatus !== 'pending' || meta.comments) && (
                  <div className="mt-2 space-y-1.5 text-[10px] text-slate-400 font-semibold border-t border-slate-850/40 pt-2 animate-fade-in">
                    
                    {meta.reviewer && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Reviewer: <strong className="text-slate-300 font-bold">{meta.reviewer}</strong></span>
                      </div>
                    )}

                    {meta.date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Date: <span className="text-slate-350 font-mono">{new Date(meta.date).toLocaleString()}</span></span>
                      </div>
                    )}

                    {meta.comments && (
                      <div className="flex items-start space-x-1 bg-slate-950/40 p-2 rounded border border-slate-900 mt-1 italic text-slate-300 font-normal">
                        <MessageSquare className="w-3 h-3 text-slate-500 mt-0.5 mr-1 shrink-0" />
                        <span>"{meta.comments}"</span>
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
