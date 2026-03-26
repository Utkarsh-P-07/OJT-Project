from pymongo import MongoClient, DESCENDING
from copy import deepcopy
from datetime import datetime, timezone
import os
import uuid

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "news_drift_db"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

drift_results = db["drift_results"]
run_history   = db["run_history"]
news_articles = db["news_articles"]
api_articles = db["api_articles"]
trend_results = db["trend_results"]

# Drift analytics retired in v2 in favor of live trend tracking

def save_articles(articles: list[dict]):
    """Store raw CSV Kaggle articles parsed manually for ML Training."""
    if articles:
        news_articles.insert_many(articles)

def save_live_news(articles: list[dict]):
    """Store raw API articles securely into the Live News separation layer."""
    if articles:
        api_articles.insert_many(articles)

def get_recent_live_news(limit: int = 2000) -> list[dict]:
    """Get the most recent LIVE API news exclusively for User Cosine-Similarity computations."""
    return list(api_articles.find({}, {"_id": 0}).sort("date", DESCENDING).limit(limit))

def get_all_articles() -> list[dict]:
    """Fetches ML Model dataset core strictly from Kaggle CSV storage."""
    return list(news_articles.find({}, {"_id": 0}))

def get_all_live_news() -> list[dict]:
    """Fetches API Trend Dataset explicitly for modeling the dashboard trajectories."""
    return list(api_articles.find({}, {"_id": 0}).sort("date", DESCENDING))

def save_trend_result(doc: dict):
    if "created_at" not in doc:
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
    trend_results.insert_one(doc)
    doc["_id"] = str(doc["_id"])
def get_dataset_summary() -> dict:
    """Provide dataset statistics for the Admin view explicitly tracking both layers."""
    total_articles = news_articles.count_documents({})
    api_articles_count = api_articles.count_documents({})
    
    # get distinct topics from ML set
    topics = news_articles.distinct("topic")
    
    # get date range from ML set
    oldest = news_articles.find_one({}, sort=[("date", 1)])
    newest = news_articles.find_one({}, sort=[("date", -1)])
    
    return {
        "total_articles": total_articles,
        "api_articles_count": api_articles_count,
        "unique_topics": len(topics),
        "topics_list": topics,
        "date_range": {
            "oldest": oldest.get("date") if oldest else None,
            "newest": newest.get("date") if newest else None
        }
    }
