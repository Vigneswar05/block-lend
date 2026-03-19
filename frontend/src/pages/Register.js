import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContract, connectWallet } from "../blockchain/ethersService";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    pan: "",
    salary: "",
    role: "borrower"
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await connectWallet();
      const contract = await getContract(true);
      
      const roleEnum = form.role === "borrower" ? 0 : 1;
      const salaryNum = parseInt(form.salary) || 0;

      const tx = await contract.registerUser(form.name, form.email, form.pan, salaryNum, roleEnum);
      await tx.wait();

      alert("Registered Successfully on Blockchain!");
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message.includes("User already registered")) {
        alert("This wallet address is already registered in the system.");
        navigate("/login");
      } else {
        alert("Transaction Failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register via Web3</h2>

        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Full Name" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input name="salary" type="number" placeholder="Annual Income (Salary)" onChange={handleChange} required />
          <input name="pan" placeholder="PAN Number (ABCDE1234F)" onChange={handleChange} required maxLength={10} />

          <select name="role" onChange={handleChange}>
            <option value="borrower">Borrower</option>
            <option value="lender">Lender</option>
          </select>

          <button disabled={loading}>
            {loading ? "Registering on Blockchain..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
