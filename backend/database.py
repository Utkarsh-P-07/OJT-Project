from pymongo import MongoClient
from copy import deepcopy
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "news_drift_db"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

news_collection = db["news_collection"]
drift_results = db["drift_results"]

def save_drift_results(results: list[dict]):
    """Insert copies so MongoDB does not mutate the original dicts with _id."""
    if results:
        drift_results.insert_many(deepcopy(results))

def get_all_drift_results() -> list[dict]:
    return list(drift_results.find({}, {"_id": 0}))
