from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from auth import auth_bp, bcrypt

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])
db.init_app(app)
bcrypt.init_app(app)
JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")


@app.route("/")
def home():
    return jsonify({"message": "Life Balance API is running"})


if __name__ == "__main__":
    app.run(debug=True)