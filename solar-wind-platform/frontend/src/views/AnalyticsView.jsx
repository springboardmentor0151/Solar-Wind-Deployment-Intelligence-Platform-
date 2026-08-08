import React from 'react';
import { TrendingUp, Sparkles, Activity } from 'lucide-react';

export default function AnalyticsView({ projects, sites }) {
  
  const getCapacityData = () => {
    return projects.map(p => {
      const pSites = sites.filter(s => Number(s.project_id) === Number(p.id));
      let cap = 0;
      pSites.forEach(s => {
        const det = s.details_json ? JSON.parse(s.details_json) : {};
        cap += (det.optimization?.recommended_capacity_mw || 0);
      });
      return {
        name: p.name,
        Capacity: Math.round(cap)
      };
    });
  };

  const getGlobalRatings = () => {
    return sites.map(s => ({
      name: s.name,
      Score: s.suitability_score,
      region: s.region || "Global"
    })).sort((a, b) => b.Score - a.Score).slice(0, 8);
  };

  const capacityData = getCapacityData();
  const ratingsData = getGlobalRatings();

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Banner */}
      <div className="bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass">
        <h2 className="text-xl font-bold text-slate-100 flex items-center">
          <TrendingUp className="w-5 h-5 text-[#16A34A] mr-2" />
          Global GIS Analytics Hub
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Perform comparative macro assessments across active project folders and registered sites.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Project capacity comparison table */}
        <div className="bg-[#111827]/80 p-5 border border-slate-800 rounded-2xl glass space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Project Capacity Load Matrix</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Sum of recommended turbine and solar capacities across projects.</p>
          </div>
          
          <div className="overflow-x-auto h-64">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Project Name</th>
                  <th className="py-2.5 px-3 text-right">Installed Capacity</th>
                </tr>
              </thead>
              <tbody className="text-slate-355">
                {capacityData.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-900 hover:bg-slate-950/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-100 font-bold">{p.name}</td>
                    <td className="py-2.5 px-3 text-right text-sky-450 font-black font-mono">{p.Capacity} MW</td>
                  </tr>
                ))}
                {capacityData.length === 0 && (
                  <tr>
                    <td colSpan="2" className="py-8 text-center text-slate-600 italic">No active projects available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global suitability rankings table */}
        <div className="bg-[#111827]/80 p-5 border border-slate-800 rounded-2xl glass space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Top Feasible Siting Indices</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Feasibility percentages mapped by location pin indexes.</p>
          </div>
          
          <div className="overflow-x-auto h-64">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Site Location</th>
                  <th className="py-2.5 px-3">Region</th>
                  <th className="py-2.5 px-3 text-right">Suitability Score</th>
                </tr>
              </thead>
              <tbody className="text-slate-355">
                {ratingsData.map((s, idx) => (
                  <tr key={idx} className="border-b border-slate-900 hover:bg-slate-950/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-100 font-bold truncate max-w-[120px]">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{s.region}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-450 font-black font-mono">{s.Score}%</td>
                  </tr>
                ))}
                {ratingsData.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-600 italic">No evaluated locations available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
