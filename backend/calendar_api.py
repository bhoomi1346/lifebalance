import calendar as pycal
from datetime import date, datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import DailyLog, Prediction

cal_bp = Blueprint("calendar", __name__)


def latest_prediction(log_id):
    return (
        Prediction.query.filter_by(log_id=log_id)
        .order_by(Prediction.created_at.desc())
        .first()
    )


@cal_bp.route("", methods=["GET"])
@jwt_required()
def month_view():
    """Per-day stress and score for one month (FR-8.3, FR-8.5)."""
    user_id = int(get_jwt_identity())
    raw = request.args.get("month", "")
    try:
        first = datetime.strptime(raw + "-01", "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Enter a month as YYYY-MM."}), 400

    last_day = pycal.monthrange(first.year, first.month)[1]
    last = date(first.year, first.month, last_day)

    logs = DailyLog.query.filter(
        DailyLog.user_id == user_id,
        DailyLog.log_date >= first,
        DailyLog.log_date <= last,
    ).all()
    by_date = {lg.log_date: lg for lg in logs}

    days = []
    for d in range(1, last_day + 1):
        day = date(first.year, first.month, d)
        lg = by_date.get(day)
        if lg is None:
            days.append({"date": day.isoformat(), "entry": False,
                         "stress_level": None, "wlb_score": None, "wlb_band": None})
            continue
        p = latest_prediction(lg.log_id)
        days.append({
            "date": day.isoformat(),
            "entry": True,
            "stress_level": p.stress_level if p else None,
            "wlb_score": p.wlb_score if p else None,
            "wlb_band": p.wlb_band if p else None,
        })

    scored = [d for d in days if d["stress_level"]]
    scores = [d["wlb_score"] for d in scored if d["wlb_score"] is not None]
    summary = {
        "logged_days": sum(1 for d in days if d["entry"]),
        "high_days": sum(1 for d in scored if d["stress_level"] == "High"),
        "avg_wlb": round(sum(scores) / len(scores)) if scores else None,
    }
    # Logging streak: consecutive days with an entry, ending on the last logged day
    streak = 0
    for d in reversed(days):
        if d["entry"]:
            streak += 1
        else:
            break
    summary["streak_to_month_end"] = streak

    return jsonify({
        "month": raw,
        "days": days,
        "summary": summary,
        "disclaimer": "General wellness estimate from a statistical model. Not medical advice or diagnosis.",
    }), 200