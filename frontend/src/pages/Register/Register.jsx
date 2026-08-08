import "./Register.css";

import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Logo from "../../components/Logo/Logo";

function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed."
        );
      }

      alert("✅ Account created successfully!");

      navigate("/login");
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">

      {/* Decorative glowing circles */}
      <div className="register-glow register-glow-one"></div>
      <div className="register-glow register-glow-two"></div>

      <motion.div
        className="register-card"
        initial={{ opacity: 0, y: 70 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >

        <Logo />

        <div className="register-heading">
          <h2>Create Your Account</h2>

          <p>
            Join the Solar & Wind Deployment
            Intelligence Platform
          </p>
        </div>

        {/* Email */}
        <div className="register-input-box">
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="register-input-box">
          <label>Password</label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Confirm Password */}
        <div className="register-input-box">
          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />
        </div>

        {/* Register Button */}
        <button
          className="register-btn"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading
            ? "Creating Account..."
            : "Create Account →"}
        </button>

        {/* Login Link */}
        <p className="login-redirect">
          Already have an account?{" "}
          <Link to="/login">
            Login here
          </Link>
        </p>

        <div className="register-footer">
          © 2026 SolarWind Deployment Intelligence
        </div>

      </motion.div>
    </div>
  );
}

export default Register;
