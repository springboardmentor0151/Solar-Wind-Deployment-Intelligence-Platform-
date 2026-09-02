import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import "../styles/Login.css";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Admin",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const registerUser = async (e) => {
    e.preventDefault();

    try {
      await API.post("/users/register", form);

      alert("Registration Successful!");

      navigate("/login");
    } catch (error) {
      console.log(error);

      if (error.response) {
        alert(error.response.data.detail);
      } else {
        alert("Registration Failed");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1>🌱 Create Account</h1>

        <p className="subtitle">
          Join the Solar & Wind Deployment Intelligence Platform
        </p>

        <form onSubmit={registerUser}>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "20px",
              border: "none",
              borderRadius: "12px",
              outline: "none",
              fontSize: "15px",
            }}
          >
            <option value="Admin">Admin</option>
            <option value="Engineer">Engineer</option>
            <option value="Viewer">Viewer</option>
          </select>

          <button type="submit">
            Create Account
          </button>

        </form>

        <div className="register-link">

          Already have an account?

          <br />

          <Link to="/login">
            Login Here
          </Link>

        </div>

      </div>
    </div>
  );
}

export default Register;