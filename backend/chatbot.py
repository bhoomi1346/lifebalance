import os
from datetime import date, timedelta

import joblib
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, DailyLog, Prediction, UserProfile, ChatMessage
from recommender import build_recommendations

chat_bp = Blueprint("chat", __name__)

BASE = os.path.dirname(os.path.abspath(__file__))
INTENT_PATH = os.path.join(BASE, "..", "ml", "models", "intent_classifier_v1.joblib")
THRESHOLD = 0.5
DISCLAIMER = "General wellness information, not medical advice or diagnosis."

# Checked BEFORE the intent classifier (FR-7.7, SAF-4). Matching is deliberately broad.
SUPPORT_TERMS = [
    "suicid", "kill myself", "end my life", "end it all", "want to die", "wanna die",
    "hurt myself", "harm myself", "self harm", "self-harm", "cut myself", "overdose",
    "don't want to live", "do not want to live", "no reason to live", "better off dead",
    "hopeless", "can't go on", "cannot go on", "can't cope", "cannot cope",
    "nobody cares", "no one cares", "i am worthless", "i'm worthless",
]

SAFETY_TEXT = (
    "I'm really sorry you're feeling this way, and I'm glad you told me. "
    "You don't have to carry this alone. Please reach out to someone you trust right now, "
    "such as a family member, a friend or someone you live with. "
    "For free support in India, you can call Tele-MANAS on 14416, which is available 24 hours. "
    "If you feel you might act on these thoughts, or you are in immediate danger, "
    "call 112 or go to the nearest emergency department now. "
    "I'm an app, so I can't check on you, which is why I'm asking you to talk to a real person."
)

NO_DATA = ("I don't have any daily records from the last 7 days yet. "
           "Add a day on the Daily Entry page and I can use your data.")
UNCLEAR_TEXT = ("I'm not sure I understood that. Try asking about your sleep, stress, "
                "work-life balance, activity, water or meals, or type 'help'.")
HELP_TEXT = ("I can answer questions about your sleep, stress, work-life balance, activity, "
             "water and meals, using your own records. You can also ask for a tip. "
             "Try: 'how was my sleep this week?' or 'what was my stress level?'")

WORK_TIPS = {
    "Remote": "When working from home, set a fixed time to stop and take a short break every hour.",
    "Hybrid": "On office days and home days alike, keep one fixed end-of-day time.",
    "Office": "Stand up and stretch for a couple of minutes every hour at your desk.",
}
DEFAULT_WORK_TIP = "Short breaks and a clear end-of-day time can help you switch off."

GENERAL_TIPS = [
    "Aim for a consistent bedtime and a wind-down routine 30 minutes before it.",
    "Keep a water bottle nearby and sip regularly through the day.",
    "A 10-minute walk or some gentle stretching counts toward your activity.",
    "Try to eat at roughly the same times each day.",
]

LINKS = {
    "dashboard": ("Open dashboard", "/"),
    "daily": ("Add a daily record", "/daily"),
    "calendar": ("Open calendar", "/calendar"),
    "simulator": ("Try the simulator", "/simulator"),
}

_clf = None


def get_clf():
    global _clf
    if _clf is None:
        _clf = joblib.load(INTENT_PATH)
    return _clf


def needs_support(text):
    return any(term in text for term in SUPPORT_TERMS)


def classify(text):
    clf = get_clf()
    probs = clf.predict_proba([text])[0]
    best = int(probs.argmax())
    if probs[best] < THRESHOLD:
        return "unclear", float(probs[best])
    return str(clf.classes_[best]), float(probs[best])


def recent_logs(user_id, days):
    start = date.today() - timedelta(days=days - 1)
    return (DailyLog.query.filter(DailyLog.user_id == user_id, DailyLog.log_date >= start)
            .order_by(DailyLog.log_date.desc()).all())


def latest_log(user_id):
    return (DailyLog.query.filter_by(user_id=user_id)
            .order_by(DailyLog.log_date.desc()).first())


def latest_prediction(log_id):
    return (Prediction.query.filter_by(log_id=log_id)
            .order_by(Prediction.created_at.desc()).first())


def values_of(log):
    return {"sleep_hours": log.sleep_hours, "working_hours": log.working_hours,
            "activity_minutes": log.activity_minutes, "water_litres": log.water_litres,
            "meal_regularity": log.meal_regularity}


def profile_dict(user_id):
    p = UserProfile.query.filter_by(user_id=user_id).first()
    return {"work_mode": p.work_mode if p else None}


