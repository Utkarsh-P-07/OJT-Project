from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
from pypdf import PdfReader

from preprocess import clean_text
from vectorizer import fit_transform
from drift import compute_similarity, detect_drift
from database import save_drift_results, get_all_drift_results

app = FastAPI(title="News Topic Drift Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    threshold: float = 0.3

@app.get("/")
def root():
    return {"message": "News Topic Drift Detection API"}

@app.post("/detect-drift")
async def detect_drift_endpoint(
    file: UploadFile = File(...),
    threshold: float = 0.3
):
    """
    Upload a CSV (date, text columns) or a PDF file.
    Returns drift analysis grouped by date periods.
    """
    contents = await file.read()
    filename = (file.filename or "").lower()

    # --- Parse input ---
    if filename.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(contents))
            text = " ".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            raise HTTPException(status_code=400, detail="Could not parse PDF file.")
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF.")
        # Single-document PDF: wrap as one period — needs at least 2 for drift
        raise HTTPException(
            status_code=400,
            detail="Single PDF uploaded. For drift detection, use a CSV with multiple date periods, or upload via the frontend which assigns a date."
        )
    else:
        try:
            df = pd.read_csv(io.BytesIO(contents))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid CSV file.")

    if "text" not in df.columns or "date" not in df.columns:
        raise HTTPException(status_code=400, detail="CSV must have 'date' and 'text' columns.")

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    df["clean_text"] = df["text"].apply(clean_text)
    df = df[df["clean_text"].str.len() > 0]

    grouped = df.groupby(df["date"].dt.date)["clean_text"].apply(" ".join).reset_index()
    grouped.columns = ["date", "text"]  # type: ignore

    if len(grouped) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 date periods for drift detection.")

    texts = grouped["text"].tolist()
    tfidf_matrix = fit_transform(texts)

    similarities = []
    for i in range(len(texts) - 1):
        sim = compute_similarity(tfidf_matrix[i], tfidf_matrix[i + 1])
        similarities.append(sim)

    results = detect_drift(similarities, threshold)

    dates = grouped["date"].astype(str).tolist()
    for i, r in enumerate(results):
        r["from_date"] = dates[i]
        r["to_date"] = dates[i + 1]

    save_drift_results(results)
    return {"results": results, "total_periods": len(results)}

@app.get("/results")
def get_results():
    """Fetch all stored drift results from MongoDB."""
    return {"results": get_all_drift_results()}

@app.get("/health")
def health():
    return {"status": "ok"}
