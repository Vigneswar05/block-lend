import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContract } from "../blockchain/ethersService";
import { BrowserProvider } from "ethers";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Connect Wallet
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Check Contract
      const contract = await getContract(false);
      const userDetail = await contract.getUser(address);

      // detail returns: [panNumber, name, salary, role, email, isRegistered]
      // Because ethers.js maps structs to arrays/objects depending on the ABI
      if (!userDetail.isRegistered) {
        alert("User not found on Blockchain. Redirecting to registration page...");
        navigate("/register");
        return;
      }

      // Convert role to string
      const roleStr = Number(userDetail.role) === 0 ? "borrower" : "lender";

      const userData = {
        name: userDetail.name,
        email: userDetail.email,
        pan: userDetail.panNumber,
        salary: Number(userDetail.salary),
        role: roleStr,
        wallet: address
      };

      localStorage.setItem("user", JSON.stringify(userData));

      if (roleStr === "borrower") navigate("/borrower");
      else navigate("/lender");

    } catch (err) {
      console.error("Login error:", err);
      if (err.message.includes("User not found")) {
        alert("This wallet address is not registered!");
        navigate("/register");
      } else {
        alert("Error connecting to Blockchain wallet. Make sure MetaMask is unlocked.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h2>Web3 Login</h2>
        <p style={{ color: "#94a3b8", marginBottom: "20px" }}>Connect your Ethereum wallet to log in securely using the Blockchain.</p>

        <button onClick={handleLogin} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Connecting Blockchain..." : "Connect MetaMask Wallet"}
        </button>
      </div>
    </div>
  );
}

export default Login;