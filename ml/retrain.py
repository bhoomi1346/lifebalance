"""
Retrains the stress model on the cleaned dataset (SRS FR-11.1 and FR-11.2).
Uses the same features, split and random seed as train_models.py.
"""
import json
import os
import sys

import joblib
import pandas as pd
from sklearn.base import clone
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split

ML_DIR = os.path.dirname(os.path.abspath(__file__))
if ML_DIR not in sys.path:
    sys.path.append(ML_DIR)

from train_models import add_features, make_pipeline, MODELS, NUM_FEATURES, CAT_FEATURES, LEVELS, SEED


def retrain(version, algorithm):
    if algorithm not in MODELS:
        raise ValueError(f"Unknown algorithm: {algorithm}")

    df = add_features(pd.read_csv(os.path.join(ML_DIR, "data", "stress_clean.csv")))
    X = df[NUM_FEATURES + CAT_FEATURES]
    y = df["stress_level"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED)

    pipe = make_pipeline(clone(MODELS[algorithm]))
    pipe.fit(X_train, y_train)
    pred = pipe.predict(X_test)

    acc = accuracy_score(y_test, pred)
    _, _, macro_f1, _ = precision_recall_fscore_support(y_test, pred, labels=LEVELS, average="macro")
    per_class_recall = precision_recall_fscore_support(y_test, pred, labels=LEVELS, average=None)[1]
    high_recall = per_class_recall[LEVELS.index("High")]

    metrics = {
        "version": version,
        "algorithm": algorithm,
        "accuracy": round(float(acc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "high_recall": round(float(high_recall), 4),
        "trained_on_rows": int(len(X_train)),
    }

    models_dir = os.path.join(ML_DIR, "models")
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(pipe, os.path.join(models_dir, f"stress_model_{version}.joblib"))
    with open(os.path.join(models_dir, f"stress_model_{version}.json"), "w") as fh:
        json.dump({**metrics, "features": NUM_FEATURES + CAT_FEATURES,
                   "random_seed": SEED}, fh, indent=2)
    return metrics