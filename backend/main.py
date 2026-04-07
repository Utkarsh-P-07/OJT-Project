import io
import logging
from dotenv import load_dotenv
load_dotenv()

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, Form, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware

from dependencies import verify_admin_role, verify_user_role
from database import (save_articles, save_live_news, get_all_articles, get_all_live_news, get_dataset_summary, news_articles)
from preprocess import clean_text
from vectorizer import fit_transform, get_top_terms, _vectorizer
from model import train_model, predict_topic, load_model
from ocr import extract_text_from_pdf, extract_text_from_image
from drift import calculate_topic_drift, get_article_drift_status

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
        import csv
        # Automatically determine if comma or tab separated safely without breaking on quotes
        sep = "\t" if b"\t" in contents[:50000] else ","
        try:
            df = pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig", sep=sep, on_bad_lines="skip")
        except Exception:
            # If quote parsing crashes (e.g. ' ' expected after '\"'), retry ignoring quotes entirely
            df = pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig", sep=sep, quoting=csv.QUOTE_NONE, on_bad_lines="skip")
        
        # AG News CSVs usually lack headers entirely. If there are exactly 3 columns 
        # and the first column's name is just an integer (e.g. "3"), intercept and reload it!
        if len(df.columns) == 3 and str(df.columns[0]).strip().replace('"', '').isdigit():
            try:
                df = pd.read_csv(io.BytesIO(contents), header=None, encoding="utf-8-sig", sep=sep, on_bad_lines="skip")
            except Exception:
                df = pd.read_csv(io.BytesIO(contents), header=None, encoding="utf-8-sig", sep=sep, quoting=csv.QUOTE_NONE, on_bad_lines="skip")
            df.columns = ["class index", "title", "description"]
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse TXT dataset: {e}")
        
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
            detail=f"Dataset is missing required column(s): {', '.join(missing_cols)}. (Found: {', '.join(df.columns)})"
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
    
    # Calculate Statistical Drift for the predicted topic
    ref_docs = get_all_articles()
    cur_docs = get_all_live_news()
    
    ref_topics = [d.get("topic", "Unknown") for d in ref_docs if "topic" in d]
    cur_topics = [d.get("topic", "Unknown") for d in cur_docs if "topic" in d]
    
    all_drift_data = calculate_topic_drift(ref_topics, cur_topics)
    drift_data = get_article_drift_status(topic, all_drift_data)
    
    # Explicitly compare the user input text strictly against the SAME category as requested.
    category_texts = [d.get("text", "") for d in cur_docs if d.get("topic") == topic]
    content_similarity = 0.0
    if category_texts:
         try:
             from sklearn.metrics.pairwise import cosine_similarity
             from vectorizer import _vectorizer
             input_vec = _vectorizer.transform([cleaned_text])
             cat_vecs = _vectorizer.transform(category_texts)
             sims = cosine_similarity(input_vec, cat_vecs)
             content_similarity = float(sims.mean()) * 100 * 5 # scale up slightly for visibility
             content_similarity = min(max(content_similarity, 0), 100)
         except Exception:
             pass
    
    return {
        "original_text": article_text[:500] + ("..." if len(article_text) > 500 else ""),
        "topic": topic,
        "drift_score": drift_data["score"],
        "drift_label": drift_data["label"],
        "category_similarity": round(content_similarity, 1)
    }

@user_router.get("/get-drift")
def get_user_drift():
    ref_docs = get_all_articles()
    cur_docs = get_all_live_news()
    
    if not ref_docs or not cur_docs:
        return {"message": "Insufficient data in either historical or live DB to calculate drift."}
        
    ref_topics = [d.get("topic", "Unknown") for d in ref_docs if "topic" in d]
    cur_topics = [d.get("topic", "Unknown") for d in cur_docs if "topic" in d]
    
    drift_data = calculate_topic_drift(ref_topics, cur_topics)
    return drift_data

app.include_router(admin_router)
app.include_router(user_router)


# Legacy healthcheck
@app.get("/health")
def health():
    return {"status": "ok"}
