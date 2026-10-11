from datetime import date, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, DailyLog, Prediction, Recommendation
from early_warning import check_warning

dash_bp = Blueprint("dashboard", __name__)


def week_summary(user_id, start, end):
    """Averages for a date range, from the user's own records only."""
    logs = DailyLog.query.filter(
        DailyLog.user_id == user_id,
        DailyLog.log_date >= start,
        DailyLog.log_date <= end,
    ).all()
    if not logs:
        return {"days": 0, "avg_sleep": None, "avg_activity": None, "avg_wlb": None}

    ids = [l.log_id for l in logs]
    preds = Prediction.query.filter(Prediction.log_id.in_(ids)).all()
    wlb_values = [p.wlb_score for p in preds if p.wlb_score is not None]

    return {
        "days": len(logs),
        "avg_sleep": round(sum(l.sleep_hours for l in logs) / len(logs), 1),
        "avg_activity": round(sum(l.activity_minutes for l in logs) / len(logs)),
        "avg_wlb": round(sum(wlb_values) / len(wlb_values)) if wlb_values else None,
    }


def latest_prediction(log_id):
    return (
        Prediction.query.filter_by(log_id=log_id)
        .order_by(Prediction.created_at.desc())
        .first()
    )


@dash_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    user_id = int(get_jwt_identity())
    today = date.today()

    # Today's record, if any
    today_log = DailyLog.query.filter_by(user_id=user_id, log_date=today).first()
    today_block = None
    if today_log:
        pred = latest_prediction(today_log.log_id)
        top_tip = (
            Recommendation.query.filter_by(log_id=today_log.log_id)
            .order_by(Recommendation.priority, Recommendation.rec_id)
            .first()
        )
        today_block = {
            "log_date": today.isoformat(),
            "stress_level": pred.stress_level if pred else None,
            "wlb_score": pred.wlb_score if pred else None,
            "wlb_band": pred.wlb_band if pred else None,
            "top_tip": top_tip.text.split(" Why: ")[0] if top_tip else None,
        }

    # Early warning from the last 7 days of stress levels (FR-4.6, SAF-2)
    recent_logs = (
        DailyLog.query.filter(
            DailyLog.user_id == user_id,
            DailyLog.log_date >= today - timedelta(days=6),
            DailyLog.log_date <= today,
        )
        .order_by(DailyLog.log_date)
        .all()
    )
    levels = []
    for lg in recent_logs:
        p = latest_prediction(lg.log_id)
        if p:
            levels.append(p.stress_level)
    warning = check_warning(levels)

    # Week-over-week: last 7 days vs the 7 days before that
    this_week = week_summary(user_id, today - timedelta(days=6), today)
    last_week = week_summary(user_id, today - timedelta(days=13), today - timedelta(days=7))

    return jsonify({
        "today": today_block,
        "warning": warning,
        "this_week": this_week,
        "last_week": last_week,
        "disclaimer": "General wellness estimate from a statistical model. Not medical advice or diagnosis.",
    }), 200