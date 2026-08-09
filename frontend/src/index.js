import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      const err = this.state.error;
      
      if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object") {
        errorMessage = err.message || JSON.stringify(err);
      }

      return (
        <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center" }}>
          <h2>Something went wrong.</h2>
          <p style={{ color: "red", background: "#ffe6e6", padding: 10, borderRadius: 4, maxWidth: 600, margin: "10px auto" }}>
            {errorMessage}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: "8px 16px", cursor: "pointer", marginTop: 10 }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);