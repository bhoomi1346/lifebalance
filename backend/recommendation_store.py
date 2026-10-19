from models import db, Recommendation, UserProfile
from recommender import build_recommendations
from app_settings import get_rules


def store_recommendations(log, prediction):
    """Creates the day's tips using the current admin rules and saves them (FR-5.1).
    Replaces the tips from an earlier save of the same record.
    Returns the saved tips, or an empty list if something failed."""
    try:
        profile_row = UserProfile.query.filter_by(user_id=log.user_id).first()
        profile = {
            "work_mode": profile_row.work_mode if profile_row else None,
            "marital_status": profile_row.marital_status if profile_row else None,
            "occupation": profile_row.occupation if profile_row else None,
        }
        values = {
            "sleep_hours": log.sleep_hours,
            "working_hours": log.working_hours,
            "activity_minutes": log.activity_minutes,
            "water_litres": log.water_litres,
            "meal_regularity": log.meal_regularity,
        }
        tips = build_recommendations(values, prediction, profile, rules=get_rules())

        Recommendation.query.filter_by(log_id=log.log_id).delete()
        new_rows = []
        for t in tips:
            row = Recommendation(
                log_id=log.log_id,
                text=f"{t['text']} Why: {t['reason']}",
                category=t["category"],
                priority=t["priority"],
                status="new",
            )
            db.session.add(row)
            new_rows.append(row)
        db.session.commit()

        return [
            {"rec_id": r.rec_id, "text": r.text, "category": r.category,
             "priority": r.priority, "status": r.status}
            for r in new_rows
        ]
    except Exception as exc:
        db.session.rollback()
        print("Recommendations could not be saved:", exc)
        return []