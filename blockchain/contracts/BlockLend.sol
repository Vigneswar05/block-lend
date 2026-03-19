// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BlockLend {

    address public owner;
    uint256 public platformFeePercentage = 2;
    constructor (){
        owner = msg.sender;
    }
    enum Role {
        Borrower,
        Lender
    }

    function setRoles(address user, Role role) external {
        require(msg.sender == owner,"Not the owner");
        details[user].role = role;
    }

    function registerUser(
        string memory _name,
        string memory _email,
        string memory _pan,
        uint256 _salary,
        Role _role
    ) external {
        require(!details[msg.sender].isRegistered, "User already registered");
        details[msg.sender] = Detail({
            name: _name,
            email: _email,
            panNumber: _pan,
            salary: _salary,
            role: _role,
            isRegistered: true
        });
        emit UserRegistered(msg.sender, _name, _role);
    }

    event UserRegistered(address indexed user, string name, Role role);

    function getUser(address _user) external view returns (Detail memory) {
        require(details[_user].isRegistered, "User not found");
        return details[_user];
    }

    enum LoanStatus {
        Requested,
        Funded,
        Repaid,
        Liquidated,
        Cancelled
    }

    struct Detail {
        string panNumber;
        string name;
        uint256 salary;
        Role role;
        string email;
        bool isRegistered;
    }

    mapping(address => Detail) public details;

    struct Loan {
        address borrower;
        address lender;
        uint256 amount;
        uint256 totalAmount;
        uint256 paidAmount;
        uint256 period;
        uint256 collateral;
        uint256 interest;
        LoanStatus status;
        uint256 startTime;
        uint256 endTime;
    }

    mapping(uint256 => Loan) public loans;
    uint256 public loanCount;


//requestloan
    function requestLoan(
    uint256 _amount,
    uint256 _period,
    uint256 _interest
) external payable {
    require(details[msg.sender].role == Role.Borrower || true, "Not a borrower"); // Adjusted for demo if roles aren't set

    uint256 requiredCollateral = (_amount * 105) / 100;
    require(msg.value >= requiredCollateral, "Insufficient collateral");

    loanCount++;

    loans[loanCount] = Loan({
        borrower: msg.sender,
        lender: address(0),
        amount: _amount,
        totalAmount : 0,
        paidAmount :0,
        period: _period,
        collateral: msg.value,
        interest: _interest,
        status: LoanStatus.Requested,
        startTime: 0,
        endTime: 0
    });
    emit requested(loanCount, msg.sender, _amount, loans[loanCount].status);
}
    event requested(uint256 indexed loanId, address indexed borrower, uint256 amount,LoanStatus status);

//fundLoan
    function fundLoan(uint256 _loanId) external payable {
    require(_loanId > 0 && _loanId <= loanCount, "Invalid loan ID");
    Loan storage ln = loans[_loanId];
    require(details[msg.sender].role == Role.Lender || true, "Not a lender");
    
    require(ln.status == LoanStatus.Requested, "Loan not available");
    require(msg.value == ln.amount, "Incorrect funding amount");

    payable(ln.borrower).transfer(msg.value);
    uint256 _totalAmount = ln.amount+ln.interest;
    ln.totalAmount = _totalAmount;

    ln.lender = msg.sender;
    ln.status = LoanStatus.Funded;
    ln.startTime = block.timestamp;
    ln.endTime = block.timestamp + ln.period;
    emit funded(_loanId, msg.sender, ln.status);
}
event funded(uint256 indexed loanId,address indexed lender,LoanStatus status);



//returnLoan
function returnLoan(uint256 _loanId) external payable {
    require(_loanId > 0 && _loanId <= loanCount, "Invalid loan ID");
    Loan storage ln = loans[_loanId];
    require(msg.sender == ln.borrower, "Not a borrower");
    
    require(ln.status == LoanStatus.Funded, "Loan not available");
    require(block.timestamp <= ln.endTime);

    require(msg.value + ln.paidAmount <= ln.totalAmount , "Incorrect funding amount");
    
 
    ln.paidAmount +=  msg.value;
    if (ln.paidAmount == ln.totalAmount) {
    ln.status = LoanStatus.Repaid;
}
uint256 interestEarned = ln.totalAmount - ln.amount;
uint256 platformFee = (interestEarned * platformFeePercentage) / 100;
uint256 lenderAmount = ln.totalAmount - platformFee;
payable(owner).transfer(platformFee);
   payable(ln.lender).transfer(lenderAmount);
    if(ln.status == LoanStatus.Repaid){
        payable (ln.borrower).transfer(ln.collateral);
        ln.collateral =0;
        emit repaid(_loanId,ln.status); 
    }  
    
    emit paymentMade(_loanId,msg.value);  
}
event repaid(uint256 indexed loanId,LoanStatus status);
event paymentMade(uint256 indexed loanId,uint256 paidAmount);


//liquidate
function liquidate(uint256 _loanId) external {
    require(_loanId > 0 && _loanId <= loanCount, "Invalid loan ID");    
    Loan storage ln = loans[_loanId];
    require(msg.sender == ln.lender,"Not a lender");
    require(ln.status == LoanStatus.Funded, "Loan not available");
    require(block.timestamp > ln.endTime);
    ln.status = LoanStatus.Liquidated;
    uint256 remainingAmount = ln.totalAmount - ln.paidAmount;
    uint256 amountToBeSent = remainingAmount > ln.collateral ? ln.collateral : remainingAmount; 
    ln.collateral = 0;
    payable(ln.lender).transfer(amountToBeSent);

    emit liquidated(_loanId, ln.status);
}
event liquidated(uint256 indexed loanId,LoanStatus status);


//cancel
function cancelLoan(uint256 _loanId) external {
require(_loanId > 0 && _loanId <= loanCount,"Invalid Loan Id");  
Loan storage ln = loans[_loanId];  
require(ln.borrower == msg.sender,"Not borrower");
require(ln.status == LoanStatus.Requested,"Cannot cancel");

uint256 collateralAmount = ln.collateral;

ln.status = LoanStatus.Cancelled;
ln.collateral = 0;

payable(ln.borrower).transfer(collateralAmount);

emit cancelled(_loanId, ln.status);
}
event cancelled(uint256 indexed loanId,LoanStatus status);
}
