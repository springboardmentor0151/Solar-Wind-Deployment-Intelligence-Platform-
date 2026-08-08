import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const [errorMessage, setErrorMessage] = useState("");
  async function handleRegister(e) {
    e.preventDefault();

    try {
      await api.post("/auth/register", {
        full_name: fullName,
        email: email,
        password: password,
        role: role,
      });

      alert("Registration Successful!");

      // Clear form
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("Admin");

      // Redirect to Login page
      navigate("/login");

    } 
catch (error) {
  console.log("ERROR:", error);
  console.log("MESSAGE:", error.message);
  console.log("RESPONSE:", error.response);

  if (error.response) {
    setErrorMessage(JSON.stringify(error.response.data));
  } else {
    setErrorMessage(error.message);
  }
}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-green-500 to-blue-600 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-[420px]">

        <h1 className="text-3xl font-bold text-center text-green-700">
          Register
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Create your account
        </p>

        {errorMessage && (
  <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
    {errorMessage}
  </div>
)}

        <form onSubmit={handleRegister} className="mt-8 space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Admin">Admin</option>
            <option value="Analyst">Analyst</option>
            <option value="User">User</option>
          </select>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition"
          >
            Register
          </button>

        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-green-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;