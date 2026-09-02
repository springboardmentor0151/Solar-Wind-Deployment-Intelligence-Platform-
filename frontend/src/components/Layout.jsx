import { Link, useLocation } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  const location = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
      }}
    >
      {/* ============================= */}
      {/* TOP NAVBAR */}
      {/* ============================= */}

      <Navbar />

      {/* ============================= */}
      {/* MAIN APPLICATION AREA */}
      {/* ============================= */}

      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 70px)",
        }}
      >
        {/* SIDEBAR */}

        <Sidebar />

        {/* CONTENT */}

        <main
          style={{
            flex: 1,
            padding: "30px",
            overflowX: "hidden",
          }}
        >
          {/* ============================= */}
          {/* INVESTMENT QUICK ACCESS */}
          {/* ============================= */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "15px",
            }}
          >
            <Link
              to="/investment"
              style={{
                textDecoration: "none",
                background:
                  location.pathname === "/investment"
                    ? "#15803d"
                    : "#16a34a",
                color: "#ffffff",
                padding: "11px 18px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                boxShadow:
                  "0 2px 6px rgba(0,0,0,0.12)",
              }}
            >
              💰 Investment Recommendation
            </Link>
          </div>

          {/* PAGE CONTENT */}

          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;