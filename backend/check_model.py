import pickle
import numpy as np

# Load the model
with open("stress_model.pkl", "rb") as f:
    saved = pickle.load(f)
    model = saved["model"]
    feature_cols = saved["features"]

print("Features the model expects:", feature_cols)
print("Classes the model knows:", model.classes_)

# Test the healthy user
healthy_user = [[
    7.5,   # Avg_Working_Hours_Per_Day
    1,     # Work_Pressure
    5,     # Manager_Support
    8.0,   # Sleeping_Habit
    4,     # Exercise_Habit
    5,     # Job_Satisfaction
    1,     # Work_Life_Balance
    1,     # Social_Person
    1,     # Lives_With_Family
    0      # Work_From (Home)
]]

prediction = model.predict(healthy_user)[0]
probabilities = model.predict_proba(healthy_user)[0]

print(f"\nPrediction for healthy user: {prediction}")
print(f"Probabilities:")
for label, prob in zip(model.classes_, probabilities):
    print(f"  {label}: {prob*100:.1f}%")
