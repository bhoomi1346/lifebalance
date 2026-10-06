import re
from datetime import timedelta
from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, UserProfile

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    consent = data.get("consent_given") is True

    if not name:
        return jsonify({"error": "Name is required."}), 400
    if not EMAIL_PATTERN.match(email):
        return jsonify({"error": "Enter a valid email address."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    if not consent:
        return jsonify({"error": "You must give consent to register."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "This email is already registered."}), 409

    user = User(
        name=name,
        email=email,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
        consent_given=True,
    )
    db.session.add(user)
    db.session.flush()  # gets user_id before commit
    db.session.add(UserProfile(user_id=user.user_id))
    db.session.commit()

    return jsonify({"message": "Registration successful. Please log in."}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Incorrect email or password."}), 401

    token = create_access_token(
        identity=str(user.user_id),
        additional_claims={"role": user.role},
        expires_delta=timedelta(hours=2),
    )
    return jsonify({
        "token": token,
        "user": {"user_id": user.user_id, "name": user.name, "email": user.email, "role": user.role},
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user_id": user.user_id, "name": user.name, "email": user.email, "role": user.role}), 200