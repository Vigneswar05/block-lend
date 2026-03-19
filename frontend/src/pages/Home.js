import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  // Auto-redirect if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "borrower") navigate("/borrower");
      else if (user.role === "lender") navigate("/lender");
    }
  }, [navigate]);

  return (
    <div className="hero">
      <h1>
        Welcome to <span>BlockLend</span>
      </h1>

      <p>
        A decentralized peer-to-peer lending platform powered by AI risk
        scoring and secure digital verification.
      </p>

      <button
        className="hero-button"
        onClick={() => navigate("/register")}
      >
        Get Started →
      </button>
    </div>
  );
}

export default Home;