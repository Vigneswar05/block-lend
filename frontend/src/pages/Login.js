import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      if (data.error) {
        // If user not found, redirect to register
        alert("User not found. Redirecting to registration page...");
        navigate("/register");
      } else {
        // Save user to localStorage
        localStorage.setItem("user", JSON.stringify(data));

        // Navigate based on role
        if (data.role === "borrower") navigate("/borrower");
        else navigate("/lender");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Error connecting to server. Please check if the backend is running.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" className="hero-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;