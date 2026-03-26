import io
import logging
from typing import Literal

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics.pairwise import cosine_similarity

from database import delete_run, get_latest_results, get_results_by_run, get_run_history, get_stats, save_run
from drift import detect_drift
from preprocess import clean_text
from vectorizer import fit_transform, get_top_terms

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="News Topic Drift Detection API", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "News Topic Drift Detection API", "version": "1.2.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/detect-drift")
async def detect_drift_endpoint(
    file: UploadFile = File(...),
    threshold: float = Query(default=0.3, ge=0.05, le=0.95),
    group_by: str  = Query(default="day", regex="^(day|week|month)$"),
):
    """
    Upload a CSV with 'date' and 'text' columns.
    group_by controls how articles are bucketed: day, week, or month.
    Returns drift analysis with top terms and article counts per period.
    """
    contents = await file.read()
    source_name = file.filename or "upload.csv"

    logger.info(f"File: {source_name} | threshold: {threshold} | group_by: {group_by}")

    # --- Parse ---
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    df.columns = [c.strip().lower() for c in df.columns]

    if "text" not in df.columns or "date" not in df.columns:
        raise HTTPException(status_code=400, detail="CSV must have 'date' and 'text' columns.")

    try:
        df["date"] = pd.to_datetime(df["date"], infer_datetime_format=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse 'date' column. Use YYYY-MM-DD format.")

    df = df.sort_values("date")
    df["clean_text"] = df["text"].fillna("").apply(clean_text)
    df = df[df["clean_text"].str.len() > 10]

    if df.empty:
        raise HTTPException(status_code=400, detail="No usable text found after cleaning.")

    # --- Group by chosen period ---
    if group_by == "month":
        df["period_key"] = df["date"].dt.to_period("M").astype(str)
    elif group_by == "week":
        # ISO week label like "2024-W03"
        df["period_key"] = df["date"].dt.strftime("%G-W%V")
    else:
        df["period_key"] = df["date"].dt.date.astype(str)

    agg = (
        df.groupby("period_key")
        .agg(text=("clean_text", " ".join), article_count=("clean_text", "count"))
        .reset_index()
        .sort_values("period_key")
    )

    if len(agg) < 2:
        raise HTTPException(
            status_code=400,
            detail=f"Only {len(agg)} period(s) found after grouping by {group_by}. Need at least 2."
        )

    texts  = agg["text"].tolist()
    dates  = agg["period_key"].tolist()
    counts = agg["article_count"].tolist()

    logger.info(f"Periods: {dates}")

    # --- Vectorize + similarities ---
    tfidf_matrix = fit_transform(texts)

    similarities = [
        float(cosine_similarity(tfidf_matrix[i], tfidf_matrix[i + 1])[0][0])
        for i in range(len(texts) - 1)
    ]

    all_terms = [get_top_terms(tfidf_matrix, i) for i in range(len(texts))]

    # --- Build results ---
    results = detect_drift(
        similarities,
        threshold=threshold,
        from_dates=dates,
        to_dates=dates,
        from_terms=all_terms,
        to_terms=all_terms,
    )

    # attach article counts to each transition row
    for i, r in enumerate(results):
        r["from_count"] = counts[i]
        r["to_count"]   = counts[i + 1] if i + 1 < len(counts) else 0

    run_id = save_run(results, source_name=source_name, threshold=threshold, group_by=group_by)

    logger.info(f"Run {run_id}: {sum(r['drift_detected'] for r in results)} drifts / {len(results)} periods")

    return {"run_id": run_id, "results": results, "total_periods": len(results)}


@app.get("/results")
def get_results(run_id: str = Query(default=None)):
    if run_id:
        data = get_results_by_run(run_id)
        if not data:
            raise HTTPException(status_code=404, detail=f"No results for run_id: {run_id}")
        return {"results": data}
    return {"results": get_latest_results()}


@app.get("/history")
def get_history(limit: int = Query(default=10, le=50)):
    return {"runs": get_run_history(limit=limit)}


@app.delete("/runs/{run_id}")
def remove_run(run_id: str):
    if not delete_run(run_id):
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found.")
    return {"deleted": run_id}


@app.get("/stats")
def stats():
    """Aggregate stats across all stored runs."""
    return get_stats()
