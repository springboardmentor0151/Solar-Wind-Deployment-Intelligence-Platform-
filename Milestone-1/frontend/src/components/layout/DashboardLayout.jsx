import { useState } from "react";
import { HiOutlineBars3 } from "react-icons/hi2";

import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar — only visible below lg, keeps nav reachable on small screens */}
        <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white px-5 py-4">
          <div className="flex items-center gap-2 text-lg font-bold">
            ⚡ Solar & Wind<span className="text-green ml-1">AI</span>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="text-2xl text-white/80 hover:text-white"
          >
            <HiOutlineBars3 />
          </button>
        </div>

        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
}
