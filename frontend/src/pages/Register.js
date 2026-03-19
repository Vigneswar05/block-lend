import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    pan: "",
    role: "borrower"
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        alert("Registered Successfully!");
        navigate("/login");
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("Error connecting to server. Please check if the backend is running.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>

        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Full Name" onChange={handleChange} required />
          <input name="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <input name="pan" placeholder="PAN Number (ABCDE1234F)" onChange={handleChange} required maxLength={10} />

          <select name="role" onChange={handleChange}>
            <option value="borrower">Borrower</option>
            <option value="lender">Lender</option>
          </select>

          <button>Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
