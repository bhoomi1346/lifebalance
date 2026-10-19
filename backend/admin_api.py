import json
import os
import sys
from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User, ModelRegistry, Prediction
from app_settings import get_rules, validate_rules, save_rules, DEFAULT_RULES, LIMITS

admin_bp = Blueprint("admin", __name__)

BASE = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.abspath(os.path.join(BASE, "..", "ml"))


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = db.session.get(User, int(get_jwt_identity()))
        if not user or user.role != "admin":
            return jsonify({"error": "Admins only."}), 403
        return fn(*args, **kwargs)
    return wrapper


def ensure_registry():
    """Registers v1.0 from its saved metadata the first time the admin panel is used."""
    if ModelRegistry.query.count() == 0:
        with open(os.path.join(ML_DIR, "models", "stress_model_v1.0.json")) as fh:
            meta = json.load(fh)
        db.session.add(ModelRegistry(
            version="v1.0",
            algorithm=meta["algorithm"],
            accuracy=meta["hold_out_accuracy"],
            macro_f1=meta["hold_out_macro_f1"],
            trained_on_rows=meta["trained_on_rows"],
            is_active=True,
        ))
        db.session.commit()


def active_row():
    return (ModelRegistry.query.filter_by(is_active=True)
            .order_by(ModelRegistry.model_id.desc()).first())


def next_version(existing):
    minors = []
    for v in existing:
        try:
            minors.append(int(v.split(".")[1]))
        except (IndexError, ValueError):
            pass
    return f"v1.{(max(minors) if minors else 0) + 1}"


def model_to_dict(m):
    return {
        "version": m.version,
        "algorithm": m.algorithm,
        "accuracy": m.accuracy,
        "macro_f1": m.macro_f1,
        "trained_on_rows": m.trained_on_rows,
        "is_active": m.is_active,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@admin_bp.route("/model", methods=["GET"])
@admin_required
def model_info():
    ensure_registry()
    versions = ModelRegistry.query.order_by(ModelRegistry.model_id.desc()).all()
    # Counts only. Admins never see individual users' records (SRS FR-11.4).
    return jsonify({
        "active": model_to_dict(active_row()),
        "versions": [model_to_dict(v) for v in versions],
        "total_predictions": Prediction.query.count(),
        "total_accounts": User.query.count(),
    }), 200


@admin_bp.route("/retrain", methods=["POST"])
@admin_required
def retrain_model():
    ensure_registry()
    current = active_row()
    versions = [v.version for v in ModelRegistry.query.all()]
    new_version = next_version(versions)

    if ML_DIR not in sys.path:
        sys.path.append(ML_DIR)
    from retrain import retrain

    metrics = retrain(new_version, current.algorithm)

    # Activate only if the new model is not worse (SRS FR-11.3).
    activated = metrics["macro_f1"] >= (current.macro_f1 or 0)
    if activated:
        ModelRegistry.query.update({"is_active": False})

    row = ModelRegistry(
        version=new_version,
        algorithm=current.algorithm,
        accuracy=metrics["accuracy"],
        macro_f1=metrics["macro_f1"],
        trained_on_rows=metrics["trained_on_rows"],
        is_active=activated,
    )
    db.session.add(row)
    db.session.commit()

    if activated:
        message = f"Model {new_version} trained and activated."
    else:
        message = (f"Model {new_version} trained but NOT activated, because its macro F1 "
                   f"({metrics['macro_f1']}) is lower than the active model's ({current.macro_f1}).")
    return jsonify({
        "message": message,
        "activated": activated,
        "metrics": metrics,
        "previous_version": current.version,
    }), 200


@admin_bp.route("/rules", methods=["GET"])
@admin_required
def get_rule_settings():
    return jsonify({"rules": get_rules(), "defaults": DEFAULT_RULES, "limits": LIMITS}), 200


@admin_bp.route("/rules", methods=["PUT"])
@admin_required
def update_rules():
    data = request.get_json(silent=True) or {}
    clean, error = validate_rules(data)
    if error:
        return jsonify({"error": error}), 400
    save_rules(clean)
    return jsonify({"message": "Rules saved. New daily records will use them.", "rules": clean}), 200