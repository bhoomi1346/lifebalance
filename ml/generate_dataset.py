"""
Generates a synthetic lifestyle/stress dataset for prototype model training.

The stress label comes from a rule-based risk score built from lifestyle habits
(short sleep, long working hours, low activity, low water, irregular meals,
low mood) plus random noise to imitate self-reported labels.
Occupation, work mode, marital status and age group are generated at random and
are NOT used to create the label (fairness requirement, SRS section 3.6).
"""
import os
import numpy as np
import pandas as pd

SEED = 42
N_ROWS = 4000
rng = np.random.default_rng(SEED)

# ---- 1. Habits ----
sleep = np.clip(rng.normal(6.4, 1.2, N_ROWS), 3.5, 10).round(1)
work = np.clip(rng.normal(8.6, 2.3, N_ROWS), 0, 14).round(1)
activity = np.clip(rng.normal(25, 22, N_ROWS), 0, 180).round().astype(int)
water = np.clip(rng.normal(2.0, 0.7, N_ROWS), 0.3, 5).round(1)
meal = rng.choice(["Regular", "Slightly irregular", "Irregular"], N_ROWS, p=[0.45, 0.35, 0.20])
mood = np.clip(np.round(3 + 0.3 * (sleep - 6.6) + rng.normal(0, 0.9, N_ROWS)), 1, 5).astype(int)

# keep sleep + work within 24 hours (always true here, kept as a safety check)
work = np.minimum(work, 24 - sleep)

# ---- 2. Context fields (NOT used for the label) ----
occupation = rng.choice(
    ["Software/IT", "Teacher", "Healthcare", "Banking/Finance", "Government", "Self-employed", "Other"],
    N_ROWS, p=[0.22, 0.17, 0.15, 0.12, 0.10, 0.10, 0.14])
work_mode = rng.choice(["Remote", "Hybrid", "Office"], N_ROWS, p=[0.25, 0.35, 0.40])
marital_status = rng.choice(["Married", "Unmarried", "Prefer not to say"], N_ROWS, p=[0.50, 0.45, 0.05])
age_group = rng.choice(["18-24", "25-34", "35-44", "45-54", "55+"], N_ROWS, p=[0.15, 0.38, 0.28, 0.14, 0.05])

# ---- 3. Stress risk (higher = more stress) ----
meal_risk = pd.Series(meal).map({"Regular": 0.0, "Slightly irregular": 0.5, "Irregular": 1.1}).to_numpy()
risk = (
    0.9 * np.maximum(0, 7 - sleep)
    + 0.25 * np.maximum(0, sleep - 9)
    + 0.45 * np.maximum(0, work - 8)
    + np.where(activity < 10, 0.8, 0.0)
    - 0.015 * np.minimum(activity, 60)
    + np.where(water < 1.5, 0.5, 0.0)
    + meal_risk
    + 0.55 * (3 - mood)
)
risk_noisy = risk + rng.normal(0, 0.3, N_ROWS)

low_cut, high_cut = np.quantile(risk_noisy, [0.38, 0.75])
stress = np.where(risk_noisy < low_cut, "Low", np.where(risk_noisy < high_cut, "Moderate", "High"))

# ---- 4. Work-life balance score (0-100), transparent weighted rules ----
sleep_s = np.where((sleep >= 7) & (sleep <= 9), 100, 100 - 25 * np.minimum(np.abs(sleep - np.clip(sleep, 7, 9)), 4))
work_s = np.clip(100 - 12.5 * np.maximum(0, work - 8), 0, 100)
act_s = np.minimum(activity / 30, 1) * 100
water_s = np.minimum(water / 2, 1) * 100
meal_s = pd.Series(meal).map({"Regular": 100, "Slightly irregular": 60, "Irregular": 20}).to_numpy()
mood_s = (mood - 1) / 4 * 100
wlb = (0.25 * sleep_s + 0.25 * work_s + 0.15 * act_s + 0.10 * water_s + 0.10 * meal_s + 0.15 * mood_s)
wlb = np.clip(wlb.round(), 0, 100).astype(int)

df = pd.DataFrame({
    "sleep_hours": sleep, "working_hours": work, "activity_minutes": activity,
    "water_litres": water, "meal_regularity": meal, "mood": mood,
    "occupation": occupation, "work_mode": work_mode,
    "marital_status": marital_status, "age_group": age_group,
    "stress_level": stress, "wlb_score": wlb,
})

# ---- 5. Add a little mess on purpose so the cleaning step (Oct 15) is real ----
for col, frac in [("sleep_hours", 0.015), ("water_litres", 0.02), ("activity_minutes", 0.01)]:
    idx = rng.choice(N_ROWS, int(N_ROWS * frac), replace=False)
    df[col] = df[col].astype("float")
    df.loc[idx, col] = np.nan
dups = df.sample(25, random_state=SEED)
df = pd.concat([df, dups], ignore_index=True)
df.insert(0, "record_id", range(1, len(df) + 1))

os.makedirs("data", exist_ok=True)
df.to_csv("data/stress_dataset.csv", index=False)
print("Saved data/stress_dataset.csv")
print("Rows:", len(df))
print("\nStress class distribution (%):")
print((df["stress_level"].value_counts(normalize=True) * 100).round(1))
print("\nMissing values per column:")
print(df.isna().sum()[df.isna().sum() > 0])