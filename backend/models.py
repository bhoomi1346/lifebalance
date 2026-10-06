from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("user", "admin"), default="user", nullable=False)
    consent_given = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserProfile(db.Model):
    __tablename__ = "user_profiles"
    profile_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    occupation = db.Column(db.String(100))
    work_mode = db.Column(db.Enum("Remote", "Hybrid", "Office"))
    marital_status = db.Column(db.Enum("Married", "Unmarried", "Prefer not to say"))
    age_group = db.Column(db.String(20))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DailyLog(db.Model):
    __tablename__ = "daily_logs"
    __table_args__ = (db.UniqueConstraint("user_id", "log_date", name="uq_user_date"),)
    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    log_date = db.Column(db.Date, nullable=False)
    sleep_hours = db.Column(db.Float, nullable=False)
    working_hours = db.Column(db.Float, nullable=False)
    activity_minutes = db.Column(db.Integer, nullable=False)
    water_litres = db.Column(db.Float, nullable=False)
    meal_regularity = db.Column(db.Enum("Regular", "Slightly irregular", "Irregular"), nullable=False)
    mood = db.Column(db.Integer, nullable=False)
    self_reported_stress = db.Column(db.Enum("Low", "Moderate", "High"))
    source = db.Column(db.Enum("manual", "wearable"), default="manual", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Prediction(db.Model):
    __tablename__ = "predictions"
    prediction_id = db.Column(db.Integer, primary_key=True)
    log_id = db.Column(db.Integer, db.ForeignKey("daily_logs.log_id", ondelete="CASCADE"), nullable=False)
    stress_level = db.Column(db.Enum("Low", "Moderate", "High"), nullable=False)
    prob_low = db.Column(db.Float)
    prob_moderate = db.Column(db.Float)
    prob_high = db.Column(db.Float)
    wlb_score = db.Column(db.Integer)
    wlb_band = db.Column(db.String(20))
    top_factors = db.Column(db.JSON)
    model_version = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Recommendation(db.Model):
    __tablename__ = "recommendations"
    rec_id = db.Column(db.Integer, primary_key=True)
    log_id = db.Column(db.Integer, db.ForeignKey("daily_logs.log_id", ondelete="CASCADE"), nullable=False)
    text = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(50))
    priority = db.Column(db.Integer, default=3)
    status = db.Column(db.Enum("new", "done", "not_relevant"), default="new")

class Simulation(db.Model):
    __tablename__ = "simulations"
    sim_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    input_values = db.Column(db.JSON)
    predicted_stress = db.Column(db.String(20))
    predicted_score = db.Column(db.Integer)
    saved_as_goal = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatMessage(db.Model):
    __tablename__ = "chat_messages"
    msg_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    sender = db.Column(db.Enum("user", "bot"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    intent = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Report(db.Model):
    __tablename__ = "reports"
    report_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    report_type = db.Column(db.Enum("daily", "weekly", "monthly", "custom"), nullable=False)
    period_start = db.Column(db.Date)
    period_end = db.Column(db.Date)
    file_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WearableConnection(db.Model):
    __tablename__ = "wearable_connections"
    conn_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    provider = db.Column(db.String(30), nullable=False)
    access_token_enc = db.Column(db.Text)
    refresh_token_enc = db.Column(db.Text)
    token_expiry = db.Column(db.DateTime)
    scopes = db.Column(db.String(255))
    status = db.Column(db.String(20), default="connected")
    last_sync_at = db.Column(db.DateTime)

class WearableData(db.Model):
    __tablename__ = "wearable_data"
    wd_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    data_date = db.Column(db.Date, nullable=False)
    sleep_hours = db.Column(db.Float)
    steps = db.Column(db.Integer)
    active_minutes = db.Column(db.Integer)
    resting_hr = db.Column(db.Integer)
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)

class ModelRegistry(db.Model):
    __tablename__ = "model_registry"
    model_id = db.Column(db.Integer, primary_key=True)
    version = db.Column(db.String(20), nullable=False)
    algorithm = db.Column(db.String(50))
    accuracy = db.Column(db.Float)
    macro_f1 = db.Column(db.Float)
    trained_on_rows = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)