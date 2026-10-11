from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from logs import validate_values
from predictor import run_prediction

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("", methods=["POST"])
@jwt_required()
def predict():
    data = request.get_json(silent=True) or {}
    clean, error = validate_values(data)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(run_prediction(clean)), 200