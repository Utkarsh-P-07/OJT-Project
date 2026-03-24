from pymongo import MongoClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "news_drift_db"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

news_collection = db["news_collection"]
drift_results = db["drift_results"]

def save_drift_results(results: list[dict]):
    if results:
        drift_results.insert_many(results)

def get_all_drift_results() -> list[dict]:
    return list(drift_results.find({}, {"_id": 0}))
