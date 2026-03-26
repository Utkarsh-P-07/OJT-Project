import io
import logging
from dotenv import load_dotenv
load_dotenv()
from typing import Literal

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, Form, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics.pairwise import cosine_similarity

from dependencies import verify_admin_role, verify_user_role
from database import (save_articles, save_live_news, get_recent_live_news, get_all_articles, get_all_live_news, get_dataset_summary, news_articles)
from preprocess import clean_text
from vectorizer import fit_transform, get_top_terms, _vectorizer
from model import train_model, predict_topic, load_model
from ocr import extract_text_from_pdf, extract_text_from_image
from trend import calculate_trend_score, predict_future_trends

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="News Topic Drift Detection API - RBAC Enabled", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    load_model()

# ==========================================
# ADMIN ROUTER
# ==========================================
admin_router = APIRouter(prefix="/admin", dependencies=[Depends(verify_admin_role)])

@admin_router.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        # utf-8-sig automatically strips BOM if present
        df = pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig")
        
        # AG News CSVs usually lack headers entirely. If there are exactly 3 columns 
        # and the first column's name is just an integer (e.g. "3"), intercept and reload it!
        if len(df.columns) == 3 and str(df.columns[0]).strip().replace('"', '').isdigit():
            df = pd.read_csv(io.BytesIO(contents), header=None, encoding="utf-8-sig")
            df.columns = ["class index", "title", "description"]
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")
        
    # Strip everything aggressively
    df.columns = [str(c).replace('\ufeff', '').strip().lower() for c in df.columns]
    
    # --- AUTO MAPPING FOR AG NEWS DATASET ---
    # --- AUTO MAPPING FOR AG NEWS DATASET ---
    class_col = next((c for c in df.columns if "class index" in str(c)), None)
    if class_col and "topic" not in df.columns:
        topic_map = {1: "World", 2: "Sports", 3: "Business", 4: "Sci/Tech"}
        # ensure numeric before mapping if possible
        df["topic"] = pd.to_numeric(df[class_col], errors="coerce").map(topic_map).fillna("Unknown")
        
    # Map "title" and "description" to "text"
    if "description" in df.columns and "text" not in df.columns:
        title_col = df["title"].astype(str) + " - " if "title" in df.columns else ""
        df["text"] = title_col + df["description"].astype(str)
        
    # User's guide outputs "category", we need "topic"
    if "category" in df.columns and "topic" not in df.columns:
        df.rename(columns={"category": "topic"}, inplace=True)
        
    # Automatically generate dates if missing to allow trend analysis to function correctly
    if "date" not in df.columns:
        import numpy as np
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90) # spread over 3 months
        random_offsets = np.random.randint(0, 90*24*60*60, size=len(df))
        mapped_dates = [start_date + timedelta(seconds=int(offset)) for offset in random_offsets]
        df["date"] = pd.Series(mapped_dates).dt.strftime("%Y-%m-%d %H:%M:%S")
    # ----------------------------------------
    
    missing_cols = [col for col in ["date", "text", "topic"] if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400, 
            detail=f"CSV is missing required column(s): {', '.join(missing_cols)}. (Found: {', '.join(df.columns)})"
        )
        
    df["clean_text"] = df["text"].fillna("").astype(str).apply(clean_text)
    df = df[df["clean_text"].str.len() > 10]
    
    if df.empty:
        raise HTTPException(status_code=400, detail="No usable text found after cleaning.")
    
    # Save directly to DB, model training separated
    # Convert through JSON to scrub out any numpy.int64 or Pandas objects that PyMongo rejects
    import json
    df_clean = df.assign(date=df['date'].astype(str)).fillna("")
    records = json.loads(df_clean.to_json(orient="records"))
    
    save_articles(records)
    
    return {"message": "Dataset uploaded. You may now train the model.", "count": len(records)}

@admin_router.post("/fetch-api-data")
def fetch_api_dataset():
    from api_ingestion import fetch_live_news
    articles = fetch_live_news()
    if not articles:
        raise HTTPException(status_code=400, detail="Could not fetch any live articles.")
        
    df = pd.DataFrame(articles)
    df["clean_text"] = df["text"].fillna("").astype(str).apply(clean_text)
    df = df[df["clean_text"].str.len() > 10]
    
    if df.empty:
        raise HTTPException(status_code=400, detail="No usable text found after cleaning API data.")
        
    import json
    df_clean = df.fillna("")
    records = json.loads(df_clean.to_json(orient="records"))
    
    save_live_news(records)
    return {"message": "Live API data successfully fetched and saved.", "count": len(records)}

@admin_router.post("/train-model")
@admin_router.post("/retrain-model")
def execute_model_training():
    articles = list(news_articles.find({}, {"_id": 0}))
    if not articles:
        raise HTTPException(status_code=400, detail="No data available in the database to train ON.")
        
    df = pd.DataFrame(articles)
    if "clean_text" not in df.columns or "topic" not in df.columns:
        raise HTTPException(status_code=400, detail="Corrupted database records. Missing text or topic.")
        
    texts = df["clean_text"].tolist()
    labels = df["topic"].tolist()
    train_model(texts, labels)
    
    # Reload it locally for immediate use
    load_model()
    
    return {"message": "Topics classified and model successfully trained.", "articles_processed": len(texts)}

@admin_router.get("/dataset-summary")
def get_summary():
    stats = get_dataset_summary()
    return stats


# ==========================================
# USER ROUTER
# ==========================================
user_router = APIRouter(prefix="/user", dependencies=[Depends(verify_user_role)])

@user_router.post("/analyze-article")
async def analyze_article(text: str = Form(None), file: UploadFile = File(None)):
    if not text and not file:
        raise HTTPException(status_code=400, detail="Provide plain text or upload a file.")
        
    article_text = text if text else ""
    if file:
        contents = await file.read()
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            article_text = extract_text_from_pdf(contents)
        elif filename.endswith((".png", ".jpg", ".jpeg")):
            article_text = extract_text_from_image(contents)
        elif filename.endswith(".txt") or filename.endswith(".csv"):
            article_text = contents.decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")
            
    if not article_text.strip():
        raise HTTPException(status_code=400, detail="No text extracted.")
        
    cleaned_text = clean_text(article_text)
    topic = predict_topic(cleaned_text)
    
    # TF-IDF Cosine Similarity strictly against Live News Pipeline
    recent_docs = get_recent_live_news(limit=50)
    recent_texts = [d.get("text", "") for d in recent_docs if "text" in d]
    
    trend_data = calculate_trend_score(cleaned_text, _vectorizer, recent_texts)
    
    return {
        "original_text": article_text[:500] + ("..." if len(article_text) > 500 else ""),
        "topic": topic,
        "trend_score": trend_data["score"],
        "trend_label": trend_data["label"]
    }

@user_router.get("/get-trend")
def get_user_trend(group_by: str = Query(default="month", regex="^(day|week|month)$")):
    # Trajectories built entirely on Live API history
    articles = get_all_live_news()
    if not articles:
        return {"message": "No Live API data available yet."}
        
    data = predict_future_trends(articles, group_by=group_by)
    return data

@user_router.get("/get-prediction")
def get_user_prediction(group_by: str = Query(default="month", regex="^(day|week|month)$")):
    # Predictions extracted entirely from Live API history
    articles = get_all_live_news()
    if not articles:
        return {"predictions": {}}
    data = predict_future_trends(articles, group_by=group_by)
    return {"predictions": data.get("predictions", {})}

app.include_router(admin_router)
app.include_router(user_router)


# Legacy healthcheck
@app.get("/health")
def health():
    return {"status": "ok"}
