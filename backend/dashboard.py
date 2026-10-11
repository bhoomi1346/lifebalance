from collections import defaultdict
from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, DailyLog, Prediction, Recommendation
from early_warning import check_warning

dash_bp = Blueprint("dashboard", __name__)

DISCLAIMER = "General wellness estimate from a statistical model. Not medical advice or diagnosis."


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


def months_back(d, back):
    """First day of the month that is `back` months before d's month."""
    y, m = d.year, d.month - back
    while m <= 0:
        m += 12
        y -= 1
    return date(y, m, 1)


def avg(values, digits=1):
    return round(sum(values) / len(values), digits) if values else None


@dash_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    user_id = int(get_jwt_identity())
    today = date.today()

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

    this_week = week_summary(user_id, today - timedelta(days=6), today)
    last_week = week_summary(user_id, today - timedelta(days=13), today - timedelta(days=7))

    return jsonify({
        "today": today_block,
        "warning": warning,
        "this_week": this_week,
        "last_week": last_week,
        "disclaimer": DISCLAIMER,
    }), 200


@dash_bp.route("/range", methods=["GET"])
@jwt_required()
def dashboard_range():
    """Chart data for the daily, weekly and monthly views (FR-8.2)."""
    user_id = int(get_jwt_identity())
    view = request.args.get("range", "daily")
    today = date.today()

    if view == "daily":
        start = today - timedelta(days=29)
        key_for = lambda d: d.isoformat()
    elif view == "weekly":
        start = today - timedelta(weeks=12) - timedelta(days=today.weekday())
        key_for = lambda d: (d - timedelta(days=d.weekday())).isoformat()
    elif view == "monthly":
        start = months_back(today, 11)
        key_for = lambda d: d.strftime("%Y-%m")
    else:
        return jsonify({"error": "range must be daily, weekly or monthly."}), 400

    logs = DailyLog.query.filter(
        DailyLog.user_id == user_id,
        DailyLog.log_date >= start,
        DailyLog.log_date <= today,
    ).order_by(DailyLog.log_date).all()

    buckets = defaultdict(lambda: {
        "sleep": [], "work": [], "activity": [], "wlb": [],
        "stress": {"Low": 0, "Moderate": 0, "High": 0},
    })
    totals = {"Low": 0, "Moderate": 0, "High": 0}

    for lg in logs:
        b = buckets[key_for(lg.log_date)]
        b["sleep"].append(lg.sleep_hours)
        b["work"].append(lg.working_hours)
        b["activity"].append(lg.activity_minutes)
        p = latest_prediction(lg.log_id)
        if p:
            if p.wlb_score is not None:
                b["wlb"].append(p.wlb_score)
            b["stress"][p.stress_level] += 1
            totals[p.stress_level] += 1

    points = []
    for label in sorted(buckets):
        b = buckets[label]
        points.append({
            "label": label,
            "days": len(b["sleep"]),
            "avg_sleep": avg(b["sleep"]),
            "avg_work": avg(b["work"]),
            "avg_activity": avg(b["activity"], 0),
            "avg_wlb": avg(b["wlb"], 0),
            "stress": b["stress"],
        })

    return jsonify({
        "range": view,
        "points": points,
        "stress_totals": totals,
        "disclaimer": DISCLAIMER,
    }), 200