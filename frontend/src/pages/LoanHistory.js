import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function LoanHistory() {
    const navigate = useNavigate();
    const storedUser = localStorage.getItem("user");
    const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
    const [loans, setLoans] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const endpoint = user.role === "Lender"
            ? "https://blocklend-backend.onrender.com/all-loans"
            : `https://blocklend-backend.onrender.com/borrower-loans/${user.email}`;

        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                // For lenders, we might want to filter for history-relevant items, 
                // but usually they want to see the track record of all loans.
                setLoans(data);
            })
            .catch(err => console.error("Error fetching loan history:", err));
    }, [user, navigate]);


    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Loan History</h1>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>

            <div className="loan-card history-summary">
                <p>Viewing all past and current loan records on the blockchain.</p>
                <button onClick={() => navigate(user.role === "Lender" ? "/lender" : "/borrower")}>
                    Back to Dashboard
                </button>
            </div>


            <h2>Detailed History</h2>
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
                            <th>Interest Rate</th>
                            <th>Outcome</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map(loan => (
                            <tr key={loan.id} className={loan.status === "Repaid" ? "row-repaid" : ""}>
                                <td>{loan.id}</td>
                                <td>{loan.blockchain_id || "-"}</td>
                                <td>{loan.loan_amnt} ETH</td>
                                <td>{loan.purpose}</td>
                                <td>
                                    <span className={`status-pill status-${loan.status.toLowerCase()}`}>
                                        {loan.status}
                                    </span>
                                </td>
                                <td>{loan.risk_score ? `${loan.risk_score}%` : "-"}</td>
                                <td>{loan.interest_rate ? `${loan.interest_rate}%` : "-"}</td>
                                <td>
                                    {loan.status === "Repaid" && <span style={{ color: "#10b981", fontWeight: "bold" }}>Settled</span>}
                                    {loan.status === "Cancelled" && <span style={{ color: "#ef4444" }}>Cancelled</span>}
                                    {loan.status === "Funded" && <span style={{ color: "#3b82f6" }}>Active</span>}
                                    {loan.status === "Pending" && <span style={{ color: "#f59e0b" }}>Waiting</span>}
                                    {loan.status === "Approved" && <span style={{ color: "#8b5cf6" }}>Ready to Fund</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No loan history found.</p>
            )}
        </div>
    );
}

export default LoanHistory;
