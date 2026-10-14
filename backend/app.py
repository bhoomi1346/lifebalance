from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from auth import auth_bp, bcrypt
from user_profile import profile_bp
from logs import logs_bp
from predict import predict_bp
from recommendations_api import recs_bp
from dashboard import dash_bp
from calendar_api import cal_bp
from simulator import sim_bp
from chatbot import chat_bp
from reports import reports_bp
from report_pdf import pdf_bp
from report_excel import excel_bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])
db.init_app(app)
bcrypt.init_app(app)
JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(profile_bp, url_prefix="/api/profile")
app.register_blueprint(logs_bp, url_prefix="/api/logs")
app.register_blueprint(predict_bp, url_prefix="/api/predict")
app.register_blueprint(recs_bp, url_prefix="/api/recommendations")
app.register_blueprint(dash_bp, url_prefix="/api/dashboard")
app.register_blueprint(cal_bp, url_prefix="/api/calendar")
app.register_blueprint(sim_bp, url_prefix="/api/simulate")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(reports_bp, url_prefix="/api/reports")
app.register_blueprint(pdf_bp, url_prefix="/api/reports")
app.register_blueprint(excel_bp, url_prefix="/api/reports")


@app.route("/")
def home():
    return jsonify({"message": "Life Balance API is running"})


if __name__ == "__main__":
    app.run(debug=True)