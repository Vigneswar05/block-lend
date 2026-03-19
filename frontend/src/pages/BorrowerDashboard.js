import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContract } from "../blockchain/ethersService";

function NotificationBell({ notifications }) {
  // ... (rest of NotificationBell unchanged)
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bell-container" onClick={() => setOpen(!open)}>
      <i className="fas fa-bell"></i>
      {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      {open && (
        <div className="bell-dropdown">
          {notifications.length === 0 ? (
            <div>No notifications</div>
          ) : (
            notifications.map((n, index) => (
              <div key={index}>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                </div>
                <span className="timestamp">{n.time}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BorrowerDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [loans, setLoans] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetch(`http://127.0.0.1:8000/borrower-loans/${user.email}`)
        .then(res => res.json())
        .then(data => setLoans(data))
        .catch(err => console.error("Error fetching loans:", err));
    }
  }, [user]);

  const deleteLoan = async (id, status) => {
    if (status === "Approved") return alert("Approved loans cannot be deleted");
    try {
      const res = await fetch(`http://127.0.0.1:8000/delete-loan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete loan");
      setLoans(loans.filter(l => l.id !== id));
      addNotification("Loan Deleted", `Loan #${id} has been deleted.`);
    } catch (err) {
      console.error("Delete loan error:", err);
      alert("Error deleting loan. Is the backend running?");
    }
  };

  const cancelOnBlockchain = async (loan) => {
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.cancelLoan(loan.blockchain_id);
      await tx.wait();
      alert("Loan cancelled on blockchain successfully!");

      // Update backend status to Cancelled
      await fetch(`http://127.0.0.1:8000/update-loan-status/${loan.id}?status=Cancelled`, { method: "POST" });

      addNotification("Blockchain Update", `Loan #${loan.blockchain_id} cancelled.`);

    } catch (err) {
      console.error(err);
      alert("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const repayOnBlockchain = async (loan) => {
    setLoading(true);
    try {
      const contract = await getContract(true);
      if (!loan.blockchain_id) {
        return alert("This loan does not have a valid Blockchain ID.");
      }

      console.log(`Checking blockchain for loan ID: ${loan.blockchain_id}...`);
      const blockchainLoan = await contract.loans(loan.blockchain_id);

      if (blockchainLoan.amount === 0n) {
        return alert("Loan not found on the blockchain. It might have been cleared or the ID is incorrect.");
      }

      console.log("On-chain Loan Data:", blockchainLoan);
      const remaining = blockchainLoan.totalAmount - blockchainLoan.paidAmount;
      console.log(`Repaying ${remaining} wei...`);

      const tx = await contract.returnLoan(loan.blockchain_id, { value: remaining });

      await tx.wait();
      alert("Loan repaid on blockchain successfully!");

      // Update backend status to Repaid
      await fetch(`http://127.0.0.1:8000/update-loan-status/${loan.id}?status=Repaid`, { method: "POST" });

      addNotification("Blockchain Update", `Loan #${loan.blockchain_id} repaid.`);


    } catch (err) {
      console.error(err);
      alert("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (title, message) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setNotifications(prev => [{ title, message, time, read: false }, ...prev]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetch(`http://127.0.0.1:8000/borrower-loans/${user.email}`)
          .then(res => res.json())
          .then(data => {
            data.forEach(newLoan => {
              // Update notifications logic (already exists)
            });
            setLoans(data);
          })
          .catch(err => console.error("Interval fetch error:", err));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loans, user]);

  const handleLogout = () => { localStorage.removeItem("user"); setUser(null); navigate("/login"); };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Your Dashboard</h1>
        <div className="dashboard-header-left">


          <NotificationBell notifications={notifications} />
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="loan-card">
        <p>Apply for a loan and wait for lender approval.</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => navigate("/apply-loan")}>Apply for a Loan</button>
          <button className="secondary-btn" onClick={() => navigate("/loan-history")}>View Loan History</button>
        </div>
      </div>


      <h2>Your Loan Applications</h2>
      {loans.length > 0 ? (
        <table className="loan-table">
          <thead>
            <tr>
              <th>System ID</th>
              <th>On-Chain ID</th>
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
            {loans.map(loan => (
              <tr key={loan.id}>
                <td>{loan.id}</td>
                <td>{loan.blockchain_id || "Not On-Chain"}</td>
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
                  {loan.status === "Pending" && (
                    <>
                      <button className="table-delete-btn" onClick={() => deleteLoan(loan.id, loan.status)}>Delete</button>
                      <button className="table-cancel-btn" onClick={() => cancelOnBlockchain(loan)} disabled={loading}>Cancel</button>
                    </>
                  )}
                  {loan.status === "Approved" && (
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>Waiting for Lender</span>
                  )}
                  {loan.status === "Funded" && (
                    <button className="table-repay-btn" onClick={() => repayOnBlockchain(loan)} disabled={loading}>Repay</button>
                  )}
                  {loan.status === "Repaid" && (
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>Settled</span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      ) : <p>No loan applications found.</p>}
    </div>
  );
}

export default BorrowerDashboard;
