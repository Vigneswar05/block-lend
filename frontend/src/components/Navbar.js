import { Link } from "react-router-dom";
import { useState } from "react";
import { connectWallet } from "../blockchain/ethersService";

function Navbar() {
  const [account, setAccount] = useState(null);

  const handleConnect = async () => {
    try {
      const acc = await connectWallet();
      setAccount(acc);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="navbar">
      <div className="nav-logo">BlockLend</div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <div className="nav-group">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
        <Link to="/loan-history">History</Link>
        {account ? (
          <div className="wallet-pill">
            <div className="dot"></div>
            <span>{account.substring(0, 6)}...{account.substring(38)}</span>
          </div>
        ) : (
          <button onClick={handleConnect} className="nav-button">
            Connect Wallet
          </button>
        )}
      </div>


    </div>
  );
}

export default Navbar;
