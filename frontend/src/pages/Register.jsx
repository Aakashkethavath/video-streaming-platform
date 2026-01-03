import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer"); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating account...");
    try {
      await axios.post("https://video-streaming-platform-99n4.onrender.com/api/auth/register", { 
        username, 
        email, 
        password,
        role 
      });
      toast.dismiss(toastId);
      toast.success("Account created! Please login.");
      navigate("/");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit}>
          
          <label>Username</label>
          <input 
            type="text" 
            placeholder="johndoe" 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          
          <label>Email Address</label>
          <input 
            type="email" 
            placeholder="name@example.com" 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          
          <label>Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          <label>Select Role</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            style={{ marginBottom: "1.5rem" }}
          >
            <option value="viewer">Viewer (Watch Only)</option>
            <option value="editor">Editor (Upload Videos)</option>
          </select>

          <button type="submit">Sign Up</button>
        </form>

        <p style={{marginTop: '1.5rem', textAlign: 'center', color: '#6b7280'}}>
          Already have an account? <Link to="/" style={{color: '#4f46e5', fontWeight: '600'}}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;