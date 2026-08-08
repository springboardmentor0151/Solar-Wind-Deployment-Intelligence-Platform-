import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AccessDeniedView({ setView }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center">
      <div className="bg-[#0f172a]/80 border border-slate-800 p-8 rounded-3xl max-w-md w-full glass space-y-6 animate-fade-in shadow-2xl">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">Access Denied</h2>
          <p className="text-xs text-slate-450 leading-relaxed font-semibold">
            Administrative privileges are required to access this workspace. Your account does not have permissions to view this resource.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-900">
          <button
            onClick={() => setView('dashboard')}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600/30 to-sky-600/20 hover:from-blue-600/40 border border-blue-500/30 hover:border-blue-500/50 rounded-xl text-sky-400 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
