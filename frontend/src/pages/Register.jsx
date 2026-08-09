import React, { useState } from "react";
import api from '../api'; 

const ROLES = ["renewable_energy_planner", "gis_analyst", "project_manager", "administrator"];

export default function Register({ onRegistered }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: ROLES[0] });
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      
      const payload = {
        ...form,
        full_name: form.name
      };

      const response = await api.post("/auth/register", payload);
      
      if (response.status === 200 || response.status === 201) {
        onRegistered();
      } else {
        setError("Registration failed.");
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      
      let errorMessage = "Registration failed. Please try again.";
      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map(d => (typeof d === "string" ? d : d.msg || JSON.stringify(d))).join(", ");
      } else if (detail !== null && typeof detail === "object") {
        errorMessage = detail.msg || JSON.stringify(detail);
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  const renderErrorMessage = () => {
    if (!error) return null;
    if (typeof error === "string") return error;
    return JSON.stringify(error);
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h2>Create an account</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" value={form.name} onChange={update("name")} required style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        <input type="email" placeholder="Email" value={form.email} onChange={update("email")} required style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        <input type="password" placeholder="Password" value={form.password} onChange={update("password")} required style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        <select value={form.role} onChange={update("role")} style={{ width: "100%", padding: 8, marginBottom: 12 }}>
          {ROLES.map((r) => <option key={r} value={r}>{r.replaceAll("_", " ")}</option>)}
        </select>
        {error && <p style={{ color: "red" }}>{renderErrorMessage()}</p>}
        <button type="submit" style={{ width: "100%", padding: 10 }}>Register</button>
      </form>
    </div>
  );
}