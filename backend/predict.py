import os
import joblib
import pandas as pd
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from logs import validate_values

predict_bp = Blueprint("predict", __name__)

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE, "..", "ml", "models", "stress_model_v1.0.joblib")
MODEL_VERSION = "v1.0"
DISCLAIMER = "General wellness estimate from a statistical model. Not medical advice or diagnosis."

MEAL_SCORE = {"Regular": 100, "Slightly irregular": 60, "Irregular": 20}
MEAL_RISK = {"Regular": 0.0, "Slightly irregular": 0.5, "Irregular": 1.1}

_model = None


def get_model():
    """Loads the model once, the first time it is needed."""
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def build_features(v):
    """Must match add_features() in ml/train_models.py exactly."""
    sleep, work = v["sleep_hours"], v["working_hours"]
    activity, water = v["activity_minutes"], v["water_litres"]
    row = {
        "sleep_hours": sleep,
        "working_hours": work,
        "activity_minutes": activity,
        "water_litres": water,
        "sleep_deficit": max(0.0, 7 - sleep),
        "work_to_sleep_ratio": work / max(sleep, 0.5),
        "activity_target_met": int(activity >= 30),
        "meal_regularity": v["meal_regularity"],
        "hydration_level": "Low" if water <= 1.5 else ("Adequate" if water <= 2.5 else "High"),
    }
    return pd.DataFrame([row])


def balance_score(v):
    """Same weights and rules as ml/generate_dataset.py (SRS FR-4.2)."""
    sleep, work = v["sleep_hours"], v["working_hours"]
    activity, water = v["activity_minutes"], v["water_litres"]

    sleep_s = 100 if 7 <= sleep <= 9 else 100 - 25 * min(abs(sleep - min(max(sleep, 7), 9)), 4)
    work_s = min(max(100 - 12.5 * max(0, work - 8), 0), 100)
    act_s = min(activity / 30, 1) * 100
    water_s = min(water / 2, 1) * 100
    meal_s = MEAL_SCORE[v["meal_regularity"]]

    total = 0.30 * sleep_s + 0.30 * work_s + 0.20 * act_s + 0.10 * water_s + 0.10 * meal_s
    score = int(min(max(round(total), 0), 100))

    if score < 40:
        band = "Poor"
    elif score < 60:
        band = "Fair"
    elif score < 80:
        band = "Good"
    else:
        band = "Excellent"
    return score, band


def main_factors(v):
    """Lists the habits that add the most to stress, largest first (SRS FR-4.4)."""
    sleep, work = v["sleep_hours"], v["working_hours"]
    activity, water = v["activity_minutes"], v["water_litres"]
    candidates = [
        (0.9 * max(0, 7 - sleep), f"Short sleep ({sleep} h, aim for 7 to 9 h)"),
        (0.45 * max(0, work - 8), f"Long working hours ({work} h)"),
        (0.8 if activity < 10 else 0.0, f"Very low physical activity ({activity} min)"),
        (0.5 if water < 1.5 else 0.0, f"Low water intake ({water} L)"),
        (MEAL_RISK[v["meal_regularity"]], f"Meal timing: {v['meal_regularity'].lower()}"),
    ]
    positive = [(score, text) for score, text in candidates if score > 0]
    positive.sort(reverse=True)
    return [text for _, text in positive[:3]]


@predict_bp.route("", methods=["POST"])
@jwt_required()
def predict():
    data = request.get_json(silent=True) or {}
    clean, error = validate_values(data)
    if error:
        return jsonify({"error": error}), 400

    model = get_model()
    proba = model.predict_proba(build_features(clean))[0]
    probabilities = {cls: round(float(p), 3) for cls, p in zip(model.classes_, proba)}
    stress_level = max(probabilities, key=probabilities.get)

    score, band = balance_score(clean)

    return jsonify({
        "stress_level": stress_level,
        "probabilities": probabilities,
        "wlb_score": score,
        "wlb_band": band,
        "top_factors": main_factors(clean),
        "model_version": MODEL_VERSION,
        "disclaimer": DISCLAIMER,
    }), 200