import json
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import (db, User, UserProfile, DailyLog, Prediction, Recommendation,
                    Simulation, ChatMessage, Report, WearableConnection, WearableData)
from auth import bcrypt

account_bp = Blueprint("account", __name__)


@account_bp.route("/export", methods=["GET"])
@jwt_required()
def export_data():
    """Everything this user owns, as JSON. The password hash is never included (SR-9)."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    logs = DailyLog.query.filter_by(user_id=user_id).order_by(DailyLog.log_date).all()

    daily = []
    for lg in logs:
        preds = Prediction.query.filter_by(log_id=lg.log_id).all()
        recs = Recommendation.query.filter_by(log_id=lg.log_id).all()
        daily.append({
            "log_date": lg.log_date.isoformat(),
            "sleep_hours": lg.sleep_hours,
            "working_hours": lg.working_hours,
            "activity_minutes": lg.activity_minutes,
            "water_litres": lg.water_litres,
            "meal_regularity": lg.meal_regularity,
            "mood": lg.mood,
            "self_reported_stress": lg.self_reported_stress,
            "source": lg.source,
            "predictions": [{"stress_level": p.stress_level, "wlb_score": p.wlb_score,
                             "wlb_band": p.wlb_band, "model_version": p.model_version,
                             "created_at": str(p.created_at)} for p in preds],
            "suggestions": [{"text": r.text, "status": r.status} for r in recs],
        })

    chats = ChatMessage.query.filter_by(user_id=user_id).order_by(ChatMessage.msg_id).all()
    sims = Simulation.query.filter_by(user_id=user_id).all()
    wear = WearableConnection.query.filter_by(user_id=user_id).first()

    export = {
        "account": {"name": user.name, "email": user.email,
                    "created_at": str(user.created_at), "consent_given": user.consent_given},
        "profile": {"occupation": profile.occupation, "work_mode": profile.work_mode,
                    "marital_status": profile.marital_status, "age_group": profile.age_group}
                   if profile else None,
        "daily_records": daily,
        "chat_messages": [{"sender": c.sender, "message": c.message, "created_at": str(c.created_at)}
                          for c in chats],
        "simulations": [{"input_values": s.input_values, "predicted_stress": s.predicted_stress,
                         "predicted_score": s.predicted_score, "created_at": str(s.created_at)}
                        for s in sims],
        "wearable": {"provider": wear.provider, "last_sync_at": str(wear.last_sync_at)} if wear else None,
    }
    body = json.dumps(export, indent=2, default=str)
    return Response(body, mimetype="application/json",
                    headers={"Content-Disposition": "attachment; filename=life_balance_my_data.json"})


@account_bp.route("", methods=["DELETE"])
@jwt_required()
def delete_account():
    """Deletes the account and every record that belongs to it (FR-1.5, SR-9).
    Needs the password, so a stolen token alone cannot delete the account."""
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Account not found."}), 404

    if not bcrypt.check_password_hash(user.password_hash, data.get("password") or ""):
        return jsonify({"error": "Password is incorrect. Your account was not deleted."}), 400

    log_ids = [lg.log_id for lg in DailyLog.query.filter_by(user_id=user_id).all()]
    if log_ids:
        Recommendation.query.filter(Recommendation.log_id.in_(log_ids)).delete(synchronize_session=False)
        Prediction.query.filter(Prediction.log_id.in_(log_ids)).delete(synchronize_session=False)
    DailyLog.query.filter_by(user_id=user_id).delete()
    for model in (Simulation, ChatMessage, Report, WearableData, WearableConnection, UserProfile):
        model.query.filter_by(user_id=user_id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Your account and all your data were deleted."}), 200