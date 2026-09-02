import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove JWT token
    localStorage.removeItem("token");

    // Show message
    alert("Logged out successfully!");

    // Redirect to Login page
    navigate("/");
  };

  return (
    <nav
      style={{
        background: "#0f766e",
        color: "white",
        padding: "15px 25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <h2 style={{ margin: 0 }}>
        🌞 Solar & Wind Deployment Intelligence Platform
      </h2>

      <button
        onClick={handleLogout}
        style={{
          background: "#dc2626",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        Logout
      </button>
    </nav>
  );
}

export default Navbar;