import { useState } from "react";
import { HiOutlineBars3 } from "react-icons/hi2";

import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Fixed Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-col min-h-screen lg:ml-64">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white px-5 py-4">
          <div className="flex items-center gap-2 text-lg font-bold">
            ⚡ Solar & Wind <span className="text-green-400">AI</span>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="text-2xl text-white/80 hover:text-white"
          >
            <HiOutlineBars3 />
          </button>
        </div>

        {/* Page Content */}
        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}