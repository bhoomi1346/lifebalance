import os
from datetime import date, timedelta

from groq import Groq
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, DailyLog, Prediction, UserProfile, ChatMessage
from extensions import limiter
from sanitize import clean_text

chat_bp = Blueprint("chat", __name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "openai/gpt-oss-20b"
DISCLAIMER = "General wellness information, not medical advice or diagnosis."

# ── Safety net (checked before Groq) ──────────────────────────────────────────
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

LINKS = {
    "dashboard": ("Open dashboard", "/"),
    "daily": ("Add a daily record", "/daily"),
    "calendar": ("Open calendar", "/calendar"),
    "simulator": ("Try the simulator", "/simulator"),
}


def needs_support(text: str) -> bool:
    return any(term in text for term in SUPPORT_TERMS)


# ── Data helpers ───────────────────────────────────────────────────────────────

def recent_logs(user_id: int, days: int):
    start = date.today() - timedelta(days=days - 1)
    return (DailyLog.query
            .filter(DailyLog.user_id == user_id, DailyLog.log_date >= start)
            .order_by(DailyLog.log_date.desc()).all())


def latest_log(user_id: int):
    return (DailyLog.query.filter_by(user_id=user_id)
            .order_by(DailyLog.log_date.desc()).first())


def latest_prediction(log_id: int):
    return (Prediction.query.filter_by(log_id=log_id)
            .order_by(Prediction.created_at.desc()).first())


def get_profile(user_id: int):
    return UserProfile.query.filter_by(user_id=user_id).first()


def build_user_context(user_id: int) -> str:
    """Summarise the user's recent wellness data for the system prompt."""
    lines = []

    profile = get_profile(user_id)
    if profile:
        parts = []
        if profile.occupation:
            parts.append(f"occupation: {profile.occupation}")
        if profile.work_mode:
            parts.append(f"work mode: {profile.work_mode}")
        if profile.age_group:
            parts.append(f"age group: {profile.age_group}")
        if parts:
            lines.append("User profile — " + ", ".join(parts) + ".")

    week = recent_logs(user_id, 7)
    if not week:
        lines.append("No daily logs recorded in the last 7 days.")
        return "\n".join(lines)

    n = len(week)
    avg_sleep = round(sum(l.sleep_hours for l in week) / n, 1)
    avg_work = round(sum(l.working_hours for l in week) / n, 1)
    avg_activity = round(sum(l.activity_minutes for l in week) / n)
    avg_water = round(sum(l.water_litres for l in week) / n, 1)
    days_30min = sum(1 for l in week if l.activity_minutes >= 30)

    lines.append(
        f"Last {n} logged day(s) — avg sleep: {avg_sleep} h, avg work: {avg_work} h, "
        f"avg activity: {avg_activity} min/day ({days_30min} day(s) ≥ 30 min target), "
        f"avg water: {avg_water} L."
    )

    latest = week[0]
    pred = latest_prediction(latest.log_id)
    if pred:
        lines.append(
            f"Latest prediction ({latest.log_date}): stress = {pred.stress_level}, "
            f"work-life balance score = {pred.wlb_score} ({pred.wlb_band})."
        )
    else:
        lines.append(f"Latest log date: {latest.log_date}. No stress/WLB prediction available yet.")

    return "\n".join(lines)


SYSTEM_PROMPT_TEMPLATE = """\
You are a friendly wellness assistant embedded in the Life Balance app.
Your job is to help users understand their own wellness data and give practical, \
evidence-based tips on sleep, stress, work-life balance, physical activity, hydration and nutrition.

Rules:
- ALWAYS keep replies SHORT — 1 to 3 sentences maximum. No long paragraphs.
- Be warm, direct and non-judgmental.
- Base answers on the user data provided below whenever relevant.
- Never diagnose medical conditions or prescribe medication.
- If you mention numbers from the user's data, be accurate.
- End with one small, actionable suggestion when truly helpful — keep it one sentence.
- Do NOT make up data the user has not recorded.
- Avoid filler phrases, preambles, or restating the question.

{user_context}
"""

LINKS_HINT = {
    "sleep": ["simulator", "daily"],
    "stress": ["calendar", "daily"],
    "balance": ["simulator", "calendar"],
    "work": ["simulator", "calendar"],
    "activity": ["simulator", "daily"],
    "water": ["daily"],
    "hydration": ["daily"],
    "food": ["daily"],
    "meal": ["daily"],
    "dashboard": ["dashboard"],
    "report": ["dashboard", "calendar"],
    "tip": ["daily"],
}


def suggest_links(message: str) -> list:
    lower = message.lower()
    keys = set()
    for keyword, link_keys in LINKS_HINT.items():
        if keyword in lower:
            keys.update(link_keys)
    return [{"label": LINKS[k][0], "path": LINKS[k][1]} for k in keys if k in LINKS]


# ── Groq call ──────────────────────────────────────────────────────────────────

def call_groq(system_prompt: str, history: list, user_message: str) -> str:
    client = Groq(api_key=GROQ_API_KEY)

    messages = [{"role": "system", "content": system_prompt}]
    # Add recent history (last 10 turns) for conversational context
    for h in history[-10:]:
        role = "user" if h.sender == "user" else "assistant"
        messages.append({"role": role, "content": h.message})
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        max_tokens=200,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


# ── Flask routes ───────────────────────────────────────────────────────────────

@chat_bp.route("", methods=["POST"])
@limiter.limit("30 per minute", methods=["POST"])
@jwt_required()
def chat():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    message = clean_text(data.get("message"), 500)
    if not message:
        return jsonify({"error": "Type a message first."}), 400
    if len(message) > 500:
        return jsonify({"error": "Please keep messages under 500 characters."}), 400

    lower = message.lower()

    # Safety check — bypass Groq entirely
    if needs_support(lower):
        text = SAFETY_TEXT
        db.session.add(ChatMessage(user_id=user_id, sender="user", message=message, intent="safety"))
        db.session.add(ChatMessage(user_id=user_id, sender="bot", message=text, intent="safety"))
        db.session.commit()
        return jsonify({
            "intent": "safety",
            "confidence": 1.0,
            "text": text,
            "actions": [],
            "disclaimer": DISCLAIMER,
        }), 200

    # Build context and call Groq
    user_context = build_user_context(user_id)
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(user_context=user_context)

    # Fetch recent history for conversational context
    history = (ChatMessage.query.filter_by(user_id=user_id)
               .order_by(ChatMessage.msg_id.desc()).limit(20).all())
    history.reverse()

    try:
        text = call_groq(system_prompt, history, message)
    except Exception as exc:
        return jsonify({"error": f"Could not reach the AI service: {exc}"}), 502

    actions = suggest_links(message)

    db.session.add(ChatMessage(user_id=user_id, sender="user", message=message, intent="groq"))
    db.session.add(ChatMessage(user_id=user_id, sender="bot", message=text, intent="groq"))
    db.session.commit()

    return jsonify({
        "intent": "groq",
        "confidence": 1.0,
        "text": text,
        "actions": actions,
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
