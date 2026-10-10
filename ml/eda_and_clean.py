import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

RAW = "data/stress_dataset.csv"
CLEAN = "data/stress_clean.csv"
CHARTS = "outputs"
NUMERIC = ["sleep_hours", "working_hours", "activity_minutes", "water_litres"]
LEVELS = ["Low", "Moderate", "High"]

os.makedirs(CHARTS, exist_ok=True)
df = pd.read_csv(RAW)
cols_no_id = [c for c in df.columns if c != "record_id"]

# ---------- PART 1: EDA ----------
print("=== 1. Shape and data types ===")
print("Rows, columns:", df.shape)
print(df.dtypes)

print("\n=== 2. Missing values per column ===")
print(df.isna().sum())

print("\n=== 3. Duplicate rows (ignoring record_id) ===")
print("Duplicates:", df.duplicated(subset=cols_no_id).sum())

print("\n=== 4. Stress class distribution (%) ===")
print(df["stress_level"].value_counts(normalize=True).mul(100).round(1))

print("\n=== 5. Summary of numeric features ===")
print(df[NUMERIC + ["wlb_score"]].describe().round(2))

print("\n=== 6. Stress by work mode (fairness check, not a model input) ===")
print(pd.crosstab(df["work_mode"], df["stress_level"], normalize="index").mul(100).round(1))

print("\n=== 7. Stress by marital status (fairness check, not a model input) ===")
print(pd.crosstab(df["marital_status"], df["stress_level"], normalize="index").mul(100).round(1))

# Charts
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
for ax, col in zip(axes.ravel(), NUMERIC):
    sns.histplot(df[col].dropna(), kde=True, ax=ax)
    ax.set_title(f"Distribution of {col}")
plt.tight_layout()
plt.savefig(f"{CHARTS}/1_histograms.png", dpi=120)
plt.close()

fig, ax = plt.subplots(figsize=(6, 4))
sns.countplot(data=df, x="stress_level", order=LEVELS, ax=ax)
ax.set_title("Stress level class distribution")
plt.tight_layout()
plt.savefig(f"{CHARTS}/2_class_distribution.png", dpi=120)
plt.close()

fig, ax = plt.subplots(figsize=(7, 6))
sns.heatmap(df[NUMERIC + ["wlb_score"]].corr(), annot=True, cmap="coolwarm", fmt=".2f", ax=ax)
ax.set_title("Correlation between numeric features")
plt.tight_layout()
plt.savefig(f"{CHARTS}/3_correlation_heatmap.png", dpi=120)
plt.close()

fig, ax = plt.subplots(figsize=(7, 5))
sns.boxplot(data=df, x="stress_level", y="sleep_hours", order=LEVELS, ax=ax)
ax.set_title("Sleep hours by stress level")
plt.tight_layout()
plt.savefig(f"{CHARTS}/4_sleep_by_stress.png", dpi=120)
plt.close()

# ---------- PART 2: CLEANING ----------
print("\n=== CLEANING ===")
clean = df.drop_duplicates(subset=cols_no_id).copy()
print("Duplicates removed:", len(df) - len(clean))

clean = clean.dropna(subset=["stress_level"])
print("Rows without a stress label removed: done (none expected)")

for col in NUMERIC:
    median = clean[col].median()
    filled = clean[col].isna().sum()
    clean[col] = clean[col].fillna(median)
    print(f"Filled {filled} missing values in {col} with median {median:.2f}")

for col in NUMERIC:
    q1, q3 = clean[col].quantile([0.25, 0.75])
    iqr = q3 - q1
    low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    outliers = ((clean[col] < low) | (clean[col] > high)).sum()
    clean[col] = clean[col].clip(low, high)
    print(f"Capped {outliers} outliers in {col} to [{low:.2f}, {high:.2f}]")

before = len(clean)
clean = clean[clean["sleep_hours"] + clean["working_hours"] <= 24]
print("Impossible rows (sleep + work > 24) removed:", before - len(clean))

clean["activity_minutes"] = clean["activity_minutes"].round().astype(int)
clean.to_csv(CLEAN, index=False)

print("\n=== RESULT ===")
print("Rows before cleaning:", len(df))
print("Rows after cleaning:", len(clean))
print("Missing values after cleaning:", int(clean.isna().sum().sum()))
print("Saved:", CLEAN)
print("Charts saved in:", CHARTS)