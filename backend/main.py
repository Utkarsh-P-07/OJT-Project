from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

load_dotenv()

from core.model import initialize_model, detect_drift
from core.file_processor import process_uploaded_file
from db.database import init_db, save_history, get_history, create_user, get_user_by_email

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", 24))
MAX_FILE_SIZE_MB = 20
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set.")

bearer_scheme = HTTPBearer()

app = FastAPI(title="News Drift Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str


@app.on_event("startup")
def startup_event():
    initialize_model()
    init_db()


@app.post("/auth/register")
def register(body: RegisterRequest):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if get_user_by_email(body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    create_user(body.email, body.name, hash_password(body.password))
    token = create_token(body.email)
    return {"token": token, "name": body.name, "email": body.email}

@app.post("/auth/login")
def login(body: LoginRequest):
    user = get_user_by_email(body.email)
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(body.email)
    return {"token": token, "name": user["name"], "email": user["email"]}

@app.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    return {"name": current_user["name"], "email": current_user["email"]}


@app.post("/analyze-news")
async def analyze_news(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds the {MAX_FILE_SIZE_MB}MB size limit.")

    try:
        document_lines = process_uploaded_file(contents, file.filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        raise HTTPException(status_code=500, detail="File processing failed.")

    if not document_lines:
        raise HTTPException(
            status_code=400,
            detail="No readable text could be extracted. If it's a PDF, ensure it has a text layer."
        )
    try:
        avg_score, status = detect_drift(document_lines)
        messages = {
            "no_drift":     "No Drift",
            "slight_drift": "Slight Drift",
            "drift":        "Drift Detected"
        }
        save_history(file.filename, float(avg_score), status, current_user["email"])
        return {
            "similarity_score": round(avg_score, 4),
            "status": status,
            "message": messages[status]
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        raise HTTPException(status_code=500, detail="Analysis failed.")

@app.get("/history")
def read_history(current_user=Depends(get_current_user)):
    return get_history(current_user["email"])
