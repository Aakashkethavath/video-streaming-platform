import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Logging in...");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
      toast.dismiss(toastId);
      toast.success("Welcome back!");
      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2>Welcome Back</h2>
        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input type="email" placeholder="name@example.com" onChange={(e) => setEmail(e.target.value)} required />
          
          <label>Password</label>
          <input type="password" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} required />
          
          <button type="submit">Sign In</button>
        </form>
        <p style={{marginTop: '1.5rem', textAlign: 'center', color: '#6b7280'}}>
          Don't have an account? <Link to="/register" style={{color: '#4f46e5', fontWeight: '600'}}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;