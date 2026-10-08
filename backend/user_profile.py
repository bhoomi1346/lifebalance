from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, UserProfile

profile_bp = Blueprint("profile", __name__)

WORK_MODES = ["Remote", "Hybrid", "Office"]
MARITAL_STATUSES = ["Married", "Unmarried", "Prefer not to say"]
AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"]


def profile_to_dict(p):
    return {
        "occupation": p.occupation,
        "work_mode": p.work_mode,
        "marital_status": p.marital_status,
        "age_group": p.age_group,
    }


@profile_bp.route("", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Profile not found."}), 404
    return jsonify(profile_to_dict(profile)), 200


@profile_bp.route("", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Profile not found."}), 404

    if "occupation" in data:
        occupation = (data["occupation"] or "").strip()
        if len(occupation) > 100:
            return jsonify({"error": "Occupation is too long."}), 400
        profile.occupation = occupation

    if "work_mode" in data:
        if data["work_mode"] not in WORK_MODES:
            return jsonify({"error": "Work mode must be Remote, Hybrid or Office."}), 400
        profile.work_mode = data["work_mode"]

    if "marital_status" in data:
        if data["marital_status"] not in MARITAL_STATUSES:
            return jsonify({"error": "Marital status must be Married, Unmarried or Prefer not to say."}), 400
        profile.marital_status = data["marital_status"]

    if "age_group" in data:
        if data["age_group"] not in AGE_GROUPS:
            return jsonify({"error": "Choose a valid age group."}), 400
        profile.age_group = data["age_group"]

    db.session.commit()
    return jsonify({"message": "Profile updated.", "profile": profile_to_dict(profile)}), 200