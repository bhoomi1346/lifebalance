from datetime import date, datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, DailyLog

logs_bp = Blueprint("logs", __name__)

MEALS = ["Regular", "Slightly irregular", "Irregular"]
STRESS_LEVELS = ["Low", "Moderate", "High"]
BACKFILL_DAYS = 30


def log_to_dict(log):
    return {
        "log_id": log.log_id,
        "log_date": log.log_date.isoformat(),
        "sleep_hours": log.sleep_hours,
        "working_hours": log.working_hours,
        "activity_minutes": log.activity_minutes,
        "water_litres": log.water_litres,
        "meal_regularity": log.meal_regularity,
        "mood": log.mood,
        "self_reported_stress": log.self_reported_stress,
        "source": log.source,
    }


def validate_values(data):
    """Checks every field. Returns (clean_values, error_message)."""
    clean = {}
    number_fields = [
        ("sleep_hours", 0, 24, False, "Sleep hours"),
        ("working_hours", 0, 24, False, "Working hours"),
        ("activity_minutes", 0, 600, True, "Physical activity minutes"),
        ("water_litres", 0, 10, False, "Water intake"),
    ]
    for key, low, high, integer, label in number_fields:
        if data.get(key) in (None, ""):
            return None, f"{label} is required."
        try:
            number = float(data[key])
        except (TypeError, ValueError):
            return None, f"{label} must be a number."
        if number < low or number > high:
            return None, f"{label} must be between {low} and {high}."
        clean[key] = int(number) if integer else number

    if clean["sleep_hours"] + clean["working_hours"] > 24:
        return None, "Sleep hours plus working hours cannot be more than 24."

    if data.get("meal_regularity") not in MEALS:
        return None, "Meal regularity must be Regular, Slightly irregular or Irregular."
    clean["meal_regularity"] = data["meal_regularity"]

    # Mood is optional (decision: Option A). Stored only if the user chooses to rate it.
    mood_raw = data.get("mood")
    if mood_raw in (None, ""):
        clean["mood"] = None
    else:
        try:
            mood = int(mood_raw)
        except (TypeError, ValueError):
            return None, "Mood must be a number from 1 to 5."
        if mood < 1 or mood > 5:
            return None, "Mood must be a number from 1 to 5."
        clean["mood"] = mood

    stress = data.get("self_reported_stress")
    if stress in (None, ""):
        clean["self_reported_stress"] = None
    elif stress in STRESS_LEVELS:
        clean["self_reported_stress"] = stress
    else:
        return None, "Stress level must be Low, Moderate or High."

    return clean, None


def parse_date(text):
    try:
        return datetime.strptime(text, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


@logs_bp.route("", methods=["POST"])
@jwt_required()
def create_log():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    log_date = parse_date(data.get("log_date"))
    if not log_date:
        return jsonify({"error": "Enter a valid date (YYYY-MM-DD)."}), 400

    today = date.today()
    if log_date > today:
        return jsonify({"error": "You cannot add a record for a future date."}), 400
    if log_date < today - timedelta(days=BACKFILL_DAYS):
        return jsonify({"error": f"You can only add records for the last {BACKFILL_DAYS} days."}), 400

    clean, error = validate_values(data)
    if error:
        return jsonify({"error": error}), 400

    if DailyLog.query.filter_by(user_id=user_id, log_date=log_date).first():
        return jsonify({"error": "A record already exists for this date. Edit it instead."}), 409

    log = DailyLog(user_id=user_id, log_date=log_date, source="manual", **clean)
    db.session.add(log)
    db.session.commit()
    return jsonify({"message": "Daily record saved.", "log": log_to_dict(log)}), 201


@logs_bp.route("", methods=["GET"])
@jwt_required()
def list_logs():
    user_id = int(get_jwt_identity())
    today = date.today()
    start = parse_date(request.args.get("from")) or (today - timedelta(days=30))
    end = parse_date(request.args.get("to")) or today

    logs = (
        DailyLog.query.filter(
            DailyLog.user_id == user_id,
            DailyLog.log_date >= start,
            DailyLog.log_date <= end,
        )
        .order_by(DailyLog.log_date.desc())
        .all()
    )
    return jsonify([log_to_dict(l) for l in logs]), 200


@logs_bp.route("/<int:log_id>", methods=["PUT"])
@jwt_required()
def update_log(log_id):
    user_id = int(get_jwt_identity())
    log = DailyLog.query.filter_by(log_id=log_id, user_id=user_id).first()
    if not log:
        return jsonify({"error": "Record not found."}), 404

    data = request.get_json(silent=True) or {}
    merged = log_to_dict(log)
    merged.update(data)

    clean, error = validate_values(merged)
    if error:
        return jsonify({"error": error}), 400

    for key, value in clean.items():
        setattr(log, key, value)
    log.source = "manual"
    db.session.commit()
    return jsonify({"message": "Daily record updated.", "log": log_to_dict(log)}), 200


@logs_bp.route("/<int:log_id>", methods=["DELETE"])
@jwt_required()
def delete_log(log_id):
    user_id = int(get_jwt_identity())
    log = DailyLog.query.filter_by(log_id=log_id, user_id=user_id).first()
    if not log:
        return jsonify({"error": "Record not found."}), 404
    db.session.delete(log)
    db.session.commit()
    return jsonify({"message": "Daily record deleted."}), 200