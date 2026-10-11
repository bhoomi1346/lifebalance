import os
import json
import time
import numpy as np
import pandas as pd
import joblib
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

SEED = 42
DATA = "data/stress_clean.csv"
MODEL_DIR = "models"
LEVELS = ["Low", "Moderate", "High"]

NUM_FEATURES = ["sleep_hours", "working_hours", "activity_minutes", "water_litres",
                "sleep_deficit", "work_to_sleep_ratio", "activity_target_met"]
CAT_FEATURES = ["meal_regularity", "hydration_level"]


# ---------- Oct 16, part 1: feature engineering ----------
def add_features(d):
    d = d.copy()
    d["sleep_deficit"] = np.maximum(0, 7 - d["sleep_hours"])
    d["work_to_sleep_ratio"] = d["working_hours"] / d["sleep_hours"].clip(lower=0.5)
    d["activity_target_met"] = (d["activity_minutes"] >= 30).astype(int)
    d["hydration_level"] = pd.cut(
        d["water_litres"], bins=[-np.inf, 1.5, 2.5, np.inf],
        labels=["Low", "Adequate", "High"]).astype(str)
    return d


# ---------- Oct 16, part 2: pipelines ----------
def make_pipeline(model):
    preprocess = ColumnTransformer([
        ("num", StandardScaler(), NUM_FEATURES),
        ("cat", OneHotEncoder(handle_unknown="ignore"), CAT_FEATURES),
    ])
    return Pipeline([("prep", preprocess), ("model", model)])


MODELS = {
    "Random Forest": RandomForestClassifier(n_estimators=300, class_weight="balanced",
                                            random_state=SEED, n_jobs=-1),
    "Decision Tree": DecisionTreeClassifier(max_depth=8, class_weight="balanced",
                                            random_state=SEED),
    "Logistic Regression": LogisticRegression(max_iter=2000, class_weight="balanced"),
    "SVM": SVC(kernel="rbf", class_weight="balanced", probability=True, random_state=SEED),
}


def main():
    df = add_features(pd.read_csv(DATA))
    X = df[NUM_FEATURES + CAT_FEATURES]
    y = df["stress_level"]
    print("Rows used for training and testing:", len(df))
    print("Features:", NUM_FEATURES + CAT_FEATURES)

    # 80% training, 20% hold-out testing, stratified (SRS 3.1.1)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED)

    # ---------- Oct 16, part 3: compare with 5-fold cross-validation ----------
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    results = {}
    print("\n=== 5-fold cross-validation on the training set (macro F1) ===")
    for name, model in MODELS.items():
        pipe = make_pipeline(model)
        start = time.time()
        scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="f1_macro", n_jobs=-1)
        seconds = time.time() - start
        results[name] = {"cv_mean_f1": scores.mean(), "cv_std": scores.std(), "seconds": seconds}
        print(f"{name:22s} mean F1 = {scores.mean():.3f}  (+/- {scores.std():.3f})  time = {seconds:.1f}s")

    best_name = max(results, key=lambda k: results[k]["cv_mean_f1"])
    print(f"\nBest model by cross-validated macro F1: {best_name}")

    # ---------- Oct 17: train the best model and check it on the hold-out set ----------
    best_pipe = make_pipeline(MODELS[best_name])
    best_pipe.fit(X_train, y_train)
    y_pred = best_pipe.predict(X_test)

    print("\n=== Hold-out test results (20% never seen during training) ===")
    print(classification_report(y_test, y_pred, labels=LEVELS, digits=3))
    print("Confusion matrix (rows = actual, columns = predicted, order Low/Moderate/High):")
    print(confusion_matrix(y_test, y_pred, labels=LEVELS))

    acc = accuracy_score(y_test, y_pred)
    p, r, f, _ = precision_recall_fscore_support(y_test, y_pred, labels=LEVELS, average=None)
    macro_p, macro_r, macro_f, _ = precision_recall_fscore_support(y_test, y_pred, labels=LEVELS, average="macro")
    high_recall = r[LEVELS.index("High")]

    print("\n=== Check against SRS targets ===")
    print(f"Accuracy {acc:.3f}  (target >= 0.80): {'PASS' if acc >= 0.80 else 'FAIL'}")
    print(f"Macro precision {macro_p:.3f}, recall {macro_r:.3f}, F1 {macro_f:.3f}  (target >= 0.75 each)")
    print(f"High-stress recall {high_recall:.3f}  (target >= 0.80): {'PASS' if high_recall >= 0.80 else 'FAIL'}")

    # ---------- Save the model with version and metrics ----------
    os.makedirs(MODEL_DIR, exist_ok=True)
    version = "v1.0"
    model_path = f"{MODEL_DIR}/stress_model_{version}.joblib"
    joblib.dump(best_pipe, model_path)
    size_mb = os.path.getsize(model_path) / (1024 * 1024)

    meta = {
        "version": version,
        "algorithm": best_name,
        "features": NUM_FEATURES + CAT_FEATURES,
        "trained_on_rows": int(len(X_train)),
        "hold_out_accuracy": round(float(acc), 4),
        "hold_out_macro_f1": round(float(macro_f), 4),
        "high_recall": round(float(high_recall), 4),
        "cv_results": {k: round(float(v["cv_mean_f1"]), 4) for k, v in results.items()},
        "random_seed": SEED,
        "sklearn_version": sklearn.__version__,
        "dataset": DATA,
        "file_size_mb": round(size_mb, 2),
    }
    with open(f"{MODEL_DIR}/stress_model_{version}.json", "w") as fh:
        json.dump(meta, fh, indent=2)

    print(f"\nSaved {model_path} ({size_mb:.2f} MB, limit is 50 MB)")
    print(f"Saved metadata to {MODEL_DIR}/stress_model_{version}.json")


if __name__ == "__main__":
    main()