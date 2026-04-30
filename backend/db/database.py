from pymongo import MongoClient
from datetime import datetime
import os
import certifi

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

_client = None

def get_db():
    global _client
    if _client is None:
        _client = MongoClient(
            MONGO_URI,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=False,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
        )
    return _client[DB_NAME]

def init_db():
    db = get_db()
    db["users"].create_index("email", unique=True)

def save_history(filename: str, similarity_score: float, drift_status: str, user_email: str):
    get_db()["history"].insert_one({
        "filename": filename,
        "similarity_score": similarity_score,
        "drift_status": drift_status,
        "user_email": user_email,
        "timestamp": datetime.now()
    })

def get_history(user_email: str, limit: int = 50):
    return list(
        get_db()["history"]
        .find({"user_email": user_email}, {"_id": 0, "user_email": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )

def create_user(email: str, name: str, hashed_password: str):
    get_db()["users"].insert_one({
        "email": email,
        "name": name,
        "password": hashed_password,
        "created_at": datetime.now()
    })

def get_user_by_email(email: str):
    return get_db()["users"].find_one({"email": email}, {"_id": 0})
