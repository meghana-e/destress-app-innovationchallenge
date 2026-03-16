from datetime import datetime, timezone
from hashlib import pbkdf2_hmac
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4
import json
import os
import pickle
import secrets

import numpy as np
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from coaching_engine import get_meralion_coaching

# Load environment variables
load_dotenv()


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
USERS_FILE = DATA_DIR / "users.json"
SESSIONS_FILE = DATA_DIR / "sessions.json"
RESPONSES_FILE = DATA_DIR / "responses.json"
MODEL_FILE = BASE_DIR / "stress_model.pkl"
FRONTEND_DIST_DIR = BASE_DIR.parent / "frontend" / "dist"

PORT = int(os.getenv("PORT", "5000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

PROFILE_FIELDS = {
    "full_name",
    "age",
    "industry",
    "work_hours",
    "pressure",
    "manager_support",
    "sleep",
    "exercise",
    "job_satisfaction",
    "work_life_balance",
    "social",
    "family",
    "work_setup",
    "onboarding_completed",
}

PRESSURE_MAP = {"low": 1, "medium": 2, "high": 3}
WORK_SETUP_MAP = {"wfh": 0, "hybrid": 1, "office": 2}

app = FastAPI(title="Destress API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_data_store() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    for path in (USERS_FILE, SESSIONS_FILE, RESPONSES_FILE):
        if not path.exists():
            path.write_text("[]", encoding="utf-8")


ensure_data_store()

model = None
feature_cols: List[str] = []
if MODEL_FILE.exists():
    try:
        with MODEL_FILE.open("rb") as file:
            saved = pickle.load(file)
            model = saved.get("model")
            feature_cols = saved.get("features", [])
    except Exception:
        model = None
        feature_cols = []


class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    age: Optional[str] = None
    industry: Optional[str] = None
    work_hours: Optional[str] = None
    pressure: Optional[str] = None
    manager_support: Optional[str] = None
    sleep: Optional[str] = None
    exercise: Optional[str] = None
    job_satisfaction: Optional[str] = None
    work_life_balance: Optional[str] = None
    social: Optional[str] = None
    family: Optional[str] = None
    work_setup: Optional[str] = None
    onboarding_completed: Optional[bool] = None


class QuestionnaireRequest(BaseModel):
    age: str
    industry: str
    work_hours: str
    pressure: str
    manager_support: str
    sleep: str
    exercise: str
    job_satisfaction: str
    work_life_balance: str
    social: str
    family: str
    work_setup: str


class UserResponse(BaseModel):
    name: str
    age: int
    industry: str
    working_hours: float
    work_pressure: int
    manager_support: int
    sleeping_habit: float
    exercise_habit: int
    job_satisfaction: int
    work_life_balance: int
    social_person: int
    lives_with_family: int
    work_from: int
    language: str = "English"  # Supported: English, Chinese, Malay, Tamil


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_json(path: Path) -> List[Dict[str, Any]]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def write_json(path: Path, payload: List[Dict[str, Any]]) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def blank_profile(full_name: str = "") -> Dict[str, Any]:
    return {
        "full_name": full_name,
        "age": "",
        "industry": "",
        "work_hours": "",
        "pressure": "",
        "manager_support": "",
        "sleep": "",
        "exercise": "",
        "job_satisfaction": "",
        "work_life_balance": "",
        "social": "",
        "family": "",
        "work_setup": "",
        "onboarding_completed": False,
    }


def sanitize_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    base = blank_profile(profile.get("full_name", ""))
    for key in PROFILE_FIELDS:
        if key in profile and profile[key] is not None:
            base[key] = profile[key]
    return base


def sanitize_email(email: str) -> str:
    return email.strip().lower()


def validate_email(email: str) -> None:
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter a valid email address.")


def validate_password(password: str) -> None:
    if len(password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters.")


def hash_password(password: str, salt: Optional[str] = None) -> Dict[str, str]:
    salt_value = salt or secrets.token_hex(16)
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_value), 200_000)
    return {"salt": salt_value, "hash": digest.hex()}


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    return hash_password(password, salt)["hash"] == password_hash


def public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["profile"].get("full_name", ""),
    }


def find_user_by_email(users: List[Dict[str, Any]], email: str) -> Optional[Dict[str, Any]]:
    return next((user for user in users if user["email"] == email), None)


def find_user_by_id(users: List[Dict[str, Any]], user_id: str) -> Optional[Dict[str, Any]]:
    return next((user for user in users if user["id"] == user_id), None)


def create_session(user_id: str) -> str:
    sessions = read_json(SESSIONS_FILE)
    token = secrets.token_urlsafe(32)
    sessions = [session for session in sessions if session.get("user_id") != user_id]
    sessions.append({"token": token, "user_id": user_id, "created_at": utc_now()})
    write_json(SESSIONS_FILE, sessions)
    return token


def remove_user_responses(user_id: str) -> None:
    responses = [entry for entry in read_json(RESPONSES_FILE) if entry.get("user_id") != user_id]
    write_json(RESPONSES_FILE, responses)


def parse_float(value: str, field_name: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid value for {field_name}.") from exc


def parse_scale(value: str, field_name: str) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid value for {field_name}.") from exc

    if parsed < 1 or parsed > 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{field_name} must be between 1 and 5.")

    return parsed


def parse_int(value: str, field_name: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid value for {field_name}.") from exc


def normalize_questionnaire(profile: Dict[str, Any]) -> Dict[str, Any]:
    pressure = str(profile.get("pressure", "")).lower()
    work_setup = str(profile.get("work_setup", "")).lower()
    social = str(profile.get("social", "")).lower()
    family = str(profile.get("family", "")).lower()
    work_life_balance_raw = parse_scale(str(profile.get("work_life_balance", "")), "work_life_balance")

    if pressure not in PRESSURE_MAP:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="pressure must be one of low, medium, or high.")
    if work_setup not in WORK_SETUP_MAP:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="work_setup must be one of office, hybrid, or wfh.")
    if social not in {"yes", "no"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="social must be yes or no.")
    if family not in {"yes", "no"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="family must be yes or no.")

    return {
        "working_hours": parse_float(profile.get("work_hours", ""), "work_hours"),
        "work_pressure": PRESSURE_MAP[pressure],
        "manager_support": parse_scale(profile.get("manager_support", ""), "manager_support"),
        "sleeping_habit": parse_float(profile.get("sleep", ""), "sleep"),
        "exercise_habit": parse_scale(profile.get("exercise", ""), "exercise"),
        "job_satisfaction": parse_scale(profile.get("job_satisfaction", ""), "job_satisfaction"),
        "work_life_balance": 1 if work_life_balance_raw >= 4 else 0,
        "social_person": 1 if social == "yes" else 0,
        "lives_with_family": 1 if family == "yes" else 0,
        "work_from": WORK_SETUP_MAP[work_setup],
    }


def build_model_input_payload(profile: Dict[str, Any]) -> Dict[str, Any]:
    normalized = normalize_questionnaire(profile)
    return {
        "name": str(profile.get("full_name", "")).strip(),
        "age": parse_int(profile.get("age", ""), "age"),
        "industry": str(profile.get("industry", "")).strip(),
        **normalized,
    }


def calculate_strain_index(data: Dict[str, Any]) -> float:
    sleep_score = max(0, min(1, (8 - data["sleeping_habit"]) / 4))
    overwork_score = max(0, min(1, (data["working_hours"] - 8) / 6))
    pressure_score = (data["work_pressure"] - 1) / 2
    support_score = max(0, (5 - data["manager_support"]) / 4)
    balance_score = 1 - data["work_life_balance"]
    exercise_score = max(0, (5 - data["exercise_habit"]) / 4)
    satisfaction_score = max(0, (5 - data["job_satisfaction"]) / 4)

    raw = (
        0.20 * pressure_score
        + 0.20 * sleep_score
        + 0.15 * overwork_score
        + 0.15 * support_score
        + 0.15 * satisfaction_score
        + 0.10 * balance_score
        + 0.05 * exercise_score
    )

    return min(100, round(raw * 100, 1))


def get_ml_prediction(strain_index: float, normalized_answers: Dict[str, Any]) -> str:
    if model and feature_cols:
        sample = np.array([[normalized_answers.get(column, 0) for column in feature_cols]], dtype=float)
        prediction = model.predict(sample)[0]
        if isinstance(prediction, str):
            return prediction.title()

    if strain_index >= 65:
        return "High"
    if strain_index >= 35:
        return "Medium"
    return "Low"


def get_nudge(strain_index: float) -> str:
    if strain_index >= 70:
        return "High strain detected. Take a real break today and speak to someone you trust."
    if strain_index >= 45:
        return "Moderate strain detected. A short walk or a 5-minute breathing exercise could help right now."
    return "You are currently in a healthy range. Keep your routines steady."


def get_dnd_status(strain_index: float) -> Dict[str, Any]:
    if strain_index >= 65:
        return {
            "status": "ACTIVE",
            "reason": "High strain index detected",
            "muted": ["email", "chat", "app alerts", "social media"],
            "allowed_through": ["emergency contacts", "critical work"],
            "duration_minutes": 30,
            "expiry_time": datetime.now().strftime("%H:%M"),
        }

    return {
        "status": "INACTIVE",
        "reason": "Strain index within healthy range",
        "muted": [],
        "allowed_through": ["all"],
        "duration_minutes": 0,
        "expiry_time": None,
    }


def identify_top_factors(data: Dict[str, Any]) -> List[str]:
    factors: List[str] = []
    if data["sleeping_habit"] < 6:
        factors.append("Low sleep (under 6 hours)")
    if data["working_hours"] > 10:
        factors.append("Overwork (10+ hours/day)")
    if data["work_pressure"] == 3:
        factors.append("High work pressure")
    if data["manager_support"] <= 2:
        factors.append("Low manager support")
    if data["work_life_balance"] == 0:
        factors.append("Poor work-life balance")
    if data["exercise_habit"] <= 2:
        factors.append("Low physical activity")
    if data["job_satisfaction"] <= 2:
        factors.append("Low job satisfaction")
    return factors or ["No major risk factors detected"]


def get_burnout_trend(strain_index: float, history: List[Dict[str, Any]]) -> str:
    if len(history) < 3:
        return "Not enough data yet. Submit the questionnaire a few more times to establish a trend."

    recent_scores = [entry["strain_index"] for entry in history[-7:]]
    recent_scores.append(strain_index)
    slope = np.polyfit(range(len(recent_scores)), recent_scores, 1)[0]

    if slope > 1:
        return "Rising. Your strain is increasing over time."
    if slope < -1:
        return "Improving. Your strain is decreasing over time."
    return "Stable. No major change in strain over recent submissions."


def build_assessment(user_id: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    model_input = build_model_input_payload(profile)
    normalized_answers = {
        "working_hours": model_input["working_hours"],
        "work_pressure": model_input["work_pressure"],
        "manager_support": model_input["manager_support"],
        "sleeping_habit": model_input["sleeping_habit"],
        "exercise_habit": model_input["exercise_habit"],
        "job_satisfaction": model_input["job_satisfaction"],
        "work_life_balance": model_input["work_life_balance"],
        "social_person": model_input["social_person"],
        "lives_with_family": model_input["lives_with_family"],
        "work_from": model_input["work_from"],
    }
    strain_index = calculate_strain_index(normalized_answers)
    ml_prediction = get_ml_prediction(strain_index, normalized_answers)

    responses = read_json(RESPONSES_FILE)
    user_history = [entry for entry in responses if entry.get("user_id") == user_id]
    trend = get_burnout_trend(strain_index, user_history)

    assessment = {
        "id": str(uuid4()),
        "timestamp": utc_now(),
        "strain_index": strain_index,
        "ml_stress_level": ml_prediction,
        "burnout_risk": ml_prediction,
        "weekly_trend": trend,
        "nudge": get_nudge(strain_index),
        "dnd_mode": get_dnd_status(strain_index),
        "top_factors": identify_top_factors(normalized_answers),
        "model_input": model_input,
        "questionnaire": {key: profile.get(key, "") for key in PROFILE_FIELDS if key != "onboarding_completed"},
    }

    responses.append({"user_id": user_id, **assessment})
    write_json(RESPONSES_FILE, responses)
    return assessment


def get_current_user(authorization: str = Header(default="")) -> Dict[str, Any]:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization token.")

    token = authorization.split(" ", 1)[1].strip()
    sessions = read_json(SESSIONS_FILE)
    session = next((item for item in sessions if item.get("token") == token), None)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session.")

    users = read_json(USERS_FILE)
    user = find_user_by_id(users, session["user_id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    return user


def get_latest_assessment(user_id: str) -> Optional[Dict[str, Any]]:
    responses = [entry for entry in read_json(RESPONSES_FILE) if entry.get("user_id") == user_id]
    return responses[-1] if responses else None


def assess_from_model_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    strain_index = calculate_strain_index(data)
    ml_prediction = get_ml_prediction(strain_index, data)
    return {
        "strain_index": strain_index,
        "ml_stress_level": ml_prediction,
        "burnout_risk": ml_prediction,
        "nudge": get_nudge(strain_index),
        "dnd_mode": get_dnd_status(strain_index),
        "top_factors": identify_top_factors(data),
    }


@app.get("/health")
def root() -> Dict[str, Any]:
    return {"status": "Destress backend is running", "port": PORT}


@app.get("/api/health")
def api_root() -> Dict[str, Any]:
    return {"status": "Destress backend API is running", "port": PORT}


@app.post("/signup")
def signup(payload: SignupRequest) -> Dict[str, Any]:
    email = sanitize_email(payload.email)
    validate_email(email)
    validate_password(payload.password)

    users = read_json(USERS_FILE)
    if find_user_by_email(users, email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with that email already exists.")

    hashed = hash_password(payload.password)
    timestamp = utc_now()
    user = {
        "id": str(uuid4()),
        "email": email,
        "password_hash": hashed["hash"],
        "password_salt": hashed["salt"],
        "profile": blank_profile(payload.full_name.strip()),
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    users.append(user)
    write_json(USERS_FILE, users)

    token = create_session(user["id"])
    return {"token": token, "user": public_user(user), "profile": sanitize_profile(user["profile"])}


@app.post("/api/signup")
def api_signup(payload: SignupRequest) -> Dict[str, Any]:
    return signup(payload)


@app.post("/assess")
def assess(payload: UserResponse) -> Dict[str, Any]:
    data = {
        "working_hours": payload.working_hours,
        "work_pressure": payload.work_pressure,
        "manager_support": payload.manager_support,
        "sleeping_habit": payload.sleeping_habit,
        "exercise_habit": payload.exercise_habit,
        "job_satisfaction": payload.job_satisfaction,
        "work_life_balance": payload.work_life_balance,
        "social_person": payload.social_person,
        "lives_with_family": payload.lives_with_family,
        "work_from": payload.work_from,
    }

    assessment = assess_from_model_payload(data)
    
    # Get AI coaching (MERaLiON or rule-based fallback)
    coaching = get_meralion_coaching(
        strain_index=assessment["strain_index"],
        top_factors=assessment["top_factors"],
        burnout_risk=assessment["burnout_risk"],
        trend="stable",  # Default trend; update based on historical data if available
        language=payload.language
    )
    
    return {
        **assessment,
        "coaching": coaching,
        "model_input": payload.dict(),
    }


@app.post("/api/assess")
def api_assess(payload: UserResponse) -> Dict[str, Any]:
    return assess(payload)


@app.post("/login")
def login(payload: LoginRequest) -> Dict[str, Any]:
    email = sanitize_email(payload.email)
    users = read_json(USERS_FILE)
    user = find_user_by_email(users, email)
    if not user or not verify_password(payload.password, user["password_hash"], user["password_salt"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token = create_session(user["id"])
    return {"token": token, "user": public_user(user), "profile": sanitize_profile(user["profile"])}


@app.post("/api/login")
def api_login(payload: LoginRequest) -> Dict[str, Any]:
    return login(payload)


@app.get("/me")
def me(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return {"user": public_user(current_user), "profile": sanitize_profile(current_user["profile"])}


@app.get("/api/me")
def api_me(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return me(current_user)


@app.get("/profile")
def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return sanitize_profile(current_user["profile"])


@app.get("/api/profile")
def api_get_profile(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return get_profile(current_user)


@app.put("/profile")
def update_profile(payload: ProfileUpdateRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    users = read_json(USERS_FILE)
    user = find_user_by_id(users, current_user["id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    profile = sanitize_profile(user["profile"])
    updates = payload.dict(exclude_unset=True)
    for key, value in updates.items():
        if key == "full_name" and isinstance(value, str):
            profile[key] = value.strip()
        else:
            profile[key] = value

    user["profile"] = sanitize_profile(profile)
    user["updated_at"] = utc_now()
    write_json(USERS_FILE, users)

    return {"profile": sanitize_profile(user["profile"]), "user": public_user(user)}


@app.put("/api/profile")
def api_update_profile(payload: ProfileUpdateRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return update_profile(payload, current_user)


@app.post("/questionnaire")
def save_questionnaire(payload: QuestionnaireRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    users = read_json(USERS_FILE)
    user = find_user_by_id(users, current_user["id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    profile = sanitize_profile(user["profile"])
    answers = payload.dict()
    for key, value in answers.items():
        profile[key] = value
    profile["onboarding_completed"] = True

    user["profile"] = sanitize_profile(profile)
    user["updated_at"] = utc_now()
    write_json(USERS_FILE, users)

    assessment = build_assessment(user["id"], user["profile"])
    return {"profile": sanitize_profile(user["profile"]), "assessment": assessment}


@app.post("/api/questionnaire")
def api_save_questionnaire(payload: QuestionnaireRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return save_questionnaire(payload, current_user)


@app.get("/questionnaire")
def get_questionnaire(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    latest = get_latest_assessment(current_user["id"])
    return {
        "questionnaire": latest.get("questionnaire") if latest else None,
        "assessment": latest,
    }


@app.get("/api/questionnaire")
def api_get_questionnaire(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return get_questionnaire(current_user)


@app.delete("/questionnaire")
def delete_questionnaire(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    users = read_json(USERS_FILE)
    user = find_user_by_id(users, current_user["id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    cleared_profile = blank_profile(user["profile"].get("full_name", ""))
    user["profile"] = cleared_profile
    user["updated_at"] = utc_now()
    write_json(USERS_FILE, users)
    remove_user_responses(user["id"])

    return {"profile": sanitize_profile(user["profile"])}


@app.delete("/api/questionnaire")
def api_delete_questionnaire(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return delete_questionnaire(current_user)


@app.get("/dashboard")
def dashboard(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    responses = [entry for entry in read_json(RESPONSES_FILE) if entry.get("user_id") == current_user["id"]]
    history = [
        {
            "timestamp": entry["timestamp"],
            "strain_index": entry["strain_index"],
            "ml_stress_level": entry["ml_stress_level"],
        }
        for entry in responses[-7:]
    ]

    latest = responses[-1] if responses else None
    return {
        "user": public_user(current_user),
        "profile": sanitize_profile(current_user["profile"]),
        "questionnaire": latest.get("questionnaire") if latest else None,
        "latest_assessment": latest,
        "history": history,
    }


@app.get("/api/dashboard")
def api_dashboard(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return dashboard(current_user)


@app.get("/agent-debate")
def agent_debate(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Multi-agent debate engine: 3 specialist agents analyze stress data and reach consensus.
    Returns agent recommendations, vote tally, and final decision with actions.
    """
    assessment = get_latest_assessment(current_user["id"])
    
    if not assessment:
        return {
            "status": "no_data",
            "message": "Complete the questionnaire first.",
            "agents": [],
            "final_decision": None,
        }
    
    model_input = assessment.get("model_input", {})
    strain_index = assessment.get("strain_index", 0)
    weekly_trend = assessment.get("weekly_trend", "")
    
    # AGENT 1: Behavioural Signal Agent
    sleeping_habit = model_input.get("sleeping_habit", 6)
    exercise_habit = model_input.get("exercise_habit", 2)
    
    observations_1 = []
    if sleeping_habit < 6:
        observations_1.append(f"Fatigue detected (sleep {sleeping_habit}h)")
    if exercise_habit <= 2:
        observations_1.append(f"Recovery deficit (exercise {exercise_habit}d/week)")
    
    if strain_index >= 65:
        signal_1 = "elevated"
        vote_1 = "intervene"
        recommendation_1 = "Take 5-min break now"
    elif strain_index >= 35:
        signal_1 = "moderate"
        vote_1 = "monitor"
        recommendation_1 = "Monitor in 2h"
    else:
        signal_1 = "within normal range"
        vote_1 = "standby"
        recommendation_1 = "No action needed"
    
    agent_1 = {
        "agent": "Behavioural Signal Agent",
        "icon": "activity",
        "observation": f"Strain {signal_1} ({strain_index}). " + ("; ".join(observations_1) if observations_1 else "Normal vitals"),
        "recommendation": recommendation_1,
        "confidence": min(100, int(strain_index * 1.1)),
        "vote": vote_1,
    }
    
    # AGENT 2: Context & Workload Agent
    working_hours = model_input.get("working_hours", 8)
    work_pressure = model_input.get("work_pressure", 2)
    manager_support = model_input.get("manager_support", 2)
    work_life_balance = model_input.get("work_life_balance", 2)
    social_person = model_input.get("social_person", 1)
    lives_with_family = model_input.get("lives_with_family", 1)
    work_from = model_input.get("work_from", 0)
    
    flags_2 = []
    if working_hours > 10 and work_pressure == 3:
        flags_2.append("Critical overload detected")
    if sleeping_habit < 6 and exercise_habit <= 2:
        flags_2.append("Recovery deficit alarming")
    if manager_support <= 2 and work_life_balance == 0:
        flags_2.append("Support and balance gap critical")
    if social_person == 0 and lives_with_family == 0 and work_from == 2:
        flags_2.append("Isolation risk high")
    
    if len(flags_2) >= 2:
        severity_2 = "critical"
        vote_2 = "intervene"
    elif len(flags_2) == 1:
        severity_2 = "moderate"
        vote_2 = "monitor"
    else:
        severity_2 = "low"
        vote_2 = "standby"
    
    observation_2 = f"Context: {severity_2}. " + ("; ".join(flags_2) if flags_2 else "Contextually stable")
    recommendations = {
        "critical": "Urgent intervention needed",
        "moderate": "Take preventive action soon",
        "low": "Maintainable workload"
    }
    
    agent_2 = {
        "agent": "Context & Workload Agent",
        "icon": "briefcase",
        "observation": observation_2,
        "recommendation": recommendations[severity_2],
        "confidence": min(100, 40 + (len(flags_2) * 20)),
        "vote": vote_2,
    }
    
    # AGENT 3: Trend & Trajectory Agent
    is_rising = any(word in weekly_trend.lower() for word in ["rising", "increasing"])
    is_improving = any(word in weekly_trend.lower() for word in ["improving", "decreasing"])
    
    if is_rising and strain_index >= 55:
        vote_3 = "intervene"
        confidence_3 = 85
        recommendation_3 = "Urgent — adjust workload immediately"
    elif is_rising:
        vote_3 = "monitor"
        confidence_3 = 75
        recommendation_3 = "Take preventive action"
    elif is_improving:
        vote_3 = "standby"
        confidence_3 = 80
        recommendation_3 = "Keep recovery habits"
    else:
        vote_3 = "standby"
        confidence_3 = 65
        recommendation_3 = "Continue current pace"
    
    agent_3 = {
        "agent": "Trend & Trajectory Agent",
        "icon": "trending-up",
        "observation": f"Trajectory: {weekly_trend}",
        "recommendation": recommendation_3,
        "confidence": confidence_3,
        "vote": vote_3,
    }
    
    # LEAD AGENT: Vote Tally & Final Decision
    votes = [agent_1["vote"], agent_2["vote"], agent_3["vote"]]
    intervene_count = votes.count("intervene")
    monitor_count = votes.count("monitor")
    standby_count = votes.count("standby")
    
    if intervene_count >= 2:
        final_action = "INTERVENE"
        reasoning = f"Consensus ({intervene_count} intervene, {monitor_count} monitor, {standby_count} standby): Immediate action required"
        actions_taken = [
            "Focus Protection Mode (30-min DND)",
            "Micro-break nudge sent",
            "Coaching message activated",
        ]
    elif monitor_count >= 2 or intervene_count == 1:
        final_action = "MONITOR"
        reasoning = f"Consensus ({intervene_count} intervene, {monitor_count} monitor, {standby_count} standby): Preventive monitoring active"
        actions_taken = [
            "Passive monitoring continues",
            "Reminder scheduled for tomorrow",
        ]
    else:
        final_action = "STANDBY"
        reasoning = f"Consensus ({intervene_count} intervene, {monitor_count} monitor, {standby_count} standby): Low stress detected, system on standby"
        actions_taken = [
            "System standby — low risk",
        ]
    
    final_decision = {
        "action": final_action,
        "reasoning": reasoning,
        "actions_taken": actions_taken,
        "decided_at": utc_now(),
    }
    
    return {
        "status": "complete",
        "agents": [agent_1, agent_2, agent_3],
        "vote_summary": {
            "intervene": intervene_count,
            "monitor": monitor_count,
            "standby": standby_count,
        },
        "final_decision": final_decision,
    }


@app.get("/api/agent-debate")
def api_agent_debate(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """API endpoint for agent debate engine"""
    return agent_debate(current_user)


if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", include_in_schema=False)
    def serve_frontend_root() -> FileResponse:
        return FileResponse(str(FRONTEND_DIST_DIR / "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str) -> FileResponse:
        if full_path.startswith("api"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API route not found")

        target = FRONTEND_DIST_DIR / full_path
        if target.exists() and target.is_file():
            return FileResponse(str(target))

        return FileResponse(str(FRONTEND_DIST_DIR / "index.html"))
