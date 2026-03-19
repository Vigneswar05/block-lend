/* global BigInt */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getContract, parseEther } from "../blockchain/ethersService";

function ApplyLoan() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    loan_amnt: "",
    annual_inc: "",
    emp_length: "",
    purpose: "",
    period: "30" // Default 30 days
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Get Prediction from Backend First
      const payload = {
        borrower_email: user.email,
        loan_amnt: parseFloat(form.loan_amnt),
        annual_inc: parseFloat(form.annual_inc),
        emp_length: parseFloat(form.emp_length),
        purpose: form.purpose,
        dti: 0,
        revol_util: 50,
        open_acc: 0,
        pub_rec: 0
      };

      console.log("Fetching prediction from AI model...");
      const res = await fetch("http://127.0.0.1:8000/predict-only", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const predictionData = await res.json();
      if (predictionData.error) throw new Error(predictionData.error);
      setPrediction(predictionData);

      // 2. Blockchain Interaction using predicted interest
      const contract = await getContract(true);
      const amount = parseEther(form.loan_amnt);
      const periodInSeconds = parseInt(form.period) * 24 * 60 * 60;

      const interestRatePercent = predictionData.interest_rate;
      const interestAmount = (amount * BigInt(interestRatePercent)) / 100n;
      const collateral = (amount * 105n) / 100n;

      console.log(`Submitting to blockchain with ${interestRatePercent}% interest...`);
      const tx = await contract.requestLoan(amount, periodInSeconds, interestAmount, { value: collateral });
      const receipt = await tx.wait();

      // Extract Loan ID from events
      const event = receipt.logs.find(log => {
        try { return contract.interface.parseLog(log).name === "requested"; } catch (e) { return false; }
      });
      const blockchainId = event ? Number(contract.interface.parseLog(event).args.loanId) : null;

      // 3. Save to backend with actual blockchain ID and results
      const finalPayload = {
        ...payload,
        blockchain_id: blockchainId,
        risk_score: predictionData.risk_score,
        risk_category: predictionData.risk_category,
        interest_rate: predictionData.interest_rate
      };

      await fetch("http://127.0.0.1:8000/apply-loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload)
      });

      alert(`Loan requested successfully!\nBlockchain ID: ${blockchainId}\nInterest Rate: ${predictionData.interest_rate}%`);
      navigate("/borrower");


    } catch (err) {
      console.error(err);
      alert("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Apply for a Loan</h2>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
          Our AI model will determine your interest rate based on your profile.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            name="loan_amnt"
            placeholder="Loan Amount (ETH)"
            type="number"
            step="0.01"
            onChange={handleChange}
            required
          />

          <input
            name="period"
            placeholder="Loan Period (Days)"
            type="number"
            value={form.period}
            onChange={handleChange}
            required
          />

          <input
            name="annual_inc"
            placeholder="Annual Income (₹)"
            type="number"
            onChange={handleChange}
            required
          />

          <input
            name="emp_length"
            placeholder="Years at Current Job"
            type="number"
            onChange={handleChange}
            required
          />

          <select name="purpose" onChange={handleChange} required>
            <option value="">Purpose of Loan</option>
            <option value="education">Education</option>
            <option value="business">Business</option>
            <option value="medical">Medical</option>
            <option value="other">Other</option>
          </select>

          {prediction && (
            <div style={{ margin: "10px 0", padding: "10px", background: "#f3f4f6", borderRadius: "8px", fontSize: "13px" }}>
              <p><strong>Predicted Risk:</strong> {prediction.risk_category}</p>
              <p><strong>Calculated Interest:</strong> {prediction.interest_rate}%</p>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Analyzing & Requesting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApplyLoan;

