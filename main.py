from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
from datetime import datetime

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "BlockLend Backend is running successfully!"}

# ---------------- LOAD ML MODEL ----------------
model = joblib.load("risk_model.pkl")

# ---------------- DATA STORAGE ----------------
users = []
loans = []
loan_counter = 1

# ---------------- USER MODELS ----------------
class User(BaseModel):
    name: str
    email: str
    password: str
    pan: str
    role: str
    is_verified: bool = False


class LoginData(BaseModel):
    email: str
    password: str

# ---------------- LOAN MODELS ----------------
class LoanApplication(BaseModel):
    borrower_email: str
    loan_amnt: float
    annual_inc: float
    dti: float = 0.0
    emp_length: float = 0.0
    revol_util: float = 50.0
    open_acc: int = 0
    pub_rec: int = 0
    purpose: str
    blockchain_id: int = None  # Add this field


# ---------------- USER ENDPOINTS ----------------
@app.post("/register")
def register(user: User):
    for u in users:
        if u["email"] == user.email:
            return {"error": "User already exists"}
    users.append(user.dict())
    return {"message": "Registered successfully"}


@app.post("/login")
def login(data: LoginData):
    for user in users:
        if user["email"] == data.email and user["password"] == data.password:
            return user
    return {"error": "Invalid credentials"}

# ---------------- LOAN ENDPOINTS ----------------
@app.post("/predict-only")
def predict_only(data: LoanApplication):
    input_data = pd.DataFrame([{
        "loan_amnt": data.loan_amnt,
        "annual_inc": data.annual_inc,
        "dti": data.dti,
        "emp_length": data.emp_length,
        "revol_util": data.revol_util,

        "open_acc": data.open_acc,
        "pub_rec": data.pub_rec
    }])
    prob = model.predict_proba(input_data)[0][1]
    risk_score = round(prob * 100, 2)

    if risk_score <= 30:
        category = "Low Risk"
        interest = 8
    elif risk_score <= 60:
        category = "Medium Risk"
        interest = 12
    else:
        category = "High Risk"
        interest = 18

    return {
        "risk_score": risk_score,
        "risk_category": category,
        "interest_rate": interest
    }

@app.post("/apply-loan")
def apply_loan(data: LoanApplication):
    global loan_counter
    loan = data.dict()
    loan["id"] = loan_counter
    loan["status"] = "Pending"
    loan["notifications"] = []
    
    # Use provided blockchain_id if available, otherwise fallback to counter
    if loan.get("blockchain_id") is None:
        loan["blockchain_id"] = loan_counter

    loans.append(loan)
    loan_counter += 1
    return loan


@app.get("/borrower-loans/{email}")
def borrower_loans(email: str):
    return [l for l in loans if l["borrower_email"] == email]

@app.get("/all-loans")
def all_loans():
    return loans

# ---------------- DELETE LOAN ----------------
@app.delete("/delete-loan/{loan_id}")
def delete_loan(loan_id: int):
    global loans
    for loan in loans:
        if loan["id"] == loan_id:
            if loan["status"] == "Approved":
                return {"error": "Approved loans cannot be deleted"}
            deleted_loan = loan
            loans = [l for l in loans if l["id"] != loan_id]
            return {"message": "Loan deleted successfully", "loan": deleted_loan}
    return {"error": "Loan not found"}

# ---------------- PREDICT RISK ----------------
@app.post("/predict-loan/{loan_id}")
def predict_loan(loan_id: int):
    for loan in loans:
        if loan["id"] == loan_id:
            input_data = pd.DataFrame([{
                "loan_amnt": loan["loan_amnt"],
                "annual_inc": loan["annual_inc"],
                "dti": loan["dti"],
                "emp_length": loan["emp_length"],
                "revol_util": loan["revol_util"],
                "open_acc": loan["open_acc"],
                "pub_rec": loan["pub_rec"]
            }])
            prob = model.predict_proba(input_data)[0][1]
            risk_score = round(prob * 100)

            if risk_score <= 30:
                category = "Low Risk"
                interest = 8
            elif risk_score <= 60:
                category = "Medium Risk"
                interest = 12
            else:
                category = "High Risk"
                interest = 18

            loan["risk_score"] = risk_score
            loan["risk_category"] = category
            loan["interest_rate"] = interest

            # Add notification
            loan["notifications"].append({
                "title": "Risk Prediction",
                "message": f"Loan Risk Predicted: {category}, Interest Rate: {interest}%",
                "time": datetime.now().strftime("%H:%M")
            })

            return loan
    return {"error": "Loan not found"}

# ---------------- APPROVE/FUND/REPAY LOAN ----------------
@app.post("/update-loan-status/{loan_id}")
def update_loan_status(loan_id: int, status: str):
    for loan in loans:
        # Match by system ID or blockchain ID
        if loan["id"] == loan_id or loan.get("blockchain_id") == loan_id:
            loan["status"] = status
            loan["notifications"].append({
                "title": f"Loan {status}",
                "message": f"Your loan status has been updated to {status}.",
                "time": datetime.now().strftime("%H:%M")
            })
            return loan
    return {"error": "Loan not found"}

@app.post("/approve-loan/{loan_id}")
def approve_loan(loan_id: int):
    for loan in loans:
        if loan["id"] == loan_id:
            loan["status"] = "Approved"
            loan["notifications"].append({
                "title": "Loan Approved",
                "message": f"Your loan has been approved.",
                "time": datetime.now().strftime("%H:%M")
            })
            return loan
    return {"error": "Loan not found"}

# ---------------- GET NOTIFICATIONS ----------------
@app.get("/notifications/{email}")
def get_notifications(email: str):
    user_loans = [l for l in loans if l["borrower_email"] == email]
    all_notifications = []
    for loan in user_loans:
        all_notifications.extend(loan.get("notifications", []))
    # Sort by time descending
    return sorted(all_notifications, key=lambda x: x["time"], reverse=True)
