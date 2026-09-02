import { useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const menuStyle = {
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "6px",
    cursor: "pointer",
    background: "#374151",
  };

  return (
    <div
      style={{
        width: "240px",
        background: "#1f2937",
        color: "white",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h2 style={{ marginBottom: "30px" }}>
        Navigation
      </h2>

      <div
        style={menuStyle}
        onClick={() => navigate("/dashboard")}
      >
        📊 Dashboard
      </div>

      <div
        style={menuStyle}
        onClick={() => navigate("/projects")}
      >
        📁 Projects
      </div>

      <div
        style={menuStyle}
        onClick={() => navigate("/sites")}
      >
        📍 Sites
      </div>

      <div
        style={menuStyle}
        onClick={() => navigate("/optimization")}
      >
        ⚡ Optimization
      </div>

      <div
        style={menuStyle}
        onClick={() => navigate("/investment")}
      >
        💰 Investment
      </div>

      <div
        style={menuStyle}
        onClick={() => navigate("/reports")}
      >
        📄 Reports
      </div>

      <div style={menuStyle}>
        ⚙ Settings
      </div>

      <button
        onClick={logout}
        style={{
          width: "100%",
          marginTop: "30px",
          padding: "10px",
          background: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
}

export default Sidebar;