import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import "../styles/Login.css";

function Login() {

  const navigate = useNavigate();

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  const loginUser=async(e)=>{

    e.preventDefault();

    try{

      const response=await API.post("/users/login",{

        email,
        password,

      });

      localStorage.setItem(
        "token",
        response.data.access_token
      );

      navigate("/dashboard");

    }

    catch{

      alert("Invalid Email or Password");

    }

  };

  return(

<div className="login-page">

<div className="login-card">

<h1>⚡ Welcome Back</h1>

<p className="subtitle">

Login to continue Renewable Energy Analysis

</p>

<form onSubmit={loginUser}>

<input
type="email"
placeholder="Enter Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="Enter Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

<button type="submit">

Login

</button>

</form>

<div className="register-link">

Don't have an account?

<br/>

<Link to="/register">

Create Account

</Link>

</div>

</div>

</div>

  );

}

export default Login;