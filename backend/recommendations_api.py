from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, DailyLog, Recommendation

recs_bp = Blueprint("recommendations", __name__)
VALID_STATUS = ["new", "done", "not_relevant"]


def rec_to_dict(r):
    return {
        "rec_id": r.rec_id,
        "text": r.text,
        "category": r.category,
        "priority": r.priority,
        "status": r.status,
    }


def owned_recs_query(user_id):
    """Only recommendations that belong to this user's daily records."""
    return Recommendation.query.join(DailyLog, Recommendation.log_id == DailyLog.log_id).filter(
        DailyLog.user_id == user_id
    )


@recs_bp.route("", methods=["GET"])
@jwt_required()
def get_recommendations():
    user_id = int(get_jwt_identity())
    try:
        day = datetime.strptime(request.args.get("date", ""), "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Enter a valid date (YYYY-MM-DD)."}), 400

    recs = (
        owned_recs_query(user_id)
        .filter(DailyLog.log_date == day)
        .order_by(Recommendation.priority, Recommendation.rec_id)
        .all()
    )
    return jsonify([rec_to_dict(r) for r in recs]), 200


@recs_bp.route("/<int:rec_id>/status", methods=["PUT"])
@jwt_required()
def set_status(rec_id):
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in VALID_STATUS:
        return jsonify({"error": "Status must be new, done or not_relevant."}), 400

    rec = owned_recs_query(user_id).filter(Recommendation.rec_id == rec_id).first()
    if not rec:
        return jsonify({"error": "Recommendation not found."}), 404

    rec.status = status
    db.session.commit()
    return jsonify({"message": "Feedback saved.", "recommendation": rec_to_dict(rec)}), 200