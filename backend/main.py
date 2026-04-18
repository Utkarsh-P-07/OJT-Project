from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from model import initialize_model, detect_drift
from file_processor import process_uploaded_file

app = FastAPI(title="News Drift Detection API (Multi-Format)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Initialize base ML files on startup if missing."""
    initialize_model()

@app.post("/analyze-news")
async def analyze_news(file: UploadFile = File(...)):
    """
    Accepts a single file (.txt, .pdf, .png, .jpg).
    Extracts text, compares against pre-trained reference corpus, and returns drift status.
    """
    contents = await file.read()
    
    try:
        # Extract text based on file type
        document_lines = process_uploaded_file(contents, file.filename)
        
        if not document_lines:
             raise ValueError("No text could be extracted from the provided file.")
             
        # Run ML Drift Check
        avg_score, is_drift = detect_drift(document_lines)
        
        message = "Drift Detected" if is_drift else "No Drift"
        
        return {
            "similarity_score": round(avg_score, 4),
            "drift": is_drift,
            "message": message
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
