from models import db, AppSetting

RULE_KEY = "recommendation_rules"

DEFAULT_RULES = {
    "sleep_min": 7,
    "sleep_max": 9,
    "work_limit": 8,
    "activity_target": 30,
    "water_target": 2.0,
}

# Admins can change rules only inside these ranges (SRS SAF-3).
LIMITS = {
    "sleep_min": (6, 8),
    "sleep_max": (8, 10),
    "work_limit": (6, 10),
    "activity_target": (10, 60),
    "water_target": (1.0, 3.0),
}


def get_rules():
    rules = dict(DEFAULT_RULES)
    row = db.session.get(AppSetting, RULE_KEY)
    if row and isinstance(row.value, dict):
        for key in DEFAULT_RULES:
            if key in row.value:
                rules[key] = row.value[key]
    return rules


def validate_rules(new):
    clean = {}
    for key, (low, high) in LIMITS.items():
        if key not in new:
            return None, f"Missing {key}."
        try:
            value = float(new[key])
        except (TypeError, ValueError):
            return None, f"{key} must be a number."
        if value < low or value > high:
            return None, f"{key} must be between {low} and {high}."
        clean[key] = round(value, 1) if key == "water_target" else int(value)
    if clean["sleep_min"] >= clean["sleep_max"]:
        return None, "sleep_min must be less than sleep_max."
    return clean, None


def save_rules(clean):
    row = db.session.get(AppSetting, RULE_KEY)
    if row:
        row.value = clean
    else:
        db.session.add(AppSetting(key=RULE_KEY, value=clean))
    db.session.commit()