from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, WearableConnection, WearableData
from wearable_adapters import ADAPTERS, ProviderNotConfigured

wear_bp = Blueprint("wearable", __name__)

SYNC_DAYS = 7
CONSENT_TEXT = ("We will read sleep duration, active minutes, steps and resting heart rate "
                "from the connected provider. We use them only to suggest values for your "
                "daily entry, and you can disconnect at any time.")


def get_connection(user_id):
    return WearableConnection.query.filter_by(user_id=user_id).first()


def conn_to_dict(conn):
    if not conn:
        return {"connected": False, "provider": None, "last_sync_at": None}
    return {
        "connected": conn.status == "connected",
        "provider": conn.provider,
        "last_sync_at": conn.last_sync_at.isoformat() if conn.last_sync_at else None,
        "scopes": conn.scopes,
    }


def data_to_dict(row):
    return {
        "date": row.data_date.isoformat(),
        "sleep_hours": row.sleep_hours,
        "active_minutes": row.active_minutes,
        "steps": row.steps,
        "resting_hr": row.resting_hr,
    }


@wear_bp.route("/status", methods=["GET"])
@jwt_required()
def status():
    user_id = int(get_jwt_identity())
    return jsonify({
        "available_providers": list(ADAPTERS.keys()),
        "consent_text": CONSENT_TEXT,
        "connection": conn_to_dict(get_connection(user_id)),
    }), 200


@wear_bp.route("/connect", methods=["POST"])
@jwt_required()
def connect():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    provider = data.get("provider", "mock")

    if data.get("consent") is not True:
        return jsonify({"error": "You must agree to the consent statement before connecting."}), 400
    if provider not in ADAPTERS:
        return jsonify({"error": "Unknown provider."}), 400

    try:
        result = ADAPTERS[provider].connect(user_id)
    except ProviderNotConfigured as exc:
        return jsonify({"error": str(exc)}), 503

    conn = get_connection(user_id)
    if not conn:
        conn = WearableConnection(user_id=user_id)
        db.session.add(conn)
    conn.provider = provider
    conn.status = result["status"]
    conn.scopes = result.get("scopes")
    db.session.commit()
    return jsonify({"message": "Connected.", "connection": conn_to_dict(conn)}), 200


@wear_bp.route("/sync", methods=["POST"])
@jwt_required()
def sync():
    user_id = int(get_jwt_identity())
    conn = get_connection(user_id)
    if not conn or conn.status != "connected":
        return jsonify({"error": "Connect a wearable first."}), 400

    adapter = ADAPTERS[conn.provider]
    today = date.today()
    synced = 0
    try:
        for offset in range(SYNC_DAYS):
            day = today - timedelta(days=offset)
            values = adapter.fetch_day(user_id, day)
            WearableData.query.filter_by(user_id=user_id, data_date=day).delete()
            db.session.add(WearableData(
                user_id=user_id, data_date=day,
                sleep_hours=values["sleep_hours"], steps=values["steps"],
                active_minutes=values["active_minutes"], resting_hr=values["resting_hr"],
            ))
            synced += 1
        conn.last_sync_at = db.func.now()
        db.session.commit()
    except ProviderNotConfigured as exc:
        db.session.rollback()
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:
        db.session.rollback()
        print("Wearable sync failed:", exc)
        return jsonify({"error": "The sync did not finish. Your records are unchanged. Try again."}), 500

    db.session.refresh(conn)
    return jsonify({
        "message": f"Synced {synced} day(s).",
        "connection": conn_to_dict(conn),
    }), 200


@wear_bp.route("/data", methods=["GET"])
@jwt_required()
def imported_data():
    user_id = int(get_jwt_identity())
    rows = (WearableData.query.filter_by(user_id=user_id)
            .order_by(WearableData.data_date.desc()).limit(14).all())
    return jsonify([data_to_dict(r) for r in rows]), 200


@wear_bp.route("/day", methods=["GET"])
@jwt_required()
def day_values():
    """Values to pre-fill the daily entry form for one date (FR-10.5)."""
    user_id = int(get_jwt_identity())
    try:
        day = date.fromisoformat(request.args.get("date", ""))
    except ValueError:
        return jsonify({"error": "Enter a valid date (YYYY-MM-DD)."}), 400

    row = WearableData.query.filter_by(user_id=user_id, data_date=day).first()
    if not row:
        return jsonify({"available": False}), 200
    return jsonify({"available": True, **data_to_dict(row)}), 200


@wear_bp.route("/disconnect", methods=["DELETE"])
@jwt_required()
def disconnect():
    user_id = int(get_jwt_identity())
    keep = request.args.get("keep", "true").lower()
    if keep not in ("true", "false"):
        return jsonify({"error": "keep must be true or false."}), 400

    conn = get_connection(user_id)
    if not conn:
        return jsonify({"message": "No wearable was connected."}), 200

    try:
        ADAPTERS[conn.provider].disconnect(user_id)
    except ProviderNotConfigured:
        pass  # nothing to revoke for a simulated provider

    db.session.delete(conn)
    deleted = 0
    if keep == "false":
        deleted = WearableData.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({
        "message": "Disconnected.",
        "imported_data_kept": keep == "true",
        "imported_rows_deleted": deleted,
    }), 200