import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, roc_auc_score
import joblib

# Load dataset (first 50k rows for speed)
df = pd.read_csv("loan.csv", low_memory=False, nrows=50000)

# Select relevant columns
df = df[[
    "loan_amnt",
    "annual_inc",
    "dti",
    "emp_length",
    "revol_util",
    "open_acc",
    "pub_rec",
    "loan_status"
]]

# Keep only Fully Paid or Charged Off
df = df[df["loan_status"].isin(["Fully Paid", "Charged Off"])]

# Convert target to numeric
df["loan_status"] = df["loan_status"].map({
    "Fully Paid": 0,
    "Charged Off": 1
})

# Convert emp_length to numeric
df["emp_length"] = (
    df["emp_length"]
    .str.extract(r"(\d+)")[0]
    .astype(float)
    .fillna(0)
)

# Drop missing values
df = df.dropna()

# Features and target
X = df.drop("loan_status", axis=1)
y = df["loan_status"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Build Random Forest pipeline
pipeline = Pipeline([
    ("scaler", StandardScaler()),   # scale features
    ("model", RandomForestClassifier(
        n_estimators=200,           # number of trees
        max_depth=8,                # depth of each tree
        class_weight="balanced",    # handle imbalanced classes
        random_state=42
    ))
])

# Train model
pipeline.fit(X_train, y_train)

# Evaluate
pred = pipeline.predict(X_test)
prob = pipeline.predict_proba(X_test)[:, 1]

print("Model Accuracy:", accuracy_score(y_test, pred))
print("ROC-AUC Score:", roc_auc_score(y_test, prob))

# Save model
joblib.dump(pipeline, "risk_model.pkl")
print("Random Forest model saved as risk_model.pkl")
