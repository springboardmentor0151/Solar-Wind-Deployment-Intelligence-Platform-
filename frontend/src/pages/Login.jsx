import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log(response.data);
localStorage.setItem(
  "token",
  response.data.access_token
);

localStorage.setItem(
  "user",
  JSON.stringify(response.data.user)
);

alert("Login Successful!");

navigate("/dashboard");

    } catch (error) {

      console.error("Login Error:", error);

      if (error.response) {
        alert(
          error.response.data.detail ||
          "Invalid email or password."
        );
      } else {
        alert("Unable to connect to the server.");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-green-500 to-blue-600 flex items-center justify-center">

      <div className="bg-white rounded-2xl shadow-2xl p-10 w-[420px]">

        <h1 className="text-3xl font-bold text-center text-green-700">
          Solar & Wind
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Deployment Intelligence Platform
        </p>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >

          <input
            type="email"
            placeholder="Enter Email"
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-green-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Login;