def answer(intent, user_id, profile):
    """Returns (text, list of action keys). Uses only this user's own records."""
    if intent == "greeting":
        return "Hello! " + HELP_TEXT, []
    if intent == "help":
        return HELP_TEXT, []
    if intent == "report_request":
        return ("Your progress is shown on the dashboard and the calendar. Downloadable "
                "weekly and monthly reports come in a later step of the project."), ["dashboard", "calendar"]
    if intent == "unclear":
        return UNCLEAR_TEXT, []

    latest = latest_log(user_id)

    if intent == "tips":
        if latest:
            p = latest_prediction(latest.log_id)
            if p:
                recs = build_recommendations(values_of(latest), {"stress_level": p.stress_level},
                                             {"work_mode": profile.get("work_mode")})
                return "From your latest record: " + recs[0]["text"], ["daily"]
        return "Here is a general idea: " + GENERAL_TIPS[0], ["daily"]

    week = recent_logs(user_id, 7)
    if not week:
        return NO_DATA, ["daily"]
    n = len(week)

    if intent == "sleep":
        avg = round(sum(l.sleep_hours for l in week) / n, 1)
        return (f"Over your last {n} logged day(s), your sleep averaged {avg} hours. "
                "Most adults do well with 7 to 9 hours. " + GENERAL_TIPS[0]), ["simulator"]

    if intent == "stress":
        p = latest_prediction(latest.log_id)
        if not p:
            return (f"Your latest record ({latest.log_date}) has no stress estimate yet. "
                    "Save it again to calculate one."), ["daily"]
        return (f"Your latest estimate ({latest.log_date}) is {p.stress_level} stress. "
                "It comes from a statistical model based on your habits, so treat it as a rough guide. "
                "Short breaks, rest and a steady sleep routine can help when stress is high."), ["calendar"]

    if intent == "work_life_balance":
        scores = [p.wlb_score for p in (latest_prediction(l.log_id) for l in week)
                  if p and p.wlb_score is not None]
        if not scores:
            return "Your recent records have no balance scores yet. Save a day again to calculate one.", ["daily"]
        avg = round(sum(scores) / len(scores))
        hours = round(sum(l.working_hours for l in week) / n, 1)
        tip = WORK_TIPS.get(profile.get("work_mode"), DEFAULT_WORK_TIP)
        return (f"Your balance score averaged {avg} over your recent scored days, and you worked "
                f"about {hours} hours a day. {tip}"), ["simulator", "calendar"]

    if intent == "activity":
        total = sum(l.activity_minutes for l in week)
        met = sum(1 for l in week if l.activity_minutes >= 30)
        return (f"In your last {n} logged day(s) you were active for {total} minutes in total, "
                f"and {met} of those days reached the 30-minute target. " + GENERAL_TIPS[2]), ["simulator"]

    if intent == "hydration_food":
        return (f"Your latest record shows {latest.water_litres} litres of water and "
                f"{latest.meal_regularity.lower()} meals. A common guide is about 2 litres of water a day. "
                + GENERAL_TIPS[1] + " " + GENERAL_TIPS[3]), ["daily"]

    return UNCLEAR_TEXT, []


def action_links(keys):
    return [{"label": LINKS[k][0], "path": LINKS[k][1]} for k in keys]


@chat_bp.route("", methods=["POST"])
@jwt_required()
def chat():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Type a message first."}), 400
    if len(message) > 500:
        return jsonify({"error": "Please keep messages under 500 characters."}), 400

    lower = message.lower()
    if needs_support(lower):
        intent, confidence, text, keys = "safety", 1.0, SAFETY_TEXT, []
    else:
        intent, confidence = classify(lower)
        text, keys = answer(intent, user_id, profile_dict(user_id))

    db.session.add(ChatMessage(user_id=user_id, sender="user", message=message, intent=intent))
    db.session.add(ChatMessage(user_id=user_id, sender="bot", message=text, intent=intent))
    db.session.commit()

    return jsonify({
        "intent": intent,
        "confidence": round(confidence, 2),
        "text": text,
        "actions": action_links(keys),
        "disclaimer": DISCLAIMER,
    }), 200


@chat_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = int(get_jwt_identity())
    msgs = (ChatMessage.query.filter_by(user_id=user_id)
            .order_by(ChatMessage.msg_id.desc()).limit(50).all())
    msgs.reverse()
    return jsonify([{
        "sender": m.sender,
        "message": m.message,
        "intent": m.intent,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    } for m in msgs]), 200


@chat_bp.route("/history", methods=["DELETE"])
@jwt_required()
def clear_history():
    user_id = int(get_jwt_identity())
    ChatMessage.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({"message": "Chat history cleared."}), 200