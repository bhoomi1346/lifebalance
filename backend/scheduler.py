from datetime import date, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from models import db, WearableConnection, WearableData
from wearable_adapters import ADAPTERS

SYNC_DAYS = 7
SYNC_HOUR = 6  # runs every day at 06:00 (SRS FR-10.4)


def sync_user(user_id):
    """Same steps as the Sync now button. Returns the number of days written."""
    conn = WearableConnection.query.filter_by(user_id=user_id).first()
    if not conn or conn.status != "connected":
        return 0

    adapter = ADAPTERS[conn.provider]
    today = date.today()
    for offset in range(SYNC_DAYS):
        day = today - timedelta(days=offset)
        values = adapter.fetch_day(user_id, day)
        WearableData.query.filter_by(user_id=user_id, data_date=day).delete()
        db.session.add(WearableData(
            user_id=user_id, data_date=day,
            sleep_hours=values["sleep_hours"], steps=values["steps"],
            active_minutes=values["active_minutes"], resting_hr=values["resting_hr"],
        ))
    conn.last_sync_at = db.func.now()
    db.session.commit()
    return SYNC_DAYS


def run_daily_sync(app):
    """Syncs every connected user. One user's failure does not stop the others."""
    with app.app_context():
        connections = WearableConnection.query.filter_by(status="connected").all()
        done, failed = 0, 0
        for conn in connections:
            try:
                sync_user(conn.user_id)
                done += 1
            except Exception as exc:
                db.session.rollback()
                failed += 1
                print(f"Scheduled sync failed for user {conn.user_id}:", exc)
        print(f"Scheduled sync: {done} user(s) synced, {failed} failed.")
        return done, failed


def start_scheduler(app):
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(
        lambda: run_daily_sync(app),
        "cron", hour=SYNC_HOUR, minute=0,
        id="daily_wearable_sync", replace_existing=True,
    )
    scheduler.start()
    return scheduler