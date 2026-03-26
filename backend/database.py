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

# create indexes once on startup — safe to call repeatedly
drift_results.create_index("run_id")
run_history.create_index([("created_at", DESCENDING)])

def save_run(results: list[dict], source_name: str = "", threshold: float = 0.3, group_by: str = "day") -> str:
    """
    Save a full analysis run.
    Each run gets a unique ID so the history page can show past runs separately.
    Returns the run_id so the API can pass it back to the frontend.
    """
    run_id = str(uuid.uuid4())[:8]   # short ID, readable enough
    created_at = datetime.now(timezone.utc).isoformat()

    run_doc = {
        "run_id": run_id,
        "source": source_name,
        "threshold": threshold,
        "group_by": group_by,
        "created_at": created_at,
        "total_periods": len(results),
        "drift_count": sum(1 for r in results if r.get("drift_detected")),
    }
    run_history.insert_one(run_doc)

    # tag each result row with the run_id so we can filter later
    tagged = deepcopy(results)
    for r in tagged:
        r["run_id"] = run_id
        r["created_at"] = created_at

    if tagged:
        drift_results.insert_many(tagged)

    return run_id

def get_results_by_run(run_id: str) -> list[dict]:
    return list(drift_results.find({"run_id": run_id}, {"_id": 0}))

def get_latest_results() -> list[dict]:
    """Fetch results from the most recent run."""
    latest = run_history.find_one({}, sort=[("created_at", DESCENDING)])
    if not latest:
        return []
    return get_results_by_run(latest["run_id"])

def get_run_history(limit: int = 20) -> list[dict]:
    """Return recent run summaries for the history panel."""
    runs = run_history.find({}, {"_id": 0}).sort("created_at", DESCENDING).limit(limit)
    return list(runs)

def get_stats() -> dict:
    """Aggregate stats across all runs — used by the /stats endpoint."""
    total_runs   = run_history.count_documents({})
    total_drifts = run_history.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$drift_count"}}}
    ])
    drift_sum = next(total_drifts, {}).get("total", 0)

    # worst single transition ever recorded
    worst = drift_results.find_one(
        {"drift_detected": True},
        sort=[("similarity", 1)],
        projection={"_id": 0, "from_date": 1, "to_date": 1, "similarity": 1, "run_id": 1}
    )

    return {
        "total_runs":   total_runs,
        "total_drifts": drift_sum,
        "worst_transition": worst,
    }


def delete_run(run_id: str) -> bool:
    """Remove a run and all its result rows. Returns True if something was deleted."""
    r1 = run_history.delete_one({"run_id": run_id})
    drift_results.delete_many({"run_id": run_id})
    return r1.deleted_count > 0
