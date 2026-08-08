import "./Login.css";

import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Logo from "../../components/Logo/Logo";
import CustomInput from "../../components/Input/CustomInput";
import PrimaryButton from "../../components/Button/PrimaryButton";

import { loginUser } from "../../services/authService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const data = await loginUser(email, password);

      localStorage.setItem("token", data.access_token);

      alert("✅ Login Successful!");

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Login Failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 70 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Logo />

        <CustomInput
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <CustomInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <PrimaryButton onClick={handleLogin}>
          {loading ? "Logging in..." : "Secure Login →"}
        </PrimaryButton>

        {/* Register Link */}
        <p className="register-link">
          Don't have an account?{" "}
          <Link to="/register">Register here</Link>
        </p>

        <div className="footer">
          © 2026 SolarWind Deployment Intelligence
        </div>
      </motion.div>
    </div>
  );
}

export default Login;