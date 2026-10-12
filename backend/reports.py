from collections import Counter
from datetime import date, datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, DailyLog, Prediction, Recommendation

reports_bp = Blueprint("reports", __name__)

DISCLAIMER = "General wellness estimate from a statistical model. Not medical advice or diagnosis."
MIN_DAYS = {"daily": 1, "weekly": 3, "monthly": 3, "custom": 3}   # FR-9.6
MAX_CUSTOM_DAYS = 366


def latest_prediction(log_id):
    return (Prediction.query.filter_by(log_id=log_id)
            .order_by(Prediction.created_at.desc()).first())


def parse_day(text):
    try:
        return datetime.strptime(text, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def period_for(kind, today, start_text, end_text):
    """Returns (start, end) for the requested report type, or (None, error message)."""
    if kind == "daily":
        return today, today, None
    if kind == "weekly":
        return today - timedelta(days=6), today, None
    if kind == "monthly":
        return today - timedelta(days=29), today, None
    if kind == "custom":
        start, end = parse_day(start_text), parse_day(end_text)
        if not start or not end:
            return None, None, "Enter both dates as YYYY-MM-DD."
        if start > end:
            return None, None, "The start date must be before the end date."
        if (end - start).days + 1 > MAX_CUSTOM_DAYS:
            return None, None, f"Choose a period of {MAX_CUSTOM_DAYS} days or less."
        if end > today:
            end = today
        return start, end, None
    return None, None, "Report type must be daily, weekly, monthly or custom."


def avg(values, digits=1):
    return round(sum(values) / len(values), digits) if values else None


def summarise(user_id, start, end):
    """Everything the report shows for one period, from this user's records only."""
    logs = (DailyLog.query.filter(
                DailyLog.user_id == user_id,
                DailyLog.log_date >= start,
                DailyLog.log_date <= end)
            .order_by(DailyLog.log_date).all())

    stress_counts = {"Low": 0, "Moderate": 0, "High": 0}
    trend, scored = [], []
    for lg in logs:
        p = latest_prediction(lg.log_id)
        score = p.wlb_score if p else None
        level = p.stress_level if p else None
        if level in stress_counts:
            stress_counts[level] += 1
        trend.append({"date": lg.log_date.isoformat(), "wlb_score": score})
        if score is not None:
            scored.append({"date": lg.log_date.isoformat(), "wlb_score": score, "stress_level": level})

    best = max(scored, key=lambda s: s["wlb_score"]) if scored else None
    hardest = min(scored, key=lambda s: s["wlb_score"]) if scored else None

    rec_rows = (db.session.query(Recommendation.text)
                .join(DailyLog, Recommendation.log_id == DailyLog.log_id)
                .filter(DailyLog.user_id == user_id,
                        DailyLog.log_date >= start,
                        DailyLog.log_date <= end)
                .all())
    counts = Counter(text.split(" Why: ")[0] for (text,) in rec_rows)
    top_tips = [{"tip": tip, "times": n} for tip, n in counts.most_common(5)]

    return {
        "days": len(logs),
        "avg_sleep": avg([l.sleep_hours for l in logs]),
        "avg_work": avg([l.working_hours for l in logs]),
        "avg_activity": avg([l.activity_minutes for l in logs], 0),
        "avg_wlb": avg([s["wlb_score"] for s in scored], 0),
        "stress_counts": stress_counts,
        "wlb_trend": trend,
        "best_day": best,
        "hardest_day": hardest,
        "top_tips": top_tips,
    }


def compare(now, before):
    """Change from the previous period. None when either side has no data."""
    def diff(a, b):
        if a is None or b is None:
            return None
        return round(a - b, 1)
    return {
        "sleep_change": diff(now["avg_sleep"], before["avg_sleep"]),
        "work_change": diff(now["avg_work"], before["avg_work"]),
        "activity_change": diff(now["avg_activity"], before["avg_activity"]),
        "wlb_change": diff(now["avg_wlb"], before["avg_wlb"]),
        "high_days_change": now["stress_counts"]["High"] - before["stress_counts"]["High"],
    }


@reports_bp.route("", methods=["GET"])
@jwt_required()
def get_report():
    user_id = int(get_jwt_identity())
    kind = request.args.get("type", "weekly")
    today = date.today()

    start, end, error = period_for(kind, today, request.args.get("from"), request.args.get("to"))
    if error:
        return jsonify({"error": error}), 400

    length = (end - start).days + 1
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=length - 1)

    current = summarise(user_id, start, end)
    previous = summarise(user_id, prev_start, prev_end)

    needed = MIN_DAYS.get(kind, 3)
    enough = current["days"] >= needed
    if current["days"] == 0:
        message = "There are no records in this period yet. Add daily entries to build a report."
    elif not enough:
        message = (f"You have {current['days']} logged day(s) in this period. A full {kind} report "
                   f"needs at least {needed}. The available days are shown below.")
    else:
        message = None

    return jsonify({
        "type": kind,
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "previous_period": {"start": prev_start.isoformat(), "end": prev_end.isoformat()},
        "enough_data": enough,
        "message": message,
        "current": current,
        "previous": previous,
        "comparison": compare(current, previous),
        "disclaimer": DISCLAIMER,
    }), 200