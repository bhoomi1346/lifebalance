from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import DailyLog
from logs import validate_values
from predictor import run_prediction

sim_bp = Blueprint("simulator", __name__)

ESTIMATE_NOTE = ("This is an estimate from a statistical model, not a guaranteed outcome. "
                 "Nothing here is saved to your daily records.")

# Single-habit changes tried for the "biggest benefit" suggestion (FR-6.4)
CHANGES = [
    ("sleep_hours", 1.0, "Sleeping 1 hour more"),
    ("working_hours", -1.0, "Working 1 hour less"),
    ("activity_minutes", 15, "Adding 15 minutes of activity"),
    ("water_litres", 0.5, "Drinking 0.5 litres more water"),
]


def summarise(values):
    result = run_prediction(values)
    return {
        "stress_level": result["stress_level"],
        "probabilities": result["probabilities"],
        "wlb_score": result["wlb_score"],
        "wlb_band": result["wlb_band"],
    }


def biggest_benefit(scenario, base_score):
    """Tries one change at a time and returns the one that raises the score most."""
    best = None
    for key, step, label in CHANGES:
        changed = dict(scenario)
        new_value = changed[key] + step
        if key == "sleep_hours":
            new_value = min(new_value, 10)
        if key == "working_hours":
            new_value = max(new_value, 0)
        if key == "activity_minutes":
            new_value = min(new_value, 600)
        if key == "water_litres":
            new_value = min(new_value, 10)
        if new_value == changed[key]:
            continue
        changed[key] = round(new_value, 1) if isinstance(step, float) else int(new_value)
        if changed["sleep_hours"] + changed["working_hours"] > 24:
            continue
        gain = run_prediction(changed)["wlb_score"] - base_score
        if gain > 0 and (best is None or gain > best["score_gain"]):
            best = {"change": label, "score_gain": gain}
    return best


@sim_bp.route("", methods=["POST"])
@jwt_required()
def simulate():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    scenario_raw = data.get("scenario") or {}
    scenario, error = validate_values(scenario_raw)
    if error:
        return jsonify({"error": f"Scenario: {error}"}), 400

    baseline_raw = data.get("baseline")
    if baseline_raw is None:
        latest = (DailyLog.query.filter_by(user_id=user_id)
                  .order_by(DailyLog.log_date.desc()).first())
        if not latest:
            return jsonify({"error": "Add a daily record first, or send a baseline."}), 400
        baseline_raw = {
            "sleep_hours": latest.sleep_hours,
            "working_hours": latest.working_hours,
            "activity_minutes": latest.activity_minutes,
            "water_litres": latest.water_litres,
            "meal_regularity": latest.meal_regularity,
        }
    baseline, error = validate_values(baseline_raw)
    if error:
        return jsonify({"error": f"Baseline: {error}"}), 400

    before = summarise(baseline)
    after = summarise(scenario)
    best = biggest_benefit(scenario, after["wlb_score"])

    return jsonify({
        "baseline": before,
        "scenario": after,
        "change": {
            "stress_level": f"{before['stress_level']} to {after['stress_level']}",
            "score_points": after["wlb_score"] - before["wlb_score"],
            "high_probability_change": round(
                after["probabilities"].get("High", 0) - before["probabilities"].get("High", 0), 3),
        },
        "biggest_benefit": best,
        "note": ESTIMATE_NOTE,
        "disclaimer": "General wellness estimate from a statistical model. Not medical advice or diagnosis.",
    }), 200