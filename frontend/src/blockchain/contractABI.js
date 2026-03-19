export const contractABI = [
    "function owner() public view returns (address)",
    "function platformFeePercentage() public view returns (uint256)",
    "function setRoles(address user, uint8 role) external",
    "function details(address) public view returns (bytes16 panNumber, string name, uint256 salary, uint8 role)",
    "function loans(uint256) public view returns (address borrower, address lender, uint256 amount, uint256 totalAmount, uint256 paidAmount, uint256 period, uint256 collateral, uint256 interest, uint8 status, uint256 startTime, uint256 endTime)",
    "function loanCount() public view returns (uint256)",
    "function requestLoan(uint256 _amount, uint256 _period, uint256 _interest) external payable",
    "function fundLoan(uint256 _loanId) external payable",
    "function returnLoan(uint256 _loanId) external payable",
    "function liquidate(uint256 _loanId) external",
    "function cancelLoan(uint256 _loanId) external",
    "event requested(uint256 indexed loanId, address indexed borrower, uint256 amount, uint8 status)",
    "event funded(uint256 indexed loanId, address indexed lender, uint8 status)",
    "event repaid(uint256 indexed loanId, uint8 status)",
    "event paymentMade(uint256 indexed loanId, uint256 paidAmount)",
    "event liquidated(uint256 indexed loanId, uint8 status)",
    "event cancelled(uint256 indexed loanId, uint8 status)"
];
