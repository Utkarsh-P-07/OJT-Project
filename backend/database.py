from pymongo import MongoClient, DESCENDING
from copy import deepcopy
from datetime import datetime, timezone
import os
import uuid

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "news_drift_db"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

news_articles = db["news_articles"]
api_articles = db["api_articles"]

def save_articles(articles: list[dict]):
    """Store parsed TXT/CSV dataset articles manually for ML Training. Clears old data first."""
    if articles:
        news_articles.delete_many({}) # Clear out the old dataset so the new TXT dataset is pure
        news_articles.insert_many(articles)

def save_live_news(articles: list[dict]):
    """Store raw API articles securely into the Live News separation layer."""
    if articles:
        api_articles.insert_many(articles)

def get_all_articles() -> list[dict]:
    """Fetches ML Model dataset core directly from storage."""
    return list(news_articles.find({}, {"_id": 0}))

def get_all_live_news() -> list[dict]:
    """Fetches API Trend Dataset explicitly for modeling the dashboard trajectories."""
    return list(api_articles.find({}, {"_id": 0}).sort("date", DESCENDING))


def get_dataset_summary() -> dict:
    """Provide dataset statistics for the Admin view explicitly tracking both layers."""
    total_articles = news_articles.count_documents({})
    api_articles_count = api_articles.count_documents({})
    
    # get distinct topics from both sets
    ml_topics = news_articles.distinct("topic")
    api_topics = api_articles.distinct("topic")
    
    # get date range from ML set
    oldest = news_articles.find_one({}, sort=[("date", 1)])
    newest = news_articles.find_one({}, sort=[("date", -1)])
    
    return {
        "total_articles": total_articles,
        "api_articles_count": api_articles_count,
        "unique_ml_topics": len(ml_topics),
        "unique_api_topics": len(api_topics),
        "date_range": {
            "oldest": oldest.get("date") if oldest else None,
            "newest": newest.get("date") if newest else None
        }
    }
