import { Link } from "react-router-dom";
import { useState } from "react";
import { connectWallet } from "../blockchain/ethersService";

function Navbar() {
  const [account, setAccount] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleConnect = async () => {
    try {
      const acc = await connectWallet();
      setAccount(acc);
      setIsMobileMenuOpen(false); // close menu upon connecting
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="navbar">
      <div className="nav-logo">BlockLend</div>
      
      {/* Hamburger Icon */}
      <div className="hamburger-icon" onClick={toggleMenu}>
        <div className={`bar ${isMobileMenuOpen ? "open" : ""}`}></div>
        <div className={`bar ${isMobileMenuOpen ? "open" : ""}`}></div>
        <div className={`bar ${isMobileMenuOpen ? "open" : ""}`}></div>
      </div>

      {/* Nav Links */}
      <div className={`nav-links ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <Link to="/" onClick={toggleMenu}>Home</Link>
        <div className="nav-group">
          <Link to="/login" onClick={toggleMenu}>Login</Link>
          <Link to="/register" onClick={toggleMenu}>Register</Link>
        </div>
        <Link to="/loan-history" onClick={toggleMenu}>History</Link>
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
