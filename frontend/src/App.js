import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BorrowerDashboard from "./pages/BorrowerDashboard";
import LoanHistory from "./pages/LoanHistory";
import LenderDashboard from "./pages/LenderDashboard";
import ApplyLoan from "./pages/ApplyLoan";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/borrower" element={<BorrowerDashboard />} />
        <Route path="/loan-history" element={<LoanHistory />} />
        <Route path="/apply-loan" element={<ApplyLoan />} />
        <Route path="/lender" element={<LenderDashboard />} />
      </Routes>
    </Router>

  );
}

export default App;