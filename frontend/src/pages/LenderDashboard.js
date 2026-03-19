import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContract, parseEther } from "../blockchain/ethersService";

function LenderDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");

    const fetchLoans = () => {
      fetch("https://blocklend-backend.onrender.com/all-loans")
        .then(res => res.json())
        .then(data => setLoans(data))
        .catch(err => console.error("Error fetching loans:", err));
    };

    fetchLoans();
    const interval = setInterval(fetchLoans, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const predictRisk = async (id) => {
    try {
      const res = await fetch(`https://blocklend-backend.onrender.com/predict-loan/${id}`, { method: "POST" });
      const data = await res.json();
      setLoans(loans.map(loan => loan.id === id ? { ...loan, ...data } : loan));
    } catch (err) {
      console.error("Predict risk error:", err);
      alert("Failed to perform risk analysis. Is the backend running?");
    }
  };

  const approveLoan = async (id) => {
    try {
      const res = await fetch(`https://blocklend-backend.onrender.com/approve-loan/${id}`, { method: "POST" });
      const data = await res.json();
      setLoans(loans.map(loan => loan.id === id ? { ...loan, ...data } : loan));
      alert("Loan Approved in system. Now you can fund it on blockchain.");
    } catch (err) {
      console.error("Approve loan error:", err);
      alert("Failed to approve loan in system.");
    }
  };

  const fundOnBlockchain = async (loan) => {
    setLoading(true);
    try {
      const contract = await getContract(true);
      const amount = parseEther(loan.loan_amnt);

      console.log(`Attempting to fund blockchain loan ID ${loan.blockchain_id} with ${loan.loan_amnt} ETH...`);
      const tx = await contract.fundLoan(loan.blockchain_id, { value: amount });


      console.log("Transaction sent:", tx.hash);
      await tx.wait();

      alert("Loan Funded on Blockchain successfully!");

      // Update backend status to Funded
      await fetch(`https://blocklend-backend.onrender.com/update-loan-status/${loan.id}?status=Funded`, { method: "POST" });

    } catch (err) {

      console.error("Funding Error:", err);
      let errorMsg = err.reason || err.message;
      if (err.data && err.data.message) errorMsg = err.data.message;
      alert("Error funding loan: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => { localStorage.removeItem("user"); setUser(null); navigate("/login"); };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Lender Dashboard</h1>
        <div style={{ display: "flex", gap: "10px" }}>


          <button className="secondary-btn" onClick={() => navigate("/loan-history")} style={{ padding: "8px 16px", borderRadius: "20px" }}>
            View History
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>


      <h2>All Loan Applications</h2>
      <table className="loan-table">
        <thead>
          <tr>
            <th>Loan ID</th>
            <th>Amount (ETH)</th>
            <th>Purpose</th>
            <th>Status</th>
            <th>Risk Score</th>
            <th>Category</th>
            <th>Interest (%)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id}>
              <td>{loan.id}</td>
              <td>{loan.loan_amnt} ETH</td>
              <td>{loan.purpose}</td>
              <td>
                <span className={`status-pill status-${loan.status.toLowerCase()}`}>
                  {loan.status}
                </span>
              </td>
              <td>{loan.risk_score ? `${loan.risk_score}%` : "-"}</td>
              <td>{loan.risk_category || "-"}</td>
              <td>{loan.interest_rate ? `${loan.interest_rate}%` : "-"}</td>
              <td>
                <div style={{ display: "flex", gap: "8px" }}>
                  {loan.status === "Pending" && (
                    <button className="table-action-btn" onClick={() => predictRisk(loan.id)}>
                      AI Risk Analysis
                    </button>
                  )}

                  {loan.status === "Pending" && loan.risk_score && (
                    <button className="table-approve-btn" onClick={() => approveLoan(loan.id)}>
                      Approve
                    </button>
                  )}

                  {loan.status === "Approved" && (
                    <button
                      className="table-fund-btn"
                      onClick={() => fundOnBlockchain(loan)}
                      disabled={loading || !loan.blockchain_id}
                      style={{ opacity: !loan.blockchain_id ? 0.6 : 1 }}
                    >
                      {loading ? "Processing..." : "Fund on Blockchain"}
                    </button>
                  )}

                  {loan.status === "Funded" && (
                    <span style={{ color: "#3b82f6", fontSize: "12px", fontWeight: "600" }}>Active Investment</span>
                  )}

                  {loan.status === "Repaid" && (
                    <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "700" }}>Profit Secured</span>
                  )}
                </div>
              </td>


            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LenderDashboard;
