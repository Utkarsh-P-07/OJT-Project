from pymongo import MongoClient
from datetime import datetime
import os

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
history_collection = db["history"]
users_collection = db["users"]

def init_db():
    users_collection.create_index("email", unique=True)

def save_history(filename: str, similarity_score: float, drift_status: str, user_email: str):
    history_collection.insert_one({
        "filename": filename,
        "similarity_score": similarity_score,
        "drift_status": drift_status,
        "user_email": user_email,
        "timestamp": datetime.now()
    })

def get_history(user_email: str, limit: int = 50):
    return list(
        history_collection.find({"user_email": user_email}, {"_id": 0, "user_email": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )

def create_user(email: str, name: str, hashed_password: str):
    users_collection.insert_one({
        "email": email,
        "name": name,
        "password": hashed_password,
        "created_at": datetime.now()
    })

def get_user_by_email(email: str):
    return users_collection.find_one({"email": email}, {"_id": 0})
