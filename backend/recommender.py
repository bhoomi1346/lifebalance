"""
Recommendation rules (SRS FR-5.1 to FR-5.3, SAF-3).
Suggestions depend on the day's habits, the predicted stress level and the
user's context (work mode, household responsibilities). Context only changes
the wording and type of tip. It never changes the stress level or the score.
"""

SAFE_SLEEP_RANGE = (7, 9)   # general wellness range used in the balance score


def _tip(priority, category, text, reason):
    return {"priority": priority, "category": category, "text": text, "reason": reason}


def _work_tips(work_mode):
    """Context filter: work mode changes the examples, not the stress level (FR-5.2)."""
    if work_mode == "Remote":
        return ("Set a fixed time to stop working and close your laptop.",
                "Take a 5-minute screen break every hour.")
    if work_mode == "Office":
        return ("Stand up and stretch for 2 minutes at your desk every hour.",
                "If you can, walk part of your commute.")
    if work_mode == "Hybrid":
        return ("Keep one fixed end-of-day time on office and home days.",
                "Use your home-day breaks for a short walk.")
    return ("Plan one protected break in your working day.",
            "Take a short screen break every hour.")


def build_recommendations(values, prediction, profile=None):
    """
    values: clean daily values (sleep_hours, working_hours, activity_minutes,
            water_litres, meal_regularity)
    prediction: the output of predictor.run_prediction (stress_level, wlb_score)
    profile: optional dict with work_mode, marital_status, occupation
    Returns 3 to 5 tips, highest priority first.
    """
    profile = profile or {}
    tips = []
    sleep = values["sleep_hours"]
    work = values["working_hours"]
    activity = values["activity_minutes"]
    water = values["water_litres"]
    meal = values["meal_regularity"]
    stress = prediction["stress_level"]

    if sleep < SAFE_SLEEP_RANGE[0]:
        tips.append(_tip(1, "sleep", 
            "Aim for a consistent bedtime, with a wind-down routine 30 minutes before it.",
            f"You slept {sleep} h; the usual range is 7 to 9 h."))
    elif sleep > SAFE_SLEEP_RANGE[1]:
        tips.append(_tip(3, "sleep",
            "Long sleep can leave you groggy. Keep a regular wake-up time.",
            f"You slept {sleep} h; the usual range is 7 to 9 h."))

    if work > 8:
        tips.append(_tip(1 if work >= 10 else 2, "work",
            _work_tips(profile.get("work_mode"))[0],
            f"You worked {work} h."))

    if activity < 30:
        tips.append(_tip(2, "activity",
            "Add a short walk or some gentle stretching. Even 10 minutes counts.",
            f"You were active for {activity} min; the target is 30 min."))

    if water < 2:
        tips.append(_tip(3, "hydration",
            "Keep a water bottle at your desk and sip regularly.",
            f"You drank {water} L; about 2 L is a common target."))

    if meal != "Regular":
        tips.append(_tip(2, "meals",
            "Try to eat at roughly the same times each day, even if the food changes.",
            f"Your meal pattern was {meal.lower()}."))

    if work > 8 and profile.get("work_mode") in ("Remote", "Hybrid"):
        tips.append(_tip(3, "boundaries", _work_tips(profile.get("work_mode"))[1],
            "Breaks help separate work time from home time."))

    if stress == "High":
        tips.append(_tip(0, "support",
            "If high stress continues for several days, talk to a trusted person or a qualified professional.",
            "Your stress estimate was High."))

    if not tips:
        tips.append(_tip(3, "maintain",
            "Your habits look balanced today. Keep the same routine.",
            "All the main habits are in the usual range."))

    tips.sort(key=lambda t: t["priority"])
    return tips[:5]