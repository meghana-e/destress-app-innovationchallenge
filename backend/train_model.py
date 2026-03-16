import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.utils import resample
import pickle

# ── 1. Load dataset ───────────────────────────────────────────────────
df = pd.read_csv("/Users/meghana/stress-app/train.csv")

# ── 2. Fix categorical columns ────────────────────────────────────────
df["Work_Life_Balance"] = (
    df["Work_Life_Balance"].astype(str).str.strip().str.lower().map({"yes": 1, "no": 0})
)
df["Work_From"] = (
    df["Work_From"].astype(str).str.strip().str.lower().map({"home": 0, "hybrid": 1, "office": 2})
)

# Social_Person in this dataset is already a numeric rating (1-5).
# Keep numeric values when present, but still support Yes/No datasets.
social_numeric = pd.to_numeric(df["Social_Person"], errors="coerce")
if social_numeric.notna().any():
    df["Social_Person"] = social_numeric
else:
    df["Social_Person"] = (
        df["Social_Person"].astype(str).str.strip().str.lower().map({"yes": 1, "no": 0})
    )

df["Lives_With_Family"] = (
    df["Lives_With_Family"].astype(str).str.strip().str.lower().map({"yes": 1, "no": 0})
)

# ── 3. Group Stress_Level 1-5 into 3 buckets ─────────────────────────
def group_stress(value):
    if value <= 2:
        return "Low"
    elif value == 3:
        return "Medium"
    else:
        return "High"

df["stress_group"] = df["Stress_Level"].apply(group_stress)
print("Before balancing:\n", df["stress_group"].value_counts())

# ── 4. Select features ────────────────────────────────────────────────
feature_cols = [
    "Avg_Working_Hours_Per_Day",
    "Work_Pressure",
    "Manager_Support",
    "Sleeping_Habit",
    "Exercise_Habit",
    "Job_Satisfaction",
    "Work_Life_Balance",
    "Social_Person",
    "Lives_With_Family",
    "Work_From"
]

df = df[feature_cols + ["stress_group"]].dropna()

# ── 5. THE KEY FIX: Balance the classes ──────────────────────────────
# Collect groups and keep only non-empty classes.
groups = {
    "Low": df[df["stress_group"] == "Low"],
    "Medium": df[df["stress_group"] == "Medium"],
    "High": df[df["stress_group"] == "High"],
}
non_empty_groups = {label: part for label, part in groups.items() if len(part) > 0}

if len(non_empty_groups) < 2:
    raise ValueError(
        "Not enough labeled rows after preprocessing to train the model. "
        "Check mappings and missing values in train.csv."
    )

target_size = max(len(part) for part in non_empty_groups.values())

# Upsample smaller groups to match the largest non-empty group.
upsampled_groups = [
    resample(part, replace=True, n_samples=target_size, random_state=42)
    for part in non_empty_groups.values()
]

df_balanced = pd.concat(upsampled_groups, ignore_index=True)
print("After balancing:\n", df_balanced["stress_group"].value_counts())

X = df_balanced[feature_cols]
y = df_balanced["stress_group"]

# ── 6. Split data ─────────────────────────────────────────────────────
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── 7. Train with better settings ────────────────────────────────────
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=15,
    min_samples_split=5,
    class_weight="balanced",
    random_state=42
)
model.fit(X_train, y_train)

# ── 8. Check accuracy ─────────────────────────────────────────────────
accuracy = model.score(X_test, y_test)
print(f"\n✅ Model Accuracy: {accuracy * 100:.1f}%")
print("\n📊 Detailed breakdown:")
print(classification_report(y_test, model.predict(X_test)))

# ── 9. Save model ─────────────────────────────────────────────────────
with open("stress_model.pkl", "wb") as f:
    pickle.dump({"model": model, "features": feature_cols}, f)

print("\n💾 Model saved!")


